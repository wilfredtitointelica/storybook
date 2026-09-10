import { Component, DestroyRef, computed, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { AddFavoritesComponent, buildSearchLabel as buildSearchLabelShared } from "intelica-library-project";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { IconFieldModule } from "primeng/iconfield";
import { InputIconModule } from "primeng/inputicon";
import { InputTextModule } from "primeng/inputtext";
import { TabsModule } from "primeng/tabs";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";
import { FEE_UPDATES_BREADCRUMB, FEE_UPDATES_CONSTANTS, FEE_UPDATES_TERM } from "./common/constants";
import { DatePeriodEnum, FeeUpdatesTabEnum } from "./common/enums";
import { FeeUpdatesExportCommand, FeeUpdatesSummaryQuery, FeeUpdatesTableQuery } from "./dto/fee-updates-commands.dto";
import { FeeUpdatesFilterOutput, FeeUpdatesPageChangeEvent } from "./dto/fee-updates.dto";
import {
	CeasedFeesResponse,
	FeeUpdatesBrandItem,
	FeeUpdatesBusinessItem,
	FeeUpdatesEntityItem,
	FeeUpdatesSummaryResponse,
	NewFeesResponse,
	TariffChangesResponse,
} from "./dto/fee-updates-responses.dto";
import { FeeUpdatesService } from "./fee-updates.service";
import { HeaderComponent } from "./header/header";
import { SummaryCardsComponent } from "./summary-cards/summary-cards";
import { NewFeesComponent } from "./new-fees/new-fees";
import { TariffChangesComponent } from "./tariff-changes/tariff-changes";
import { CeasedFeesComponent } from "./ceased-fees/ceased-fees";
import { FormsModule } from "@angular/forms";
import { SkeletonModule } from "primeng/skeleton";
import { CommonGlobalService } from "../common/services/common.service";

@Component({
	selector: "fee-fee-updates",
	standalone: true,
	imports: [
		FormsModule,
		ButtonModule,
		IconFieldModule,
		InputIconModule,
		InputTextModule,
		TabsModule,
		ToastModule,
		TooltipModule,
		HeaderComponent,
		SummaryCardsComponent,
		NewFeesComponent,
		TariffChangesComponent,
		CeasedFeesComponent,
		SkeletonModule,
		AddFavoritesComponent,
	],
	providers: [MessageService],
	templateUrl: "./fee-updates.html",
})
export class FeeUpdatesComponent implements OnInit {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly commonGlobalService = inject(CommonGlobalService);
	private readonly termPipe = inject(TermPipe);
	public readonly feeUpdatesTerm = FEE_UPDATES_TERM;
	public readonly FeeUpdatesTabEnum = FeeUpdatesTabEnum;
	private readonly sessionConfig = inject(ConfigService);
	private readonly service = inject(FeeUpdatesService);
	private readonly messageService = inject(MessageService);
	private readonly destroyRef = inject(DestroyRef);

	public readonly isGroupProfile = this.sessionConfig.SessionInformation?.isGroup ?? false;

	public entities = signal<FeeUpdatesEntityItem[]>([]);
	public brands = signal<FeeUpdatesBrandItem[]>([]);
	public businesses = signal<FeeUpdatesBusinessItem[]>([]);
	public minDate = signal<Date | null>(null);
	public maxDate = signal<Date | null>(null);
	public isLoadingFilters = signal<boolean>(false);

	public summary = signal<FeeUpdatesSummaryResponse | null>(null);
	public isLoadingSummary = signal<boolean>(false);

	public newFeesData = signal<NewFeesResponse | null>(null);
	public tariffChangesData = signal<TariffChangesResponse | null>(null);
	public ceasedFeesData = signal<CeasedFeesResponse | null>(null);

	public isLoadingNewFees = signal<boolean>(false);
	public isLoadingTariffChanges = signal<boolean>(false);
	public isLoadingCeasedFees = signal<boolean>(false);

	public newFeesError = signal<boolean>(false);
	public tariffChangesError = signal<boolean>(false);
	public ceasedFeesError = signal<boolean>(false);

	public isDownloadingNewFees = signal<boolean>(false);
	public isDownloadingTariffChanges = signal<boolean>(false);
	public isDownloadingCeasedFees = signal<boolean>(false);

	public isBusy = computed<boolean>(() => this.isLoadingSummary() || this.isLoadingNewFees() || this.isLoadingTariffChanges() || this.isLoadingCeasedFees());

	public hasNewFees = computed<boolean>(() => (this.newFeesData()?.items?.length ?? 0) > 0);
	public hasTariffChanges = computed<boolean>(() => (this.tariffChangesData()?.items?.length ?? 0) > 0);
	public hasCeasedFees = computed<boolean>(() => (this.ceasedFeesData()?.items?.length ?? 0) > 0);

	public newFeesExportTooltip = computed<string>(() => (!this.isDownloadingNewFees() && !this.hasNewFees() ? this.commonGlobalService.termText(this.feeUpdatesTerm.NO_DATA_TO_EXPORT) : ""));

	public newFeesSearchFields = computed<string[]>(() => {
		const fields = [this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_CODE), this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_NAME)];
		if (this.showClientColumn()) {
			fields.push(this.commonGlobalService.termText(this.feeUpdatesTerm.COL_INSTITUTION));
		}
		fields.push(
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_CATEGORY),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BUSINESS),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BRAND),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FIRST_BILLING_DATE)
		);
		const amountLabel = this.commonGlobalService.termText(this.feeUpdatesTerm.COL_AMOUNT_IN);
		for (const code of this.newFeesData()?.availableCurrencies ?? []) {
			fields.push(`${amountLabel} ${code}`);
		}
		return fields;
	});
	public newFeesSearchPlaceholder = computed<string>(() => this.buildSearchLabel(this.newFeesSearchFields()).placeholder);
	public newFeesSearchTooltip = computed<string>(() => this.buildSearchLabel(this.newFeesSearchFields()).tooltip);

	public tariffChangesSearchFields = computed<string[]>(() => {
		const fields = [this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_CODE), this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_NAME)];
		if (this.showClientColumn()) {
			fields.push(this.commonGlobalService.termText(this.feeUpdatesTerm.COL_INSTITUTION));
		}
		fields.push(
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_CATEGORY),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BUSINESS),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BRAND),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_CHANGE_DATE),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_PREVIOUS_RATE),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_NEW_RATE),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_ABSOLUTE_CHANGE)
		);
		return fields;
	});
	public tariffChangesSearchPlaceholder = computed<string>(() => this.buildSearchLabel(this.tariffChangesSearchFields()).placeholder);
	public tariffChangesSearchTooltip = computed<string>(() => this.buildSearchLabel(this.tariffChangesSearchFields()).tooltip);

	public ceasedFeesSearchFields = computed<string[]>(() => {
		const fields = [this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_CODE), this.commonGlobalService.termText(this.feeUpdatesTerm.COL_FEE_NAME)];
		if (this.showClientColumn()) {
			fields.push(this.commonGlobalService.termText(this.feeUpdatesTerm.COL_INSTITUTION));
		}
		fields.push(
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_CATEGORY),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BUSINESS),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_BRAND),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_CEASED_DATE),
			this.commonGlobalService.termText(this.feeUpdatesTerm.COL_LAST_KNOWN_RATE)
		);
		return fields;
	});
	public ceasedFeesSearchPlaceholder = computed<string>(() => this.buildSearchLabel(this.ceasedFeesSearchFields()).placeholder);
	public ceasedFeesSearchTooltip = computed<string>(() => this.buildSearchLabel(this.ceasedFeesSearchFields()).tooltip);

	private readonly maxSearchPlaceholderLength = 20;
	private buildSearchLabel(fields: string[]): { placeholder: string; tooltip: string } {
		return buildSearchLabelShared(this.termPipe, this.globalTermService.languageCode, fields, this.maxSearchPlaceholderLength);
	}
	public tariffChangesExportTooltip = computed<string>(() =>
		!this.isDownloadingTariffChanges() && !this.hasTariffChanges() ? this.commonGlobalService.termText(this.feeUpdatesTerm.NO_DATA_TO_EXPORT) : ""
	);
	public ceasedFeesExportTooltip = computed<string>(() => (!this.isDownloadingCeasedFees() && !this.hasCeasedFees() ? this.commonGlobalService.termText(this.feeUpdatesTerm.NO_DATA_TO_EXPORT) : ""));

	// Igual que library: el buscador se deshabilita en NoData/SystemError, pero NO en NoMatches
	// (si no, el usuario no podria limpiar su busqueda para recuperarse).
	public isNewFeesSearchDisabled = computed<boolean>(() => this.newFeesError() || (!this.hasNewFees() && !this.newFeesQuery().search));
	public isTariffChangesSearchDisabled = computed<boolean>(() => this.tariffChangesError() || (!this.hasTariffChanges() && !this.tariffChangesQuery().search));
	public isCeasedFeesSearchDisabled = computed<boolean>(() => this.ceasedFeesError() || (!this.hasCeasedFees() && !this.ceasedFeesQuery().search));

	public showClientColumn = computed<boolean>(() => {
		const available = this.entities();
		if (available.length <= 1) return false;
		const selected = this.currentFilter()?.entityIds ?? [];
		if (selected.length === 0 || selected.length >= available.length) return true;
		return selected.length > 1;
	});

	public newFeesSearch = signal<string>("");
	public tariffChangesSearch = signal<string>("");
	public ceasedFeesSearch = signal<string>("");

	public hasSystemError = signal<boolean>(false);

	public activeTab = signal<string>(FeeUpdatesTabEnum.NewFees);
	public currentFilter = signal<FeeUpdatesFilterOutput | null>(null);

	public newFeesQuery = signal<FeeUpdatesPageChangeEvent>({
		pageNumber: 1,
		rowsPerPage: FEE_UPDATES_CONSTANTS.DEFAULT_PAGE_SIZE,
		sortField: "firstBillingDate",
		sortOrder: -1,
		search: "",
	});

	public tariffChangesQuery = signal<FeeUpdatesPageChangeEvent>({
		pageNumber: 1,
		rowsPerPage: FEE_UPDATES_CONSTANTS.DEFAULT_PAGE_SIZE,
		sortField: "changeDate",
		sortOrder: -1,
		search: "",
	});

	public ceasedFeesQuery = signal<FeeUpdatesPageChangeEvent>({
		pageNumber: 1,
		rowsPerPage: FEE_UPDATES_CONSTANTS.DEFAULT_PAGE_SIZE,
		sortField: "ceasedDate",
		sortOrder: -1,
		search: "",
	});

	public ngOnInit(): void {
		this.loadFiltersBootstrap();
	}

	public onApplyFilter(filter: FeeUpdatesFilterOutput): void {
		this.currentFilter.set(filter);
		this.newFeesSearch.set("");
		this.tariffChangesSearch.set("");
		this.ceasedFeesSearch.set("");
		this.newFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.tariffChangesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.ceasedFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.loadAllData();
	}

	public onResetFilter(): void {
		this.currentFilter.set(this.buildDefaultFilter());
		this.newFeesSearch.set("");
		this.tariffChangesSearch.set("");
		this.ceasedFeesSearch.set("");
		this.newFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.tariffChangesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.ceasedFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.loadAllData();
	}

	public onNewFeesSearchInput(text: string): void {
		this.newFeesSearch.set(text);
	}

	public onNewFeesSearchExecute(): void {
		this.newFeesQuery.update(q => ({ ...q, pageNumber: 1, search: this.newFeesSearch().trim() }));
		this.loadNewFees();
	}

	public onNewFeesSearchClear(): void {
		this.newFeesSearch.set("");
		this.newFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.loadNewFees();
	}

	public onTariffChangesSearchInput(text: string): void {
		this.tariffChangesSearch.set(text);
	}

	public onTariffChangesSearchExecute(): void {
		this.tariffChangesQuery.update(q => ({ ...q, pageNumber: 1, search: this.tariffChangesSearch().trim() }));
		this.loadTariffChanges();
	}

	public onTariffChangesSearchClear(): void {
		this.tariffChangesSearch.set("");
		this.tariffChangesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.loadTariffChanges();
	}

	public onCeasedFeesSearchInput(text: string): void {
		this.ceasedFeesSearch.set(text);
	}

	public onCeasedFeesSearchExecute(): void {
		this.ceasedFeesQuery.update(q => ({ ...q, pageNumber: 1, search: this.ceasedFeesSearch().trim() }));
		this.loadCeasedFees();
	}

	public onCeasedFeesSearchClear(): void {
		this.ceasedFeesSearch.set("");
		this.ceasedFeesQuery.update(q => ({ ...q, pageNumber: 1, search: "" }));
		this.loadCeasedFees();
	}

	public onNewFeesQueryChange(event: FeeUpdatesPageChangeEvent): void {
		this.newFeesQuery.update(q => ({
			...q,
			pageNumber: event.pageNumber,
			rowsPerPage: event.rowsPerPage,
			sortField: event.sortField,
			sortOrder: event.sortOrder,
		}));
		this.loadNewFees();
	}

	public onTariffChangesQueryChange(event: FeeUpdatesPageChangeEvent): void {
		this.tariffChangesQuery.update(q => ({
			...q,
			pageNumber: event.pageNumber,
			rowsPerPage: event.rowsPerPage,
			sortField: event.sortField,
			sortOrder: event.sortOrder,
		}));
		this.loadTariffChanges();
	}

	public onCeasedFeesQueryChange(event: FeeUpdatesPageChangeEvent): void {
		this.ceasedFeesQuery.update(q => ({
			...q,
			pageNumber: event.pageNumber,
			rowsPerPage: event.rowsPerPage,
			sortField: event.sortField,
			sortOrder: event.sortOrder,
		}));
		this.loadCeasedFees();
	}

	public onNewFeesReload(): void {
		this.loadNewFees();
	}

	public onTariffChangesReload(): void {
		this.loadTariffChanges();
	}

	public onCeasedFeesReload(): void {
		this.loadCeasedFees();
	}

	public onFeeCodeClick(row: { feeId: string; clientId: number | null; newTab: boolean }): void {
		if (!row?.feeId) return;
		const bankId = row.clientId && row.clientId > 0 ? row.clientId : -1;
		const filter = this.currentFilter();
		this.commonGlobalService.navigateToFeeDetail(
			{
				feeId: row.feeId,
				bankId,
				origin: FEE_UPDATES_BREADCRUMB,
				dateRange: filter?.startDate && filter?.endDate ? { startDate: filter.startDate, endDate: filter.endDate } : undefined,
			},
			row.newTab
		);
	}

	public onDownloadNewFees(): void {
		this.downloadTab(FeeUpdatesTabEnum.NewFees, this.newFeesQuery(), this.isDownloadingNewFees);
	}

	public onDownloadTariffChanges(): void {
		this.downloadTab(FeeUpdatesTabEnum.TariffChanges, this.tariffChangesQuery(), this.isDownloadingTariffChanges);
	}

	public onDownloadCeasedFees(): void {
		this.downloadTab(FeeUpdatesTabEnum.CeasedFees, this.ceasedFeesQuery(), this.isDownloadingCeasedFees);
	}

	private loadFiltersBootstrap(): void {
		this.isLoadingFilters.set(true);
		this.isLoadingSummary.set(true);
		this.isLoadingNewFees.set(true);
		this.isLoadingTariffChanges.set(true);
		this.isLoadingCeasedFees.set(true);
		this.service
			.getFiltersBootstrap()
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.entities.set(data.entities);
					this.brands.set(data.brands);
					this.businesses.set(data.businesses);
					this.minDate.set(this.parseIsoDate(data.minDate));
					this.maxDate.set(this.parseIsoDate(data.maxDate));
					this.isLoadingFilters.set(false);
					this.currentFilter.set(this.buildDefaultFilter());
					this.loadAllData();
				},
				error: () => {
					this.isLoadingFilters.set(false);
					this.isLoadingSummary.set(false);
					this.isLoadingNewFees.set(false);
					this.isLoadingTariffChanges.set(false);
					this.isLoadingCeasedFees.set(false);
					this.newFeesError.set(true);
					this.tariffChangesError.set(true);
					this.ceasedFeesError.set(true);
					this.hasSystemError.set(true);
				},
			});
	}

	private loadAllData(): void {
		this.loadSummary();
		this.loadNewFees();
		this.loadTariffChanges();
		this.loadCeasedFees();
	}

	private buildDefaultFilter(): FeeUpdatesFilterOutput {
		const max = this.maxDate();
		const min = this.minDate();
		const end = max ?? new Date();
		let start = new Date(end.getFullYear(), end.getMonth() - 11, 1);
		if (min && start.getTime() < min.getTime()) start = min;
		return {
			entityIds: this.entities().map(e => e.entityId),
			brandIds: this.brands().map(b => b.brandId),
			businessIds: this.businesses().map(b => b.businessId),
			period: DatePeriodEnum.Last12Months,
			startDate: this.formatIso(start),
			endDate: this.formatIso(end),
		};
	}

	private parseIsoDate(iso: string | null): Date | null {
		if (!iso) return null;
		const [y, m, d] = iso.split("-").map(Number);
		if (!y || !m || !d) return null;
		return new Date(y, m - 1, d);
	}

	private formatIso(d: Date): string {
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, "0");
		const day = String(d.getDate()).padStart(2, "0");
		return `${y}-${m}-${day}`;
	}

	private loadSummary(): void {
		this.isLoadingSummary.set(true);
		this.service
			.getSummary(this.buildSummaryQuery())
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.summary.set(data);
					this.isLoadingSummary.set(false);
				},
				error: () => {
					this.isLoadingSummary.set(false);
				},
			});
	}

	private loadNewFees(): void {
		this.isLoadingNewFees.set(true);
		this.newFeesError.set(false);
		this.service
			.getNewFees(this.buildQuery(FeeUpdatesTabEnum.NewFees, this.newFeesQuery()))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.newFeesData.set(data);
					this.isLoadingNewFees.set(false);
				},
				error: () => {
					this.newFeesData.set(null);
					this.newFeesError.set(true);
					this.isLoadingNewFees.set(false);
				},
			});
	}

	private loadTariffChanges(): void {
		this.isLoadingTariffChanges.set(true);
		this.tariffChangesError.set(false);
		this.service
			.getTariffChanges(this.buildQuery(FeeUpdatesTabEnum.TariffChanges, this.tariffChangesQuery()))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.tariffChangesData.set(data);
					this.isLoadingTariffChanges.set(false);
				},
				error: () => {
					this.tariffChangesData.set(null);
					this.tariffChangesError.set(true);
					this.isLoadingTariffChanges.set(false);
				},
			});
	}

	private loadCeasedFees(): void {
		this.isLoadingCeasedFees.set(true);
		this.ceasedFeesError.set(false);
		this.service
			.getCeasedFees(this.buildQuery(FeeUpdatesTabEnum.CeasedFees, this.ceasedFeesQuery()))
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: data => {
					this.ceasedFeesData.set(data);
					this.isLoadingCeasedFees.set(false);
				},
				error: () => {
					this.ceasedFeesData.set(null);
					this.ceasedFeesError.set(true);
					this.isLoadingCeasedFees.set(false);
				},
			});
	}

	private downloadTab(tab: FeeUpdatesTabEnum, page: FeeUpdatesPageChangeEvent, loader: { set: (v: boolean) => void }): void {
		loader.set(true);
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_DOWNLOAD_START_FILE),
		});

		const command: FeeUpdatesExportCommand = {
			tab,
			entityIds: this.currentFilter()?.entityIds ?? [],
			brandIds: this.currentFilter()?.brandIds ?? [],
			businessIds: this.currentFilter()?.businessIds ?? [],
			startDate: this.currentFilter()?.startDate ?? "",
			endDate: this.currentFilter()?.endDate ?? "",
			sortField: page.sortField,
			sortOrder: page.sortOrder,
			search: page.search,
		};

		this.service
			.exportTab(command)
			.pipe(takeUntilDestroyed(this.destroyRef))
			.subscribe({
				next: response => {
					this.saveBlob(response.body, this.buildExportFileName(tab));
					loader.set(false);
					this.messageService.add({
						severity: "success",
						icon: "icon icon-success",
						summary: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_FILE_DOWNLOAD_SUCCESS),
						detail: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_FILE_DOWNLOAD_DEVICE),
					});
				},
				error: () => {
					loader.set(false);
					this.messageService.add({
						severity: "error",
						icon: "icon icon-alert",
						summary: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_FILE_FAILED_DOWNLOAD),
						detail: this.commonGlobalService.termText(this.feeUpdatesTerm.LBL_FILE_CONTACT_SUPPORT),
					});
				},
			});
	}

	private buildSummaryQuery(): FeeUpdatesSummaryQuery {
		const filter = this.currentFilter();
		return {
			entityIds: filter?.entityIds ?? [],
			brandIds: filter?.brandIds ?? [],
			businessIds: filter?.businessIds ?? [],
			startDate: filter?.startDate ?? "",
			endDate: filter?.endDate ?? "",
		};
	}

	private buildQuery(tab: FeeUpdatesTabEnum, page: FeeUpdatesPageChangeEvent): FeeUpdatesTableQuery {
		const filter = this.currentFilter();
		const search = page.search;
		return {
			tab,
			entityIds: filter?.entityIds ?? [],
			brandIds: filter?.brandIds ?? [],
			businessIds: filter?.businessIds ?? [],
			startDate: filter?.startDate ?? "",
			endDate: filter?.endDate ?? "",
			pageNumber: page.pageNumber,
			pageSize: page.rowsPerPage,
			sortField: page.sortField,
			sortOrder: page.sortOrder,
			search,
		};
	}

	private buildExportFileName(tab: FeeUpdatesTabEnum): string {
		const tabTermKey: Record<FeeUpdatesTabEnum, string> = {
			[FeeUpdatesTabEnum.NewFees]: this.feeUpdatesTerm.TAB_NEW_FEES,
			[FeeUpdatesTabEnum.TariffChanges]: this.feeUpdatesTerm.TAB_TARIFF_CHANGES,
			[FeeUpdatesTabEnum.CeasedFees]: this.feeUpdatesTerm.TAB_CEASED_FEES,
		};
		const tabLabel = this.commonGlobalService.termText(tabTermKey[tab]).replace(/\s+/g, "_");
		return this.commonGlobalService.buildExportFileName(this.commonGlobalService.termText(this.feeUpdatesTerm.EXPORT_NAME), tabLabel);
	}

	private saveBlob(blob: Blob | null, filename: string): void {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}
}
