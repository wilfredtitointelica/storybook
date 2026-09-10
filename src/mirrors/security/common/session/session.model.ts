/**
 * Domain model representing the authenticated user's session.
 * Mapped from the `data` cookie set by the authentication layer.
 *
 * All properties are readonly — the session is consumed, never mutated.
 */
export interface UserSession {
	readonly businessUserID: string;
	readonly clientGroupID: string;
	readonly name: string;
	readonly fullName: string;
	readonly email: string;
	readonly isAdmin: boolean;
	readonly isGroup: boolean;
	readonly isInternal: boolean;
	readonly businessUserTypeName: string;
	readonly callBack: string;
	readonly callBackSecurityQuestions: string;
	readonly callBackLink: string;
	readonly organizationName: string;
}
