export interface SetupTwoFactorResponse {
	qrCodeBase64: string;
	manualEntryKey: string;
}

export interface VerifyTwoFactorResponse {
	verified: boolean;
}
