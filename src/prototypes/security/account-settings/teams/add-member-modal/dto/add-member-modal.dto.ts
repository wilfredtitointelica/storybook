export interface AddMemberData {
	name: string;
	lastName: string;
	email: string;
	isAdmin: boolean;
	businessWorkId: string | null;
	businessWorkOther?: string;
}

export interface EditMemberData {
	userID: string;
	userLoginID: string;
	name: string;
	lastName: string;
	email: string;
	isAdmin: boolean;
	businessWorkId: string | null;
	businessWorkOther?: string;
}
