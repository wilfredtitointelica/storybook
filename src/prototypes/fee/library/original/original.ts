import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, TemplateRef, effect, inject, input, output, signal, viewChild } from "@angular/core";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { ColumnComponent, FormatAmountPipe, OrderConstants, RowResumenComponent, TableFetchComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { ClientInformationResponse } from "../../common/DTO/client-response";
import { CatalogField, CatalogIdField, ColumnDefinition, isCatalogField, QueryParametersModel } from "../common/table.types";
import { ClientCatalogItem, CurrencyTotal, FeeLibraryMaster, FeeResponse, FeeUnallocatedPaginationResult, ResumeFee } from "../DTO/response";
import { FeeLibraryFilter } from "../DTO/request";
import { FEE_LIBRARY_BREADCRUMB, LIBRARY_TERM } from "../common/constants";
import { CommonService } from "../domain/common.service";
import { LibraryService } from "../library.service";
import { ORIGINAL_CONFIGURABLE_COLUMNS, ORIGINAL_FIXED_COLUMNS, ORIGINAL_GROUP_COLUMNS } from "./original.columns";
import { CommonGlobalService } from "../../common/services/common.service";

type OriginalRowViewModel = {
	id: number;
	feeId: number;
	feeCode: string;
	feeName: string;
	feeDescription: string;
	typeOfRate: string;
	category: string;
	subCategory: string;
	clientId: number | null;
	clientName: string;
	customCategoryId: number | null;
	customCategory: string;
	costCenterId: number | null;
	costCenter: string;
	generalAccountId: number | null;
	generalAccount: string;
	businessDescription: string;
	brandCode: string;
	brandDescription: string;
	lastBillingDate: string;
	[key: string]: string | number | null;
};

@Component({
	selector: "fee-original",
	imports: [
		CommonModule,
		ColumnComponent,
		TableFetchComponent,
		RowResumenComponent,
		ButtonModule,
		FormsModule,
		MultiSelectModule,
		SelectModule,
		SkeletonModule,
		StatusStateComponent,
		TooltipModule,
	],
	templateUrl: "./original.html",
	styleUrls: ["./original.css"],
})
export class Original {
	private readonly libraryService = inject(LibraryService);
	readonly commonService = inject(CommonService);
	private readonly amountPipe = inject(FormatAmountPipe);
	private readonly messageService = inject(MessageService);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly libraryTerm = LIBRARY_TERM;
	readonly StatusStateEnum = StatusStateEnum;
	active = input(false);
	isAdmin = input(false);
	filter = input<FeeLibraryFilter | null>(null);
	clientInformation = input<ClientInformationResponse | null>(null);
	masters = input<FeeLibraryMaster | null>(null);
	resume = input<ResumeFee | null>(null);
	loadingChange = output<boolean>();
	sortChange = output<{ sortField: string | null; sortOrder: string; pageNumber: number; searchText: string }>();

	RowsPerPage = 10;
	CurrentPage = 1;
	SortOrder = -1;
	SortField = "lastBillingDate";
	errorMessage: string = "";
	TotalInicial = 0;
	isLoading = true;
	hasError = false;
	readonly isDownloading = signal(false);
	moneyColumns: ColumnDefinition[] = [];
	moneyTotals: Record<string, string> = {};
	columnOptions: ColumnDefinition[] = [];
	selectedColumnFields: string[] = [];
	searchText = "";
	ListData: OriginalRowViewModel[] = [];
	rawItems: FeeResponse[] = [];

	private lastBaseFilterKey = "";
	private lastExecutedFilterKey = "";
	readonly fixedColumns = ORIGINAL_FIXED_COLUMNS;
	readonly itltable = viewChild<TableFetchComponent<OriginalRowViewModel>>("itltable");
	readonly additionalCentralTemplate = viewChild.required<TemplateRef<any>>("additionalCentralTemplate");
	constructor() {
		effect(() => {
			const active = this.active();
			const baseFilter = this.filter();
			const clientInformation = this.clientInformation();
			const masters = this.masters();

			if (!active || !baseFilter || !clientInformation || !masters) {
				return;
			}

			this.syncTableStateFromFilter(baseFilter);
			this.loadTableData(this.buildTableFilter(baseFilter));
		});

		effect(() => {
			this.syncMoneyColumns(this.resume(), this.rawItems);
		});
	}

	onReorder(event: any) {
		console.log("onColReorder:", event);
	}

	navigateToDetail(rowData: OriginalRowViewModel, event?: MouseEvent): void {
		const bankId = this.commonService.resolveDetailBankId(rowData?.clientId, this.clientInformation(), this.filter());
		const filter = this.filter();
		const openInNewTab = !!(event && (event.ctrlKey || event.metaKey));
		this.commonGlobalService.navigateToFeeDetail(
			{
				feeId: rowData.feeId,
				bankId,
				origin: FEE_LIBRARY_BREADCRUMB,
				dateRange: filter?.startDate && filter?.endDate ? { startDate: filter.startDate, endDate: filter.endDate, period: this.commonGlobalService.mapPeriodToDetailPeriod(filter.typePeriod) } : undefined,
			},
			openInNewTab
		);
	}

	OnQueryParametersChange(event: QueryParametersModel) {
		const baseFilter = this.filter();
		if (!baseFilter) {
			return;
		}

		this.searchText = event.FilterValue?.trim() ?? "";
		this.RowsPerPage = event.PageSize ?? this.RowsPerPage;
		this.CurrentPage = event.PageNumber ?? this.CurrentPage;
		const sortChanged = event.OrderBy !== undefined;
		const searchChanged = event.FilterValue !== undefined && event.FilterValue !== baseFilter.codeNameFee;
		if (sortChanged) {
			this.SortField = event.OrderBy ?? "";
			this.SortOrder = event.SortDirection === OrderConstants.ORDER_BY_ASC ? 1 : -1;
		}

		const tableFilter = this.buildTableFilter(baseFilter, event);
		this.loadTableData(tableFilter);

		if (sortChanged || searchChanged) {
			this.sortChange.emit({
				sortField: this.SortField || null,
				sortOrder: this.SortOrder === 1 ? "1" : "-1",
				pageNumber: this.CurrentPage,
				searchText: this.searchText,
			});
		}
	}

	downloadExcel(): void {
		const baseFilter = this.filter();
		if (!baseFilter || this.isDownloading()) {
			return;
		}

		const exportFilter = this.buildExportFilter(baseFilter);
		this.isDownloading.set(true);
		this.messageService.add({
			severity: "secondary",
			icon: "icon icon-loading",
			summary: this.commonGlobalService.termText(this.libraryTerm.PREPARING_FILE),
			detail: this.commonGlobalService.termText(this.libraryTerm.DOWNLOAD_START_FILE),
		});
		this.libraryService.downloadFeeUnallocated(exportFilter).subscribe({
			next: blob => {
				try {
					this.commonService.downloadBlob(blob, this.buildExportFileName());
					this.messageService.add({
						severity: "success",
						icon: "icon icon-success",
						summary: this.commonGlobalService.termText(this.libraryTerm.FILE_DOWNLOAD_SUCCESS),
						detail: this.commonGlobalService.termText(this.libraryTerm.FILE_DOWNLOAD_DEVICE),
					});
				} catch {
					this.showExportError();
				}
				this.isDownloading.set(false);
			},
			error: () => {
				this.showExportError();
				this.isDownloading.set(false);
			},
		});
	}

	isColumnVisible(field: string): boolean {
		return this.selectedColumnFields.includes(field);
	}

	isCatalogColumn(field: string): boolean {
		return isCatalogField(field);
	}

	canEditCatalog(row: OriginalRowViewModel): boolean {
		return this.isAdmin() && !!row.clientId;
	}

	get visibleBaseColumns(): ColumnDefinition[] {
		return this.configurableBaseColumns.filter(column => this.isColumnVisible(column.field));
	}

	get configurableBaseColumns(): ColumnDefinition[] {
		return ORIGINAL_CONFIGURABLE_COLUMNS;
	}

	get visibleFixedColumns(): ColumnDefinition[] {
		return this.commonService.shouldShowGroupClientColumn(this.filter(), this.clientInformation()) ? [...this.fixedColumns, ...ORIGINAL_GROUP_COLUMNS] : this.fixedColumns;
	}

	get visibleMoneyColumns(): ColumnDefinition[] {
		return this.moneyColumns.filter(column => this.isColumnVisible(column.field));
	}
	get visibleSummaryColspan(): number {
		return this.visibleFixedColumns.length + this.visibleBaseColumns.length;
	}

	get searchFields(): string[] {
		return [this.commonGlobalService.termText("FeeCode"), this.commonGlobalService.termText("FeeName")];
	}
	private syncTableStateFromFilter(filter: FeeLibraryFilter): void {
		const baseFilterKey = JSON.stringify(filter);
		if (baseFilterKey === this.lastBaseFilterKey) {
			return;
		}

		this.lastBaseFilterKey = baseFilterKey;
		this.RowsPerPage = filter.pageSize;
		this.CurrentPage = filter.pageNumber;
		this.SortField = filter.sortField ?? "";
		this.SortOrder = filter.sortOrder === "1" ? 1 : -1;
		this.syncSearchFromFilter(filter.codeNameFee ?? "");
	}

	private syncSearchFromFilter(value: string): void {
		if (this.searchText === value) return;
		this.searchText = value;
		setTimeout(() => {
			const table = this.itltable();
			if (table) table.SearchInput = value;
		});
	}

	private buildTableFilter(baseFilter: FeeLibraryFilter, queryParams?: QueryParametersModel): FeeLibraryFilter {
		return this.commonService.buildSearchTableFilter(baseFilter, {
			searchTerm: queryParams?.FilterValue ?? (this.searchText || baseFilter.codeNameFee || ""),
			matchType: Number(queryParams?.FilterOperator ?? baseFilter.matchType ?? 0),
			pageNumber: queryParams?.PageNumber ?? this.CurrentPage,
			pageSize: queryParams?.PageSize ?? this.RowsPerPage,
			sortField: (queryParams?.OrderBy ?? this.SortField) || null,
			sortDirection: queryParams?.SortDirection ?? (this.SortOrder === 1 ? OrderConstants.ORDER_BY_ASC : OrderConstants.ORDER_BY_DESC),
		});
	}

	private buildExportFilter(baseFilter: FeeLibraryFilter): FeeLibraryFilter {
		const filter = this.commonService.buildSearchTableFilter(baseFilter, {
			searchTerm: this.searchText,
			sortField: this.SortField || null,
			sortDirection: this.SortOrder === 1 ? OrderConstants.ORDER_BY_ASC : OrderConstants.ORDER_BY_DESC,
			pageNumber: 1,
			pageSize: this.RowsPerPage,
		});

		return {
			...filter,
			visibleColumns: [...this.visibleFixedColumns, ...this.visibleBaseColumns, ...this.visibleMoneyColumns].map(column => column.field),
		};
	}

	private loadTableData(filter: FeeLibraryFilter): void {
		const filterKey = JSON.stringify(filter);
		if (filterKey === this.lastExecutedFilterKey) {
			return;
		}

		this.lastExecutedFilterKey = filterKey;
		this.setLoading(true);
		this.hasError = false;

		this.libraryService.getFeeUnallocated(filter).subscribe({
			next: chargeSummary => {
				if (filterKey !== this.lastExecutedFilterKey) return;
				this.mapTableData(chargeSummary);
				this.logTablePayload(filter, this.resume(), chargeSummary);
				this.setLoading(false);
				this.restoreSearchText();
			},
			error: error => {
				if (filterKey !== this.lastExecutedFilterKey) return;
				this.hasError = true;
				this.ListData = [];
				this.TotalInicial = 0;
				this.setLoading(false);
				console.error("[Fee Library][Original] initial table load error", error);
			},
		});
	}

	private setLoading(value: boolean): void {
		this.isLoading = value;
		this.loadingChange.emit(value);
	}

	private logTablePayload(filter: FeeLibraryFilter, headerSummary: ResumeFee | null, chargeSummary: FeeUnallocatedPaginationResult): void {
		console.log("[Fee Library][Original] table load", {
			filter,
			clientInformation: this.clientInformation(),
			masters: this.masters(),
			resumeFromShell: true,
			headerSummary,
			chargeSummary,
		});
	}

	private mapTableData(response: FeeUnallocatedPaginationResult): void {
		const items = response.pagination.items ?? response.pagination.data ?? [];
		this.rawItems = items;
		this.syncMoneyColumns(this.resume(), items);
		this.ListData = items.map(item => this.mapRow(item));
		this.TotalInicial = response.pagination.totalCount ?? items.length;
		this.moneyTotals = this.buildMoneyTotalsFromCurrencyTotals(response.currencyTotals ?? []);
	}

	private syncMoneyColumns(resume: ResumeFee | null, items: FeeResponse[]): void {
		this.moneyColumns = this.buildMoneyColumns(resume, items);
		this.syncColumnOptions();
	}

	private buildMoneyColumns(resume: ResumeFee | null, items: FeeResponse[]): ColumnDefinition[] {
		const codes = new Set<string>();

		(resume?.resumeFeeAmounts ?? []).forEach(item => {
			if (item.code) {
				codes.add(item.code);
			}
		});

		items.forEach(item => {
			(item.currencyDetailList ?? []).forEach(currency => {
				if (currency.code) {
					codes.add(currency.code);
				}
			});
		});

		return Array.from(codes)
			.sort()
			.map(code => ({
				field: `${code}_raw`,
				headerTerm: code,
				headerLiteral: true,
				sortable: true,
				minWidth: "120px",
				className: "text-end",
				defaultVisible: true,
			}));
	}

	private syncColumnOptions(): void {
		const nextOptions: ColumnDefinition[] = [...this.configurableBaseColumns, ...this.moneyColumns];
		this.columnOptions = this.commonService.buildColumnOptions(nextOptions);
		const selectedBaseFields = this.selectedColumnFields.filter(field => this.configurableBaseColumns.some(column => column.field === field));
		const resolvedBaseFields = this.commonService.resolveSelectedColumnFields(this.configurableBaseColumns, selectedBaseFields);
		this.selectedColumnFields = [...resolvedBaseFields, ...this.moneyColumns.map(column => column.field)];
	}

	private mapRow(item: FeeResponse): OriginalRowViewModel {
		const row: OriginalRowViewModel = {
			id: item.id,
			feeId: item.feeDetail?.id ?? item.id,
			feeCode: item.feeDetail?.code ?? "",
			feeName: item.feeDetail?.name ?? "",
			feeDescription: item.feeDetail?.description ?? "",
			typeOfRate: item.typeOfRate ?? "-",
			category: item.feeDetail?.category ?? "-",
			subCategory: item.feeDetail?.subCategory ?? "-",
			clientId: item.clientId ?? null,
			clientName: item.clientName ?? item.clientNameCommercial ?? "-",
			customCategoryId: item.customCategoryId ?? null,
			customCategory: item.customCategory ?? "-",
			costCenterId: item.costCenterId ?? null,
			costCenter: item.costCenter ?? "-",
			generalAccountId: item.generalAccountId ?? null,
			generalAccount: item.generalAccount ?? "-",
			businessDescription: item.businessDescription ?? "-",
			brandCode: item.brandCode ?? "",
			brandDescription: item.brandDescription ?? item.brandCode ?? "-",
			lastBillingDate: item.lastBillingDate ?? item.feeDetail?.lastBillingDate ?? "",
		};

		this.moneyColumns.forEach(column => {
			const code = column.headerTerm;
			const currency = (item.currencyDetailList ?? []).find(detail => detail.code === code);
			row[column.field] = currency?.feeAmount ?? null;
		});

		return row;
	}

	formatCurrencyAmount(value: unknown): string {
		if (value == null || value === "") {
			return "-";
		}

		const numeric = typeof value === "number" ? value : Number(value);
		if (!Number.isFinite(numeric)) {
			return "-";
		}

		return this.amountPipe.transform(numeric, false, 2, true) ?? "-";
	}

	private buildMoneyTotalsFromCurrencyTotals(currencyTotals: CurrencyTotal[]): Record<string, string> {
		const totals = new Map(currencyTotals.map(item => [item.code, this.amountPipe.transform(item.totalAmount ?? 0, false, 2, true) ?? "-"]));

		this.moneyColumns.forEach(column => {
			const header = column.headerTerm;
			if (!totals.has(header)) {
				totals.set(header, "-");
			}
		});

		return Object.fromEntries(totals);
	}

	get exportTooltip(): string {
		return !this.isLoading && this.ListData.length === 0 ? this.commonGlobalService.termText(this.libraryTerm.NO_DATA_TO_EXPORT) : "";
	}

	get isEmptyState(): boolean {
		return !this.isLoading && (this.hasError || this.ListData.length === 0);
	}

	get isSystemErrorState(): boolean {
		return !this.isLoading && this.hasError;
	}

	get isNoMatchesState(): boolean {
		return !this.isLoading && !this.hasError && this.ListData.length === 0 && this.searchText.length > 0;
	}

	get isNoDataState(): boolean {
		return !this.isLoading && !this.hasError && this.ListData.length === 0 && this.searchText.length === 0;
	}

	reloadPage(): void {
		window.location.reload();
	}

	private restoreSearchText(): void {
		if (!this.searchText) {
			return;
		}

		setTimeout(() => {
			const table = this.itltable();
			if (!table) {
				return;
			}

			table.SearchInput = this.searchText;
		});
	}

	private buildExportFileName(): string {
		return this.commonService.buildExportFileName(this.commonGlobalService.termText(this.libraryTerm.MODULE_EXPORT), this.commonGlobalService.termText(this.libraryTerm.NAME_ORIGINAL_EXPORT));
	}

	private showExportError(): void {
		this.messageService.add({
			severity: "error",
			icon: "icon icon-alert",
			summary: this.commonGlobalService.termText(this.libraryTerm.FILE_FAILED_DOWNLOAD),
			detail: this.commonGlobalService.termText(this.libraryTerm.FILE_CONTACT_SUPPORT),
		});
	}

	getCustomCategoryOptions(clientId: number | null): ClientCatalogItem[] {
		return this.commonService.filterClientCatalogItemsByClientId(this.masters()?.customCategories ?? [], clientId);
	}

	getGeneralAccountOptions(clientId: number | null): ClientCatalogItem[] {
		return this.commonService.filterClientCatalogItemsByClientId(this.masters()?.generalAccounts ?? [], clientId);
	}

	getCostCenterOptions(clientId: number | null): ClientCatalogItem[] {
		return this.commonService.filterClientCatalogItemsByClientId(this.masters()?.costCenters ?? [], clientId);
	}

	getCatalogPlaceholder(row: OriginalRowViewModel, field: string): string {
		if (!isCatalogField(field)) {
			return this.commonGlobalService.termText(this.libraryTerm.SELECT);
		}

		const normalizedField = field;
		const currentValue = row[normalizedField];
		return currentValue && currentValue !== "-" ? currentValue : this.commonGlobalService.termText(this.libraryTerm.SELECT);
	}

	onCatalogSelectionChange(row: OriginalRowViewModel, field: string, optionId: number | null): void {
		if (!isCatalogField(field)) {
			return;
		}

		const normalizedField = field;
		const config = this.resolveCatalogConfig(normalizedField);
		const option = this.commonService.filterClientCatalogItemsByClientId(config.items, row.clientId).find(item => item.id === optionId) ?? null;
		const previousState = {
			idValue: row[config.idField],
			textValue: row[normalizedField],
		};

		this.applyCatalogSelection(row, normalizedField, config.idField, optionId, option?.description ?? null);

		const command = this.commonService.buildClientFeeRelationCommand(row);
		if (!command) {
			this.applyCatalogSelection(row, normalizedField, config.idField, previousState.idValue, previousState.textValue);
			return;
		}

		this.libraryService.saveClientFeeRelation(command).subscribe({
			error: () => {
				this.applyCatalogSelection(row, normalizedField, config.idField, previousState.idValue, previousState.textValue);
				this.messageService.add({
					severity: "error",
					icon: "icon icon-alert",
					summary: this.commonGlobalService.termText(this.libraryTerm.CATALOG_UPDATE),
					detail: this.commonGlobalService.termText(this.libraryTerm.CATALOG_RELATION_SAVE_ERROR),
				});
			},
		});
	}

	private resolveCatalogConfig(field: CatalogField): {
		items: ClientCatalogItem[];
		idField: CatalogIdField;
	} {
		switch (field) {
			case "customCategory":
				return { items: this.masters()?.customCategories ?? [], idField: "customCategoryId" };
			case "generalAccount":
				return { items: this.masters()?.generalAccounts ?? [], idField: "generalAccountId" };
			case "costCenter":
			default:
				return { items: this.masters()?.costCenters ?? [], idField: "costCenterId" };
		}
	}

	private applyCatalogSelection(row: OriginalRowViewModel, field: CatalogField, idField: CatalogIdField, optionId: number | null, description: string | null): void {
		row[idField] = optionId;
		row[field] = description?.trim() ? description : "-";
	}
}
