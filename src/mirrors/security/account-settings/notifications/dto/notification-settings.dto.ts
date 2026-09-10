export interface NotificationSettingsResponse {
	emailNotificationMaster: boolean;
	newFee: boolean;
	penalty: boolean;
	optOut: boolean;
	announcements: boolean;
	customFees: boolean;
	accessRequests: boolean;
	newUserRegistrations: boolean;
}

export interface UpdateNotificationCommand {
	businessUserID: string;
	emailNotificationMaster: boolean;
	newFee: boolean;
	penalty: boolean;
	optOut: boolean;
	announcements: boolean;
	customFees: boolean;
	accessRequests: boolean;
	newUserRegistrations: boolean;
}
