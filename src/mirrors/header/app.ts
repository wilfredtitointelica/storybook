import { Component, effect, inject, signal } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { ConfigService, GlobalMenuService, GlobalTermService, IntelicaAlertComponent } from "intelica-library-base";
import { SessionInactivityService } from "./common/service/session-inactivity.service";
import { ToggleSidebar } from "./toggle-sidebar/toggle-sidebar";
import { MenuProducts } from "./menu-products/menu-products";
import { MenuAlerts } from "./menu-alerts/menu-alerts";
import { SearchMain } from "./search-main/search-main";
import { MenuFilesharing } from "./menu-filesharing/menu-filesharing";
import { Language } from "./language/language";
import { NotificationBell } from "./notification-bell/notification-bell";
import { UserProfile } from "./user-profile/user-profile";
@Component({
	selector: "app-header",
	imports: [RouterLink, RouterOutlet, IntelicaAlertComponent, ToggleSidebar, MenuProducts, MenuAlerts, SearchMain, MenuFilesharing, NotificationBell, UserProfile, Language],
	templateUrl: "./app.html",
})
export class App {
	private readonly sessionInactivityService = inject(SessionInactivityService);
	public globalTermService = inject(GlobalTermService);
	public globalMenuService = inject(GlobalMenuService);
	private readonly configService = inject(ConfigService);
	public isInternal: boolean = false;
	public isIntelicaUser: boolean = false;
	isSessionInformation: boolean = document.URL.includes("setsesioninformation");
	constructor() {
		this.globalTermService.Initialize("Menu");
		this.globalMenuService.initialize();

		const hideMenu = ["/fee/alerts", "/fee/filesharing"].includes(window.location.pathname);
		this.globalMenuService.setMenuVisibility(!hideMenu);

		this.sessionInactivityService.initialize();
		this.isInternal = this.configService?.SessionInformation?.isInternal ?? false;
		this.isIntelicaUser = this.configService?.SessionInformation?.businessuserTypeName?.toLowerCase() === "intelica";
		effect(() => {
			if (this.globalTermService.TermsReady()) (window as any).__intelicaReady$?.next("@Intelica/IntelicaHeaderWeb");
		});
	}

	showGlobalMenu() {
		this.globalMenuService.setMenuVisibility(true);
	}
}
