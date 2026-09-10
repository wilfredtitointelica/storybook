import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { GlobalMenuService, GlobalTermService, TermPipe } from 'intelica-library-base';
import { Button } from 'primeng/button';
import { Popover } from 'primeng/popover';
import { MenuOptionResponse, MenuProductResponse } from './dto/product.response';
import { ListItemDefault } from './list-item/list-item';
import { ProductsHttpService } from './products.http.service';
import { Router } from '@angular/router';
@Component({
  selector: 'menu-products',
  imports: [Button, TermPipe, Popover, ListItemDefault],
  templateUrl: './menu-products.html',
})
export class MenuProducts {
  public readonly globalTermService = inject(GlobalTermService);
  private readonly productService = inject(ProductsHttpService);
  private readonly globalMenuService = inject(GlobalMenuService);
  private readonly router = inject(Router);
  private readonly popover = viewChild.required<Popover>('popoverMenuProducts');
  public activeButton = signal<boolean>(false);
  public listProducts = this.productService.productList;
  public currentProductId = computed<string>(
    () => this.globalMenuService.selectedProduct().productId,
  );
  onSelectItem(item: MenuProductResponse) {
    console.log('Menu seleccionado -> ', item);
    this.globalMenuService.setSelectedProduct({
      product: item.termName,
      icon: item.icon,
      productId: item.menuOptionId,
      isLegacy: item.isLegacy,
      isBeta: item.isBeta,
    });
    this.popover().hide();
    this.productService
      .getAllMenuOption(item.menuOptionId)
      .subscribe((response: MenuOptionResponse[]) => {
        let path = response[0].subMenuOptions[0]?.pageURL;
        let url = response[0].subMenuOptions[0]?.url ?? '';
        let origin = window.location.origin;
        this.globalMenuService.setMenuVisibility(true);
        if (url.startsWith(origin)) this.router.navigate([path]);
        else {
          this.router.navigate(['/']);
          if (url != '') window.open(url, '_blank');
        }
      });
  }
}
