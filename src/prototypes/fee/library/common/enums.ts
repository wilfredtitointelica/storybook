export enum BrandEnum {
	Mastercard = 1,
	Visa = 2,
	Amex = 3,
}

export enum FinancialCategoryEnum {
	Refund = 0,
	Fee = 1,
	ExcludedFee = 2,
	Total = 255,
}

export enum LibraryTabEnum {
	Original = "0",
	Allocated = "1",
}

export enum PeriodEnum {
	CurrentMonth = 1,
	LastMonth = 2,
	CurrentYear = 3,
	LastYear = 4,
	Last12Month = 5,
	Customized = 6,
	AllHistory = 7,
	Quarters = 8,
	QuartersUnitCost = 9,
}
