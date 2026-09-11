// Reemplazos del MenuHttpService y de los servicios globales de menú/favoritos:
// mismos métodos/API pública, sin HttpClient, devuelven fixtures fijas.
import { signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { menuOptions, favoritesData } from './menu.data';

// getAllMenuOption SÍ se delaya: MenuSidebar (mirrors/menu/menu/menu.ts) tiene un `isLoading`
// signal real que gatilla los <p-skeleton> del sidebar (skeletonRows) mientras espera la respuesta.
export function createMockMenuHttpService() {
  return {
    getAllMenuOption: () => delayedOf(menuOptions),
    getURLPortal: () => of(''),
  };
}

// Nota: GlobalMenuService de Header sigue en intelica-library-base — usar
// createMockGlobalMenuServiceBase() de mocks/header/menu-products.mocks.ts para ambos. Menu
// (mirrors/menu/menu/menu.ts, Actual) migró su import a intelica-library-components; el mismo mock
// se comparte con ese token vía un alias `useExisting` en shell.ts (shellProviders), no acá.

// Reemplazo reactivo (real signal, no una función fija) de GlobalFavoriteService: además de
// alimentar el listado de favoritos del sidebar, sirve de base para AddFavoritesService
// (intelica-library-project), que usa favoritesChanges()/isFavoriteByPageRoot()/create()/
// removeFavoriteByPageRoot() cuando una pantalla (ej. Fee Library) tiene el botón
// "Add/Remove from favorites". Como es el mismo signal, marcar/desmarcar favorito en una pantalla
// se refleja también en el listado de favoritos del sidebar — igual que en producción.
// `currentPage` describe la pantalla que monta este shell (ej. Fee Library), porque la llamada real
// AddFavoritesService.addPageToFavorites() -> GlobalFavoriteService.create() no recibe parámetros:
// en producción el backend infiere "la página actual" del contexto de la request. Acá no hay
// backend, así que el mock necesita que se le diga de antemano a qué página agregar el favorito.
export function createMockGlobalFavoriteService(currentPage?: { pageName: string; pageUrl: string; pageRoot: string }) {
  const _favorites = signal([...favoritesData]);
  return {
    favorites: () => _favorites(),
    favoritesChanges: () =>
      new Observable<typeof favoritesData>(subscriber => {
        subscriber.next(_favorites());
        const id = setInterval(() => subscriber.next(_favorites()), 250);
        return () => clearInterval(id);
      }),
    isFavoriteByPageRoot: (pageRoot: string) => _favorites().some(item => item.pageRoot === pageRoot),
    create: () => {
      if (currentPage && !_favorites().some(item => item.pageRoot === currentPage.pageRoot)) {
        _favorites.set([..._favorites(), { ...currentPage, authenticationClientID: 'ExternalNew' }]);
      }
      return of(void 0);
    },
    removeFavoriteByPageRoot: (pageRoot: string) => {
      _favorites.set(_favorites().filter(item => item.pageRoot !== pageRoot));
      return of(void 0);
    },
  };
}

export function createMockStatusLastUpdateHttpService() {
  return {
    getLastBrandUpdates: () => of([]),
  };
}
