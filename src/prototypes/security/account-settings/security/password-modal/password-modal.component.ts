import { Component, signal, input, output, computed, inject, effect } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// --- directives ---
import { GaTrackDirective } from "../../../common/analitycs";
// components
import { PasswordModule } from "primeng/password";
import { Button } from "primeng/button";
import { Skeleton } from "primeng/skeleton";
// interfaces & types
import { PasswordCriterion } from "./password-modal.interface";
// domain
import { validateMinLength, validateUppercase, validateNumber, validateSpecialChar, getNewPasswordError, getConfirmPasswordError } from "./password-modal.domain";
// term
import { GlobalTermService, TermPipe } from "intelica-library-base";

@Component({
	selector: "app-password-modal",
	standalone: true,
	imports: [FormsModule, GaTrackDirective, CommonModule, PasswordModule, Button, Skeleton, TermPipe],
	templateUrl: "./password-modal.component.html",
})
export class PasswordModalComponent {
	readonly termService = inject(GlobalTermService);
	private t(name: string): string {
		return this.termService.terms?.find(t => t.termName === name)?.termValue ?? name;
	}
	// --- inputs ---
	isLoading = input<boolean>(false);
	passwordErrorKey = input<string>("");
	actualPassword = input<string>("");
	// --- output ---
	update = output<{ currentPassword: string; newPassword: string }>();
	cancel = output<void>();
	// --- form: fields ---
	valueCurrentPassword = signal<string>("");
	valueNewPassword = signal<string>("");
	valueConfirmPassword = signal<string>("");
	// --- form: criteria states ---
	minLengthState = signal<boolean | null>(null);
	uppercaseState = signal<boolean | null>(null);
	numberState = signal<boolean | null>(null);
	specialState = signal<boolean | null>(null);
	// --- form: criteria list (keys resueltos por | term en template) ---
	criteria = computed<PasswordCriterion[]>(() => [
		{ text: "ChkMustBe12Char", state: this.minLengthState() },
		{ text: "ChkMustIncludeUppperCaseLetter", state: this.uppercaseState() },
		{ text: "ChkMustIncludeLastOneNumber", state: this.numberState() },
		{ text: "ChkIncludeSpecialChar", state: this.specialState() },
	]);
	private static readonly CURRENT_PASSWORD_ERRORS = new Set(["CURRENT_PASSWORD_INVALID", "UserNotFound"]);
	// --- sync error from parent ---
	constructor() {
		effect(() => {
			const key = this.passwordErrorKey();
			if (!key) return;
			if (PasswordModalComponent.CURRENT_PASSWORD_ERRORS.has(key)) {
				this.msgCurrentPasswordError.set(this.t("ValidationCurrentPasswordIncorrect"));
			} else if (key === "NEW_PASSWORD_SAME_AS_CURRENT") {
				this.msgCurrentPasswordError.set(this.t("ValidationNewPasswordSameAsCurrent"));
			} else {
				this.msgCurrentPasswordError.set(this.t("ErrorUpdatePasswordAlertTitle"));
			}
		});
	}
	// --- form: errors ---
	msgCurrentPasswordError = signal<string>("");
	msgNewPasswordError = computed(() => {
		this.termService.TermsReady();
		const key = getNewPasswordError(this.valueCurrentPassword(), this.valueNewPassword());
		return key ? this.t(key) : "";
	});
	msgConfirmPasswordError = computed(() => {
		this.termService.TermsReady();
		const key = getConfirmPasswordError(this.valueNewPassword(), this.valueConfirmPassword());
		return key ? this.t(key) : "";
	});
	// --- computed: button state ---
	disabledButton = computed(() => {
		return (
			!this.valueCurrentPassword().trim() ||
			!this.valueNewPassword().trim() ||
			!this.valueConfirmPassword().trim() ||
			!!this.msgCurrentPasswordError() ||
			!!this.msgNewPasswordError() ||
			!!this.msgConfirmPasswordError() ||
			this.isLoading()
		);
	});
	// --- methods ---
	OnCurrentPasswordChange(value: string): void {
		this.valueCurrentPassword.set(value);
		if (value && this.actualPassword() && value !== this.actualPassword()) {
			this.msgCurrentPasswordError.set(this.t("CurrentPasswordInvalid"));
		} else {
			this.msgCurrentPasswordError.set("");
		}
	}
	OnNewPasswordChange(value: string): void {
		this.valueNewPassword.set(value);
		const touched = value.length > 0;
		this.minLengthState.set(touched ? validateMinLength(value) : null);
		this.uppercaseState.set(touched ? validateUppercase(value) : null);
		this.numberState.set(touched ? validateNumber(value) : null);
		this.specialState.set(touched ? validateSpecialChar(value) : null);
	}
	UpdatePassword(): void {
		this.update.emit({
			currentPassword: this.valueCurrentPassword(),
			newPassword: this.valueNewPassword(),
		});
	}
	CancelPassword(): void {
		this.cancel.emit();
	}
}
