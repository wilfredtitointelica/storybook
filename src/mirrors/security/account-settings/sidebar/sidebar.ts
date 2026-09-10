import { Component, computed, inject } from "@angular/core";
import { MenuItem } from "primeng/api";
import { PanelMenu } from "primeng/panelmenu";
import { SkeletonModule } from "primeng/skeleton";
import { GlobalTermService } from "intelica-library-base";
import { SessionService } from "../../common/session/session.service";

@Component({
	selector: "app-sidebar",
	imports: [PanelMenu, SkeletonModule],
	templateUrl: "./sidebar.html",
})
export class Sidebar {
	readonly termService = inject(GlobalTermService);
	private readonly sessionService = inject(SessionService);

	disableURL: boolean = false;

	accountSettingsTitle = computed(() => {
		this.termService.TermsReady();
		return this.term("AccountSettingsTitle");
	});

	menuItems = computed<MenuItem[]>(() => {
		this.termService.TermsReady();
		const items: MenuItem[] = [
			{
				label: this.term("ProfileMenu"),
				icon: "icon icon-user",
				routerLink: this.AssignURL("profile"),
				routerLinkActiveOptions: { exact: true },
			},
		];

		if (this.sessionService.isAdmin()) {
			items.push({
				label: this.term("TeamsMenu"),
				icon: "icon icon-user-group",
				routerLink: this.AssignURL("teams"),
				routerLinkActiveOptions: { exact: true },
			});
		}

		items.push(
			{
				label: this.term("SecurityMenu"),
				icon: "icon icon-security",
				routerLink: this.AssignURL("security"),
				routerLinkActiveOptions: { exact: true },
			},
			{
				label: this.term("NotificationsMenu"),
				icon: "icon icon-notification",
				routerLink: this.AssignURL("notifications"),
				routerLinkActiveOptions: { exact: true },
			}
		);

		return items;
	});

	private term(name: string): string {
		return this.termService.terms?.find(t => t.termName === name)?.termValue ?? name;
	}

	AssignURL(url: string) {
		if (this.disableURL) return;
		return url;
	}
}
