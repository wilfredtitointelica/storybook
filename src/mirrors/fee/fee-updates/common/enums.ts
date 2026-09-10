export enum FeeUpdatesTabEnum {
	NewFees = "new-fees",
	TariffChanges = "tariff-changes",
	CeasedFees = "ceased-fees",
}

export enum DatePeriodEnum {
	Last12Months = "Last12Months",
	CurrentYear = "CurrentYear",
	CurrentMonth = "CurrentMonth",
	Custom = "Custom",
}

export enum TariffChangeDirectionEnum {
	Increase = "Increase",
	Decrease = "Decrease",
	None = "None",
}

export enum FeeUpdatesSystemStateEnum {
	Loading = "Loading",
	NoData = "NoData",
	NoMatchesFound = "NoMatchesFound",
	SystemError = "SystemError",
	Ready = "Ready",
}
