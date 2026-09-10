export interface CustomConfigurationMaintenanceRequest {
	feeId: number;
	configurationType: number;
	thresholdValue: number;
	thresholdUnit: number;
	currencyId: number;
	clientId?: string;
	bankId?: number;
}
