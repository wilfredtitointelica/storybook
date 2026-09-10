export interface FeeDetailSimpleResponse {
	feeId: number;
	feeOCode: string;
	feeCode: string;
	feeName?: string;
	feeDescription?: string;
	brandId: number;
	brandDesc: string;
	memberChargedId: number;
	memberChargedDescription: string;
	regionId: number;
	feeRegionDesc: string;
	collectionDesc: string;
	feeServiceCod: string;
	feeServiceDesc: string;
	categoryId: number;
	categoryDescription: string;
	subcategoryId?: number;
	subcategoryDescription: string;
	dependency: string;
	parentCode: string;
	parentName: string;
}

export interface FeeDetailDatesSimpleResponse {
	minDate: string | null;
	maxDate: string | null;
	associatedBanks: BasicItemSimpleResponse[];
	referencesCount: number;
}

export interface BasicItemSimpleResponse {
	id: number;
	name: string;
}

export interface FeeHistoryTotalSimpleResponse {
	feeCntTotal: number;
	feeAmountTotalByCurrency: Array<{
		billingCurrencyGroup: string;
		feeAmountTotal: number;
	}>;
}

export interface FeeHistorySimpleResponse {
	feeSubId: number;
	runDt: string;
	feeCnt: number;
	rateCurrency: string | null;
	feeRate: number;
	billingCurrency: string | null;
	feeAmount: number;
	bankId: number;
	prodCod: string | null;
	prodDesc: string | null;
	prodActCod: string | null;
	prodActDesc: string | null;
	feeDesc: string | null;
	invoiceNumDesc: string;
	mppCod: string | null;
	mppDesc: string | null;
	exchangeRate: number;
	bankDesc: string;
	billingActivity: string | null;
	entityActivity: string | null;
	originalCurrency: string | null;
	originalAmount: number;
	targetCurrency: string | null;
	targetAmount: number;
	isUnallocated: boolean;
}

export interface PaginationSimpleResponse<T> {
	items: T[];
	totalCount: number;
	pageNumber: number;
	pageSize: number;
}

export interface FeeDetailChartItemSimpleResponse {
	year: number;
	month: number;
	amount: number | null;
	previousYearAmount: number | null;
	events: number | null;
}

export interface FeeFileDocumentSimpleResponse {
	documentId: number;
	documentCode: string;
	fileType: string;
	path: string;
	fileFormat: string;
	publicationDate: string | null;
	description: string;
	fileName: string;
	feeId: number;
	feeCode: string;
}
