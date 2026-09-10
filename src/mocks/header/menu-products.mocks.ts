// Reemplazo del ProductsHttpService: misma API pública (productList como signal + getAllMenuOption),
// sin HttpClient, devuelve fixtures fijas.
import { signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { menuProducts } from './menu-products.data';

export function createMockProductsHttpService() {
  return {
    productList: () => menuProducts,
    getAllMenuOption: () => of([]),
  };
}

// `isMenuVisible` es un signal real (no un `() => true` fijo) porque el Header real
// (mirrors/header/app.ts) llama `setMenuVisibility(false)` en su constructor cuando
// `window.location.pathname` es '/fee/alerts' o '/fee/filesharing' — y `MenuApp`
// (mirrors/menu/app.html) ya envuelve TODO su contenido en `@if (... && isMenuVisible())`,
// así que el sidebar se auto-oculta en esas 2 pantallas en producción real.
//
// PERO ese chequeo de Header (mirrors/header/app.ts, sin editar) corre UNA sola vez, en su
// constructor — en producción real eso alcanza porque Header es un microfrontend separado que
// vuelve a montarse (y volver a evaluar `hideMenu`) cada vez que el CONTENEDOR cruza un límite de
// ruta real. Acá, al combinar Header + Menu + todos los módulos en una sola app de Storybook con UN
// solo Router, Header se monta UNA vez por story y el usuario puede navegar libremente entre rutas
// (ej. Security/Account Settings -> "Productos" del header -> de vuelta a Fee/Landing) sin que
// Header se reconstruya — un `initialVisible`/lock fijo por story se queda pegado en el estado de
// la PRIMERA ruta para siempre, escondiendo el sidebar incluso al volver a un módulo de Fee (bug
// real, reportado). Por eso este mock NO decide la visibilidad una sola vez: se suscribe a
// `router.events` y la recalcula en CADA `NavigationEnd`, así queda siempre en sync con la ruta
// activa — oculto en `FORCE_MENU_HIDDEN_PREFIXES`, visible en cualquier otra (todos los módulos de
// Fee Manager). `setMenuVisibility(true)` explícito (ej. click en el logo del header,
// `showGlobalMenu()`) se sigue respetando salvo que la ruta activa esté forzada a oculto.
//
// `router` es opcional: las stories que muestran Header/Menu aislados (Header/Header Bar,
// Header/Menu Products, Menu/Sidebar) llaman esto sin Router — ahí no hace falta esta lógica
// por-ruta, se comporta igual que antes (siempre visible, sin reactividad).
//
// NO incluye '/fee/filesharing' aunque el Header real (mirrors/header/app.ts) sí lo oculta ahí —
// el usuario pidió explícitamente, al inicio de este proyecto (antes de saber que producción lo
// oculta), que File Sharing mantenga el sidebar visible en el showcase. Ver README.md.
const FORCE_MENU_HIDDEN_PREFIXES = ['/fee/alerts', '/security/settings'];

export function createMockGlobalMenuServiceBase(router?: Router, productId = 'FEE') {
  const isForceHiddenRoute = () => !!router && FORCE_MENU_HIDDEN_PREFIXES.some(prefix => router.url.startsWith(prefix));
  const visible = signal(!isForceHiddenRoute());
  router?.events.subscribe(event => {
    if (event instanceof NavigationEnd) visible.set(!isForceHiddenRoute());
  });
  return {
    selectedProduct: () => ({ product: 'Fee Manager', icon: 'icon-fee-manager', productId, isLegacy: false, isBeta: true }),
    isMenuVisible: visible,
    setMenuVisibility: (isVisible: boolean) => {
      if (isForceHiddenRoute() && isVisible) return;
      visible.set(isVisible);
    },
    setSelectedProduct: () => {},
    initialize: () => {},
  };
}
