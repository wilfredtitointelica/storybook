export interface FeeUpdatesSummaryResponse {
	newFeesCount: number;
	tariffChangesCount: number;
	ceasedFeesCount: number;
}

export interface CurrencyTotal {
	code: string;
	totalAmount: number;
}

export interface NewFeeItem {
	feeId: string;
	feeCode: string;
	feeName: string;
	clientId: number | null;
	clientName: string | null;
	categoryId: number;
	category: string;
	brandId: number;
	brand: string;
	brandCode: string | null;
	business: string;
	firstBillingDate: string;
	amountByCurrency: Record<string, number>;
}

export interface NewFeesResponse {
	items: NewFeeItem[];
	totalCount: number;
	availableCurrencies: string[];
	currencyTotals: CurrencyTotal[];
}

export interface TariffChangeItem {
	feeId: string;
	feeCode: string;
	feeName: string;
	clientId: number | null;
	clientName: string | null;
	categoryId: number;
	category: string;
	brandId: number;
	brand: string;
	brandCode: string | null;
	business: string;
	previousRate: number;
	newRate: number;
	changeDate: string;
	absoluteChange: number;
}

export interface TariffChangesResponse {
	items: TariffChangeItem[];
	totalCount: number;
	total: number;
}

export interface CeasedFeeItem {
	feeId: string;
	feeCode: string;
	feeName: string;
	clientId: number | null;
	clientName: string | null;
	categoryId: number;
	category: string;
	brandId: number;
	brand: string;
	brandCode: string | null;
	business: string;
	lastKnownRate: number;
	currencyId: number;
	currency: string;
	ceasedDate: string;
}

export interface CeasedFeesResponse {
	items: CeasedFeeItem[];
	totalCount: number;
}

export interface FeeUpdatesEntityItem {
	entityId: number;
	entityName: string;
}

export interface FeeUpdatesBrandItem {
	brandId: number;
	brandName: string;
}

export interface FeeUpdatesBusinessItem {
	businessId: number;
	businessName: string;
}

export interface FeeUpdatesFiltersBootstrapResponse {
	entities: FeeUpdatesEntityItem[];
	brands: FeeUpdatesBrandItem[];
	businesses: FeeUpdatesBusinessItem[];
	minDate: string | null;
	maxDate: string | null;
}
