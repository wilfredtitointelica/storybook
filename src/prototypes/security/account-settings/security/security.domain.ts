import { NotificationDraft } from "intelica-library-notification";

export function detectBrowser(userAgent: string): string {
	if (/Edg\//.test(userAgent)) return "Microsoft Edge";
	if (/OPR\//.test(userAgent)) return "Opera";
	if (/Chrome\//.test(userAgent)) return "Google Chrome";
	if (/Firefox\//.test(userAgent)) return "Mozilla Firefox";
	if (/Safari\//.test(userAgent)) return "Safari";
	return "Unknown Browser";
}

export function detectOS(userAgent: string): string {
	if (/Windows/.test(userAgent)) return "Windows";
	if (/Mac OS X/.test(userAgent)) return "macOS";
	if (/Android/.test(userAgent)) return "Android";
	if (/iPhone|iPad/.test(userAgent)) return "iOS";
	if (/Linux/.test(userAgent)) return "Linux";
	return "Unknown OS";
}

export function formatNotificationDate(date: Date): string {
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	const yyyy = date.getFullYear();
	let hh = date.getHours();
	const min = String(date.getMinutes()).padStart(2, "0");
	const sec = String(date.getSeconds()).padStart(2, "0");
	const ampm = hh >= 12 ? "PM" : "AM";
	hh = hh % 12 || 12;
	return `${mm}/${dd}/${yyyy} ${String(hh).padStart(2, "0")}:${min}:${sec} ${ampm}`;
}

export function buildPasswordUpdateNotification(firstName: string, email: string, sessionUserId: string, languageCode: string): NotificationDraft {
	const lang = languageCode.toLowerCase();
	const ua = navigator.userAgent;
	return {
		originReference: `password-update`,
		notificationTypeCode: "NTF",
		priorityCode: "high",
		title: "PasswordUpdatedNotification",
		bucketName: "security",
		templateName: `/template/email/${lang}/update-password`,
		templateData: JSON.stringify({
			firstName,
			date: formatNotificationDate(new Date()),
			browser: detectBrowser(ua),
			so: detectOS(ua),
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

export function computeDaysAgo(lastSecurityUpdate: string | null): number | null {
	if (!lastSecurityUpdate) return null;
	const now = new Date();
	const reference = new Date(lastSecurityUpdate);
	return Math.floor((now.getTime() - reference.getTime()) / (1000 * 60 * 60 * 24));
}

export function isPasswordStrong(passwordStrength: string): boolean {
	return passwordStrength === "VerySecure" || passwordStrength === "Secure";
}
