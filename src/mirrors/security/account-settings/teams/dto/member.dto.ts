export interface BusinessWorkDto {
	businessWorkId: string;
	name: string;
}

/** Response returned by POST /User when creating a new team member. */
export interface AddMemberResponse {
	userID?: string;
	/** RS256 JWT for the Create Account activation flow. Expires in 72h. */
	activationToken?: string;
	userEmailExist?: boolean;
}

export interface TeamMembersResponse {
	userID: string;
	name: string;
	lastName: string;
	email: string;
	userLoginID: string;
	isAdmin: boolean;
	active: boolean;
	statusCode: string;
	statusDescription: string;
	requestType: string | null;
	createdDate: string;
	workRoleId: string | null;
	department: string | null;
	businessWorkId: string | null;
	businessWorkOther: string | null;
}
