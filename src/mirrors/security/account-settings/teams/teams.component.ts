import { Component, computed, effect, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
// --- directives ---
import { GaTrackDirective } from "../../common/analitycs";
// library
import { AlertService, AlertButtonMode, IntelicaAlertComponent, GlobalTermService, TermPipe } from "intelica-library-base";
import { NotificationOrchestratorService } from "intelica-library-notification";
import { buildSearchLabel, StatusStateComponent, StatusStateEnum } from "intelica-library-project";
// components
import { Panel } from "primeng/panel";
import { Button } from "primeng/button";
import { Card } from "primeng/card";
import { Badge } from "primeng/badge";
import { Dialog } from "primeng/dialog";
import { Toast } from "primeng/toast";
import { MessageService, ToastMessageOptions } from "primeng/api";
import { InputText } from "primeng/inputtext";
import { IconField } from "primeng/iconfield";
import { InputIcon } from "primeng/inputicon";
import { SkeletonModule } from "primeng/skeleton";
import { Tooltip } from "primeng/tooltip";
// patterns
import { AddMemberModalComponent } from "./add-member-modal/add-member-modal.component";
import { AddMemberData, EditMemberData } from "./add-member-modal/dto/add-member-modal.dto";
import { TeamMember } from "./team-member/team-member";
// interface
import { Member } from "./team-member/team-member.interface";
// service
import { TeamsService } from "./teams.service";
import { TeamMembersResponse } from "./dto/member.dto";
// state
import { AccountSettingsStateService } from "../account-settings-state.service";
// session
import { SessionService } from "../../common/session/session.service";
// notification

import environment from "../../../environment/environment.json";
// domain
import { buildInviteNotification, buildRejectionNotification, computeTeamStats, TeamStats } from "./teams.domain";
@Component({
	selector: "app-teams",
	standalone: true,
	imports: [
		FormsModule,
		CommonModule,
		GaTrackDirective,
		IntelicaAlertComponent,
		Panel,
		Button,
		Dialog,
		Toast,
		AddMemberModalComponent,
		TeamMember,
		InputText,
		IconField,
		InputIcon,
		SkeletonModule,
		TermPipe,
		Tooltip,
		StatusStateComponent,
	],
	providers: [MessageService],
	templateUrl: "./teams.component.html",
	host: {
		class: "profile",
	},
})
export class TeamsComponent {
	private readonly alertService = inject(AlertService);
	private readonly teamsService = inject(TeamsService);
	private readonly state = inject(AccountSettingsStateService);
	private readonly session = inject(SessionService);
	private readonly notificationService = inject(NotificationOrchestratorService);
	readonly termService = inject(GlobalTermService);
	private readonly termPipe = inject(TermPipe);
	isReady = computed(() => this.termService.TermsReady() && !!this.state.user());
	searchInput = signal<string>("");
	searchText = signal<string>("");
	selectedMember = signal<Member | null>(null);
	showMemberDialog = signal<boolean>(false);
	demoMembers = signal<Member[]>([]);
	teamStats = computed<TeamStats>(() => computeTeamStats(this.demoMembers()));
	filteredMembers = computed(() => {
		const query = this.searchText().toLowerCase().trim();
		if (!query) return this.demoMembers();
		return this.demoMembers().filter(m => m.firstName.toLowerCase().includes(query) || m.lastName.toLowerCase().includes(query) || m.email.toLowerCase().includes(query));
	});
	private readonly maxPlaceholderLength = 20;
	private searchFields = computed(() => [this.t("PersonalInformationNamePlaceHolder"), this.t("PersonalInformationLastNamePlaceHolder"), this.t("PersonalInformationLastEmailPlaceHolder")]);
	private searchLabel = computed(() => {
		this.termService.TermsReady();
		return buildSearchLabel(this.termPipe, this.termService.languageCode, this.searchFields(), this.maxPlaceholderLength);
	});
	searchPlaceholder = computed(() => this.searchLabel().placeholder);
	searchTooltip = computed(() => this.searchLabel().tooltip);
	readonly statusStateEnum = StatusStateEnum;
	isNoDataState = computed(() => !this.searchText() && this.demoMembers().length === 0);
	isNoMatchesState = computed(() => !!this.searchText() && this.filteredMembers().length === 0);
	processingMemberID = signal<string | null>(null);
	emailExistsError = signal<boolean>(false);
	isAddingMember = signal<boolean>(false);
	isSavingMember = signal<boolean>(false);

	constructor(private messageService: MessageService) {
		effect(() =>
			setTimeout(() => {
				this.ShowWarningToast();
			}, 300)
		);
		effect(() => {
			const members = this.state.teamMembers();
			this.demoMembers.set(members.map(m => this.mapToMember(m)));
		});
	}

	private mapToMember(r: TeamMembersResponse): Member {
		const statusMap: Record<string, Member["status"]> = {
			PA: "pending",
			A: "approve",
			DE: "reject",
		};
		const requestTypeMap: Record<string, Member["requestType"]> = {
			"New Administrator": "new_admin",
			"Account Request": "account_request",
		};
		const resolvedRequestType: Member["requestType"] = r.requestType ? (requestTypeMap[r.requestType] ?? null) : r.isAdmin ? "new_admin" : "account_request";

		return {
			userID: r.userID,
			userLoginID: r.userLoginID,
			firstName: r.name,
			lastName: r.lastName,
			email: r.email,
			role: "other",
			otherRole: r.department ?? undefined,
			operation: "",
			status: statusMap[r.statusCode] ?? "approve",
			requestDate: new Date(r.createdDate),
			requestType: resolvedRequestType,
			active: r.active,
			businessWorkId: r.businessWorkId,
			businessWorkOther: r.businessWorkOther,
		};
	}

	private t(name: string): string {
		return this.termService.terms?.find(t => t.termName === name)?.termValue ?? name;
	}

	private showToast(options: ToastMessageOptions) {
		this.messageService.add(options);
	}

	ShowWarningToast() {
		this.showToast({
			severity: "warn",
			icon: "icon icon-warning",
			summary: this.t("TeamMessageSecurityNoticeTitle"),
			detail: this.t("TeamMessageSecurityNoticeSubTitle"),
		});
	}

	ShowSuccessToast() {
		this.showToast({
			severity: "success",
			icon: "icon icon-success",
			summary: this.t("EditTeamMemberSuccessSaveToastMessageTitle"),
			detail: this.t("EditTeamMemberSuccessSaveToastMessageSubTitle"),
		});
	}

	ShowAddMemberDialog() {
		this.showMemberDialog.set(true);
		this.selectedMember.set(null);
	}

	ShowEditMemberDialog(member: Member) {
		this.showMemberDialog.set(true);
		this.selectedMember.set(member);
	}

	async ShowAlertAddMember(): Promise<void> {
		await this.alertService.success(this.t("SaveTeamMemberSuccessSaveToastMessageTitle"), this.t("SaveTeamMemberSuccessSaveToastMessageSubTitle"), AlertButtonMode.OK_ONLY, {
			confirmText: this.t("AlertSuccessUpdateButtonText"),
		});
	}

	async ShowAlertDeleteMember(member: Member): Promise<void> {
		const result = await this.alertService.warning(this.t("DeleteTeamMemberAlertTitle"), this.t("DeleteTeamMemberAlertSubTitle"), AlertButtonMode.CONFIRM_ONLY, {
			confirmText: this.t("DeleteTeamMemberAlertButtonConfirm"),
		});
		if (!result.isConfirmed) return;
		this.teamsService.deleteMember(member.userID).subscribe({
			next: () => {
				this.demoMembers.update(list => list.filter(m => m.userID !== member.userID));
			},
			error: err => {
				console.error("delete error:", err);
			},
		});
	}

	OnApproveMember(member: Member) {
		this.processingMemberID.set(member.userID);
		this.teamsService.resolveRequest(member.userID, "APPROVE").subscribe({
			next: () => {
				this.processingMemberID.set(null);
				this.state.reloadTeamMembers();
				this.ShowSuccessToast();
			},
			error: err => {
				this.processingMemberID.set(null);
				console.error("approve error:", err);
			},
		});
	}

	OnRejectMember(member: Member) {
		this.processingMemberID.set(member.userID);
		this.teamsService.resolveRequest(member.userID, "REJECT").subscribe({
			next: () => {
				this.processingMemberID.set(null);
				this.state.reloadTeamMembers();
				this.sendRejectionEmail(member.firstName, member.email);
			},
			error: err => {
				this.processingMemberID.set(null);
				console.error("reject error:", err);
			},
		});
	}

	OnSaveChanged(data: EditMemberData) {
		this.isSavingMember.set(true);
		this.teamsService.updateMember(data).subscribe({
			next: () => {
				this.isSavingMember.set(false);
				this.showMemberDialog.set(false);
				this.ShowSuccessToast();
				this.state.reloadTeamMembers();
			},
			error: err => {
				this.isSavingMember.set(false);
				console.error("updateMember error:", err);
			},
		});
	}

	OnAddMember(data: AddMemberData) {
		this.isAddingMember.set(true);
		this.emailExistsError.set(false);
		this.teamsService
			.addMember({
				name: data.name,
				lastName: data.lastName,
				email: data.email,
				isAdmin: data.isAdmin,
				businessWorkId: data.businessWorkId,
				businessWorkOther: data.businessWorkOther,
				clientGroupID: this.session.clientGroupID(),
			})
			.subscribe({
				next: response => {
					this.isAddingMember.set(false);
					if (response.userEmailExist) {
						this.emailExistsError.set(true);
						return;
					}
					this.showMemberDialog.set(false);
					this.ShowAlertAddMember();
					this.state.reloadTeamMembers();
					this.sendInviteEmail(data.name, data.email, response.activationToken);
				},
				error: err => {
					this.isAddingMember.set(false);
					console.error("addMember error:", err);
				},
			});
	}

	private sendRejectionEmail(firstName: string, email: string): void {
		const draft = buildRejectionNotification(firstName, email, this.session.businessUserID(), this.termService.languageCode);
		this.notificationService.ensureCreateJobNotifications("security", "user_reject", [draft]).catch(err => console.error("Failed to send rejection email:", err));
	}

	private sendInviteEmail(firstName: string, email: string, recoveryToken?: string): void {
		const draft = buildInviteNotification(
			firstName,
			email,
			this.session.organizationName(),
			recoveryToken,
			environment.baseUrl + "/create-account",
			this.session.businessUserID(),
			this.termService.languageCode
		);
		this.notificationService.ensureCreateJobNotifications("security", "user_invite", [draft]).catch(err => console.error("Failed to send invite email:", err));
	}

	ClearSearch() {
		this.searchInput.set("");
		this.searchText.set("");
	}

	OnSearchEnter() {
		this.searchText.set(this.searchInput());
	}

	OnSearchClick() {
		this.searchText.set(this.searchInput());
	}
}
