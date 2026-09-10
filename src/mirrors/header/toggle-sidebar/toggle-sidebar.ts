import { Component, inject } from "@angular/core";
import { GlobalMenuService } from "intelica-library-base";
import { Button } from "primeng/button";

@Component({
	selector: "toggle-sidebar",
	imports: [Button],
	templateUrl: "./toggle-sidebar.html",
})
export class ToggleSidebar {
	private readonly globalMenuService = inject(GlobalMenuService);
	onChangeVisibility() {
		const isMenuVisible = this.globalMenuService.isMenuVisible();
		this.globalMenuService.setMenuVisibility(!isMenuVisible);
	}
}
