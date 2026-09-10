import { Member } from "./team-member/team-member.interface";
import { NotificationDraft } from "intelica-library-notification";

export interface TeamStats {
	total: number;
	active: number;
	pending: number;
}

export function computeTeamStats(members: Member[]): TeamStats {
	return {
		total: members.length,
		active: members.filter(m => m.status === "approve").length,
		pending: members.filter(m => m.status === "pending").length,
	};
}

export function buildRejectionNotification(firstName: string, email: string, sessionUserId: string, languageCode: string): NotificationDraft {
	const lang = languageCode.toLowerCase();
	return {
		originReference: `user-rejection-${email}`,
		notificationTypeCode: "NTF",
		priorityCode: "high",
		title: "AccountAccessDeniedNotification",
		bucketName: "security",
		templateName: `/template/email/${lang}/account-access-denied`,
		templateData: JSON.stringify({ firstName }),
		recipients: [
			{
				recipientTypeCode: "user",
				channelCode: "email",
				userId: sessionUserId,
				address: email,
			},
		],
	};
}

export function buildInviteNotification(
	firstName: string,
	email: string,
	organizationName: string,
	recoveryToken: string | undefined,
	createAccountUrl: string,
	sessionUserId: string,
	languageCode: string
): NotificationDraft {
	const lang = languageCode.toLowerCase();
	const recoveryUrl = recoveryToken ? `${createAccountUrl}?token=${recoveryToken}` : createAccountUrl;

	return {
		originReference: `user-message`,
		notificationTypeCode: "NTF",
		priorityCode: "high",
		title: "AccountSetupInvitationNotification",
		bucketName: "security",
		templateName: `/template/email/${lang}/account-setup-invite`,
		templateData: JSON.stringify({
			firstName: firstName,
			organizationName: organizationName,
			recoveryUrl: recoveryUrl,
		}),
		recipients: [
			{
				recipientTypeCode: "user",
				channelCode: "email",
				userId: sessionUserId,
				address: email,
			},
		],
	};
}
