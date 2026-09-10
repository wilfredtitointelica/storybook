export interface CustomConfigurationResponse {
	customConfigurationId: number;
	clientId: number;
	businessUserId: string;
	feeId: number;
	configurationType: number;
	thresholdValue: number;
	thresholdUnit: number;
	currencyId: number;
	isActive: boolean;
	createdDate: string;
	updatedDate: string | null;
}

export interface CustomConfigurationMaintenanceResponse {
	customConfigurationId: number;
}

export interface CustomConfigurationByFeeResponse {
	clientId: number;
	configuration: CustomConfigurationResponse | null;
}
