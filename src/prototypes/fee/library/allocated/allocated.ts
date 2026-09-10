import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Component, effect, inject, input, output, signal, viewChild } from "@angular/core";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { MultiSelectModule } from "primeng/multiselect";
import { SelectModule } from "primeng/select";
import { SkeletonModule } from "primeng/skeleton";
import { TooltipModule } from "primeng/tooltip";
import { ColumnComponent, FormatAmountPipe, OrderConstants, RowResumenComponent, TableFetchComponent, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
import { ClientInformationResponse } from "../../common/DTO/client-response";
import { AllocatedModalName, ALLOCATED_MODAL, LIBRARY_TERM, CATALOG_CONFIG, FEE_LIBRARY_BREADCRUMB } from "../common/constants";
import { CatalogField, CatalogIdField, ColumnDefinition, isCatalogField, QueryParametersModel } from "../common/table.types";
import { FeeLibraryFilter } from "../DTO/request";
import { ClientCatalogItem, FeeLibraryMaster, FeePaginationResult, FeeResponse, ResumeFee } from "../DTO/response";
import { AllocatedRowViewModel } from "../common/types";
import { LibraryService } from "../library.service";
import { ALLOCATED_FIXED_COLUMNS, ALLOCATED_GROUP_COLUMNS, getAllocatedConfigurableColumns } from "./allocated.columns";
import { DialogModule } from "primeng/dialog";
import { ModalAllocatedRefund } from "../modal-allocated-refund/modal-allocated-refund";
import { ModalAllocatedExcluded } from "../modal-allocated-excluded/modal-allocated-excluded";
import { ModalAllocatedGroupView } from "../modal-allocated-group-view/modal-allocated-group-view";

import { CommonService } from "../domain/common.service";
import { CommonGlobalService } from "../../common/services/common.service";

@Component({
	selector: "fee-allocated",
	imports: [
		CommonModule,
		FormsModule,
		ColumnComponent,
		TableFetchComponent,
		RowResumenComponent,
		ButtonModule,
		MultiSelectModule,
		SelectModule,
		SkeletonModule,
		FormatAmountPipe,
		DialogModule,
		ModalAllocatedRefund,
		ModalAllocatedExcluded,
		ModalAllocatedGroupView,
		StatusStateComponent,
		TooltipModule,
	],
	templateUrl: "./allocated.html",
	styleUrl: "./allocated.css",
})
export class Allocated {
	private readonly libraryService = inject(LibraryService);
	readonly commonService = inject(CommonService);
	private readonly messageService = inject(MessageService);
	readonly commonGlobalService = inject(CommonGlobalService);
	readonly allocatedModal = ALLOCATED_MODAL;
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
	SortField: keyof AllocatedRowViewModel | null = "lastBillingDate";
	TotalInicial = 0;
	totalFeeAmount = 0;
	isLoading = true;
	hasError = false;
	readonly isDownloading = signal(false);
	ListData: AllocatedRowViewModel[] = [];
	rawItems: FeeResponse[] = [];
	columnOptions: ColumnDefinition[] = [];
	selectedColumnFields: string[] = [];
	searchText = "";

	private lastBaseFilterKey = "";
	private lastExecutedFilterKey = "";

	readonly fixedColumns = ALLOCATED_FIXED_COLUMNS;
	configurableBaseColumns: ColumnDefinition[] = [];

	readonly itltable = viewChild<TableFetchComponent<AllocatedRowViewModel>>("itltable");

	constructor() {
		effect(() => {
			const active = this.active();
			const baseFilter = this.filter();
			const clientInformation = this.clientInformation();

			if (!active || !baseFilter || !clientInformation) {
				return;
			}

			this.configureColumns();
			this.syncTableStateFromFilter(baseFilter);
			this.loadTableData(this.buildTableFilter(baseFilter));
		});

		effect(() => {
			this.resume();
			this.configureColumns();
		});
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
			this.SortField = (event.OrderBy as keyof AllocatedRowViewModel) ?? null;
			this.SortOrder = event.SortDirection === OrderConstants.ORDER_BY_ASC ? 1 : -1;
		}

		const tableFilter = this.buildTableFilter(baseFilter, event);
		this.loadTableData(tableFilter);

		if (sortChanged || searchChanged) {
			this.sortChange.emit({
				sortField: (this.SortField as string | null) ?? null,
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
		this.libraryService.downloadFeeAllocated(exportFilter).subscribe({
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

	canEditCatalog(row: AllocatedRowViewModel): boolean {
		return this.isAdmin() && !!row.clientId;
	}

	get visibleBaseColumns(): ColumnDefinition[] {
		return this.configurableBaseColumns.filter(column => this.isColumnVisible(column.field));
	}

	get visibleFixedColumns(): ColumnDefinition[] {
		return this.commonService.shouldShowGroupClientColumn(this.filter(), this.clientInformation()) ? [...this.fixedColumns, ...ALLOCATED_GROUP_COLUMNS] : this.fixedColumns;
	}

	get visibleColumns(): ColumnDefinition[] {
		return [...this.visibleFixedColumns, ...this.visibleBaseColumns];
	}

	get searchFields(): string[] {
		return [this.commonGlobalService.termText("FeeCode"), this.commonGlobalService.termText("FeeName")];
	}

	get totalAmountColumnIndex(): number {
		return this.visibleColumns.findIndex(column => column.field === "feeAmount");
	}

	get totalTrailingColumns(): number[] {
		if (this.totalAmountColumnIndex === -1) {
			return [];
		}

		return Array.from({ length: this.visibleColumns.length - this.totalAmountColumnIndex - 1 }, (_, index) => index);
	}

	get modalCurrencyCode(): string {
		return this.resolveBillingCurrencyHeader();
	}

	private configureColumns(): void {
		this.configurableBaseColumns = getAllocatedConfigurableColumns(this.resolveBillingCurrencyHeader());
		this.syncColumnOptions();
	}

	private syncTableStateFromFilter(filter: FeeLibraryFilter): void {
		const baseFilterKey = JSON.stringify(filter);
		if (baseFilterKey === this.lastBaseFilterKey) {
			return;
		}

		this.lastBaseFilterKey = baseFilterKey;
		this.RowsPerPage = filter.pageSize;
		this.CurrentPage = filter.pageNumber;
		this.SortField = (filter.sortField as keyof AllocatedRowViewModel | null | undefined) ?? null;
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

	private syncColumnOptions(): void {
		const nextOptions = [...this.configurableBaseColumns];
		this.columnOptions = this.commonService.buildColumnOptions(nextOptions);
		this.selectedColumnFields = this.commonService.resolveSelectedColumnFields(this.configurableBaseColumns, this.selectedColumnFields);
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
			visibleColumns: this.visibleColumns.map(column => column.field),
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

		this.libraryService.getFeeAllocated(filter).subscribe({
			next: response => {
				if (filterKey !== this.lastExecutedFilterKey) return;
				this.mapTableData(response);
				this.setLoading(false);
				this.restoreSearchText();
			},
			error: error => {
				if (filterKey !== this.lastExecutedFilterKey) return;
				this.hasError = true;
				this.ListData = [];
				this.TotalInicial = 0;
				this.setLoading(false);
				console.error("[Fee Library][Allocated] table load error", error);
			},
		});
	}

	private setLoading(value: boolean): void {
		this.isLoading = value;
		this.loadingChange.emit(value);
	}

	private mapTableData(response: FeePaginationResult): void {
		const items = response.pagination.items ?? response.pagination.data ?? [];
		this.rawItems = items;
		this.configureColumns();
		this.ListData = items.map(item => this.mapRow(item, response.totalFeeAmount));
		this.TotalInicial = response.pagination.totalCount ?? items.length;
		this.totalFeeAmount = response.totalFeeAmount ?? 0;
	}

	private mapRow(item: FeeResponse, totalFeeAmount: number): AllocatedRowViewModel {
		const feeAmount = item.currencyDetail?.feeAmount ?? 0;
		const amountPercent = totalFeeAmount === 0 ? null : Math.abs((feeAmount * 100) / totalFeeAmount);

		return {
			id: item.id,
			feeId: item.feeDetail?.id ?? item.id,
			feeCode: item.feeDetail?.code ?? "",
			feeName: item.feeDetail?.name ?? "",
			feeDescription: item.feeDetail?.description ?? "",
			lastBillingDate: item.lastBillingDate ?? item.feeDetail?.lastBillingDate ?? "",
			brandCode: item.brandCode ?? "",
			brandDescription: item.brandDescription ?? item.brandCode ?? "-",
			countryCode: item.countryCode ?? "-",
			businessDescription: item.businessDescription ?? "-",
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
			typeOfRate: item.typeOfRate ?? "-",
			consecutiveMonths: item.consecutiveMonths ?? "-",
			feeAmount,
			amountPercent,
		};
	}

	private resolveBillingCurrencyHeader(): string {
		const resumeCode = this.resume()
			?.resumeFeeAmounts?.find(item => item.code?.trim())
			?.code?.trim();
		if (resumeCode) {
			return resumeCode;
		}

		const rowCurrencyCode = this.rawItems.find(item => item.currencyDetail?.code?.trim())?.currencyDetail?.code?.trim();
		if (rowCurrencyCode) {
			return rowCurrencyCode;
		}

		return this.commonGlobalService.termText(this.libraryTerm.AMOUNT);
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
		return this.commonService.buildExportFileName(this.commonGlobalService.termText(this.libraryTerm.MODULE_EXPORT), this.commonGlobalService.termText(this.libraryTerm.NAME_ALLOCATED_EXPORT));
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

	getCatalogPlaceholder(row: AllocatedRowViewModel, field: string): string {
		if (!isCatalogField(field)) {
			return this.commonGlobalService.termText(this.libraryTerm.SELECT);
		}

		const normalizedField = field;
		const currentValue = row[normalizedField];
		return currentValue && currentValue !== "-" ? currentValue : this.commonGlobalService.termText(this.libraryTerm.SELECT);
	}

	onCatalogSelectionChange(row: AllocatedRowViewModel, field: string, optionId: number | null): void {
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
		const config = CATALOG_CONFIG[field];

		return {
			items: this.masters()?.[config.masterKey] ?? [],
			idField: config.idField,
		};
	}

	private applyCatalogSelection(row: AllocatedRowViewModel, field: CatalogField, idField: CatalogIdField, optionId: number | null, description: string | null): void {
		row[idField] = optionId;
		row[field] = description?.trim() ? description : "-";
	}
	// modals
	incentivesVisible = false;
	excludedVisible = false;
	groupViewVisible = false;

	openModal(modalName: AllocatedModalName) {
		this.closeAllModals();
		if (modalName === ALLOCATED_MODAL.REFUND) this.incentivesVisible = true;
		if (modalName === ALLOCATED_MODAL.EXCLUDED) this.excludedVisible = true;
		if (modalName === ALLOCATED_MODAL.GROUP_VIEW) this.groupViewVisible = true;
	}

	closeAllModals() {
		this.incentivesVisible = false;
		this.excludedVisible = false;
		this.groupViewVisible = false;
	}

	navigateToDetail(rowData: AllocatedRowViewModel, event?: MouseEvent): void {
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
}
