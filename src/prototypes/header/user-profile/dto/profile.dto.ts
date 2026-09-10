export interface AuthenticationData {
	mame: string;
	email: string;
	businessUserID: string;
	businessUserProfile: string;
}
export interface BusinessUserClientGroupsResponse {
	businessUserClientGroupID: string;
	clientGroupID: string;
	intelicaName: string;
	bankName: string;
	projectName: string;
	isDefault: boolean;
	isGroup: boolean;
	isInternal: boolean;
	languageID: string;
	clientDetails: BusinessUserClientDetailsResponse[];
}
export interface BusinessUserClientDetailsResponse {
	clientID: string;
	intelicaName: string;
	bankName: string;
	projectName: string;
	associnvBankID: number;
	languageID: string;
}
export interface BusinessUserPagesAuthFormated {
	authClientID: string;
	compressedPages: string;
}
export interface AuthenticationProfileCommand {
	businessUserClientGroupID: string;
	businessUserID: string;
	clientGroupID: string;
	clientID: string;
	authenticationClientID: string;
	callBack: string;
	languageID: string;
}
