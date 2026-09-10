import { Component, DestroyRef, WritableSignal, computed, effect, inject, signal, untracked } from "@angular/core";
import { takeUntilDestroyed, toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { HttpResponse } from "@angular/common/http";
import { Observable, forkJoin } from "rxjs";
import { map } from "rxjs/operators";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { SortFieldModel, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { MessageService } from "primeng/api";
import { TabsModule } from "primeng/tabs";
import { Skeleton } from "primeng/skeleton";
import { ToastModule } from "primeng/toast";
import { Dialog } from "primeng/dialog";
import { HeaderComponent } from "./header/header";
import { TitleComponent } from "./title/title";
import { OverviewComponent } from "./overview/overview";
import { HistoryComponent } from "./history/history";
import { DatePeriodEnum, FeeDetailTabEnum } from "./common/enums";
import { FEE_DETAIL_BREADCRUMB_DEFAULT, FEE_DETAIL_TERM } from "./common/constants";
import { FeeDetailFilterOutput, FeeDetailHistoryQuery } from "./dto/fee-detail-commands.dto";
import { BillingHistoryResponse, FeeDetailChartItem, FeeDetailInfoResponse, FeeDetailKpiResponse, FeeRateVersionsResponse, FeeSummaryResponse } from "./dto/fee-detail.dto";
import { FeeDetailService } from "./fee-detail.service";
import { ModalSetAlertComponent } from "./modal-set-alert/modal-set-alert";
import { CustomConfigurationService } from "./modal-set-alert/custom-configuration.service";
import { ClientInformationResponse } from "../common/DTO/client-response";
import { FeeDetailOrigin } from "../common/DTO/fee-detail-origin";
import { CommonGlobalService } from "../common/services/common.service";

@Component({
	selector: "fee-fee-detail",
	standalone: true,
	imports: [TabsModule, Skeleton, Dialog, ToastModule, HeaderComponent, TitleComponent, OverviewComponent, HistoryComponent, ModalSetAlertComponent, TermPipe, StatusStateComponent],
	providers: [MessageService],
	templateUrl: "./fee-detail.html",
})
export class FeeDetailComponent {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	public readonly feeDetailTerm = FEE_DETAIL_TERM;
	public readonly FeeDetailTabEnum = FeeDetailTabEnum;
	public readonly StatusStateEnum = StatusStateEnum;
	private readonly route = inject(ActivatedRoute);
	private readonly router = inject(Router);
	private readonly configService = inject(CustomConfigurationService);
	private readonly sessionConfig = inject(ConfigService);
	private readonly destroyRef = inject(DestroyRef);
	private readonly service = inject(FeeDetailService);
	private readonly messageService = inject(MessageService);

	public feeId = toSignal(this.route.paramMap.pipe(map(p => p.get("feeId") ?? "")), { initialValue: "" });
	public bankId = toSignal(this.route.paramMap.pipe(map(p => Number(p.get("bankId") ?? "-1"))), { initialValue: -1 });
	public originTrail = toSignal(this.route.queryParamMap.pipe(map(q => this.parseTrail(q.get("originLabelKey"), q.get("originPath")))), { initialValue: [] as FeeDetailOrigin[] });

	public overviewData = signal<FeeDetailInfoResponse | null>(null);
	public feeSummary = signal<FeeSummaryResponse | null>(null);
	public rateVersions = signal<FeeRateVersionsResponse | null>(null);
	public isLoadingOverview = signal<boolean>(false);
	public hasOverviewError = signal<boolean>(false);

	public kpiData = signal<FeeDetailKpiResponse | null>(null);
	public chartData = signal<FeeDetailChartItem[]>([]);
	public historyData = signal<BillingHistoryResponse | null>(null);
	public isLoadingHistory = signal<boolean>(false);
	public hasHistoryError = signal<boolean>(false);
	public isDownloading = signal<boolean>(false);
	public isDownloadingExpenseEvolution = signal<boolean>(false);

	public activePeriod = signal<DatePeriodEnum>(DatePeriodEnum.Last12Months);
	public currentFilter = signal<FeeDetailFilterOutput | null>(null);
	// true si el rango de fechas vino por query params (desde el modulo origen) → tiene prioridad sobre defaults.
	private hasSeededFromParams = false;
	// Rango/period entrantes para que el header (datepicker) muestre lo mismo que se filtro en el modulo origen.
	public incomingDateRange = signal<{ start: Date; end: Date } | null>(null);
	public incomingPeriod = signal<DatePeriodEnum | null>(null);

	public activeTab = signal<string>(FeeDetailTabEnum.Overview);
	public showModalReference = signal(false);
	public showModalSetAlert = signal(false);
	public hasIncompleteHistory = computed<boolean>(() => this.computeHasIncompleteHistory(this.chartData()));
	public hasAlert = signal<boolean>(false);
	public isSavingAlert = signal<boolean>(false);
	public isNewFee = computed<boolean>(() => {
		const d = this.overviewData();
		if (!d) return false;
		const min = d.minDate ?? "";
		const max = d.maxDate ?? "";
		return !!min && !!max && min.slice(0, 7) === max.slice(0, 7);
	});
	public readonly isGroupProfile = this.sessionConfig.SessionInformation?.isGroup ?? false;
	public clientInfo = signal<ClientInformationResponse | null>(null);

	constructor() {
		this.seedFilterFromQueryParams();

		effect(() => {
			const id = this.feeId();
			const bId = this.bankId();
			if (!id) return;
			this.loadOverview(id, bId);
			this.loadHasAlert(id);
		});

		effect(() => {
			const data = this.overviewData();
			if (!data) return;
			untracked(() => {
				if (this.isNewFee() && !this.hasSeededFromParams) this.activePeriod.set(DatePeriodEnum.CurrentMonth);
				this.loadHistorySection();
			});
		});

		if (this.isGroupProfile) {
			this.configService
				.getClientInformation()
				.pipe(takeUntilDestroyed(this.destroyRef))
				.subscribe({
					next: response => this.clientInfo.set(response),
					error: () => this.clientInfo.set(null),
				});
		}
	}

	public onReloadOverview(): void {
		this.loadOverview(this.feeId(), this.bankId());
	}

	public onReloadHistory(): void {
		this.loadHistorySection();
	}

	// El rango de fechas viaja desde el modulo origen por query params (contrato FeeDetailNavigation).
	// Si llega, siembra el filtro para que la busqueda use ese periodo; si no, se queda con los defaults.
	private seedFilterFromQueryParams(): void {
		const params = this.route.snapshot.queryParamMap;
		const startDate = params.get("startDate") ?? "";
		const endDate = params.get("endDate") ?? "";
		if (!startDate || !endDate) {
			return;
		}

		const period = this.resolveIncomingPeriod(params.get("period"));
		this.currentFilter.set({ period, startDate, endDate });
		this.activePeriod.set(period);
		this.hasSeededFromParams = true;

		// Alimenta el header: si es preset lo pasa como period; si es custom pasa el rango exacto.
		if (period === DatePeriodEnum.Custom) {
			const start = this.parseIso(startDate);
			const end = this.parseIso(endDate);
			if (start && end) {
				this.incomingDateRange.set({ start, end });
			}
		} else {
			this.incomingPeriod.set(period);
		}
	}

	private resolveIncomingPeriod(period: string | null): DatePeriodEnum {
		switch (period) {
			case DatePeriodEnum.Last12Months:
			case DatePeriodEnum.CurrentYear:
			case DatePeriodEnum.CurrentMonth:
			case DatePeriodEnum.Custom:
				return period;
			default:
				return DatePeriodEnum.Custom;
		}
	}

	// El breadcrumb viaja desde el modulo origen como trail ordenado (label|label / path|path).
	// Un solo nivel llega sin separador, asi que los modulos planos siguen funcionando igual.
	private parseTrail(labels: string | null, paths: string | null): FeeDetailOrigin[] {
		const pathParts = (paths ?? "").split("|");
		const trail = (labels ?? "")
			.split("|")
			.map((labelKey, index) => ({ labelKey, path: this.decodePath(pathParts[index] ?? "") }))
			.filter(level => !!level.labelKey);
		return trail.length ? trail : [FEE_DETAIL_BREADCRUMB_DEFAULT];
	}

	private decodePath(value: string): string {
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	public onApplyFilter(filter: FeeDetailFilterOutput): void {
		this.currentFilter.set(filter);
		this.activePeriod.set(filter.period);
		this.loadHistorySection();
	}

	public onResetFilter(): void {
		this.currentFilter.set(null);
		this.activePeriod.set(this.isNewFee() ? DatePeriodEnum.CurrentMonth : DatePeriodEnum.Last12Months);
		this.loadHistorySection();
	}

	public onClientChanged(newBankId: number): void {
		if (newBankId === this.bankId()) return;
		this.currentFilter.set(null);
		this.activePeriod.set(DatePeriodEnum.Last12Months);
		this.router.navigate(["/fee/detail", this.feeId(), newBankId], {
			replaceUrl: true,
			queryParams: { startDate: null, endDate: null, period: null },
			queryParamsHandling: "merge",
		});
	}

	public onDownloadRequest(sort: SortFieldModel): void {
		const data = this.overviewData();
		if (!data || this.isDownloading()) return;
		const query = { ...this.buildHistoryQuery(data), sortField: sort.sortField, sortOrder: sort.sortOrder };
		this.runDownload(this.isDownloading, this.service.downloadBillingHistory(query), this.buildExportFileName());
	}

	private buildExportFileName(): string {
		return this.commonGlobalService.buildExportFileName(
			this.commonGlobalService.termText(this.feeDetailTerm.MODULE_EXPORT),
			this.commonGlobalService.termText(this.feeDetailTerm.NAME_BILLING_HISTORY_EXPORT)
		);
	}

	public onExpenseEvolutionDownloadRequest(): void {
		const data = this.overviewData();
		if (!data || this.isDownloadingExpenseEvolution()) return;
		const [startDate, endDate] = this.resolveDateRange(DatePeriodEnum.Last12Months, null, data);
		this.runDownload(
			this.isDownloadingExpenseEvolution,
			this.service.downloadExpenseEvolutionComparison(data.feeId, this.bankId(), startDate, endDate),
			this.buildExpenseEvolutionExportFileName()
		);
	}

	private buildExpenseEvolutionExportFileName(): string {
		return this.commonGlobalService.buildExportFileName(
			this.commonGlobalService.termText(this.feeDetailTerm.MODULE_EXPORT),
			this.commonGlobalService.termText(this.feeDetailTerm.NAME_EXPENSE_EVOLUTION_EXPORT)
		);
	}

	private runDownload(isDownloadingSignal: WritableSignal<boolean>, request: Observable<HttpResponse<Blob>>, fileName: string): void {
		isDownloadingSignal.set(true);
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.feeDetailTerm.PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.feeDetailTerm.DOWNLOAD_START_FILE),
		});
		request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
			next: response => {
				try {
					this.saveBlobAsFile(response.body, fileName);
					this.messageService.add({
						severity: "success",
						icon: "icon icon-success",
						summary: this.commonGlobalService.termText(this.feeDetailTerm.FILE_DOWNLOAD_SUCCESS),
						detail: this.commonGlobalService.termText(this.feeDetailTerm.FILE_DOWNLOAD_DEVICE),
					});
				} catch {
					this.showExportError();
				}
				isDownloadingSignal.set(false);
			},
			error: () => {
				this.showExportError();
				isDownloadingSignal.set(false);
			},
		});
	}

	private showExportError(): void {
		this.messageService.add({
			severity: "error",
			icon: "icon icon-alert",
			summary: this.commonGlobalService.termText(this.feeDetailTerm.FILE_FAILED_DOWNLOAD),
			detail: this.commonGlobalService.termText(this.feeDetailTerm.FILE_CONTACT_SUPPORT),
		});
	}

	public onShowReference(): void {}

	public onSetAlert(): void {
		this.showModalSetAlert.set(true);
	}

	private loadOverview(feeId: string, bankId: number): void {
		this.isLoadingOverview.set(true);
		this.hasOverviewError.set(false);
		forkJoin({
			info: this.service.getFeeDetailInfo(feeId, bankId),
			summary: this.service.getFeeSummary(feeId, bankId),
			versions: this.service.getFeeRateVersions(feeId, bankId),
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ info, summary, versions }) => {
					this.overviewData.set(info);
					this.feeSummary.set(summary);
					this.rateVersions.set(versions);
					this.isLoadingOverview.set(false);
					this.validateBankAccess(info, bankId);
				},
				error: () => {
					this.isLoadingOverview.set(false);
					this.hasOverviewError.set(true);
				},
			});
	}

	private validateBankAccess(info: FeeDetailInfoResponse, currentBankId: number): void {
		const banks = info.associatedBanks ?? [];
		if (banks.length === 0) return;
		if (banks.some(b => b.bankId === currentBankId)) return;
		const fallback = banks[0].bankId;
		if (currentBankId !== -1) {
			this.messageService.add({
				severity: "warn",
				icon: "icon icon-warning",
				summary: this.commonGlobalService.termText(this.feeDetailTerm.NO_ACCESS_TO_INSTITUTION),
			});
		}
		this.router.navigate(["/fee/detail", this.feeId(), fallback], { replaceUrl: true, queryParamsHandling: "preserve" });
	}

	private loadHistorySection(): void {
		const data = this.overviewData();
		if (!data) return;

		const historyQuery = this.buildHistoryQuery(data);
		const kpiQuery = {
			feeId: historyQuery.feeId,
			bankId: historyQuery.bankId,
			brandId: historyQuery.brandId,
			startDate: historyQuery.startDate,
			endDate: historyQuery.endDate,
			period: historyQuery.period,
		};
		const chartQuery = {
			feeId: historyQuery.feeId,
			bankId: historyQuery.bankId,
			startDate: historyQuery.startDate,
			endDate: historyQuery.endDate,
			period: historyQuery.period,
		};

		this.isLoadingHistory.set(true);
		this.hasHistoryError.set(false);

		forkJoin({
			kpi: this.service.getFeeDetailKpi(kpiQuery),
			chart: this.service.getFeeDetailChart(chartQuery),
			history: this.service.getFeeDetailHistory(historyQuery),
		})
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: ({ kpi, chart, history }) => {
					this.kpiData.set({ ...kpi, isSinglePeriod: data.isSinglePeriod, hasIncompleteHistory: this.computeHasIncompleteHistory(chart) });
					this.chartData.set(chart);
					this.historyData.set(history);
					this.isLoadingHistory.set(false);
				},
				error: () => {
					this.isLoadingHistory.set(false);
					this.hasHistoryError.set(true);
				},
			});
	}

	private buildHistoryQuery(data: FeeDetailInfoResponse): FeeDetailHistoryQuery {
		const period = this.activePeriod();
		const filter = this.currentFilter();
		const [startDate, endDate] = this.resolveDateRange(period, filter, data);
		return {
			feeId: data.feeId,
			bankId: this.bankId(),
			brandId: data.brandId,
			startDate,
			endDate,
			period,
			pageNumber: 1,
			pageSize: 0,
			sortField: "",
			sortOrder: 0,
		};
	}

	private resolveDateRange(period: DatePeriodEnum, filter: FeeDetailFilterOutput | null, data: FeeDetailInfoResponse): [string, string] {
		const min = this.parseIso(data.minDate);
		const max = this.parseIso(data.maxDate);

		if (filter && filter.startDate && filter.endDate) {
			const start = this.parseIso(filter.startDate);
			const end = this.parseIso(filter.endDate);
			if (!start || !end) return [filter.startDate, filter.endDate];
			return this.clampRangeToIso(start, end, min, max);
		}

		const today = new Date();

		if (period === DatePeriodEnum.CurrentMonth) {
			const anchorEnd = max && max < today ? max : today;
			const anchorStart = new Date(anchorEnd.getFullYear(), anchorEnd.getMonth(), 1);
			return this.clampRangeToIso(anchorStart, anchorEnd, min, max);
		}

		const start = period === DatePeriodEnum.CurrentYear ? new Date(today.getFullYear(), 0, 1) : new Date(today.getFullYear(), today.getMonth() - 11, 1);
		return this.clampRangeToIso(start, today, min, max);
	}

	private clampRangeToIso(start: Date, end: Date, min: Date | null, max: Date | null): [string, string] {
		let clampedStart = start;
		let clampedEnd = end;
		const noOverlap = (max && clampedStart > max) || (min && clampedEnd < min);
		if (noOverlap && max) {
			clampedEnd = max;
			clampedStart = new Date(max.getFullYear(), max.getMonth() - 11, 1);
		}
		if (max && clampedEnd > max) clampedEnd = max;
		if (min && clampedStart < min) clampedStart = min;
		if (max && clampedStart > max) clampedStart = max;
		if (min && clampedEnd < min) clampedEnd = min;
		return [this.toIso(clampedStart), this.toIso(clampedEnd)];
	}

	private parseIso(iso: string | null | undefined): Date | null {
		if (!iso) return null;
		const [y, m, d] = iso.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}

	private computeHasIncompleteHistory(items: FeeDetailChartItem[]): boolean {
		if (this.activePeriod() === DatePeriodEnum.CurrentMonth) return false;
		if (items.length === 0) return false;
		return items.some(i => i.amount !== null && i.amount !== undefined && (i.previousYearAmount === null || i.previousYearAmount === undefined));
	}

	private toIso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	private saveBlobAsFile(blob: Blob | null, filename: string): void {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	public onSetAlertClosed(saved: boolean): void {
		this.showModalSetAlert.set(false);
		if (saved) this.loadHasAlert(this.feeId());
	}

	public onAlertSaved(): void {
		this.loadHasAlert(this.feeId());
		this.messageService.add({
			severity: "success",
			icon: "icon icon-success",
			summary: this.commonGlobalService.termText("LBL_ALERT_SAVED_TITLE"),
			detail: this.commonGlobalService.termText("LBL_ALERT_SAVED_DETAIL"),
		});
	}

	private loadHasAlert(feeId: string): void {
		if (!feeId) {
			this.hasAlert.set(false);
			return;
		}
		this.configService
			.getByFee(Number(feeId), this.bankId())
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: response => this.hasAlert.set(response.configuration !== null),
				error: () => this.hasAlert.set(false),
			});
	}
}
