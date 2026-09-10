export interface PaginationResponse<T> {
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
	summaries: T[];
}

export interface BasicItemResponse {
	id: number;
	name: string;
}

export interface BasicItemCodeResponse {
	id: string;
	name: string;
}

export interface ClientCountryTpeResponse {
	clientId: number;
	clientName: string;
	clientCurrency: string;
	countryId: number;
	countryName: string;
	minDate: string;
	maxDate: string;
	lastUpdate: string;
	enabledDates: string[];
}

export interface FiltersTpeResponse {
	icas: string[];
	fees: BasicItemResponse[];
	merchants: BasicItemCodeResponse[];
	feeToIcas: Record<number, string[]>;
	icaToFees: Record<string, number[]>;
	merchantToFees?: Record<string, number[]>;
}

export interface MerchantNonComplianceResponse {
	merchantWithMostPenalties: string;
	totalMerchants: number;
}

export interface MerchantNonComplianceTopMerchantResponse {
	merchantWithMostPenalties: string;
}

export interface MerchantNonComplianceSummaryResponse {
	totalMerchants: number;
}

export interface MonthlyExpenseResponse {
	yearMonth: number;
	amount: number;
	convertedAmount: number;
	quantity: number;
}

export interface PenaltyFeesOverviewResponse {
	amountPaid: number;
	mostCommonFeeName: string;
	mostCommonFeeCode: string;
}

export interface PenaltyFeeResponse {
	feeId: number;
	feeCode: string;
	feeName: string;
	feeDescription: string;
	amount: number;
}

export interface PenaltyMccResponse {
	mccId: number;
	mccDescription: string;
	amount: number;
}

export interface PenaltyMccDetailResponse {
	merchantId: string;
	merchantName: string;
	amount: number;
}

export interface PenaltyMerchantDetailResponse {
	date: string;
	feeId: number;
	feeCode: string;
	feeName: string;
	currencyRate: string;
	rate: number;
	events: number;
	currencyBilling: string;
	amount: number;
}

export interface MerchantReportResponse {
	documentDate: string | null;
	documentDateFormat: string;
	feeCode: string;
	ica: string;
	merchantName: string;
	merchantId: number | null;
	quantityNumber: number;
	convertedAmount: number;
	tierValue: number;
	feeValue: number;
}

export interface MerchantReportSummaryResponse {
	totalCount: number;
	totalAmount: number;
}

export interface ExportableResponse {
	stream: Blob;
	contentType: string;
	filename: string;
}

export interface RecommendationResponse {
	feeCode: string;
	feeName: string;
	description: string;
	recomendation: string;
	complexity: string;
}

export interface RatingResponse {
	letter: string;
	description: string;
	color: string;
	value: number;
}

export interface TariffDetailSimpleResponse {
	tariffId: number | null;
	tariffDetailId: number | null;
	begin: string | null;
	end: string | null;
	unitId: number | null;
	methodId: number | null;
	currencyId: number | null;
	status: boolean;
	frecuencyId: number | null;
	tariffMultipleRateFlag: number | null;
	tariffMultipleCountryFlag: number | null;
	additionalConfigurationId: number | null;
	minAmount: number | null;
	maxAmount: number | null;
	dependantFees: number[];
	associatedFees: number[];
	tiers: TariffTierSimpleResponse[];
	rules: TariffRuleSimpleResponse[];
}

export interface TariffTierSimpleResponse {
	tariffTierId: number;
	order: number;
	description: string;
	minValue: number | null;
	maxValue: number | null;
	tierValue: number | null;
}

export interface TariffRuleSimpleResponse {
	tariffRuleId: number;
	tariffDetailId: number | null;
	transactionIds: number[] | null;
	subTransactionIds: number[] | null;
	scopeId: number[] | null;
	levelId: number | null;
	productIds: number[] | null;
	status: number | null;
}

export interface TariffAssociatedFeeResponse {
	id: number;
	code: string;
}

export interface TariffDetailPopupSimpleResponse extends TariffDetailSimpleResponse {
	currencyCode: string | null;
	transactionTypes: string | null;
	scopes: string | null;
	productTypes: string | null;
	associatedFeeCodes: TariffAssociatedFeeResponse[] | null;
	frecuencyName: string | null;
	rateUnit: string | null;
}

export enum SortOrderEnum {
	Ascending = 1,
	Descending = -1,
}
