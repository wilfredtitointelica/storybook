import { RateStructureEnum, RateVersionEnum } from "../common/enums";

export interface FeeDetailInfoResponse {
	feeId: string;
	feeName: string;
	brandId: number;
	brand: string;
	businessId: number;
	business: string;
	feeOCode: string;
	feeCode: string;
	description: string;
	currentRate: string;
	billingFrequency: string;
	rateStructure: RateStructureEnum;
	rateVersions: RateVersionItem[];
	additionalDetails: FeeAdditionalDetails;
	minDate: string;
	maxDate: string;
	isSinglePeriod: boolean;
	hasAlert: boolean;
	associatedBanks: AssociatedBankItem[];
	referencesCount: number;
}

export interface AssociatedBankItem {
	bankId: number;
	bankName: string;
}

export type RateVersionStatus = "Active" | "Historical" | "Coming Soon";

export interface RateVersionItem {
	version: RateVersionEnum;
	label: string;
	status: RateVersionStatus;
	begin: string | null;
	end: string | null;
	minAmount: number | null;
	maxAmount: number | null;
	rateStructureCode: number | null;
	rateStructure: string | null;
	rateUnit: string | null;
	currency: string | null;
	isMultipleRate: boolean;
	isDependent: boolean;
	tiers: RateTierItem[];
}

export interface RateTierItem {
	tier: number;
	minimum: number | null;
	maximum: number | null;
	rate: string;
	description: string | null;
}

export interface FeeRateVersionsResponse {
	currency: string | null;
	rateStructure: string | null;
	rateStructureCode: number | null;
	rateUnit: string | null;
	versions: RateVersionItem[];
	additionalDetails: FeeAdditionalDetailsResponse | null;
}

export interface FeeAdditionalDetailsResponse {
	scope: string[];
	transactions: AdditionalDetailGroup[];
	products: AdditionalDetailGroup[];
	associatedFees: AdditionalDetailFee[];
}

export interface AdditionalDetailGroup {
	code: string;
	items: string[];
}

export interface AdditionalDetailFee {
	id: number;
	code: string;
}

export interface FeeAdditionalDetails {
	scope: string[];
	transactionTypes: string[];
	productTypes: string[];
	associatedFees: AssociatedFeeItem[];
	isAssociated: boolean;
	isDependent: boolean;
	isMultipleRate: boolean;
}

export interface AssociatedFeeItem {
	feeId: string;
	feeCode: string;
	feeName: string;
}

export interface FeeSummaryResponse {
	currency: string | null;
	currentRate: string | null;
	billingFrequency: string | null;
	rateStructure: string | null;
	rateStructureCode: number | null;
	rateUnit: string | null;
}

export interface FeeDetailKpiResponse {
	totalFeeAmount: number;
	currency: string;
	totalEvents: number | null;
	totalFeeAmountPrevious: number | null;
	hasEnoughHistory: boolean;
	isSinglePeriod: boolean;
	hasIncompleteHistory: boolean;
}

export interface FeeDetailChartItem {
	year: number;
	month: number;
	amount: number | null;
	previousYearAmount: number | null;
	events: number | null;
}

export interface BillingHistoryItem {
	date: string;
	billingNumber: string;
	billingActivity: string;
	entityActivity: string;
	description: string;
	price: number;
	events: number | null;
	originalCurrency: string;
	originalAmount: number;
	exchangeRate: number;
	targetCurrency: string;
	targetAmount: number;
	isUnallocated: boolean;
}

export interface BillingHistoryResponse {
	items: BillingHistoryItem[];
	totalCount: number;
	hasMultipleCurrencies: boolean;
	unifiedCurrency: string;
}

export interface FeeReferenceItem {
	documentId: number;
	fileName: string;
	documentCode: string;
	documentType: string;
	documentCategory: string;
	publicationDate: string;
	path: string;
}
