import { Component, inject, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { Sidebar } from "./sidebar/sidebar";
import { AccountSettingsStateService } from "./account-settings-state.service";
//import { GlobalMenuService } from "intelica-library-base";

@Component({
	selector: "app-account-settings",
	standalone: true,
	imports: [RouterOutlet, Sidebar],
	templateUrl: "./account-settings.component.html",
})
export class AccountSettingsComponent implements OnInit {
	private readonly state = inject(AccountSettingsStateService);

	//public globalMenuService = inject(GlobalMenuService);

	constructor() {
		//this.globalMenuService.setMenuVisibility(false);
	}

	ngOnInit(): void {
		this.state.load();
	}
}
