export interface AlertsListResponse {
	alerts: AlertGroupCard[];
	totalCount: number;
	inboxCount: number;
	readCount: number;
}

export interface AlertGroupCard {
	alertType: number;
	alertTypeName: string;
	title: string;
	billingDate: string;
	createdRealDate: string;
	totalCount: number;
	brands: string[];
	brandBreakdown: BrandBreakdown[];
	totalAmount: number | null;
	currencyCode: string | null;
	isRead: boolean;
	isViewed: boolean;
	// Custom-only fields
	alertId?: number | null;
	feeCode?: string | null;
	feeName?: string | null;
	configurationType?: number | null;
	thresholdValue?: number | null;
	thresholdUnit?: number | null;
	actualValue?: number | null;
	deviationValue?: number | null;
	// Group profile fields (DRF-009)
	bankId?: number | null;
	bankName?: string | null;
}

export interface BrandBreakdown {
	brandName: string;
	count: number;
}

export interface AlertGroupDetailResponse {
	alertType: number;
	alertTypeName: string;
	title: string;
	createdRealDate: string;
	totalCount: number;
	totalAmountsByBrand: BrandTotal[];
	fees: AlertFeeDetail[];
	isRead: boolean;
	// Custom-only fields
	feeCode?: string | null;
	feeName?: string | null;
	feeDescription?: string | null;
	configurationType?: number | null;
	thresholdValue?: number | null;
	thresholdUnit?: number | null;
	actualValue?: number | null;
	deviationValue?: number | null;
	feeId?: number | null;
	bankId?: number | null;
}

export interface BrandTotal {
	brandName: string;
	totalAmount: number;
	currencyCode: string;
}

export interface AlertFeeDetail {
	alertId: number;
	feeId: number;
	bankId: number;
	feeName: string;
	feeCode: string;
	brandName: string;
	amount: number;
	currencyCode: string;
	billingDate: string;
	businessName: string;
	productCode: string | null;
	productActivityDescription: string | null;
}

export interface MarkAsReadResponse {
	success: boolean;
}
