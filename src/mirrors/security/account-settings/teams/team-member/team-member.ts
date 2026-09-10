import { Component, computed, inject, input, output } from "@angular/core";
import { CommonModule } from "@angular/common";
// --- directives ---
import { GaTrackDirective } from "../../../common/analitycs";
// components
import { Badge } from "primeng/badge";
import { Button } from "primeng/button";
// interface
import { Member } from "../team-member/team-member.interface";
// term
import { GlobalTermService, TermPipe } from "intelica-library-base";

@Component({
	selector: "team-member",
	imports: [CommonModule, GaTrackDirective, Badge, Button, TermPipe],
	templateUrl: "./team-member.html",
})
export class TeamMember {
	readonly termService = inject(GlobalTermService);
	// --- properties ---
	member = input.required<Member>();
	processingMemberID = input<string | null>(null);
	edit = output<Member>();
	delete = output<Member>();
	approve = output<Member>();
	reject = output<Member>();
	status = computed(() => this.member().status);
	active = computed(() => this.member().active);
	badge = computed(() => this.GetBadgeByRequest(this.member().requestType));
	isProcessing = computed(() => this.processingMemberID() === this.member().userID);

	transferText = computed(() => {
		this.termService.TermsReady();
		const template = this.termService.terms?.find(t => t.termName === "TransferAdminPrivileges")?.termValue ?? "TransferAdminPrivileges";
		return template.replace("{firstName}", this.member().firstName).replace("{lastName}", this.member().lastName);
	});

	requestedOnText = computed(() => {
		this.termService.TermsReady();
		const template = this.termService.terms?.find(t => t.termName === "RequestedOn")?.termValue ?? "RequestedOn";
		return template.replace("{date}", String(this.member().requestDate));
	});
	// --- methods ---
	EditMember() {
		this.edit.emit(this.member());
	}
	DeleteMember() {
		this.delete.emit(this.member());
	}
	ApproveMember() {
		this.approve.emit(this.member());
	}
	RejectMember() {
		this.reject.emit(this.member());
	}
	GetBadgeByRequest(type: Member["requestType"]) {
		switch (type) {
			case "account_request":
				return { typeKey: "MemeberChipUserTypeMember", icon: "icon-user", valueKey: "MemberRequestChipAccount" };
			case "new_admin":
				return { typeKey: "MemeberChipUserTypeAdmin", icon: "icon-access", valueKey: "MemberRequestChipAdministrator" };
			default:
				return null;
		}
	}
}
