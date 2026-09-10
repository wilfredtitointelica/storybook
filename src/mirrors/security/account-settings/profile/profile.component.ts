import { Component, computed, effect, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// --- directives ---
import { GaTrackDirective } from "../../common/analitycs";
// library
import { AlertService, AlertButtonMode, IntelicaAlertComponent, GlobalTermService, TermPipe } from "intelica-library-base";
// services
import { ProfileService } from "./profile.service";
import { UserResponse, UserUpdateCommand } from "./dto/profile-update.dto";
// state
import { AccountSettingsStateService } from "../account-settings-state.service";
// components
import { Panel } from "primeng/panel";
import { InputText } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { RadioButton } from "primeng/radiobutton";
import { Select } from "primeng/select";
import { Button } from "primeng/button";
import { SkeletonModule } from "primeng/skeleton";

const OTHER_BUSINESS_WORK_ID = "00000000-0000-0000-0000-000000000000";

interface Option {
	key: string;
	name: string;
}

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [FormsModule, CommonModule, GaTrackDirective, IntelicaAlertComponent, Panel, InputText, IconField, RadioButton, Select, Button, SkeletonModule, TermPipe],
	templateUrl: "./profile.component.html",
	host: {
		class: "profile",
	},
})
export class ProfileComponent implements OnInit {
	private readonly alertService = inject(AlertService);
	private readonly profileService = inject(ProfileService);
	private readonly state = inject(AccountSettingsStateService);
	readonly termService = inject(GlobalTermService);
	private originalData = signal<UserResponse | null>(null);
	isReady = computed(() => this.termService.TermsReady() && !!this.state.user() && !!this.state.configMetadata());

	constructor() {
		effect(() => {
			const user = this.state.user();
			const metadata = this.state.configMetadata();
			if (!user || !metadata) return;
			// Build plain arrays first — never read roleOptions/operationOptions
			// as signals inside this effect to avoid creating a circular dependency
			// that would cause the effect to re-run and reset the user's selection.
			const roleOpts = (metadata.businessWorks ?? []).map(b => ({ key: b.businessWorkId, name: b.name }));
			const opOpts = (metadata.workRoles ?? []).map(r => ({ key: r.workRoleId, name: r.name }));
			this.roleOptions.set(roleOpts);
			this.operationOptions.set(opOpts);
			this.mapToForm(user, roleOpts, opOpts);
		});
	}

	private mapToForm(data: UserResponse, roleOpts: Option[], opOpts: Option[]): void {
		this.originalData.set(data);
		this.valueFirstName.set(data.name ?? "");
		this.valueLastName.set(data.lastName ?? "");
		this.valueEmail.set(data.email ?? "");
		this.valueDepartament.set(data.department ?? "");
		this.valueOrganization.set(data.organizationName ?? "");
		this.valueDomain.set(data.domain ?? "");
		this.valueOther.set(data.businessWorkOther ?? "");
		this.selectedRole.set(roleOpts.find(r => r.key === data.businessWorkId) ?? null);
		this.selectedOperation.set(opOpts.find(o => o.key === data.workRoleId) ?? null);
	}

	onOperationChange(key: string | null): void {
		this.selectedOperation.set(this.operationOptions().find(o => o.key === key) ?? null);
	}

	ngOnInit(): void {}

	isUpdating = signal<boolean>(false);

	update(): void {
		const userData = this.originalData();
		if (!userData) return;
		const isOther = this.selectedRole()?.key === OTHER_BUSINESS_WORK_ID;
		const command: UserUpdateCommand = {
			userID: userData.userID,
			areaID: null,
			businessUserTypeID: null,
			businessUserStatusID: null,
			countryID: null,
			name: this.valueFirstName(),
			lastName: this.valueLastName(),
			email: this.valueEmail(),
			userLoginID: userData.userLoginID,
			expirationDate: null,
			isAdmin: null,
			workRoleId: this.selectedOperation()?.key ?? null,
			businessWorkId: this.selectedRole()?.key ?? null,
			businessWorkOther: isOther ? this.valueOther() : null,
			department: this.valueDepartament(),
		};
		this.isUpdating.set(true);
		this.profileService.update(command).subscribe({
			next: () => {
				this.isUpdating.set(false);
				this.originalData.set({
					...this.originalData()!,
					name: this.valueFirstName(),
					lastName: this.valueLastName(),
					department: this.valueDepartament(),
					businessWorkOther: this.valueOther(),
					businessWorkId: this.selectedRole()?.key ?? null,
					workRoleId: this.selectedOperation()?.key ?? null,
				});
				this.ShowAlertSuccess();
			},
			error: () => {
				this.isUpdating.set(false);
				this.ShowAlertError();
			},
		});
	}

	disabled = signal<boolean>(true);
	// --- form: fields ---
	valueFirstName = signal<string>("");
	valueLastName = signal<string>("");
	valueEmail = signal<string>("");
	valueDepartament = signal<string>("");
	valueOrganization = signal<string>("");
	valueDomain = signal<string>("");
	valueOther = signal<string>("");
	selectedRole = signal<Option | null>(null);
	roleOptions = signal<Option[]>([]);
	selectedOperation = signal<Option | null>(null);
	operationOptions = signal<Option[]>([]);
	translatedOperationOptions = computed(() => {
		this.termService.TermsReady();
		return this.operationOptions().map(o => ({
			key: o.key,
			label: this.termService.terms?.find(t => t.termName === o.name)?.termValue ?? o.name,
		}));
	});
	private hasChanges = computed(() => {
		const o = this.originalData();
		if (!o) return false;
		return (
			this.valueFirstName() !== (o.name ?? "") ||
			this.valueLastName() !== (o.lastName ?? "") ||
			this.valueDepartament() !== (o.department ?? "") ||
			this.valueOther() !== (o.businessWorkOther ?? "") ||
			this.selectedRole()?.key !== o.businessWorkId ||
			this.selectedOperation()?.key !== o.workRoleId
		);
	});
	disabledButton = computed(() => {
		const fieldsValid = this.valueFirstName().trim() && this.valueLastName().trim() && this.valueDepartament().trim() && this.selectedRole() && this.selectedOperation();
		return !fieldsValid || !this.hasChanges();
	});

	// --- form: errors ---
	demoFeedback = signal<boolean>(false);
	showOtherError = computed<boolean>(() => this.demoFeedback());
	showOperationError = computed<boolean>(() => this.demoFeedback());

	// --- methods ---
	private t(name: string): string {
		return this.termService.terms?.find(t => t.termName === name)?.termValue ?? name;
	}

	async ShowAlertSuccess(): Promise<void> {
		await this.alertService.success(this.t("AlertSuccessUpdateTitle"), this.t("AlertSuccessUpdateSubtitle"), AlertButtonMode.OK_ONLY, {
			confirmText: this.t("AlertSuccessUpdateButtonText"),
		});
	}
	async ShowAlertError(): Promise<void> {
		await this.alertService.error(this.t("AlertErrorUpdateTitle"), this.t("AlertErrorUpdateSubtitle"), AlertButtonMode.CONFIRM_ONLY, {
			confirmText: this.t("AlertErrorUpdateButtonText"),
		});
	}
}
