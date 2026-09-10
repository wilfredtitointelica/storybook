import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
// components
import { InputText } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { Select } from "primeng/select";
import { RadioButton } from "primeng/radiobutton";
import { Button } from "primeng/button";
import { Message } from "primeng/message";
import { Skeleton } from "primeng/skeleton";
// interface
import { Member } from "../team-member/team-member.interface";
// dto
import { AddMemberData, EditMemberData } from "./dto/add-member-modal.dto";
// domain
import { RoleOption, AccountTypeOption, OTHER_BUSINESS_WORK_ID, ACCOUNT_TYPE_OPTIONS } from "./add-member-modal.domain";
// state
import { AccountSettingsStateService } from "../../account-settings-state.service";
// term
import { GlobalTermService, TermPipe } from "intelica-library-base";

export type { AddMemberData, EditMemberData };

@Component({
	selector: "app-add-member-modal",
	standalone: true,
	imports: [FormsModule, InputText, IconField, Select, RadioButton, Button, Message, TermPipe, Skeleton],
	templateUrl: "./add-member-modal.component.html",
})
export class AddMemberModalComponent {
	readonly termService = inject(GlobalTermService);
	private readonly state = inject(AccountSettingsStateService);
	isReady = computed(() => this.termService.TermsReady() && !!this.state.securityStatus());
	member = input<Member | null>();
	isLoading = input<boolean>(false);
	emailExistsError = input<boolean>(false);
	saveChanges = output<EditMemberData>();
	addMember = output<AddMemberData>();
	// --- form: fields ---
	valueFirstName = signal<string>("");
	valueLastName = signal<string>("");
	valueEmail = signal<string>("");
	valueOther = signal<string>("");
	selectedRole = signal<RoleOption | null>(null);
	selectedAccountType = signal<AccountTypeOption | null>(null);
	accountType = signal<AccountTypeOption[]>(ACCOUNT_TYPE_OPTIONS);
	roleOptions = signal<RoleOption[]>([]);
	translatedAccountType = computed(() => {
		this.termService.TermsReady();
		return this.accountType().map(o => ({
			...o,
			label: this.termService.terms?.find(t => t.termName === o.label)?.termValue ?? o.label,
		}));
	});
	disabledButton = computed(() => {
		return !(this.valueFirstName().trim() && this.valueLastName().trim() && this.valueEmail().trim() && this.selectedRole() && this.selectedAccountType());
	});

	// --- form: errors ---
	demoFeedback = signal<boolean>(false);
	showFirstNameError = computed<boolean>(() => this.demoFeedback());
	showLastNameError = computed<boolean>(() => this.demoFeedback());
	showEmailError = computed<boolean>(() => this.demoFeedback() || this.emailExistsError());
	showRoleError = computed<boolean>(() => this.demoFeedback());
	showOtherError = computed<boolean>(() => this.demoFeedback());
	showAccountTypeError = computed<boolean>(() => this.demoFeedback());
	showMsgRememberError = computed<boolean>(() => this.demoFeedback());

	// --- constructor ---
	constructor() {
		effect(() => {
			const metadata = this.state.configMetadata();
			const member = this.member();

			if (!metadata?.businessWorks) return;

			const roleOpts: RoleOption[] = (metadata.businessWorks ?? []).map(b => ({
				key: b.businessWorkId,
				name: b.name,
			}));
			this.roleOptions.set(roleOpts);

			if (!member) return;

			this.valueFirstName.set(member.firstName);
			this.valueLastName.set(member.lastName);
			this.valueEmail.set(member.email);
			this.valueOther.set(member.businessWorkOther ?? "");

			this.selectedRole.set(roleOpts.find(r => r.key === member.businessWorkId) ?? null);

			const accountType = this.accountType().find(o => o.value === member.requestType);
			this.selectedAccountType.set(accountType ?? null);
		});
	}

	// --- methods ---
	AddNewMember() {
		const roleKey = this.selectedRole()?.key ?? null;
		const isOther = roleKey === OTHER_BUSINESS_WORK_ID;
		this.addMember.emit({
			name: this.valueFirstName().trim(),
			lastName: this.valueLastName().trim(),
			email: this.valueEmail().trim(),
			isAdmin: this.selectedAccountType()?.value === "new_admin",
			businessWorkId: roleKey,
			businessWorkOther: isOther ? this.valueOther().trim() : undefined,
		});
	}

	EditMember() {
		const roleKey = this.selectedRole()?.key ?? null;
		const isOther = roleKey === OTHER_BUSINESS_WORK_ID;
		this.saveChanges.emit({
			userID: this.member()!.userID,
			userLoginID: this.member()!.userLoginID,
			name: this.valueFirstName().trim(),
			lastName: this.valueLastName().trim(),
			email: this.valueEmail().trim(),
			isAdmin: this.selectedAccountType()?.value === "new_admin",
			businessWorkId: roleKey,
			businessWorkOther: isOther ? this.valueOther().trim() : undefined,
		});
	}
}
