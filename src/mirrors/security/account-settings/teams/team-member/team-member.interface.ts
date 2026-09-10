export interface Member {
	userID: string;
	userLoginID: string;
	firstName: string;
	lastName: string;
	email: string;
	role: Role;
	otherRole?: string;
	operation: string;
	status: Status;
	requestDate: Date;
	requestType?: Type;
	active?: boolean;
	businessWorkId?: string | null;
	businessWorkOther?: string | null;
}

type Role = "accountant" | "analyst" | "consultant" | "management" | "other";
type Status = "pending" | "approve" | "reject";
type Type = "account_request" | "new_admin" | null;
