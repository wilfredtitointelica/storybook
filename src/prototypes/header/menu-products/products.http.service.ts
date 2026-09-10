import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { ConfigService, GlobalMenuService } from 'intelica-library-base';
import { Observable } from 'rxjs';
import { MenuOptionResponse, MenuProductResponse } from './dto/product.response';

@Injectable({
  providedIn: 'root',
})
export class ProductsHttpService {
  private readonly httpClient = inject(HttpClient);
  private readonly configService = inject(ConfigService);
  private readonly globalMenuService = inject(GlobalMenuService);
  private readonly path = `${this.configService.environment?.securityPath}/menu`;
  private readonly _productList = signal<MenuProductResponse[]>([]);
  public readonly productList = this._productList.asReadonly();
  private getAllProducts(): Observable<MenuProductResponse[]> {
    return this.httpClient.get<MenuProductResponse[]>(`${this.path}/products`);
  }
  getAllMenuOption(menuOptionId: string): Observable<MenuOptionResponse[]> {
    return this.httpClient.get<MenuOptionResponse[]>(`${this.path}/sub-menu/${menuOptionId}`);
  }
  constructor() {
    this.getAllProducts().subscribe({
      next: (products) => this._productList.set(products ?? []),
      error: () => this._productList.set([]),
      complete: () => {
        const firtProducts = this.productList()[0];
        this.globalMenuService.setSelectedProduct({
          product: firtProducts.termName,
          icon: firtProducts.icon,
          productId: firtProducts.menuOptionId,
          isBeta: firtProducts.isBeta,
          isLegacy: firtProducts.isLegacy,
        });
      },
    });
  }
}
