import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnDestroy, output, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  GlobalFavoriteService,
  GlobalMenuService,
  GlobalTermService,
  TermPipe,
} from 'intelica-library-base';
import { MenuItem } from 'primeng/api';
import { PanelMenu } from 'primeng/panelmenu';
import { Tooltip } from 'primeng/tooltip';
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { toObservable } from '@angular/core/rxjs-interop';
import { finalize, Subscription, distinctUntilChanged, map } from 'rxjs';
import { MenuOptionResponse } from './dto/menu-responses';
import { MenuHttpService } from './menu-http.service';

@Component({
  selector: 'menu-sidebar',
  imports: [PanelMenu, CommonModule, RouterLink, RouterLinkActive, Tooltip, Button, Skeleton],
  templateUrl: './menu.html',
})
export class MenuSidebar implements OnDestroy {
  public styleClass = input<string>('');
  public collapsed = input<boolean>(false);
  public openSidebar = output<boolean>();
  public isLoading = signal<boolean>(false);
  private prevCollapsed: boolean | null = null;
  public skeletonRows = [1, 2, 3, 4, 5, 6, 7, 8];
  public globalTermService = inject(GlobalTermService);
  private globalMenuService = inject(GlobalMenuService);
  private termPipe = inject(TermPipe);
  private menuService = inject(MenuHttpService);
  private favoriteService = inject(GlobalFavoriteService);
  private router = inject(Router);
  private menuSubs$?: Subscription;
  // CAMBIO:
  // Antes mainMenuItems era signal<MenuItem[]>
  // Ahora usamos un array normal para evitar recreaciones reactivas
  // que hacían perder el estado interno del PanelMenu.
  private mainMenuItems: MenuItem[] = [];
  // CAMBIO:
  // Antes menuItems era computed<MenuItem[]>
  // Ahora es un array mutable estable.
  // PrimeNG mantiene mejor el estado expanded/collapsed
  // cuando las referencias son estables.
  public menuItems: MenuItem[] = [];
  // CAMBIO IMPORTANTE:
  // Este objeto se crea UNA sola vez.
  // Antes Favorites se recreaba constantemente
  // causando pérdida de estado visual.
  private readonly favoriteMenuItem: MenuItem = {
    label: 'Favorites',
    icon: 'icon icon-favorites-off',
    items: [],
    styleClass: 'favorites',
  };
  constructor() {
    this.effectGetMenu();
    // CAMBIO:
    // Nuevo efecto separado únicamente para sincronizar favoritos
    // sin reconstruir todo el árbol del menú.
    this.effectSyncFavorites();
    this.effectCollapsedBehavior();
  }
  private effectGetMenu(): void {
    toObservable(this.globalMenuService.selectedProduct)
      .pipe(
        map((p) => p.productId),
        distinctUntilChanged(), // 👈 ignora si el valor es el mismo
      )
      .subscribe((menuProductId) => {
        if (!menuProductId) {
          this.mainMenuItems = [];
          this.menuItems = [];
          this.isLoading.set(false);
          return;
        }
        this.getMenuItems(menuProductId);
      });
  }
  // NUEVO:
  // Este efecto escucha cambios en favoritos y solamente
  // actualiza los items internos de Favorites.
  // NO reconstruye el objeto favoriteMenuItem.
  private effectSyncFavorites(): void {
    effect(() => {
      const favorites = this.favoriteService.favorites().map((f) => {
        const isNew = ['ExternalNew', 'InternalNew'].some((id) => id === f.authenticationClientID);
        return {
          label: this.termPipe.transform(f.pageName),
          routerPath: isNew ? f.pageUrl : null,
          url: isNew ? undefined : f.url,
        };
      });
      // CAMBIO CLAVE:
      // Solo mutamos items.
      // No recreamos el objeto Favorites.
      this.favoriteMenuItem.items = favorites;
      this.syncFavoriteSection();
    });
  }
  private effectCollapsedBehavior(): void {
    effect(() => {
      const isCollapsed = this.collapsed();
      if (this.prevCollapsed === isCollapsed) return;
      this.prevCollapsed = isCollapsed;
      if (isCollapsed) {
        this.mainMenuItems = this.mainMenuItems.map((item) => this.closeAll(item));
        // CAMBIO:
        // Se mantiene comportamiento original del collapse
        // también para Favorites.
        if (this.favoriteMenuItem.items?.length) this.favoriteMenuItem.expanded = false;
        this.rebuildMenuItems();
        return;
      }
      setTimeout(() => {
        this.mainMenuItems = this.mainMenuItems.map((item) => this.openActive(item));
        this.rebuildMenuItems();
      }, 300);
    });
  }
  private getMenuItems(menuProductId: string): void {
    this.menuSubs$?.unsubscribe();
    this.isLoading.set(true);
    this.menuSubs$ = this.menuService
      .getAllMenuOption(menuProductId)
      .pipe(
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: (menu) => {
          this.mainMenuItems = this.mapToMenuItem(menu);
          this.rebuildMenuItems();
        },
        error: () => {
          this.mainMenuItems = [];
          this.rebuildMenuItems();
        },
      });
  }
  // NUEVO:
  // Método centralizado para reconstruir menuItems.
  // Mantiene estable favoriteMenuItem.
  private rebuildMenuItems(): void {
    if (this.favoriteMenuItem.items?.length) {
      this.menuItems = [...this.mainMenuItems, this.favoriteMenuItem];
      return;
    }
    this.menuItems = [...this.mainMenuItems];
  }
  // NUEVO:
  // Maneja únicamente la existencia visual de Favorites
  // sin recrear el objeto.
  private syncFavoriteSection(): void {
    const hasFavorites = (this.favoriteMenuItem.items?.length ?? 0) > 0;
    const hasFavoriteSection = this.menuItems.includes(this.favoriteMenuItem);
    if (hasFavorites && !hasFavoriteSection) {
      this.menuItems = [...this.mainMenuItems, this.favoriteMenuItem];
      return;
    }
    if (!hasFavorites && hasFavoriteSection) {
      this.menuItems = this.menuItems.filter((item) => item !== this.favoriteMenuItem);
      return;
    }
    // CAMBIO IMPORTANTE:
    // Reasignamos el array padre para disparar change detection
    // sin reemplazar favoriteMenuItem.
    if (hasFavoriteSection) {
      this.menuItems = [...this.menuItems];
      return;
    }
    this.menuItems = [...this.mainMenuItems];
  }
  private openActive(item: MenuItem): MenuItem {
    const newItem = { ...item };
    if (newItem.items) {
      newItem.items = newItem.items.map((child) => this.openActive(child));
      if (newItem.items.some((child) => this.isActive(child))) newItem.expanded = true;
    }
    return newItem;
  }
  private closeAll(item: MenuItem): MenuItem {
    const newItem = { ...item };
    newItem.expanded = false;
    if (newItem.items) newItem.items = newItem.items.map((child) => this.closeAll(child));
    return newItem;
  }
  private mapToMenuItem(response: MenuOptionResponse[]): MenuItem[] {
    const menu = response.map((menu) => this.toMenuItem(menu));
    return menu.flatMap((x) => x.items ?? []);
  }
  private toMenuItem(
    node: MenuOptionResponse,
    parentAuthenticationClientID: string | null = null,
  ): MenuItem {
    const hasChildren = (node.subMenuOptions?.length ?? 0) > 0;
    const item: MenuItem = {
      label: this.termPipe.transform(node.nameMenu),
      icon: node.icon,
    };
    if (hasChildren) {
      item.items = node.subMenuOptions!.map((child) =>
        this.toMenuItem(child, node.authenticationClientID ?? null),
      );
    } else {
      let differentParent = node.authenticationClientID !== parentAuthenticationClientID;
      if (differentParent) item.url = node.url;
      else item['routerPath'] = node.pageURL;
    }
    return item;
  }
  public EmitOpenSidebar(): void {
    if (this.collapsed()) this.openSidebar.emit(true);
  }
  public isActive(item: MenuItem): boolean {
    return this.router.url === item.url;
  }
  public checkTextOverflow(element: HTMLElement | null, item: MenuItem): void {
    if (!element) return;
    item['isTextOverflow'] = element.scrollWidth > element.clientWidth;
  }
  ngOnDestroy(): void {
    this.menuSubs$?.unsubscribe();
  }
}
