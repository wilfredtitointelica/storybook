interface NotificationAlert {
	checkedTitleKey?: string;
	checkedBodyKey?: string;
	uncheckedTitleKey?: string;
	uncheckedBodyKey?: string;
	visible: boolean;
}

interface NotificationItem {
	id: string;
	title: string;
	description?: string;
	checked: boolean; // Visual state of the toggle: ON/OFF
	blocked: boolean; // Indicates that the switch cannot be manipulated
	alert?: NotificationAlert;
}

interface NotificationChannel {
	heading?: string;
	masters?: NotificationItem[];
	items?: NotificationItem[];
}

export interface NotificationPreferences {
	email: NotificationChannel;
	administrative: NotificationChannel;
}
