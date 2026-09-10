export interface RoleOption {
	key: string;
	name: string;
}

export interface AccountTypeOption {
	key: string;
	value: string;
	label: string;
}

export const OTHER_BUSINESS_WORK_ID = "00000000-0000-0000-0000-000000000000";

export const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
	{ key: "operation-1", value: "new_admin",       label: "MemeberChipUserTypeAdmin"  },
	{ key: "operation-2", value: "account_request", label: "MemeberChipUserTypeMember" },
];
