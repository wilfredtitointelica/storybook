import { CommonModule } from "@angular/common";
import { Component, DestroyRef, effect, inject, signal } from "@angular/core";
import { GlobalMenuService, GlobalTermService, TermPipe } from "intelica-library-base";
import { Button } from "primeng/button";
import { Badge } from "primeng/badge";
import { Tooltip } from "primeng/tooltip";
import { MenuSidebar, StatusLastUpdate } from "./";
@Component({
	selector: "app-menu",
	imports: [MenuSidebar, StatusLastUpdate, CommonModule, Button, Badge, Tooltip, TermPipe],
	templateUrl: "./app.html",
})
export class App {
	public isVisibleSidebar = signal<boolean>(false);
	public isCollapsed = signal<boolean>(false);
	public readonly globalTermService = inject(GlobalTermService);
	public readonly globalMenuService = inject(GlobalMenuService);
	public selectedProduct = this.globalMenuService.selectedProduct;
	constructor() {
		effect(() => {
			if (this.globalTermService.TermsReady()) {
				(window as any).__intelicaReady$?.next("@Intelica/IntelicaMenuWeb");
			}
		});
		this.globalTermService.Initialize("Menu");
		this.globalMenuService.initialize();
		history.replaceState({ ...history.state, menuVisible: true }, "");
		// effect(() => {
		// 	const isVisible = this.globalMenuService.isMenuVisible();
		// 	history.replaceState({ ...history.state, menuVisible: isVisible }, "");
		// 	console.log(`[x] - El estado cambio a:  ${isVisible}`);
		// });
		const destroyRef = inject(DestroyRef);
		const onPopState = (event: PopStateEvent) => {
			if (event.isTrusted) {
				this.globalMenuService.setMenuVisibility(event.state?.menuVisible ?? true);
				console.log(`[x] - Se recupero el estado: ${event.state?.menuVisible} `);
			}
		};
		window.addEventListener("popstate", onPopState);
		destroyRef.onDestroy(() => window.removeEventListener("popstate", onPopState));
		const onRouting = () => {
			const isVisible = this.globalMenuService.isMenuVisible();
			if (history.state?.menuVisible !== isVisible) {
				history.replaceState({ ...history.state, menuVisible: isVisible }, "");
				console.log(`[x] - Se re-estampo el estado tras navegar: ${isVisible}`);
			}
		};
		window.addEventListener("single-spa:routing-event", onRouting);
		destroyRef.onDestroy(() => window.removeEventListener("single-spa:routing-event", onRouting));
	}
	public CollapsedSidebar(active: boolean) {
		this.isCollapsed.set(active);
	}

	// toolltip en titulo producto
	isTextOverflow = false;

	checkTextOverflow(element: HTMLElement): void {
		this.isTextOverflow = element.scrollWidth > element.clientWidth;
	}
}
