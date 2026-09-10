export enum UnitCostTypeEnum {
	Variable = 0,
	Fixed = 1,
}

export enum CategoryEnum {
	AuthorizationServices = 1,
	MandatedServices = 2,
	SettlementServices = 3,
	AssociationAssessment = 6,
	Penalties = 71,
	OptionalServices = 75,
	OptOutServices = 999,
}

export enum BusinessEnum {
	Acquirer = 1,
	Isssuer = 2,
	NotSpecified = 255,
}

export enum TransactionEnum {
	Purchase = 1,
	Cash = 8,
}

export enum BusinessTrasactionEnum {
	All = -1,
	Issuer = 1,
	AcquirerMerchant = 2,
	AcquirerCash = 3,
	NotSpecified = 0,
}
