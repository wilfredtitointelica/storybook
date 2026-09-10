export interface BasicItemResponse {
	id: number;
	name: string;
}

export interface FeeCategory {
	id: number;
	code: string;
	description: string;
	order?: number;
}

export interface FeeSubCategory {
	id: number;
	categoryId: number;
	code: string;
	description: string;
	categoryCode: string;
	categoryDesc: string;
	order: number;
}

export interface EntityType {
	brandId: number;
	brandName: string;
	categories: BasicItemResponse[];
}

export interface Business {
	id: number;
	name: string;
}

export interface BusinessTransaction {
	id: number;
	name: string;
	businessId: number;
	transactionId: number;
}

export interface ClientCatalogItem {
	id: number;
	clientId: number;
	code: string;
	description: string;
}

export interface GroupNameOption {
	id: number;
	code: string;
	name: string;
}

export interface FeeLibraryMaster {
	categories: FeeCategory[];
	subCategories: FeeSubCategory[];
	typeOfRates: BasicItemResponse[];
	entityTypes: EntityType[];
	business: Business[];
	businessTransaction: BusinessTransaction[];
	productTypes: AllocatedProductTypes;
	brands: BasicItemResponse[];
	customCategories: ClientCatalogItem[];
	generalAccounts: ClientCatalogItem[];
	costCenters: ClientCatalogItem[];
	scopes: BasicItemResponse[];
	transactionTypes: BasicItemResponse[];
	productProgramIndPerBrand: BasicItemResponse[];
	scopesByClient: BasicItemResponse[];
	productTypesByClient: ProductTypes;
	businessByClient: BasicItemResponse[];
}

export interface PaginationResponse<T> {
	data?: T[];
	items?: T[];
	pageNumber?: number;
	pageSize?: number;
	totalCount?: number;
	totalPages?: number;
}

export interface FeePaginationResult {
	pagination: PaginationResponse<FeeResponse>;
	totalFeeAmount: number;
}

export interface FeeUnallocatedPaginationResult {
	pagination: PaginationResponse<FeeResponse>;
	currencyTotals: CurrencyTotal[];
}

export interface CurrencyTotal {
	code: string;
	totalAmount: number;
}

export interface FeeResponse {
	id: number;
	brandId: number;
	brandCode: string;
	brandDescription: string;
	businessId: number;
	businessCode: string;
	businessDescription: string;
	clientId: number;
	clientName?: string;
	clientNameCommercial?: string;
	countryId: number;
	countryCode?: string;
	countryName?: string;
	lastBillingDate?: string;
	feeDetail: FeeDetail;
	consecutiveMonths?: number;
	currencyId: number;
	percent?: number;
	crncys?: string;
	currencyDetail: CurrencyDetail;
	currencyDetailList: CurrencyDetail[];
	financialCategory: number;
	transactionId: number;
	transactionCode?: string;
	transactionName?: string;
	groupId?: number;
	groupName?: string;
	typeOfRate?: string;
	customCategoryId?: number;
	customCategory?: string;
	costCenterId?: number;
	costCenter?: string;
	generalAccountId?: number;
	generalAccount?: string;
	hasTariff?: boolean;
}

export interface FeeDetail {
	id: number;
	code?: string;
	codeIntelica?: string;
	name?: string;
	description?: string;
	categoryId: number;
	category: string;
	subCategory: string;
	lastBillingCurrency?: string;
	lastBillingAmount?: number;
	lastBillingDate?: string;
	billingFrecuencyId?: number;
	billingFrecuency?: string;
	methodId?: number;
	method?: string;
}

export interface CurrencyDetail {
	id: number;
	code?: string;
	description?: string;
	feeAmount: number;
	feeCnt: number;
	amountPercent: number;
}

export interface ResumeFee {
	resumeFeeAmounts: ResumeFeeAmount[];
	grossAmounts?: ResumeFeeAmount[];
	returnsAmounts?: ResumeFeeAmount[];
	exclusionAmounts?: ResumeFeeAmount[];
}

export interface ResumeFeeAmount {
	code: string;
	financialCategory: number;
	totalAmount: number;
}

export interface FeeRefund {
	id: number;
	brandId: number;
	brandCode: string;
	brandDescription: string;
	businessCode: string;
	businessDescription?: string;
	countryCode?: string;
	countryName?: string;
	clientId: number;
	clientName?: string;
	feeId: number;
	feeCode?: string;
	feeName?: string;
	category: string;
	lastBillingDate?: string;
	currencyId: number;
	currencyCode?: string;
	feeAmount: number;
}

export interface FeeExcluded {
	id: number;
	brandId: number;
	brandCode: string;
	brandDescription: string;
	businessDescription?: string;
	countryCode?: string;
	countryName?: string;
	clientId: number;
	clientName?: string;
	feeId: number;
	feeCode?: string;
	feeName?: string;
	category: string;
	lastBillingDate?: string;
	currencyId: number;
	currencyCode?: string;
	feeAmount: number;
}

export interface FeeGroupViewChild {
	clientId: number;
	name: string;
	clientNameCommercial?: string;
	mastercardAcqCash: number;
	mastercardAcqPos: number;
	mastercardIssuer: number;
	mastercardTotal: number;
	visaAcqCash: number;
	visaAcqPos: number;
	visaIssuer: number;
	visaTotal: number;
	amexAcqCash: number;
	amexAcqPos: number;
	amexIssuer: number;
	amexTotal: number;
	total: number;
	totalPercent: number;
}

export interface FeeGroupView {
	id: number;
	name: string;
	countryCode?: string;
	countryId?: number;
	flagBank?: boolean;
	children?: FeeGroupViewChild[];
	mastercardAcqCash: number;
	mastercardAcqPos: number;
	mastercardIssuer: number;
	mastercardTotal: number;
	total: number;
	totalPercent: number;
	visaAcqCash: number;
	visaAcqPos: number;
	visaIssuer: number;
	visaTotal: number;
	amexAcqCash: number;
	amexAcqPos: number;
	amexIssuer: number;
	amexTotal: number;
}

export interface PeriodDatesModel {
	filterType: number;
	description: string;
	startDate: string | Date;
	endDate: string | Date;
}

export interface LibraryDatesResponse {
	minDate: string | null;
	maxDate: string | null;
}

export interface EntityProductModel {
	brandId: number;
	brandName: string;
	prodId: number;
	prodCod: string;
	prodCatDescription: string;
	prodCatId: number;
	entity: number;
	entityDesc: string;
}

export interface InvoiceOption {
	invoiceNumber: string;
	brandId: number;
	brandName: string;
	feeDate: string;
}

export interface AllocatedProductTypeItem {
	id: number;
	code: string;
	name: string;
}

export interface AllocatedProductTypeBrandGroup {
	brandId: number;
	brandName: string;
	items: AllocatedProductTypeItem[];
}

export interface AllocatedProductTypes {
	credit: AllocatedProductTypeBrandGroup[];
	debitPrepaid: AllocatedProductTypeBrandGroup[];
}

export interface ProductTypeItem {
	id: number;
	code: string;
	name: string;
}

export interface ProductTypesBrand {
	brandId: number;
	brandName: string;
	items: ProductTypeItem[];
}

export interface ProductTypes {
	credit: ProductTypesBrand[];
	debitPrepaid: ProductTypesBrand[];
}
