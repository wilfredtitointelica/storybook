export interface OptionData {
	id: number;
	name: string;
}

export enum AlertMethod {
	ExpectedAmount = "ExpectedAmount",
	VariationLimit = "VariationLimit",
}

export const ConfigurationTypeMap: Record<AlertMethod, number> = {
	[AlertMethod.ExpectedAmount]: 1,
	[AlertMethod.VariationLimit]: 2,
};

export const AlertMethodFromConfigurationType: Record<number, AlertMethod> = {
	1: AlertMethod.ExpectedAmount,
	2: AlertMethod.VariationLimit,
};

export const ThresholdUnit = {
	Amount: 1,
	Percentage: 2,
} as const;
