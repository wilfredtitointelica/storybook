export interface TotalFeeExpenseResponse {
	currencyCode: string;
	monthShort: string;
	table: TotalFeeExpenseTableResponse[];
}

export interface TotalFeeExpenseTableResponse {
	brandId: number;
	businessId: number;
	transactionId: number;
	monthId: number;
	amount: number;
}

export interface NetFeesBySchemeResponse {
	currencyCode: string;
	startDateLabel: string;
	endDateLabel: string;
	table: NetFeesBySchemeTableResponse[];
}

export interface NetFeesBySchemeTableResponse {
	brandId: number;
	monthId: number;
	monthShort: string;
	monthLabel: string;
	amount: number;
	grossFees: number;
	returns: number;
	exclusions: number;
}

export interface PerformanceScoreResponse {
	currencyCode: string;
	score: number;
	amount: number;
}

export interface MainOpportunitiesResponse {
	currencyCode: string;
	monthShort: string;
	monthShortComparison: string;
	yearShort: string;
	yearShortComparison: string;
	amountMonth: number;
	percentMonth: number;
	amountYear: number;
	percentYear: number;
	table: MainOpportunitiesTableResponse[];
}

export interface MainOpportunitiesTableResponse {
	brandId: number;
	monthAmount: number;
	yearAmount: number;
	monthShort: string;
	yearShort: string;
}

export interface UpcomingAnnouncementsResponse {
	bannerCount: number;
	table: BannerFinancialImpactResponse[];
}

export interface BannerFinancialImpactResponse {
	brandId: number;
	documentId: number;
	businessId: number;
	documentCode: string;
	regionIds: number[];
	countryIds: number[];
	jurisdiction: string;
	finantialTitle: string;
	finantialDescription: string;
	impactTypeIds: number[];
	financialImpactType: BasicItemResponse[];
	business: BasicItemResponse[];
	effectiveDate: Date;
	effectiveDateShort: string;
}

export interface UnitCostByProductResponse {
	currencyCode: string;
	quarters: UnitCostByProductHeadersResponse[];
	data: UnitCostByProductDataResponse[];
	table: UnitCostByProductTableResponse[];
	total: UnitCostByProductTableResponse;
}

export interface UnitCostByProductHeadersResponse {
	value: number;
	label: string;
}

export interface UnitCostByProductDataResponse {
	id: number;
	brandIndId: number;
	brandIndIds: number[];
	brandCredit: string;
	quarterId: number;
	unitCostTypeId: number;
	value: string;
	weightedAverage?: string | null;
}

export interface UnitCostByProductTableResponse {
	brandIndId: number;
	scopeId: number;
	brandIndDesc: string;
	scopeDesc: string;
	col1: number;
	col2: number;
	col3: number;
	col4: number;
	col5: number;
	qoq: number;
}
export interface FeeExpensesResponse {
	netFees: NetFeesBySchemeResponse;
	totalFees: TotalFeeExpensesResponse;
}

export interface TotalFeeExpensesResponse {
	currencyCode: string;
	monthShort: string;
	monthShortComparison: string;
	lastMonthShort: string;
	lastMonthShortComparison: string;
	last12MonthShortComparison: string;
	lastValueAmount: TotalFeeExpenseTableResponse[];
	lastValueAmountComparison: TotalFeeExpenseTableResponse[];
	lastMonthAmount: TotalFeeExpenseTableResponse[];
	lastMonthAmountComparison: TotalFeeExpenseTableResponse[];
	last12MonthAmount: TotalFeeExpenseTableResponse[];
	last12MonthAmountComparison: TotalFeeExpenseTableResponse[];
}
export interface FeeExpenseTableResponse {
	brandId: number;
	businessId: number;
	transactionId: number;
	monthId: number;
	currencyId: number;
	amount: number;
}
/**
 * External DTO
 */
export interface BasicItemResponse {
	id: number;
	name: string;
}
