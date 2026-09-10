import { CommonModule } from "@angular/common";
import { HttpResponse } from "@angular/common/http";
import { Component, computed, effect, inject, OnDestroy, signal, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterLink, RouterModule } from "@angular/router";
import { AlertService, GlobalTermService, TermPipe } from "intelica-library-base";
import { ColumnComponent, ElementService, QueryParametersModel, RowResumenComponent, TableFetchComponent, TruncatePipe, AddFavoritesComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { MenuItem, MessageService } from "primeng/api";
import { BreadcrumbModule } from "primeng/breadcrumb";
import { Button } from "primeng/button";
import { DatePicker } from "primeng/datepicker";
import { Dialog } from "primeng/dialog";
import { MultiSelect } from "primeng/multiselect";
import { PaginatorModule } from "primeng/paginator";
import { PopoverModule } from "primeng/popover";
import { SelectModule } from "primeng/select";
import { Skeleton } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { Toast, ToastModule } from "primeng/toast";
import { Tooltip, TooltipModule } from "primeng/tooltip";
import { finalize, forkJoin, Observable, Subscription } from "rxjs";
import { TpeReportParams } from "../dto/tpe-commands.dto";
import { FiltersTpeResponse, MerchantReportResponse, SortOrderEnum } from "../dto/tpe-responses.dto";
import { TpeDatePreset, TpeFilterService, TPE_DATE_PRESETS } from "../tpe-filter/tpe-filter.service";
import { TpeService } from "../tpe.service";
import moment from "moment";
import { PrimeNG } from "primeng/config";
import { CommonGlobalService } from "../../common/services/common.service";
import { PeriodType } from "../../common/enums/common.enum";
import { TPE_MERCHANT_REPORT_BREADCRUMB } from "../../library/common/constants";

interface SelectOption<TValue> {
	label: string;
	value: TValue;
}

const MERCHANT_REPORT_TABLE_KEY = "merchant-report";
@Component({
	selector: "fee-tpe-merchant-report",
	imports: [
		AddFavoritesComponent,
		BreadcrumbModule,
		Button,
		ColumnComponent,
		CommonModule,
		DatePicker,
		Dialog,
		FormsModule,
		MultiSelect,
		PaginatorModule,
		PopoverModule,
		RouterLink,
		RouterModule,
		SelectModule,
		Skeleton,
		TableFetchComponent,
		TableModule,
		TermPipe,
		ToastModule,
		Tooltip,
		TooltipModule,
		TruncatePipe,
		RowResumenComponent,
		Toast,
		StatusStateComponent,
	],
	templateUrl: "./tpe-merchant-report.component.html",
	styles: ``,
})
export class TpeMerchantReport implements OnDestroy {
	public readonly globalTermService = inject(GlobalTermService);
	private readonly filterService = inject(TpeFilterService);
	private readonly tpeService = inject(TpeService);
	private readonly temPipe = inject(TermPipe);
	private readonly alertService = inject(AlertService);
	private readonly elementService = inject(ElementService);
	private readonly commonGlobalService = inject(CommonGlobalService);
	private readonly route = inject(ActivatedRoute);
	@ViewChild("picker") picker!: DatePicker;
	@ViewChild(TableFetchComponent) tableFetch!: TableFetchComponent<MerchantReportResponse>;

	public isNoData = this.filterService.isNoData;
	public statusStateEnum = StatusStateEnum;

	private reportLoading = signal<boolean>(true);
	private _isDownloadReport = signal<boolean>(false);
	public merchantReport = signal<MerchantReportResponse[]>([]);
	public sortField = signal<keyof MerchantReportResponse>("feeValue");
	public sortDirection = signal<SortOrderEnum>(SortOrderEnum.Descending);
	public rowsPerPage = signal<number>(10);
	private readonly restoredTableState = this.route.snapshot.paramMap.has("returnFrom") ? this.filterService.getTableState(MERCHANT_REPORT_TABLE_KEY) : null;
	public currentPage = signal<number>(this.restoredTableState?.currentPage ?? 1);
	public totalItems = signal<number>(0);
	public totalAmount = signal<number>(0);
	public searchText = signal<string | null>(this.restoredTableState?.searchText ?? null);
	public presetActive = signal<TpeDatePreset | null>(null);
	public includeTerminalId = this.elementService.HasElement("TERMINAL_ID");
	public includeSubprogramId = this.elementService.HasElement("SUB_PRG_ID");
	public includeResponseCode = this.elementService.HasElement("RESP_CD");
	public searchFields = computed(() => {
		const term = (key: string) => this.temPipe.transform(key, this.globalTermService.languageCode);
		return [
			term("FeeCode"),
			term("LBL_ACQUIRER_ICA"),
			term("LBL_MERCHANT_NAME"),
			term("LBL_MERCHANT_ID"),
			term("LBL_QUANTITY_NUMBER"),
			term("CONVERTED_AMOUNT_DE_10"),
			term("LBL_T_RATE"),
			term("LBL_AMOUNT") + ` (${this.currency()})`,
		];
	});

	public isLoadingReport = computed<boolean>(() => this.reportLoading());
	public isDownloadReport = computed<boolean>(() => this._isDownloadReport());
	public currency = computed<string>(() => {
		const client = this.filterService.selectedClientTemp();
		return client ? client.clientCurrency : "";
	});

	public items: MenuItem[] = [];

	private lastFilterKey = "";
	private lastSummaryKey = "";
	private lastRawFiltersKey = "";
	private reportSub: Subscription | null = null;
	private rawFiltersSub: Subscription | null = null;
	public maxMerchantNameLength = 40;

	public viewMonth!: number;
	public viewYear!: number;
	public months: { label: string; value: number }[] = [];
	public years: number[] = [];

	public datePickerOptions = computed<{ minDate: Date; maxDate: Date; disabledDates: Date[] }>(() => {
		const selectedClient = this.filterService.selectedClientTemp();
		if (!selectedClient) {
			const today = new Date();
			return { minDate: today, maxDate: today, disabledDates: [] };
		}
		const { minDate, maxDate, disabledDates } = selectedClient;

		const minYear = minDate.getFullYear();
		const maxYear = maxDate.getFullYear();

		this.years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
		return { minDate, maxDate, disabledDates };
	});

	private viewedDate = signal<Date>(new Date());
	private viewedView = signal<"date" | "month" | "year">("date");

	public canGoPrev = computed(() => {
		const min = this.datePickerOptions().minDate;
		if (!min) return true;
		const viewed = this.viewedDate();
		switch (this.viewedView()) {
			case "month":
				return min.getFullYear() < viewed.getFullYear();
			case "year":
				return min.getFullYear() < decadeStart(viewed.getFullYear());
			default:
				return isMonthBefore(min, viewed);
		}
	});

	public canGoNext = computed(() => {
		const max = this.datePickerOptions().maxDate;
		const viewed = this.viewedDate();
		switch (this.viewedView()) {
			case "month":
				return viewed.getFullYear() < max.getFullYear();
			case "year":
				return decadeStart(viewed.getFullYear()) + 9 < max.getFullYear();
			default:
				return isMonthBefore(viewed, max);
		}
	});

	public panelClasses = computed(() => {
		const classes: string[] = ["prDatapicker", "prDatapicker--range"];
		if (!this.canGoPrev()) classes.push("prDatapicker--noPrev");
		if (!this.canGoNext()) classes.push("prDatapicker--noNext");
		return classes.join(" ");
	});

	public rawPresetsState = computed(() => {
		const { minDate: min, maxDate: max } = this.datePickerOptions();
		const activePreset = this.presetActive();
		const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
		const defs: [TpeDatePreset, string, Date, Date][] = [
			[TPE_DATE_PRESETS.LAST_12_MONTHS, "LBL_LAST_12_MONTHS", new Date(today.getFullYear(), today.getMonth() - 11, 1), today],
			[TPE_DATE_PRESETS.CURRENT_YEAR, "CurrentYear", new Date(today.getFullYear(), 0, 1), today],
			[TPE_DATE_PRESETS.CURRENT_MONTH, "LBL_CURRENT_MONTH", new Date(today.getFullYear(), today.getMonth(), 1), today],
		];
		return defs.map(([preset, termKey, start, end]) => {
			const available = start <= max && end >= min;
			return { preset, termKey, active: activePreset === preset && available, disabled: !available };
		});
	});

	public fullItems: MenuItem[] = [
		{ label: "MastercardTPE", routerLink: "/fee/tpe/dashboard" },
		{
			label: "LBL_MERCHANT_REPORT",
		},
	];
	private messageService = inject(MessageService);

	private termText(key: string): string {
		return this.temPipe.transform(key, this.globalTermService.languageCode);
	}

	onExportChange(value: string) {
		if (!value) return;

		switch (value) {
			case "excel":
				this.openExcelDialog();
				break;
			case "raw":
				this.openRawDialog("raw");
				break;
			case "zip":
				this.openRawDialog("zip");
				break;
		}
	}

	public hasFeeDetail(feeCode: string): boolean {
		return this.resolveFeeId(feeCode) !== 0;
	}

	public goToDetail(rowData: MerchantReportResponse): void {
		const feeId = this.resolveFeeId(rowData.feeCode);
		if (feeId === 0) {
			return;
		}

		this.filterService.saveTableState(MERCHANT_REPORT_TABLE_KEY, {
			currentPage: this.currentPage(),
			searchText: this.searchText(),
		});

		const filter = this.filterService.filter();
		const dateRange =
			filter.from && filter.to
				? {
						startDate: filter.from,
						endDate: filter.to,
						period: this.commonGlobalService.mapPeriodToDetailPeriod(PeriodType.Customized),
					}
				: undefined;

		this.commonGlobalService.navigateToFeeDetail(
			{
				feeId,
				bankId: filter.clientId,
				origin: TPE_MERCHANT_REPORT_BREADCRUMB,
				dateRange,
			},
			false
		);
	}

	private resolveFeeId(feeCode: string): number {
		return this.filterService.filterOptionsApply()?.fees.find(fee => fee.name === feeCode)?.id ?? 0;
	}

	public constructor(private primeng: PrimeNG) {
		this.filterService.restoreTempFilter();
		this.setupMerchantReportEffect();
		this.setupRawDialogOptionsEffect();
		setTimeout(() => {
			this.items = [
				{ label: "EXCEL", value: "excel" },
				{ label: "RAW", value: "raw" },
				{ label: "DOWNLOAD_ZIP", value: "zip" },
			];
		}, 1500);
		this.months =
			this.primeng?.translation?.monthNames?.map((m, i) => ({
				label: m,
				value: i,
			})) ?? [];
	}

	public showDialogRaw = false;
	public rawDownloadType: "raw" | "zip" = "raw";

	public openExcelDialog(): void {
		this.confirmExcelDownload();
	}

	public openRawDialog(type: "raw" | "zip"): void {
		this.rawDownloadType = type;
		this.syncRawDialogWithFilters();
		this.showDialogRaw = true;
	}

	public confirmExcelDownload(): void {
		const params = this.buildExcelParams();
		if (!params || this.merchantReport().length === 0) {
			this.messageService.add({
				severity: "secondary",
				icon: "icon icon-loading",
				summary: this.termText("NO_INFORMATION"),
				detail: this.termText("NOT_INFORMATION_TO_DOWNLOAD"),
			});
			return;
		}
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.termText("PREPARING_YOUR_FILE"),
			detail: this.termText("YOUR_DOWNLOAD_WILL_START"),
		});
		this.executeDownload(this.tpeService.downloadMerchantReport(params), "merchant-report.xlsx");
	}

	public confirmRawDataZipDownload(): void {
		if (this.isRawFiltersLoading()) return;
		this.showDialogRaw = false;
		const params = this.buildRawParams();

		if (!params) {
			this._isDownloadReport.set(false);
			return;
		}
		const request = this.rawDownloadType === "raw" ? this.tpeService.downloadMerchantReportRawData(params) : this.tpeService.downloadMerchantReportZip(params);
		const filename = this.rawDownloadType === "raw" ? "merchant-report-raw-data.xlsx" : "merchant-report.zip";
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.termText("PREPARING_YOUR_FILE"),
			detail: this.termText("YOUR_DOWNLOAD_WILL_START"),
		});
		this.executeDownload(request, filename);
	}

	public closeRawDialog(): void {
		this.showDialogRaw = false;
	}

	public dates = signal<Date[] | undefined>(undefined);
	private rawDialogFilters = signal<FiltersTpeResponse | null>(null);
	private rawFiltersLoading = signal<boolean>(false);
	public isRawFiltersLoading = computed<boolean>(() => this.rawFiltersLoading());

	public icaOptions: SelectOption<string>[] = [];
	public feeOptions: SelectOption<number>[] = [];
	public selectedIcas: string[] = [];
	public selectedFees: number[] = [];

	get isReadonlyIca(): boolean {
		return this.icaOptions.length <= 1;
	}

	get isReadonlyFee(): boolean {
		return this.feeOptions.length <= 1;
	}

	get selectedIcasLabel(): string {
		const selected = this.selectedIcas;
		const options = this.icaOptions;
		if (selected.length === 0) return "";
		if (selected.length === options.length && options.length > 1) return this.termText("ALL_ICAS");
		if (selected.length === 1) return options.find(o => o.value === selected[0])?.label ?? "";
		return `${selected.length} ${this.termText("SELECTED_ICAS")}`;
	}

	get selectedFeesLabel(): string {
		const selected = this.selectedFees;
		const options = this.feeOptions;
		if (selected.length === 0) return "";
		if (selected.length === options.length && options.length > 1) return this.termText("ALL_FEES");
		if (selected.length === 1) return options.find(o => o.value === selected[0])?.label ?? "";
		return `${selected.length} ${this.termText("SELECTED_FEES")}`;
	}

	public onRawIcaChange(): void {
		if (this.isRawFiltersLoading()) return;
	}

	public onRawFeeChange(): void {
		if (this.isRawFiltersLoading()) return;
	}

	public selectedCurrentMonth = computed(() => this.presetActive() == TPE_DATE_PRESETS.CURRENT_MONTH);

	public selectedLast12Months = computed(() => this.presetActive() == TPE_DATE_PRESETS.LAST_12_MONTHS);

	public selectedCurrentYear = computed(() => this.presetActive() == TPE_DATE_PRESETS.CURRENT_YEAR);

	public applyRawLast12Months(): void {
		this.applyRawPreset(TPE_DATE_PRESETS.LAST_12_MONTHS);
	}

	public applyRawCurrentYear(): void {
		this.applyRawPreset(TPE_DATE_PRESETS.CURRENT_YEAR);
	}

	public applyRawCurrentMonth(): void {
		this.applyRawPreset(TPE_DATE_PRESETS.CURRENT_MONTH);
	}

	public applyRawPreset(preset: TpeDatePreset): void {
		const dates = this.toDates(this.getPresetRange(preset));
		if (!dates) return;
		this.presetActive.set(preset);
		this.dates.set(dates);
		this.loadRawDialogFiltersByDateRange(dates);
		this.picker.hideOverlay();
	}

	public onRawDateRangeChange(range: Date[] | undefined): void {
		this.dates.set(range);
		this.presetActive.set(null);
		this.loadRawDialogFiltersByDateRange(range);
	}

	private getPresetRange(preset: TpeDatePreset): { from: string; to: string } | null {
		const client = this.filterService.selectedClientTemp();
		return client ? this.filterService.getPresetRange(client, preset) : null;
	}

	private setupMerchantReportEffect(): void {
		effect(() => {
			const filter = this.filterService.filter();
			const pageNumber = this.currentPage();
			const pageSize = this.rowsPerPage();
			const sortField = this.sortField();
			const sortDirection = this.sortDirection();
			const searchText = this.searchText();

			if (!filter.clientId || !filter.from || !filter.to) return;

			const filterKey = `${filter.clientId}|${filter.from}|${filter.to}|${(filter.icas ?? []).join(",")}`;
			if (filterKey !== this.lastFilterKey) {
				const isFilterChange = this.lastFilterKey !== "";
				this.lastFilterKey = filterKey;
				if (isFilterChange && pageNumber !== 1) {
					this.currentPage.set(1);
					this.filterService.clearTableState(MERCHANT_REPORT_TABLE_KEY);
					return;
				}
			}

			const params: TpeReportParams = {
				client: filter.clientId,
				from: filter.from,
				to: filter.to,
				icas: filter.icas,
				pageNumber,
				pageSize,
				sortField,
				sortOrder: sortDirection,
				searchText,
			};

			this.reportLoading.set(true);
			this.filterService.beginFilterRequest();
			this.reportSub?.unsubscribe();
			const summaryKey = `${filterKey}|${searchText ?? ""}`;
			if (summaryKey !== this.lastSummaryKey) {
				this.lastSummaryKey = summaryKey;
				this.reportSub = forkJoin({
					report: this.tpeService.getMerchantReport(params),
					summary: this.tpeService.getMerchantReportSummary(params),
				})
					.pipe(finalize(() => this.filterService.endFilterRequest()))
					.subscribe({
						next: ({ report, summary }) => {
							this.applyReportItems(report.items);
							this.applyReportSummary(summary.totalAmount, summary.totalCount);
						},
						error: () => {
							this.lastSummaryKey = "";
							this.handleReportError(true);
						},
						complete: () => this.reportLoading.set(false),
					});
				return;
			}

			this.reportSub = this.tpeService
				.getMerchantReport(params)
				.pipe(finalize(() => this.filterService.endFilterRequest()))
				.subscribe({
					next: response => {
						this.applyReportItems(response.items);
					},
					error: () => {
						this.handleReportError(false);
					},
					complete: () => this.reportLoading.set(false),
				});
		});
	}

	private applyReportItems(items: MerchantReportResponse[] | undefined | null): void {
		this.merchantReport.set(items ?? []);
	}

	private applyReportSummary(totalAmount: number | undefined, totalCount: number | undefined): void {
		this.totalAmount.set(totalAmount ?? 0);
		this.totalItems.set(totalCount ?? 0);
	}

	private handleReportError(resetSummary: boolean): void {
		this.merchantReport.set([]);
		if (resetSummary) {
			this.applyReportSummary(0, 0);
		}
		this.reportLoading.set(false);
	}

	private setupRawDialogOptionsEffect(): void {
		effect(() => {
			const filters = this.filterService.filterOptions();
			if (!filters) return;
			this.recomputeRawOptions(filters);
		});
	}

	private syncRawDialogWithFilters(): void {
		const filter = this.filterService.filter();
		const filters = this.filterService.filterOptions();
		const currentDates = this.toDates({ from: filter.from, to: filter.to });
		this.dates.set(currentDates);
		const currentPreset = this.filterService.activePreset();
		this.presetActive.set(currentPreset);
		this.selectedIcas = this.getVisibleRawIcaSelection(filter.icas ?? [], filters);
		this.selectedFees = this.feeOptions.map(x => x.value);
		this.rawDialogFilters.set(filters);
		this.lastRawFiltersKey = filter.clientId && filter.from && filter.to ? `${filter.clientId}|${filter.from}|${filter.to}` : "";
		this.recomputeRawOptions(filters ?? undefined);
	}

	private recomputeRawOptions(filtersOverride?: FiltersTpeResponse): void {
		const filters = filtersOverride ?? this.rawDialogFilters() ?? this.filterService.filterOptions();
		if (!filters) {
			this.icaOptions = [];
			this.feeOptions = [];
			return;
		}

		const allowedFeeIds = this.getAllowedFeeIds(filters, this.selectedIcas);
		const allowedIcas = this.getAllowedIcas(filters, this.selectedFees);

		this.selectedFees = this.selectedFees.filter(id => allowedFeeIds.has(id));
		this.selectedIcas = this.selectedIcas.filter(ica => allowedIcas.has(ica));

		const allowedFeeIdsAfter = this.getAllowedFeeIds(filters, this.selectedIcas);
		const allowedIcasAfter = this.getAllowedIcas(filters, this.selectedFees);

		this.feeOptions = this.buildFeeOptions(filters, allowedFeeIdsAfter);
		this.icaOptions = this.buildIcaOptions(filters, allowedIcasAfter);
	}

	private loadRawDialogFiltersByDateRange(range: Date[] | undefined): void {
		const filter = this.filterService.filter();
		if (!filter.clientId || !range || range.length < 2 || !range[0] || !range[1]) return;

		const from = moment(range[0]).format("YYYY-MM-DD");
		const to = moment(range[1]).format("YYYY-MM-DD");
		const key = `${filter.clientId}|${from}|${to}`;
		if (key === this.lastRawFiltersKey) return;

		this.lastRawFiltersKey = key;
		this.rawFiltersSub?.unsubscribe();
		this.rawFiltersLoading.set(true);
		this.rawFiltersSub = this.tpeService.getFilters({ client: filter.clientId, from, to }).subscribe({
			next: filters => {
				this.rawDialogFilters.set(filters);
				this.recomputeRawOptions(filters);
				this.selectedIcas = this.icaOptions.map(o => o.value);
				this.selectedFees = this.feeOptions.map(o => o.value);
			},
			error: () => {
				this.rawFiltersLoading.set(false);
			},
			complete: () => {
				this.rawFiltersLoading.set(false);
			},
		});
	}

	private getAllowedFeeIds(filters: FiltersTpeResponse, selectedIcas: string[]): Set<number> {
		if (!selectedIcas.length) {
			return new Set(filters.fees.map(fee => fee.id));
		}
		const allowed = new Set<number>();
		for (const ica of selectedIcas) {
			const fees = filters.icaToFees[ica] ?? [];
			for (const feeId of fees) {
				allowed.add(feeId);
			}
		}
		return allowed;
	}

	private getAllowedIcas(filters: FiltersTpeResponse, selectedFees: number[]): Set<string> {
		if (!selectedFees.length) {
			return new Set(filters.icas);
		}
		const allowed = new Set<string>();
		for (const feeId of selectedFees) {
			const icas = filters.feeToIcas[feeId] ?? [];
			for (const ica of icas) {
				allowed.add(ica);
			}
		}
		return allowed;
	}

	private buildIcaOptions(filters: FiltersTpeResponse, allowed: Set<string>): SelectOption<string>[] {
		return filters.icas.filter(ica => allowed.has(ica)).map(ica => ({ label: ica, value: ica }));
	}

	private buildFeeOptions(filters: FiltersTpeResponse, allowed: Set<number>): SelectOption<number>[] {
		return filters.fees.filter(fee => allowed.has(fee.id)).map(fee => ({ label: fee.name, value: fee.id }));
	}

	private buildExcelParams(): TpeReportParams | null {
		const filter = this.filterService.filter();
		if (!filter.clientId || !filter.from || !filter.to) return null;
		return {
			client: filter.clientId,
			from: filter.from,
			to: filter.to,
			icas: filter.icas,
			pageNumber: this.currentPage(),
			pageSize: this.rowsPerPage(),
			sortField: this.sortField(),
			sortOrder: this.sortDirection(),
			searchText: this.searchText(),
		};
	}

	private buildRawParams(): TpeReportParams | null {
		const filter = this.filterService.filter();
		if (!filter.clientId) return null;
		const date = this.dates();
		if (!date) return null;
		if (!this.isWithin3Months(date[0], date[1])) {
			this.alertService.error(this.termText("DownloadLimitReached"), this.termText("ExportsAreLimitedTo3Months")).then(_ => _);
			return null;
		}
		return {
			client: filter.clientId,
			from: moment(date[0]).format("YYYY-MM-DD"),
			to: moment(date[1]).format("YYYY-MM-DD"),
			icas: this.normalizeRawIcasForRequest(this.selectedIcas),
			fees: this.selectedFees,
			sortField: this.sortField(),
			sortOrder: this.sortDirection(),
			includeTerminalId: this.includeTerminalId,
			includeSubprogramId: this.includeSubprogramId,
			includeResponseCode: this.includeResponseCode,
		};
	}

	private isWithin3Months(start: Date, end: Date): boolean {
		return moment(end).isSameOrBefore(moment(start).add(3, "months"));
	}

	private getVisibleRawIcaSelection(filterIcas: string[], filters: FiltersTpeResponse | null): string[] {
		if (filterIcas.length > 0) {
			return [...filterIcas];
		}
		const availableIcas = filters?.icas ?? [];
		return availableIcas.length === 1 ? [availableIcas[0]] : [];
	}

	private normalizeRawIcasForRequest(selectedIcas: string[]): string[] {
		return selectedIcas.map(ica => ica?.trim()).filter((ica): ica is string => Boolean(ica));
	}

	private toDates(range: { from: string; to: string } | null | undefined): Date[] | undefined {
		return this.filterService.getDatesFromRange(range);
	}

	private executeDownload(request: Observable<HttpResponse<Blob>>, fallbackFilename: string): void {
		this._isDownloadReport.set(true);
		request.subscribe({
			next: response => {
				this.triggerDownloadFromResponse(response, fallbackFilename);
				this.messageService.add({
					severity: "success",
					icon: "icon icon-success",
					summary: this.termText("FILE_DOWNLOADED_SUCCESSFULLY"),
					detail: this.termText("YOUR_FILE_HAS_BEEN"),
				});
				this._isDownloadReport.set(false);
			},
			error: () => {
				this.messageService.add({
					severity: "error",
					icon: "icon icon-alert",
					summary: this.termText("DOWNLOAD_FAILED"),
					detail: this.termText("WE_COULDNT_GENERATE_FILE"),
				});
				this._isDownloadReport.set(false);
			},
		});
	}

	private triggerDownloadFromResponse(response: HttpResponse<Blob>, fallbackFilename: string): void {
		const blob = response.body;
		if (!blob) {
			return;
		}
		const filename = this.resolveFilename(response, fallbackFilename);
		this.triggerDownload(blob, filename);
	}

	private triggerDownload(blob: Blob, filename: string): void {
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = filename;
		anchor.click();
		URL.revokeObjectURL(url);
	}

	private resolveFilename(response: HttpResponse<Blob>, fallback: string): string {
		const header = response.headers.get("content-disposition") ?? response.headers.get("Content-Disposition");
		if (!header) return fallback;
		const filenameStar = this.extractFilenameStar(header);
		if (filenameStar) return filenameStar;
		const filename = this.extractFilename(header);
		return filename ?? fallback;
	}

	private extractFilenameStar(header: string): string | null {
		const match = header.match(/filename\*\s*=\s*([^;]+)/i);
		if (!match) return null;
		const raw = match[1].trim();
		const value = raw.replace(/^["']|["']$/g, "");
		const parts = value.split("''");
		const encoded = parts.length === 2 ? parts[1] : value;
		try {
			return decodeURIComponent(encoded);
		} catch {
			return encoded;
		}
	}

	private extractFilename(header: string): string | null {
		const match = header.match(/filename\s*=\s*([^;]+)/i);
		if (!match) return null;
		return match[1].trim().replace(/^["']|["']$/g, "");
	}

	public onSearchParamsChange(params: QueryParametersModel): void {
		if (params.OrderBy) {
			this.sortField.set(params.OrderBy as keyof MerchantReportResponse);
		}
		if (params.SortDirection) {
			this.sortDirection.set(params.SortDirection === "asc" ? SortOrderEnum.Ascending : SortOrderEnum.Descending);
		}
		if (params.PageSize) {
			this.rowsPerPage.set(params.PageSize);
		}
		if (params.PageNumber) {
			this.currentPage.set(params.PageNumber);
		}

		this.searchText.set(params.FilterValue ?? null);
		this.filterService.clearTableState(MERCHANT_REPORT_TABLE_KEY);
	}

	get isNoMatchesState(): boolean {
		return !this.isLoadingReport() && this.merchantReport().length === 0 && (this.searchText()?.length ?? 0) > 0;
	}

	get isNoDataState(): boolean {
		return !this.isLoadingReport() && this.merchantReport().length === 0 && (this.searchText()?.length ?? 0) === 0;
	}

	public clearSearch(): void {
		this.tableFetch?.ClearSearch();
	}

	public ngOnDestroy(): void {
		this.reportSub?.unsubscribe();
		this.rawFiltersSub?.unsubscribe();
	}

	onDatepickerOpen() {
		const datesFromFilter = this.filterService.getDatesFromRange(this.filterService.filter()) ?? null;
		if (!datesFromFilter) return;
		const date = datesFromFilter[1] ?? datesFromFilter[0];
		this.viewMonth = date.getMonth();
		this.viewYear = date.getFullYear();
		this.goToMonthYear(this.viewMonth, this.viewYear);
		this.syncViewedState();
	}

	public onPanelInteract(): void {
		this.syncViewedState();
	}

	goToMonthYear(month: number, year: number) {
		this.picker.currentMonth = month;
		this.picker.currentYear = year;
		this.picker.createMonths(this.picker.currentMonth, this.picker.currentYear);
	}

	onViewChange() {
		this.goToMonthYear(this.viewMonth, this.viewYear);
	}
	onMonthChange(e: any) {
		this.viewMonth = this.picker.currentMonth;
		this.viewYear = this.picker.currentYear;
		this.syncViewedState();
	}

	onYearChange(e: any) {
		this.viewYear = this.picker.currentYear;
		this.syncViewedState();
	}

	private syncViewedState(): void {
		if (!this.picker) return;
		const dp = this.picker as unknown as { currentMonth?: number; currentYear?: number; currentView?: string };
		if (dp.currentView === "date" || dp.currentView === "month" || dp.currentView === "year") {
			this.viewedView.set(dp.currentView);
		}
		if (typeof dp.currentMonth === "number" && typeof dp.currentYear === "number") {
			this.viewedDate.set(new Date(dp.currentYear, dp.currentMonth, 1));
		}
	}
}

function isMonthBefore(a: Date, b: Date): boolean {
	return a.getFullYear() < b.getFullYear() || (a.getFullYear() === b.getFullYear() && a.getMonth() < b.getMonth());
}

function decadeStart(year: number): number {
	return year - (year % 10);
}
