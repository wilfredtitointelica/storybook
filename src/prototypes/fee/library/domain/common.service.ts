import { HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ConfigService, GlobalTermService, TermPipe } from "intelica-library-base";
import { OrderConstants } from "intelica-library-project";
import moment from "moment";
import { ClientBankResponse, ClientInformationResponse, ClientRegionResponse } from "../../common/DTO/client-response";
import { ClientFeeRelationCommand, FeeLibraryFilter } from "../DTO/request";
import { ClientCatalogItem, EntityType, PeriodDatesModel } from "../DTO/response";
import { LIBRARY_TERM, LibraryConstants } from "../common/constants";
import { ColumnDefinition } from "../common/table.types";

import { FormatDateConstants } from "../../common/constants/format.date";
import { PeriodType } from "../../common/enums/common.enum";
import { CommonGlobalService } from "../../common/services/common.service";

@Injectable({
	providedIn: "root",
})
export class CommonService {
	private readonly config = inject(ConfigService);
	private readonly globalTermService = inject(GlobalTermService);
	private readonly commonGlobalService = inject(CommonGlobalService);
	constructor(private readonly termPipe: TermPipe) {}

	get apiUrl(): string {
		return `${this.config.environment?.feePath}/${LibraryConstants.BASE_URL}`;
	}

	termText(termCode: string): string {
		return this.termPipe.transform(termCode, this.globalTermService.languageCode);
	}

	resolveTermText(termCode: string | undefined, fallback: string): string {
		if (!termCode) {
			return fallback;
		}

		const resolvedText = this.termText(termCode)?.trim();
		if (!resolvedText || resolvedText === termCode) {
			return fallback;
		}

		return resolvedText;
	}
	resolveColumnHeader(column: Pick<ColumnDefinition, "headerTerm" | "headerLiteral">): string {
		if (column.headerLiteral) {
			return column.headerTerm;
		}

		return this.resolveTermText(column.headerTerm, column.headerTerm);
	}

	isTextTruncated(element: HTMLElement | null): boolean {
		if (!element) {
			return false;
		}

		return element.scrollHeight > element.clientHeight;
	}

	buildColumnOptions(columns: ColumnDefinition[]): ColumnDefinition[] {
		return columns.map(column => ({
			...column,
			label: this.resolveColumnHeader(column),
		}));
	}

	resolveSelectedColumnFields(columns: ColumnDefinition[], selectedFields: string[]): string[] {
		const selectedFieldSet = new Set(selectedFields);

		if (selectedFieldSet.size === 0) {
			return columns.filter(column => column.defaultVisible ?? true).map(column => column.field);
		}

		return columns.filter(column => selectedFieldSet.has(column.field)).map(column => column.field);
	}

	setDates(periodType: PeriodType, periodDates: PeriodDatesModel[]): { startDate: string; endDate: string } {
		const format = FormatDateConstants.YYYYMMDD;
		const now = moment();
		const period = periodDates.find(item => item.filterType === periodType);

		if (period) {
			return {
				startDate: moment(period.startDate).format(format),
				endDate: moment(period.endDate).format(format),
			};
		}

		switch (periodType) {
			case PeriodType.CurrentMonth:
				return {
					startDate: now.clone().startOf("month").format(format),
					endDate: now.clone().endOf("month").format(format),
				};
			case PeriodType.LastMonth:
				return {
					startDate: now.clone().subtract(1, "month").startOf("month").format(format),
					endDate: now.clone().subtract(1, "month").endOf("month").format(format),
				};
			case PeriodType.CurrentYear:
				return {
					startDate: now.clone().startOf("year").format(format),
					endDate: now.clone().endOf("year").format(format),
				};
			case PeriodType.LastYear:
				return {
					startDate: now.clone().subtract(1, "year").startOf("year").format(format),
					endDate: now.clone().subtract(1, "year").endOf("year").format(format),
				};
			case PeriodType.Last12Months:
			default:
				return {
					startDate: now.clone().subtract(11, "months").startOf("month").format(format),
					endDate: now.clone().endOf("month").format(format),
				};
		}
	}

	getCurrentMonthStart(referenceDate: Date = new Date()): Date {
		return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
	}

	formatStartOfMonth(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
	}

	formatEndOfMonth(date: Date): string {
		const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`;
	}

	formatUtcDate(date: string | undefined): string {
		if (!date) {
			return "-";
		}

		const parsed = new Date(date);
		if (Number.isNaN(parsed.getTime())) {
			return "-";
		}

		return parsed.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			timeZone: "UTC",
		});
	}

	buildExportFileName(moduleName: string, contentType: string): string {
		return this.commonGlobalService.buildExportFileName(moduleName, contentType);
	}

	downloadBlob(blob: Blob, fileName: string): void {
		const url = window.URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = fileName;
		anchor.click();
		window.URL.revokeObjectURL(url);
	}

	buildSearchTableFilter(
		baseFilter: FeeLibraryFilter,
		options: {
			searchTerm?: string | null;
			matchType?: number | null;
			pageNumber?: number;
			pageSize?: number;
			sortField?: string | null;
			sortDirection?: string | null;
		}
	): FeeLibraryFilter {
		const searchTerm = (options.searchTerm ?? "").trim();
		const hasSearchTerm = searchTerm.length > 0;

		return {
			...baseFilter,
			pageNumber: options.pageNumber ?? baseFilter.pageNumber,
			pageSize: options.pageSize ?? baseFilter.pageSize,
			feeCode: hasSearchTerm,
			feeName: hasSearchTerm,
			matchType: Number(options.matchType ?? baseFilter.matchType ?? 0),
			codeNameFee: searchTerm,
			sortField: options.sortField ?? baseFilter.sortField ?? null,
			sortOrder: (options.sortDirection ?? (baseFilter.sortOrder === "1" ? OrderConstants.ORDER_BY_ASC : OrderConstants.ORDER_BY_DESC)) === OrderConstants.ORDER_BY_ASC ? "1" : "-1",
		};
	}

	buildClientFeeRelationCommand(row: {
		clientId: number | null;
		id?: number;
		feeId?: number | null;
		customCategoryId?: number | null;
		generalAccountId?: number | null;
		costCenterId?: number | null;
	}): ClientFeeRelationCommand | null {
		const feeId = row.feeId ?? row.id ?? null;
		if (!row.clientId || !feeId) {
			return null;
		}

		return {
			clientId: row.clientId,
			feeId,
			clientCustomCategoryId: row.customCategoryId ?? null,
			clientGeneralAccountId: row.generalAccountId ?? null,
			clientCostCenterId: row.costCenterId ?? null,
		};
	}

	sanitizeAmountInput(value: string | number | null, maxDigits: number, maxDecimals = 2): string {
		if (value === null || value === undefined || value === "") {
			return "";
		}

		const rawValue = String(value).trim();
		const isNegative = rawValue.startsWith("-");
		const unsignedValue = rawValue.replace(/^-/, "");
		const lastDotIndex = unsignedValue.lastIndexOf(".");
		const lastCommaIndex = unsignedValue.lastIndexOf(",");
		const decimalIndex = Math.max(lastDotIndex, lastCommaIndex);
		const integerSource = decimalIndex >= 0 ? unsignedValue.slice(0, decimalIndex) : unsignedValue;
		const decimalSource = decimalIndex >= 0 ? unsignedValue.slice(decimalIndex + 1) : "";

		const integerDigits = integerSource.replace(/\D/g, "");
		const decimalDigits = decimalSource.replace(/\D/g, "");
		const combinedDigits = `${integerDigits}${decimalDigits}`.slice(0, maxDigits);
		const safeIntegerDigits = combinedDigits.slice(0, integerDigits.length || combinedDigits.length);
		const remainingDecimalCapacity = Math.max(0, Math.min(maxDecimals, maxDigits - safeIntegerDigits.length));
		const safeDecimalDigits = combinedDigits.slice(safeIntegerDigits.length, safeIntegerDigits.length + remainingDecimalCapacity);
		const hadDecimalSeparator = decimalIndex >= 0;

		if (!safeIntegerDigits && !safeDecimalDigits) {
			return isNegative ? "-" : "";
		}

		const integerPart = safeIntegerDigits || "0";
		const decimalPart = hadDecimalSeparator ? `.${safeDecimalDigits}` : "";

		return `${isNegative ? "-" : ""}${integerPart}${decimalPart}`;
	}

	normalizeAmountValue(value: string | number | null, maxDigits: number, maxDecimals = 2): number | null {
		const normalizedString = this.sanitizeAmountInput(value, maxDigits, maxDecimals);
		if (normalizedString === "" || normalizedString === "-") {
			return null;
		}

		const normalizedValue = Number(normalizedString);
		return Number.isNaN(normalizedValue) ? null : normalizedValue;
	}

	formatAmountInput(value: number | null, decimals = 2): string {
		if (value == null || Number.isNaN(value)) {
			return "";
		}

		return new Intl.NumberFormat("en-US", {
			minimumFractionDigits: decimals,
			maximumFractionDigits: decimals,
		}).format(value);
	}

	toEditableAmountInput(value: number | null, decimals = 2): string {
		if (value == null || Number.isNaN(value)) {
			return "";
		}

		return value.toFixed(decimals);
	}

	resolveBrandIconClass(brandDescription?: string | null, brandCode?: string | null): string | null {
		return this.commonGlobalService.resolveBrandIconClass(brandDescription, brandCode);
	}

	formatSelectionSummary(
		ids: number[],
		items: Array<{ id: number; name?: string; description?: string }>,
		options?: {
			emptyLabel?: string;
			singleFallbackLabel?: string;
			multiSuffixLabel?: string;
		}
	): string {
		const emptyLabel = options?.emptyLabel ?? this.termText(LIBRARY_TERM.ALL);
		const singleFallbackLabel = options?.singleFallbackLabel ?? this.termText(LIBRARY_TERM.SELECTED);
		const multiSuffixLabel = options?.multiSuffixLabel ?? this.termText(LIBRARY_TERM.SELECTED);
		const selectedLabels = items
			.filter(item => ids.includes(item.id))
			.map(item => item.name ?? item.description ?? "")
			.filter(label => label.length > 0);

		if (ids.length === 0) {
			return emptyLabel;
		}

		if (ids.length === 1) {
			return selectedLabels[0] ?? singleFallbackLabel;
		}

		return `${ids.length} ${multiSuffixLabel}`;
	}

	splitPipeSelection(value?: string | null): string[] {
		if (!value) {
			return [];
		}

		return value
			.split("|")
			.map(item => item.trim())
			.filter(item => item.length > 0);
	}

	buildInvoiceSelectionSummary(value?: string | null, selectedLabel = "selected"): string {
		const invoices = this.splitPipeSelection(value);
		if (invoices.length === 0) return "";
		if (invoices.length === 1) return invoices[0];
		return `${invoices.length} ${selectedLabel}`;
	}

	buildAmountRangeSummary(minAmount: number | null, maxAmount: number | null, decimals = 2): string {
		const minLabel = minAmount != null ? this.formatAmountInput(minAmount, decimals) : null;
		const maxLabel = maxAmount != null ? this.formatAmountInput(maxAmount, decimals) : null;

		if (minLabel && maxLabel) {
			return `${minLabel} - ${maxLabel}`;
		}

		if (minLabel) {
			return `>= ${minLabel}`;
		}

		if (maxLabel) {
			return `<= ${maxLabel}`;
		}

		return "All";
	}

	resolveAppliedMinAmount(minAmount: number | null, maxAmount: number | null): number | null {
		if (minAmount != null) {
			return minAmount;
		}

		return maxAmount != null && maxAmount >= 0 ? 0 : null;
	}

	returnIdRegionDefault(regions: ClientRegionResponse[]): number {
		const europeIds = [LibraryConstants.REGION_EUROPE, LibraryConstants.REGION_EUROPE_NO_SEPA, LibraryConstants.REGION_EUROPE_SEPA];
		const allEurope = regions.length > 0 && regions.every(region => europeIds.includes(region.regionId));
		return allEurope ? LibraryConstants.REGION_EUROPE : -1;
	}

	isGroupProfile(): boolean {
		return this.config.SessionInformation?.isGroup ?? false;
	}

	resolveGroupScope(clientInfo: ClientInformationResponse): Pick<FeeLibraryFilter, "groupId" | "flagGroup"> {
		const flagGroup = this.isGroupProfile();
		const groupId = flagGroup ? (clientInfo.groups?.[0]?.groupId ?? -1) : -1;

		return {
			groupId,
			flagGroup,
		};
	}

	buildDefaultFilter(bankId: string, groupScope?: Pick<FeeLibraryFilter, "groupId" | "flagGroup">): FeeLibraryFilter {
		return {
			brandId: [],
			businessId: [],
			category: -1,
			subCategory: -1,
			subCategoryIds: [],
			startDate: "",
			endDate: "",
			bankId,
			regionId: -1,
			countryId: -1,
			groupId: groupScope?.groupId ?? -1,
			brandBusinessPairs: [],
			brandBusinessTrx: [],
			businessTransaction: [],
			entity1: null,
			entity2: null,
			entity3: [],
			entity3Labels: [],
			invoice: null,
			productId: [],
			productIdLabels: [],
			rateId: [],
			customCategoryId: [],
			codeNameFee: "",
			parentFeeCodeText: null,
			parentFeeName: null,
			feeName: false,
			feeCode: false,
			matchType: 0,
			typePeriod: PeriodType.Last12Months,
			langId: "325",
			pageNumber: 1,
			pageSize: 10,
			sortField: "lastBillingDate",
			sortOrder: "-1",
			visibleColumns: [],
			flagGroup: groupScope?.flagGroup ?? false,
			entityCategory: "",
			entities: "",
			coreId: [],
		};
	}

	resolveDetailBankId(rowClientId: number | null | undefined, clientInfo: ClientInformationResponse | null, filter: FeeLibraryFilter | null): number {
		if (rowClientId && rowClientId !== 0) return rowClientId;
		if (!clientInfo || !filter) return -1;
		const filteredBanks = this.getFilteredBanks(clientInfo, filter);
		if (filteredBanks.length === 1) return filteredBanks[0].bankId;
		return -1;
	}

	getFilteredBanks(clientInfo: ClientInformationResponse, filter: FeeLibraryFilter): ClientBankResponse[] {
		const banks = clientInfo.banks ?? [];
		if (banks.length === 0) {
			return [];
		}

		if (banks.length === 1) {
			return banks;
		}

		if (filter.bankId && filter.bankId !== "-1") {
			const selectedIds = filter.bankId
				.split("|")
				.map(value => Number(value))
				.filter(value => !Number.isNaN(value));

			return banks.filter(bank => selectedIds.includes(bank.bankId));
		}

		if (filter.countryId !== -1) {
			return banks.filter(bank => bank.countryId === filter.countryId);
		}

		if (filter.regionId !== -1) {
			if (filter.regionId === LibraryConstants.REGION_EUROPE) {
				return banks.filter(bank => [LibraryConstants.REGION_EUROPE_NO_SEPA, LibraryConstants.REGION_EUROPE_SEPA].includes(bank.regionId));
			}

			return banks.filter(bank => bank.regionId === filter.regionId);
		}

		return [];
	}

	shouldShowGroupClientColumn(filter: FeeLibraryFilter | null, clientInfo: ClientInformationResponse | null): boolean {
		if (!filter?.flagGroup) {
			return false;
		}

		const availableBanks = clientInfo?.banks ?? [];
		if (availableBanks.length <= 1) {
			return false;
		}

		if (!filter.bankId || filter.bankId === "-1") {
			return true;
		}

		const selectedIds = filter.bankId
			.split("|")
			.map(value => Number(value))
			.filter(value => !Number.isNaN(value));

		return selectedIds.length > 1;
	}

	createFilterParams(filter: FeeLibraryFilter): HttpParams {
		let params = new HttpParams();

		const appendSimple = (key: string, value: unknown) => {
			if (value !== undefined && value !== null) {
				params = params.append(key, String(value));
			}
		};

		const appendText = (key: string, value?: string | null) => {
			const trimmedValue = value?.trim();
			if (trimmedValue) {
				params = params.append(key, trimmedValue);
			}
		};

		const appendArray = (key: string, values?: unknown[]) => {
			if (!values || values.length === 0) {
				return;
			}

			values.forEach(value => {
				params = params.append(key, String(value));
			});
		};

		const appendObjectArray = <T extends object>(key: string, values?: T[]) => {
			if (!values || values.length === 0) {
				return;
			}

			values.forEach((item, index) => {
				Object.entries(item).forEach(([prop, value]) => {
					params = params.append(`${key}[${index}].${prop}`, String(value));
				});
			});
		};

		appendSimple("startDate", filter.startDate);
		appendSimple("endDate", filter.endDate);
		appendSimple("category", filter.category);
		appendSimple("subCategory", filter.subCategory);
		appendArray("subCategoryIds", filter.subCategoryIds);
		appendSimple("bankId", filter.bankId);
		appendSimple("regionId", filter.regionId);
		appendSimple("countryId", filter.countryId);
		appendSimple("groupId", filter.groupId);
		appendSimple("langId", filter.langId);
		appendObjectArray("brandBusinessPairs", filter.brandBusinessPairs);
		appendObjectArray("brandBusinessTrx", filter.brandBusinessTrx);
		appendObjectArray("businessTransaction", filter.businessTransaction);
		appendArray("brandId", filter.brandId);
		appendArray("businessId", filter.businessId);
		appendSimple("entity1", filter.entity1);
		appendSimple("entity2", filter.entity2);
		appendArray("entity3", filter.entity3);
		appendSimple("invoice", filter.invoice);
		appendArray("productId", filter.productId);
		appendArray("rateId", filter.rateId);
		appendArray("customCategoryId", filter.customCategoryId);
		appendSimple("minAmount", filter.minAmount);
		appendSimple("maxAmount", filter.maxAmount);
		appendText("parentFeeCodeText", filter.parentFeeCodeText);
		appendText("parentFeeName", filter.parentFeeName);
		appendSimple("codeNameFee", filter.codeNameFee);
		appendSimple("matchType", filter.matchType);
		appendSimple("typePeriod", filter.typePeriod);
		params = params.append("feeName", String(filter.feeName));
		params = params.append("feeCode", String(filter.feeCode));
		params = params.append("pageNumber", String(filter.pageNumber));
		params = params.append("pageSize", String(filter.pageSize));
		if (filter.sortField !== null && filter.sortField !== undefined) {
			appendSimple("sortField", filter.sortField);
		}
		if (filter.sortOrder !== null && filter.sortOrder !== undefined) {
			appendSimple("sortOrder", filter.sortOrder);
		}
		appendArray("visibleColumns", filter.visibleColumns);
		appendSimple("flagGroup", filter.flagGroup);
		appendSimple("entityCategory", filter.entityCategory);
		appendSimple("entities", filter.entities);
		appendArray("coreId", filter.coreId);

		return params;
	}

	resolveAppliedSubCategoryIds(filter: Pick<FeeLibraryFilter, "category" | "subCategory" | "subCategoryIds">, subCategories: Array<{ id: number; categoryId: number }>): number[] {
		if (filter.subCategoryIds?.length) {
			return [...new Set(filter.subCategoryIds)];
		}

		if (filter.subCategory > 0) {
			return [filter.subCategory];
		}

		if (filter.category > 0) {
			return subCategories.filter(subCategory => subCategory.categoryId === filter.category).map(subCategory => subCategory.id);
		}

		return [];
	}

	buildCategorizationSummary(
		filter: Pick<FeeLibraryFilter, "category" | "subCategory" | "subCategoryIds">,
		categories: Array<{ id: number; description: string }>,
		subCategories: Array<{ id: number; categoryId: number; description: string }>,
		options?: {
			allLabel?: string;
			multiSuffixLabel?: string;
		}
	): string {
		const allLabel = options?.allLabel ?? this.termText(LIBRARY_TERM.ALL);
		const multiSuffixLabel = options?.multiSuffixLabel ?? this.termText(LIBRARY_TERM.SELECTED);
		const selectedSubCategoryIds = this.resolveAppliedSubCategoryIds(filter, subCategories);

		if (selectedSubCategoryIds.length === 0 || selectedSubCategoryIds.length === subCategories.length) {
			return allLabel;
		}

		if (selectedSubCategoryIds.length === 1) {
			const selectedSubCategory = subCategories.find(subCategory => subCategory.id === selectedSubCategoryIds[0]);
			const category = categories.find(item => item.id === selectedSubCategory?.categoryId);
			if (selectedSubCategory && category) {
				return `${category.description} / ${selectedSubCategory.description}`;
			}
		}

		const fullySelectedCategory = categories.find(category => {
			const categorySubCategoryIds = subCategories.filter(subCategory => subCategory.categoryId === category.id).map(subCategory => subCategory.id);
			return categorySubCategoryIds.length > 0 && categorySubCategoryIds.every(id => selectedSubCategoryIds.includes(id)) && categorySubCategoryIds.length === selectedSubCategoryIds.length;
		});

		if (fullySelectedCategory) {
			return fullySelectedCategory.description;
		}

		return `${selectedSubCategoryIds.length} ${multiSuffixLabel}`;
	}

	resolveScopedClientIds(clientList: ClientBankResponse[], bankId: string): number[] {
		if (!bankId || bankId === "-1") {
			return clientList.map(client => client.bankId);
		}

		return bankId
			.split("|")
			.map(value => Number(value))
			.filter(value => !Number.isNaN(value));
	}

	filterClientCatalogItemsByClientIds(items: ClientCatalogItem[], clientIds: number[]): ClientCatalogItem[] {
		if (clientIds.length === 0) {
			return items;
		}

		return items.filter(item => clientIds.includes(item.clientId));
	}

	filterClientCatalogItemsByClientId(items: ClientCatalogItem[], clientId: number | null | undefined): ClientCatalogItem[] {
		if (!clientId || clientId <= 0) {
			return [];
		}

		return items.filter(item => item.clientId === clientId);
	}

	getEntityLevelTwoOptions(): { id: number; name: string; termKey: string }[] {
		return [
			{ id: 0, name: "Product Activity", termKey: "ProdActivity" },
			{ id: 1, name: "Product Billable", termKey: "ProdBillable" },
		];
	}

	filterEntityCategoriesByBrand(entityTypes: EntityType[], brandId: number | null): { id: number; name: string }[] {
		if (!brandId) {
			return [];
		}

		return (entityTypes.find(entityType => entityType.brandId === brandId)?.categories ?? []).filter(category => category.id > 0);
	}
}
