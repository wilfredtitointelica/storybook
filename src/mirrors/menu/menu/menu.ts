import { CommonModule } from "@angular/common";
import { Component, computed, effect, inject, input, OnDestroy, output, signal } from "@angular/core";
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { GlobalFavoriteService, GlobalMenuService, GlobalTermService, TermPipe } from "intelica-library-components";
import { MenuItem } from "primeng/api";
import { PanelMenu } from "primeng/panelmenu";
import { Tooltip } from "primeng/tooltip";
import { Skeleton } from "primeng/skeleton";
import { finalize, Subscription } from "rxjs";
import { MenuOptionResponse } from "./dto/menu-responses";
import { MenuHttpService } from "./menu-http.service";

@Component({
	selector: "menu-sidebar",
	imports: [PanelMenu, CommonModule, TermPipe, RouterLink, RouterLinkActive, Tooltip, Skeleton],
	templateUrl: "./menu.html",
})
export class MenuSidebar implements OnDestroy {
	public styleClass = input<string>("");
	public collapsed = input<boolean>(false);
	public openSidebar = output<boolean>();
	public isLoading = signal<boolean>(false);
	private prevCollapsed: boolean | null = null;
	public skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];

	public globalTermService = inject(GlobalTermService);

	private globalMenuService = inject(GlobalMenuService);
	private menuService = inject(MenuHttpService);
	private favoriteService = inject(GlobalFavoriteService);

	private menuProduct = computed<string>(() => this.globalMenuService.selectedProduct().productId);
	private menuSubs$?: Subscription;

	private mainMenuItems = signal<MenuItem[]>([]);
	private favoritesItems = computed<MenuItem[]>(() => {
		const fav = this.favoriteService.favorites().map(f => ({
			label: f.pageName,
			url: f.pageUrl,
		}));
		return fav;
	});

	private favoriteMenuItems = computed<MenuItem>(() => ({
		label: "Favorites",
		icon: "icon icon-favorites-off",
		items: this.favoritesItems(),
		styleClass: "favorites",
	}));

	public menuItems = computed<MenuItem[]>(() => {
		if (this.favoritesItems().length === 0) {
			return [...this.mainMenuItems()];
		}
		return [...this.mainMenuItems(), this.favoriteMenuItems()];
	});

	constructor() {
		this.effectGetMenu();

		effect(() => {
			const isCollapsed = this.collapsed();
			if (this.prevCollapsed === isCollapsed) return;
			this.prevCollapsed = isCollapsed;
			if (isCollapsed) {
				const updated = this.mainMenuItems().map(item => this.closeAll(item));
				this.mainMenuItems.set(updated);
			} else {
				setTimeout(() => {
					const updated = this.mainMenuItems().map(item => this.openActive(item));
					this.mainMenuItems.set(updated);
				}, 300);
			}
		});
	}
	private openActive(item: MenuItem): MenuItem {
		const newItem = { ...item };
		if (newItem.items) {
			newItem.items = newItem.items.map(child => this.openActive(child));
			if (newItem.items.some(child => this.isActive(child))) {
				newItem.expanded = true;
			}
		}
		return newItem;
	}
	private closeAll(item: MenuItem): MenuItem {
		const newItem = { ...item };
		newItem.expanded = false;
		if (newItem.items) {
			newItem.items = newItem.items.map(child => this.closeAll(child));
		}
		return newItem;
	}

	public EmitOpenSidebar() {
		if (this.collapsed()) this.openSidebar.emit(true);
	}

	ngOnDestroy(): void {
		this.menuSubs$?.unsubscribe();
	}

	private effectGetMenu() {
		effect(() => {
			const menuProductId = this.menuProduct();
			if (!menuProductId) {
				this.menuSubs$?.unsubscribe();
				this.mainMenuItems.set([]);
				this.isLoading.set(false);
				return;
			}
			this.getMenuItems(menuProductId);
		});
	}

	private getMenuItems(menuProductId: string) {
		this.menuSubs$?.unsubscribe();
		this.isLoading.set(true);
		this.menuSubs$ = this.menuService
			.getAllMenuOption(menuProductId)
			.pipe(
				finalize(() => {
					this.isLoading.set(false);
				})
			)
			.subscribe({
				next: menu => this.mainMenuItems.set(this.mapToMenuItem(menu)),
				error: () => this.mainMenuItems.set([]),
			});
	}

	private mapToMenuItem(response: MenuOptionResponse[]): MenuItem[] {
		const menu = response.map(menu => this.toMenuItem(menu));
		return menu.flatMap(x => x.items ?? []);
	}

	private toMenuItem(node: MenuOptionResponse): MenuItem {
		const hasChildren = (node.subMenuOptions?.length ?? 0) > 0;

		const item: MenuItem = {
			label: node.nameMenu,
			icon: node.icon,
		};

		if (hasChildren) {
			item.items = node.subMenuOptions!.map(child => this.toMenuItem(child));
		} else {
			item.url = node.pageURL;
		}

		return item;
	}
	// --- route active ---
	private router = inject(Router);
	isActive(item: MenuItem): boolean {
		return this.router.url === item.url;
	}
	// --- text tootlip ---
	isTextOverflow = false;
	checkTextOverflow(element: HTMLElement | null): void {
		if (!element) return;
		this.isTextOverflow = element.scrollWidth > element.clientWidth;
	}
}
