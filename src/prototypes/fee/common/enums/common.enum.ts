export enum TariffMethodEnum {
	NotAssigned = 0,
	Flat = 1,
	StandarTier = 2,
	FlatTier = 3,
	ProgressiveTier = 4,
	Fixed = 5,
	Variable = 6,
	NotAvailable = 7,
	NotSpecified = 255,
}

export enum SearchTypeEnum {
	Contains = 0,
	Exact = 1,
	Begin = 2,
	Ends = 3,
}

export enum SortOrderEnum {
	Ascending = 1,
	Descending = -1,
}

export enum BrandEnum {
	Mastercard = 1,
	Visa = 2,
	Amex = 3,
}
export enum PeriodType {
	CurrentMonth = 1,
	LastMonth = 2,
	CurrentYear = 3,
	LastYear = 4,
	Last12Months = 5,
	Customized = 6,
	AllHistory = 7,
}
