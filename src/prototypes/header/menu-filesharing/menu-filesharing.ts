import { Component, inject } from "@angular/core";
import { GlobalMenuService, GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";

@Component({
	selector: "menu-filesharing",
	imports: [RouterLink, RouterLinkActive, Button, TermPipe],
	templateUrl: "./menu-filesharing.html",
})
export class MenuFilesharing {
	public readonly globalMenuService = inject(GlobalMenuService);
	public readonly globalTermService = inject(GlobalTermService);
	public readonly router = inject(Router);
	showGlobalMenu() {
		this.globalMenuService.setMenuVisibility(false);
		//this.router.navigate(["fee/filesharing"]);
	}
}
