export enum FeeDetailTabEnum {
	Overview = "overview",
	History = "history",
}

export enum RateStructureEnum {
	NotAssigned = 0,
	Flat = 1,
	StandardTier = 2,
	FlatTier = 3,
	ProgressiveTier = 4,
	Fixed = 5,
	Variable = 6,
	NotAvailable = 7,
	NotSpecified = 255,
}

export enum RateVersionEnum {
	Current = "Current",
	Previous = "Previous",
	Future = "Future",
}

export enum DatePeriodEnum {
	Last12Months = "Last12Months",
	CurrentYear = "CurrentYear",
	CurrentMonth = "CurrentMonth",
	Custom = "Custom",
}

export enum SimulatorError {
	InvalidFormat = "InvalidFormat",
	InvalidBasis = "InvalidBasis",
}
