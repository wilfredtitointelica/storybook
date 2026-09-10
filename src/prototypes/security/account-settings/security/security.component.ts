import { Component, computed, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// --- directives ---
import { GaTrackDirective } from "../../common/analitycs";
// library
import { AlertService, AlertButtonMode, IntelicaAlertComponent, GlobalTermService, TermPipe } from "intelica-library-base";
import { NotificationOrchestratorService } from "intelica-library-notification";
// service
import { SecurityService } from "./security.service";
// state
import { AccountSettingsStateService } from "../account-settings-state.service";
// session
import { SessionService } from "../../common/session/session.service";
// domain
import { buildPasswordUpdateNotification, computeDaysAgo, isPasswordStrong } from "./security.domain";
// custom
import { PasswordModalComponent } from "./password-modal/password-modal.component";
import { SetupVerificationModalComponent } from "./setup-verification-modal/setup-verification-modal.component";
// components
import { Panel } from "primeng/panel";
import { Badge } from "primeng/badge";
import { Button } from "primeng/button";
import { PasswordModule } from "primeng/password";
import { Message } from "primeng/message";
import { Dialog } from "primeng/dialog";
import { Skeleton } from "primeng/skeleton";
@Component({
	selector: "app-security",
	standalone: true,
	imports: [
		FormsModule,
		CommonModule,
		GaTrackDirective,
		PasswordModalComponent,
		SetupVerificationModalComponent,
		IntelicaAlertComponent,
		Panel,
		Badge,
		Button,
		PasswordModule,
		Message,
		Dialog,
		Skeleton,
		TermPipe,
	],
	templateUrl: "./security.component.html",
	host: {
		class: "profile",
	},
})
export class SecurityComponent {
	private readonly alertService = inject(AlertService);
	private readonly securityService = inject(SecurityService);
	private readonly state = inject(AccountSettingsStateService);
	private readonly session = inject(SessionService);
	private readonly notificationService = inject(NotificationOrchestratorService);
	readonly termService = inject(GlobalTermService);
	isReady = computed(() => this.termService.TermsReady() && !!this.state.securityStatus());

	private t(name: string): string {
		return this.termService.terms?.find(t => t.termName === name)?.termValue ?? name;
	}

	// --- security status (derived from shared state) ---
	isTwoStepVerificationEnabled = computed(() => this.state.securityStatus()?.twoFactorEnabled ?? false);
	isPasswordStrong = computed(() => isPasswordStrong(this.state.securityStatus()?.passwordStrength ?? ""));
	lastUpdatedDays = computed(() => computeDaysAgo(this.state.securityStatus()?.lastSecurityUpdate ?? null));
	userEmail = computed(() => this.state.securityStatus()?.email ?? "");
	lastUpdatedText = computed(() => {
		this.termService.TermsReady();
		const days = this.lastUpdatedDays();
		if (days === null) return this.t("NoSecurityUpdatesYet");
		return this.t("SecurityStatusSubTitle").replace("{0}", String(days));
	});

	// --- password state ---
	isEditingPassword = signal<boolean>(false);
	isChangingPassword = signal<boolean>(false);
	passwordErrorKey = signal<string>("");
	valueCurrentPassword = computed(() => this.state.securityStatus()?.password ?? "••••••••••••");

	// --- 2FA dialog state ---
	isAuthenticationAppDialog = signal<boolean>(false);
	qrCodeBase64 = signal<string>("");
	manualEntryKey = signal<string>("");
	isLoadingQr = signal<boolean>(false);
	isVerifyingCode = signal<boolean>(false);
	hasTwoFactorError = signal<boolean>(false);

	ShowAuthenticationAppDialog(): void {
		this.qrCodeBase64.set("");
		this.manualEntryKey.set("");
		this.hasTwoFactorError.set(false);
		this.isLoadingQr.set(true);
		this.isAuthenticationAppDialog.set(true);
		this.securityService.setupTwoFactor(this.session.businessUserID()).subscribe({
			next: data => {
				this.qrCodeBase64.set(data.qrCodeBase64);
				this.manualEntryKey.set(data.manualEntryKey);
				this.isLoadingQr.set(false);
			},
			error: err => {
				this.isLoadingQr.set(false);
				console.error("setupTwoFactor error:", err);
			},
		});
	}

	OnVerifyTwoFactor(code: string): void {
		this.hasTwoFactorError.set(false);
		this.isVerifyingCode.set(true);
		this.securityService.verifyTwoFactor(this.session.businessUserID(), code).subscribe({
			next: res => {
				this.isVerifyingCode.set(false);
				if (res.verified) {
					this.isAuthenticationAppDialog.set(false);
					this.state.reloadSecurityStatus();
					this.ShowAlertTwoFactorSuccess();
				} else {
					this.hasTwoFactorError.set(true);
				}
			},
			error: err => {
				this.isVerifyingCode.set(false);
				this.hasTwoFactorError.set(true);
				console.error("verifyTwoFactor error:", err);
			},
		});
	}

	OnPasswordUpdate(data: { currentPassword: string; newPassword: string }): void {
		this.isChangingPassword.set(true);
		this.passwordErrorKey.set("");
		this.securityService.changePassword(data.currentPassword, data.newPassword).subscribe({
			next: () => {
				this.isChangingPassword.set(false);
				this.isEditingPassword.set(false);
				this.state.reloadSecurityStatus();
				this.ShowAlertPasswordSuccess();
				this.sendPasswordUpdateEmail();
			},
			error: () => {
				this.isChangingPassword.set(false);
			},
		});
	}

	private sendPasswordUpdateEmail(): void {
		const draft = buildPasswordUpdateNotification(this.session.fullName(), this.session.email(), this.session.businessUserID(), this.termService.languageCode);
		this.notificationService.ensureCreateJobNotifications("security", "password_update", [draft]).catch(err => console.error("Failed to send password update email:", err));
	}

	OnPasswordCancel(): void {
		this.isEditingPassword.set(false);
	}

	// --- alerts ---
	async ShowAlertPasswordSuccess(): Promise<void> {
		await this.alertService.success(this.t("SuccessUpdatePasswordAlertTitle"), this.t("SuccessUpdatePasswordAlertSubTitle"), AlertButtonMode.OK_ONLY, {
			confirmText: this.t("ButtonBackSecurePassword"),
		});
	}

	async ShowAlertPasswordError(): Promise<void> {
		await this.alertService.error(this.t("ErrorUpdatePasswordAlertTitle"), this.t("ErrorUpdatePasswordAlertSubTitle"), AlertButtonMode.CONFIRM_ONLY, { confirmText: this.t("ButtonBackSecurePassword") });
	}

	async ShowAlertTwoFactorSuccess(): Promise<void> {
		await this.alertService.success(this.t("SteupVerificationAlertSuccessTitle"), this.t("SteupVerificationAlertSuccessSubTitle"), AlertButtonMode.OK_ONLY, {
			confirmText: this.t("SteupVerificationAlertSuccessTextButton"),
		});
	}
}
