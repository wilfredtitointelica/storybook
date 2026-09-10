export interface SecurityStatusResponse {
	twoFactorEnabled: boolean;
	passwordStrength: string;
	password: string;
	email: string;
	active: boolean;
	lastSecurityUpdate: string | null;
	createdDate: string;
}
