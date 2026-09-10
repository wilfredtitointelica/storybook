import { ContactTypeEnum, PeriodFilterTypeEnum, UpcomingOptOutStatusEnum, UsageLevelEnum, VariationTrendEnum } from "../common/enums/opt-out-service.enum";

export interface OptOutServicesFilterResponse {
	clients: ClientBankResponse[];
	brands: BasicItemResponse[];
	business: BasicItemResponse[];
	periods: PeriodDatesResponse[];
	currency?: CurrencyReponse;
}

export interface ClientBankResponse {
	bankId: number;
	bankName: string;
	regionId: number;
	countryId: number;
}

export interface BasicItemResponse {
	id: number;
	name: string;
}

export interface CurrencyReponse extends BasicItemResponse {
	code: string;
}

export interface PeriodDatesResponse {
	filterType: number;
	term: string;
	suffix: string;
	startDate: string;
	endDate: string;
}

export interface TopOptOutSubscriptionsCardResponse {
	periodShortStart: string;
	periodShortEnd: string;
	totalOptOutSubscriptions: number;
	items: readonly TopOptOutSubscriptionItem[];
}

export interface TopOptOutSubscriptionItem {
	optOutCode: string;
	feeCode: string;
	feeName: string;
	totalSavingsAmount: number;
	regionalAdoptionRate: number;
	usageLevel: UsageLevelEnum;
}

export interface CardOptOutSavingsResponse {
	currentSavings: number;
	previousSavings: number;
	variationPercentage: number;
	trend: VariationTrendEnum;
}

export interface CardUpcomingOptOutsResponse {
	pendingOptOuts: number;
	status: UpcomingOptOutStatusEnum;
}

export interface GraphOptOutBillingEvolutionResponse {
	currency: string;
	periodType: PeriodFilterTypeEnum;
	periodStart: string;
	periodEnd: string;
	periodShortStart: string;
	periodShortEnd: string;
	lastMonth?: LastMonthSummary;
	selectedPeriod: PeriodSummary;
	annualForecast?: ForecastSummary;
	months: readonly MonthlyBillingPoint[];
	showForecastArea: boolean;
	showTodayDivider: boolean;
	todayMarkerMonth?: string;
	todayShort?: string;
}

export interface LastMonthSummary {
	month: string;
	monthShort: string;
	amount: number;
}

export interface PeriodSummary {
	totalAmount: number;
}

export interface ForecastSummary {
	amount: number;
}

export interface MonthlyBillingPoint {
	month: number;
	monthShort?: string;
	actualAmount: number;
	forecastAmount?: number;
	isFuture: boolean;
	isDrillDownEnabled: boolean;
}

export interface TopOptOutSubscriptionsSummaryResponse {
	issuerAmount: number;
	acquirerAmount: number;
	memberAmount: number;
	totalAmount: number;
}

export interface OptOutSavingsSummaryResponse {
	totalOptOutSavings: number;
	potentialSavings: number;
	captureRate: number;
	totalBilled: number;
	totalMonthlySavings: number;
	totalAnnualSavings: number;
}

export interface UpcomingOptOutsSummaryResponse {
	pendingOptOuts: number;
	totalEstimatedCost: number;
	totalAnnouncements: number;
	totalAnnualForecast: number;
}

export interface TopOptOutSubscriptionsListSummaryResponse {
	totalAmount: number;
	items: TopOptOutSubscriptionsListResponse[];
}

export interface TopOptOutSubscriptionsListResponse {
	documentId: number;
	brandId: number;
	brandName: string;
	clientId: number;
	clientName: string;
	opcBusinessName: string;
	opcId: number;
	opcName: string;
	lastBillingDate: string;
	feeId: number;
	feeCode: string;
	feeName: string;
	feeBusinessName: string;
	consecutiveBilling: number;
	amount: number;
	regionalAdoptionRate?: number | null;
	stepsToOptOut: boolean;
	children: TopOptOutSubscriptionsListResponse[];
}
export interface OptOutSavingsListSummaryResponse {
	totalBilled: number;
	monthlySavings: number;
	annualSavings: number;
	items: OptOutSavingsListResponse[];
}
export interface OptOutSavingsListResponse {
	brandId: number;
	brandName: string;
	lastBillingDate: string;
	documentId: number;
	announcementCode: string;
	announcementTitle: string;
	clientId: number;
	clientName: string;
	opcId: number;
	opcName: string;
	opcBusinessName: string;
	feeId: number;
	feeCode: string;
	feeName: string;
	billedMonths: number;
	amountBilled: number;
	amountMonthlySavings: number;
	amountAnnualSavings: number;
	minDate: string;
	maxDate: string;
}

export interface UpcomingTableResponse {
	feeId: number;
	clientId: number;
	documentId: number;
	opcId: number;
	brandId: number;
	brandName: string;
	announcementCode: string;
	announcementTitle: string;
	announcementName: string;
	countryId: number;
	countryName: string;
	clientName: string;
	announcementBusinessId: number;
	announcementBusinessName: string;
	feeCode: string;
	publicationDate?: string;
	trialPeriodStarts?: string;
	cancellationDeadline?: string;
	billingStarts?: string;
	annualForecast: string;
	stepsToOptOut: boolean;
	isPendingConfirmation: boolean;
	hasMultipleFees: boolean;
	isParent: boolean;
	feeAuxIds?: number[];
	children: UpcomingTableResponse[];
}
export interface UpcomingSummaryResponse {
	totalAnnouncements: number;
	totalPendings: number;
	items: UpcomingListResponse[];
}

export interface UpcomingListResponse {
	documentId: number;
	announcementCode?: string;
	brandId: number;
	announcementTitle?: string;
	announcementBusinessName?: string;
	clientId: number;
	clientName: string;
	publicationDate?: string | null;
	trialPeriodStarts?: string | null;
	cancellationDeadline?: string | null;
	billingStarts?: string | null;
	isPendingConfirmation: boolean;
	children: UpcomingListResponse[];
}

export interface OptOutFlowResponse {
	optOutName: string;
	announcementCode: string;
	brand: string;
	publicationDate: Date;
	trialPeriodStart: Date;
	lastDayOptOut: Date;
	billingStart: Date;
	nextOptOutWindow: Date;
	warningMessage: string;
	contactType: ContactTypeEnum;
	to: string;
	subject: string;
	body: string;
	url: string;
	confirmEmailMessage: string;
	confirmFormMessage: string;
	completeMessage: string;
	windowFrequencyId: number;
	windowBeginningDate: Date;
	windowBeginningTypeFlag: number;
	publicationDateParse: string;
	trialPeriodStartParse: string;
	lastDayOptOutParse: string;
	billingStartParse: string;
	nextOptOutWindowParse: string;
}

export interface FeeByDocumentConfigurationResponse {
	feeId: number;
	code: string;
	name: string;
}
