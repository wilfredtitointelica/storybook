export interface UserResponse {
	userID: string;
	name: string;
	lastName: string;
	email: string;
	userLoginID: string;
	active: boolean;
	createdDate: string;
	department: string | null;
	organizationName: string | null;
	domain: string | null;
	workRoleId: string | null;
	businessWorkOther: string | null;
	businessWorkId: string | null;
}

export interface WorkRoleDto {
	workRoleId: string;
	name: string;
}

export interface BusinessWorkDto {
	businessWorkId: string;
	name: string;
}

export interface ConfigMetadataResponse {
	workRoles?: WorkRoleDto[];
	businessWorks?: BusinessWorkDto[];
}

export interface UserUpdateCommand {
	userID: string;
	areaID: string | null;
	businessUserTypeID: string | null;
	businessUserStatusID: string | null;
	countryID: string | null;
	name: string;
	lastName: string;
	email: string;
	userLoginID: string;
	expirationDate: string | null;
	isAdmin: boolean | null;
	workRoleId: string | null;
	businessWorkOther: string | null;
	businessWorkId: string | null;
	department: string | null;
}
