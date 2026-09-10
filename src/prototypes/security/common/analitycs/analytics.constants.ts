export const GA_TRACKING = {
	updateProfile: "updateProfileGA",
	actionMember: "actionMemberGA",
	search: "searchGA",
	setUpVerification: "setUpVerificationGA",
	editingPassword: "editingPasswordGA",
	updatePassword: "updatePasswordGA",
	notificationToggle: "notificationToggleGA",
} as const;

// --------------------------------------
// SEMANTIC KEYS (lo que usas en templates)
// --------------------------------------
export type GATrackingKey = keyof typeof GA_TRACKING;
