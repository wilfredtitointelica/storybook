export interface BrandBusinessPair {
	brandId: number;
	businessId: number;
}

export interface BrandBusinessTrx {
	brandId: number;
	businessId: number;
	transactionId: number;
}

export interface BusinessTransaction {
	businessId: number;
	transactionId: number;
}

export interface FeeLibraryGlobalFilter {
	brandId: number[];
	businessId: number[];
	businessTransaction: BusinessTransaction[];
	bankId: string;
	startDate: string;
	endDate: string;
	typePeriod: number;
}

export interface FeeLibraryFilter {
	brandId: number[];
	businessId: number[];
	category: number;
	subCategory: number;
	subCategoryIds: number[];
	startDate: string;
	endDate: string;
	bankId: string;
	regionId: number;
	countryId: number;
	groupId: number;
	brandBusinessPairs: BrandBusinessPair[];
	brandBusinessTrx: BrandBusinessTrx[];
	businessTransaction: BusinessTransaction[];
	entity1?: number | null;
	entity2?: number | null;
	entity3?: number[];
	entity3Labels?: string[];
	invoice?: string | null;
	productId: number[];
	productIdLabels?: string[];
	rateId?: number[];
	customCategoryId: number[];
	minAmount?: number | null;
	maxAmount?: number | null;
	parentFeeCodeText?: string | null;
	parentFeeName?: string | null;
	codeNameFee: string;
	feeName: boolean;
	feeCode: boolean;
	matchType: number;
	typePeriod?: number;
	langId: string;
	pageNumber: number;
	pageSize: number;
	sortField?: string | null;
	sortOrder?: string | null;
	visibleColumns?: string[];
	flagGroup?: boolean;
	entityCategory?: string;
	entities?: string;
	coreId?: number[];
}

export interface ClientFeeRelationCommand {
	clientId: number;
	feeId: number;
	clientCustomCategoryId: number | null;
	clientGeneralAccountId: number | null;
	clientCostCenterId: number | null;
}
export type CurrentBusinessOption = {
	id: number;
	name: string;
	businessId: number;
	transactionId: number;
};

export type AppliedAdvancedFilterPill = {
	key: string;
	label: string;
};

export type AppliedAdvancedFilterKey =
	| "categorization"
	| "customCategory"
	| "parentFeeCode"
	| "groupName"
	| "rate"
	| "amount"
	| "productType"
	| "productTypeCredit"
	| "productTypeDebitPrepaid"
	| "entityType"
	| "entityDetail"
	| "entityValues"
	| "invoice";
