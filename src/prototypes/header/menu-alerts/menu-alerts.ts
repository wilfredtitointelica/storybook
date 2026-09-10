import { Component, inject } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { GlobalMenuService, GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";

@Component({
	selector: "menu-alerts",
	imports: [RouterLink, RouterLinkActive, Button, TermPipe],
	templateUrl: "./menu-alerts.html",
})
export class MenuAlerts {
	public readonly globalTermService = inject(GlobalTermService);
	public readonly globalMenuService = inject(GlobalMenuService);
	private readonly router = inject(Router);
	showGlobalMenu() {
		this.globalMenuService.setMenuVisibility(false);
		// this.router.navigate(["fee/alerts"]);
	}
}
