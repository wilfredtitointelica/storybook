// Shell reutilizable: header (arriba) + sidebar (al lado), igual que en producción
// (IntelicaContainerExternal/src/microfrontend-layout.html -> lyDashboard/lyDashboard__header/
// lyDashboard__sidebar/lyDashboard__main). Cualquier story de un módulo (File Sharing, y los que
// sigan) debe montar su pantalla real DENTRO de este shell en vez de renderizarla sola, porque en
// producción ninguna pantalla se ve nunca sin el header y el sidebar alrededor.
import type { Provider, Type } from '@angular/core';
import { Component, inject } from '@angular/core';
import type { Route } from '@angular/router';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { ConfigService, GlobalTermService, GlobalMenuService, GlobalFavoriteService, AlertService, TermPipe, PageRootChildGuard } from 'intelica-library-base';
import { NotificationOrchestratorService } from 'intelica-library-notification';
// mirrors/menu/menu/menu.ts y menu-http.service.ts (Actual) migraron a 'intelica-library-components'
// en el repo real (menu.new), pero el resto del showcase (Header/Fee/Security, y también
// prototypes/menu/menu/menu.ts) sigue en 'intelica-library-base' — migración real a medias todavía
// en el repo de Menu (mirrors/menu/app.ts y status-last-update/* del MISMO repo siguen en base). Son
// paquetes/clases distintas para Angular DI aunque compartan nombre: sin un provider explícito para
// estos tokens, MenuSidebar (Actual) construiría las clases REALES de intelica-library-components
// (providedIn: 'root') en vez de los mocks — eso sí puede pegarle a un backend real. Los alias
// `useExisting` de más abajo apuntan al mismo mock ya usado para el token de 'intelica-library-base',
// así Header y Menu siguen compartiendo el mismo estado (favoritos, producto seleccionado) que antes.
import {
  ConfigService as ConfigServiceComponents,
  GlobalMenuService as GlobalMenuServiceComponents,
  GlobalFavoriteService as GlobalFavoriteServiceComponents,
  GlobalTermService as GlobalTermServiceComponents,
} from 'intelica-library-components';
import { setCookie } from 'typescript-cookie';
import { activeClientID } from '../mocks/header/user-profile.data';
import { createMockConfigService, createMockGlobalTermService } from '../mocks/shared.mocks';
import { createMockGlobalMenuServiceBase, createMockProductsHttpService } from '../mocks/header/menu-products.mocks';
import { createMockUserProfileHttpService, createMockNotificationOrchestratorService, createMockSearchService } from '../mocks/header/header.mocks';
import { createMockSessionInactivityService } from '../mocks/header/session-inactivity.mocks';
import { createMockMenuHttpService, createMockGlobalFavoriteService, createMockStatusLastUpdateHttpService } from '../mocks/menu/menu.mocks';

import { SessionInactivityService as SessionInactivityServiceActual } from '../mirrors/header/common/service/session-inactivity.service';
import { SessionInactivityService as SessionInactivityServicePropuesta } from '../prototypes/header/common/service/session-inactivity.service';

import { App as HeaderAppActual } from '../mirrors/header/app';
import { ProductsHttpService as ProductsHttpServiceActual } from '../mirrors/header/menu-products/products.http.service';
import { UserProfileHttpService as UserProfileHttpServiceActual } from '../mirrors/header/user-profile/user-profile.http.service';
import { SearchService as SearchServiceActual } from '../mirrors/header/search-main/search.service';
import { App as MenuAppActual } from '../mirrors/menu/app';
import { MenuHttpService as MenuHttpServiceActual } from '../mirrors/menu/menu/menu-http.service';
import { StatusLastUpdateHttpService as StatusLastUpdateHttpServiceActual } from '../mirrors/menu/status-last-update/status-last-update.service';

import { App as HeaderAppPropuesta } from '../prototypes/header/app';
import { ProductsHttpService as ProductsHttpServicePropuesta } from '../prototypes/header/menu-products/products.http.service';
import { UserProfileHttpService as UserProfileHttpServicePropuesta } from '../prototypes/header/user-profile/user-profile.http.service';
import { SearchService as SearchServicePropuesta } from '../prototypes/header/search-main/search.service';
import { App as MenuAppPropuesta } from '../prototypes/menu/app';
import { MenuHttpService as MenuHttpServicePropuesta } from '../prototypes/menu/menu/menu-http.service';
import { StatusLastUpdateHttpService as StatusLastUpdateHttpServicePropuesta } from '../prototypes/menu/status-last-update/status-last-update.service';

// Módulos ruteables (los mismos para cualquier story que use el shell): así el sidebar/header
// navega de verdad sin importar desde qué story arrancó (Fee/File Sharing, Fee/Library o
// Layout/Full Page) — antes solo Layout/Full Page tenía `provideRouter`, así que en las demás
// stories el <RouterLink> del sidebar/header no tenía ningún Router inyectable y fallaba.
import { FileSharingComponent as FileSharingActual } from '../mirrors/fee/file-sharing/file-sharing.component';
import { FileSharingService as FileSharingServiceActual } from '../mirrors/fee/file-sharing/file-sharing.service';
import { FileSharingComponent as FileSharingPropuesta } from '../prototypes/fee/file-sharing/file-sharing.component';
import { FileSharingService as FileSharingServicePropuesta } from '../prototypes/fee/file-sharing/file-sharing.service';
import { createMockFileSharingService } from '../mocks/fee/file-sharing.mocks';

import { Library as LibraryActual } from '../mirrors/fee/library/library';
import { LibraryService as LibraryServiceActual } from '../mirrors/fee/library/library.service';
import { Library as LibraryPropuesta } from '../prototypes/fee/library/library';
import { LibraryService as LibraryServicePropuesta } from '../prototypes/fee/library/library.service';
import { createMockLibraryService } from '../mocks/fee/library.mocks';

import { FeeUpdatesComponent as FeeUpdatesActual } from '../mirrors/fee/fee-updates/fee-updates';
import { FeeUpdatesService as FeeUpdatesServiceActual } from '../mirrors/fee/fee-updates/fee-updates.service';
import { FeeUpdatesComponent as FeeUpdatesPropuesta } from '../prototypes/fee/fee-updates/fee-updates';
import { FeeUpdatesService as FeeUpdatesServicePropuesta } from '../prototypes/fee/fee-updates/fee-updates.service';
import { createMockFeeUpdatesService } from '../mocks/fee/fee-updates.mocks';

import { AlertsComponent as AlertsActual } from '../mirrors/fee/alerts/alerts.component';
import { AlertsService as AlertsServiceActual } from '../mirrors/fee/alerts/alerts.service';
import { AlertsComponent as AlertsPropuesta } from '../prototypes/fee/alerts/alerts.component';
import { AlertsService as AlertsServicePropuesta } from '../prototypes/fee/alerts/alerts.service';
import { createMockAlertsService } from '../mocks/fee/alerts.mocks';

import { FeeDetailComponent as FeeDetailActual } from '../mirrors/fee/fee-detail/fee-detail';
import { FeeDetailService as FeeDetailServiceActual } from '../mirrors/fee/fee-detail/fee-detail.service';
import { CustomConfigurationService as CustomConfigurationServiceActual } from '../mirrors/fee/fee-detail/modal-set-alert/custom-configuration.service';
import { FeeDetailComponent as FeeDetailPropuesta } from '../prototypes/fee/fee-detail/fee-detail';
import { FeeDetailService as FeeDetailServicePropuesta } from '../prototypes/fee/fee-detail/fee-detail.service';
import { CustomConfigurationService as CustomConfigurationServicePropuesta } from '../prototypes/fee/fee-detail/modal-set-alert/custom-configuration.service';
import { createMockCustomConfigurationService, createMockFeeDetailService } from '../mocks/fee/fee-detail.mocks';

import { OptOutService as OptOutServiceActual } from '../mirrors/fee/opt-out-service/opt-out-service';
import { OptOutServicesDashboard as OptOutDashboardActual } from '../mirrors/fee/opt-out-service/components/opt-out-services-dashboard/opt-out-services-dashboard';
import { TopOptOutSubscriptions as OptOutTopSubscriptionsActual } from '../mirrors/fee/opt-out-service/components/top-opt-out-subscriptions/top-opt-out-subscriptions';
import { OptOutSavings as OptOutSavingsActual } from '../mirrors/fee/opt-out-service/components/opt-out-savings/opt-out-savings';
import { UpcomingOptOuts as OptOutUpcomingActual } from '../mirrors/fee/opt-out-service/components/upcoming-opt-outs/upcoming-opt-outs';
import { OptOutServicesService as OptOutServicesServiceActual } from '../mirrors/fee/opt-out-service/opt-out-service.service';

import { OptOutService as OptOutServicePropuesta } from '../prototypes/fee/opt-out-service/opt-out-service';
import { OptOutServicesDashboard as OptOutDashboardPropuesta } from '../prototypes/fee/opt-out-service/components/opt-out-services-dashboard/opt-out-services-dashboard';
import { TopOptOutSubscriptions as OptOutTopSubscriptionsPropuesta } from '../prototypes/fee/opt-out-service/components/top-opt-out-subscriptions/top-opt-out-subscriptions';
import { OptOutSavings as OptOutSavingsPropuesta } from '../prototypes/fee/opt-out-service/components/opt-out-savings/opt-out-savings';
import { UpcomingOptOuts as OptOutUpcomingPropuesta } from '../prototypes/fee/opt-out-service/components/upcoming-opt-outs/upcoming-opt-outs';
import { OptOutServicesService as OptOutServicesServicePropuesta } from '../prototypes/fee/opt-out-service/opt-out-service.service';
import { createMockOptOutServiceService } from '../mocks/fee/opt-out-service.mocks';

import { TpeComponent as TpeComponentActual } from '../mirrors/fee/tpe/tpe.component';
import { TpeDashboard as TpeDashboardActual } from '../mirrors/fee/tpe/tpe-dashboard/tpe-dashboard.component';
import { TpePenaltiesPaid as TpePenaltiesPaidActual } from '../mirrors/fee/tpe/tpe-penalties-paid/tpe-penalties-paid.component';
import { TpeMerchantReport as TpeMerchantReportActual } from '../mirrors/fee/tpe/tpe-merchant-report/tpe-merchant-report.component';
import { TpeRecomendations as TpeRecomendationsActual } from '../mirrors/fee/tpe/tpe-recomendations/tpe-recomendations.component';
import { TpeService as TpeServiceActual } from '../mirrors/fee/tpe/tpe.service';

import { TpeComponent as TpeComponentPropuesta } from '../prototypes/fee/tpe/tpe.component';
import { TpeDashboard as TpeDashboardPropuesta } from '../prototypes/fee/tpe/tpe-dashboard/tpe-dashboard.component';
import { TpePenaltiesPaid as TpePenaltiesPaidPropuesta } from '../prototypes/fee/tpe/tpe-penalties-paid/tpe-penalties-paid.component';
import { TpeMerchantReport as TpeMerchantReportPropuesta } from '../prototypes/fee/tpe/tpe-merchant-report/tpe-merchant-report.component';
import { TpeRecomendations as TpeRecomendationsPropuesta } from '../prototypes/fee/tpe/tpe-recomendations/tpe-recomendations.component';
import { TpeService as TpeServicePropuesta } from '../prototypes/fee/tpe/tpe.service';
import { createMockTpeService } from '../mocks/fee/tpe.mocks';

import { LandingDashboard as LandingDashboardActual } from '../mirrors/fee/landing/components/landing-dashboard/landing-dashboard';
import { LandingService as LandingServiceActual } from '../mirrors/fee/landing/landing.service';
import { LandingDashboard as LandingDashboardPropuesta } from '../prototypes/fee/landing/components/landing-dashboard/landing-dashboard';
import { LandingService as LandingServicePropuesta } from '../prototypes/fee/landing/landing.service';
import { createMockLandingService } from '../mocks/fee/landing.mocks';

// Security / Account Settings ("Configuración") — se llega acá desde el popover de user-profile
// del Header (botón "Configuración" -> onSettings() -> navigateToUrl('/security/settings/profile'),
// código real sin editar), interceptado por el shim de pushState de más abajo. adminGuard es real
// (mirrors/security/common/guards/admin.guard.ts, CanActivateFn) y NO tiene variante
// Actual/Propuesta — se comparte igual que PageRootChildGuard.
import { AccountSettingsComponent as AccountSettingsActual } from '../mirrors/security/account-settings/account-settings.component';
import { ProfileComponent as ProfileActual } from '../mirrors/security/account-settings/profile/profile.component';
import { SecurityComponent as SecurityActual } from '../mirrors/security/account-settings/security/security.component';
import { NotificationsComponent as NotificationsActual } from '../mirrors/security/account-settings/notifications/notifications.component';
import { TeamsComponent as TeamsActual } from '../mirrors/security/account-settings/teams/teams.component';
import { ProfileService as ProfileServiceActual } from '../mirrors/security/account-settings/profile/profile.service';
import { SecurityService as SecurityServiceActual } from '../mirrors/security/account-settings/security/security.service';
import { TeamsService as TeamsServiceActual } from '../mirrors/security/account-settings/teams/teams.service';
import { NotificationsService as NotificationsServiceActual } from '../mirrors/security/account-settings/notifications/notifications.service';

import { AccountSettingsComponent as AccountSettingsPropuesta } from '../prototypes/security/account-settings/account-settings.component';
import { ProfileComponent as ProfilePropuesta } from '../prototypes/security/account-settings/profile/profile.component';
import { SecurityComponent as SecurityPropuesta } from '../prototypes/security/account-settings/security/security.component';
import { NotificationsComponent as NotificationsPropuesta } from '../prototypes/security/account-settings/notifications/notifications.component';
import { TeamsComponent as TeamsPropuesta } from '../prototypes/security/account-settings/teams/teams.component';
import { ProfileService as ProfileServicePropuesta } from '../prototypes/security/account-settings/profile/profile.service';
import { SecurityService as SecurityServicePropuesta } from '../prototypes/security/account-settings/security/security.service';
import { TeamsService as TeamsServicePropuesta } from '../prototypes/security/account-settings/teams/teams.service';
import { NotificationsService as NotificationsServicePropuesta } from '../prototypes/security/account-settings/notifications/notifications.service';

import { adminGuard } from '../mirrors/security/common/guards/admin.guard';
import { createMockProfileService, createMockSecurityService, createMockTeamsService, createMockNotificationsService } from '../mocks/security/account-settings.mocks';

// Preselecciona el perfil/cliente activo en el switcher del header (igual que en producción).
setCookie('defaultClientID', activeClientID);

// `mirrors/security/common/session/session.service.ts` (SessionService, real, sin editar) lee la
// sesión activa directo de la cookie "data" (no de ConfigService) — la usan las pantallas de
// Security/Account Settings para saber qué businessUserID pedir y si isAdmin (muestra o esconde el
// tab "Teams"). Mismo demo user que el resto del showcase (Wilfredo Tito, @intelica.com, ver
// `businessuserTypeName: 'Intelica'` en `defaultShellConfigOverrides` más abajo) — isAdmin:true para
// que el tab Teams se vea en la demo.
export const activeBusinessUserID = 'usr-001-wilfredo-tito';
setCookie(
  'data',
  encodeURIComponent(
    JSON.stringify({
      name: 'Wilfredo',
      fullName: 'Wilfredo Tito',
      email: 'wilfredo.tito@intelica.com',
      businessUserID: activeBusinessUserID,
      isAdmin: true,
      businessuserTypeName: 'Intelica',
      callBack: '',
      isGroup: false,
      isInternal: true,
      clientGroupID: activeClientID,
      callBackSecurityQuestions: '',
      callBackLink: '',
      organizationName: 'Intelica',
    }),
  ),
);

// Coincide con `data.pageRoot` de la ruta real de Library (ver app.routes.ts) — lo usa
// AddFavoritesService (intelica-library-project) para saber a qué página agregar/quitar favorito.
export const libraryPageRoot = 'library-migration';

export type ShellVariant = 'actual' | 'propuesta';

const shellClasses = {
  actual: {
    HeaderApp: HeaderAppActual,
    MenuApp: MenuAppActual,
    ProductsHttpService: ProductsHttpServiceActual,
    UserProfileHttpService: UserProfileHttpServiceActual,
    SearchService: SearchServiceActual,
    MenuHttpService: MenuHttpServiceActual,
    StatusLastUpdateHttpService: StatusLastUpdateHttpServiceActual,
  },
  propuesta: {
    HeaderApp: HeaderAppPropuesta,
    MenuApp: MenuAppPropuesta,
    ProductsHttpService: ProductsHttpServicePropuesta,
    UserProfileHttpService: UserProfileHttpServicePropuesta,
    SearchService: SearchServicePropuesta,
    MenuHttpService: MenuHttpServicePropuesta,
    StatusLastUpdateHttpService: StatusLastUpdateHttpServicePropuesta,
  },
} as const;

// En producción, Header y cada módulo (ej. File Sharing) son apps Angular separadas (microfrontends
// distintos vía single-spa), cada una con su propio árbol de inyección. Acá las combinamos en una
// sola app para la demo, así que sin este boundary comparten el mismo ConfirmationService/AlertService
// globales — eso hace que el <intelica-alert> del Header y el de File Sharing (ambos con el mismo
// key "intelica-alert-dialog") reaccionen a la vez a un solo confirm(): se abren dos diálogos
// duplicados y al hacer clic solo se cierra el que clickeaste, el otro queda "pegado" en pantalla.
// Proveer ConfirmationService/AlertService de nuevo acá crea instancias propias para todo lo que
// se monte dentro de <showcase-module-boundary>, aislándolo del ConfirmationService del Header.
// Header/User Profile ("onSettings()") y Header/Notification Bell Admin navegan a la app de Security
// ("/security/settings/profile", "/security/settings/teams") vía `navigateToUrl` de 'single-spa' —
// código real, sin editar (mirrors/header/user-profile/user-profile.ts,
// mirrors/header/notification-bell/notification-bell-admin/notification-bell-admin.ts). En
// producción, single-spa (que este showcase NO inicializa) intercepta esos cambios de URL y monta la
// otra microfrontend. Revisando el código fuente de single-spa (node_modules/single-spa), cuando el
// host no cambia pero el pathname sí, `navigateToUrl` termina llamando literalmente a
// `window.history.pushState(null, null, url)` y nada más — por eso acá interceptamos ESE único punto
// (no `addEventListener`/`popstate`, que es lo que single-spa sí parchea globalmente si se llama a su
// `start()`, cosa que nunca hacemos) y lo reenviamos al `Router` de Angular de la story activa, solo
// para las URLs de Security ya usadas en el código real. Nada de esto toca mirrors/ ni prototypes/.
let historyPatchedForShowcase = false;

@Component({
  selector: 'showcase-module-boundary',
  standalone: true,
  providers: [ConfirmationService, AlertService],
  template: `<ng-content></ng-content>`,
})
export class ModuleBoundary {
  constructor() {
    if (historyPatchedForShowcase) return;
    historyPatchedForShowcase = true;
    const router = inject(Router);
    const originalPushState = window.history.pushState.bind(window.history);
    window.history.pushState = (data: unknown, unused: string, url?: string | URL | null) => {
      const path = typeof url === 'string' ? url : url?.toString();
      if (path?.startsWith('/security/settings')) {
        router.navigateByUrl(path);
        return;
      }
      originalPushState(data, unused, url);
    };
  }
}

export function shellImports(variant: ShellVariant): Type<unknown>[] {
  const c = shellClasses[variant];
  return [c.HeaderApp, c.MenuApp, ModuleBoundary];
}

const moduleRouteClasses = {
  actual: {
    FileSharing: FileSharingActual,
    Library: LibraryActual,
    OptOutService: OptOutServiceActual,
    OptOutDashboard: OptOutDashboardActual,
    OptOutTopSubscriptions: OptOutTopSubscriptionsActual,
    OptOutSavings: OptOutSavingsActual,
    OptOutUpcoming: OptOutUpcomingActual,
    Tpe: TpeComponentActual,
    TpeDashboard: TpeDashboardActual,
    TpePenaltiesPaid: TpePenaltiesPaidActual,
    TpeMerchantReport: TpeMerchantReportActual,
    TpeRecomendations: TpeRecomendationsActual,
    LandingDashboard: LandingDashboardActual,
    FeeUpdates: FeeUpdatesActual,
    Alerts: AlertsActual,
    FeeDetail: FeeDetailActual,
    AccountSettings: AccountSettingsActual,
    Profile: ProfileActual,
    Security: SecurityActual,
    Notifications: NotificationsActual,
    Teams: TeamsActual,
  },
  propuesta: {
    FileSharing: FileSharingPropuesta,
    Library: LibraryPropuesta,
    OptOutService: OptOutServicePropuesta,
    OptOutDashboard: OptOutDashboardPropuesta,
    OptOutTopSubscriptions: OptOutTopSubscriptionsPropuesta,
    OptOutSavings: OptOutSavingsPropuesta,
    OptOutUpcoming: OptOutUpcomingPropuesta,
    Tpe: TpeComponentPropuesta,
    TpeDashboard: TpeDashboardPropuesta,
    TpePenaltiesPaid: TpePenaltiesPaidPropuesta,
    TpeMerchantReport: TpeMerchantReportPropuesta,
    TpeRecomendations: TpeRecomendationsPropuesta,
    LandingDashboard: LandingDashboardPropuesta,
    FeeUpdates: FeeUpdatesPropuesta,
    Alerts: AlertsPropuesta,
    FeeDetail: FeeDetailPropuesta,
    AccountSettings: AccountSettingsPropuesta,
    Profile: ProfilePropuesta,
    Security: SecurityPropuesta,
    Notifications: NotificationsPropuesta,
    Teams: TeamsPropuesta,
  },
} as const;

// Coincide con `data.pageRoot` de la ruta real de Landing / Incontrol Panel (ver landing.routes.ts).
export const landingPageRoot = 'LandingExternalNew';

// Coincide con `data.pageRoot` de la ruta real de Opt-Out Services (ver opt-out-service.routes.ts).
export const optOutServicePageRoot = 'OptOutServicesExternalNew';

// Coincide con `data.pageRoot` de la ruta real de TPE (ver tpe.routes.ts).
export const tpePageRoot = 'TPE';

// Coincide con `data.pageRoot` de la ruta real de Fee Updates (ver app.routes.ts, path 'updates').
export const feeUpdatesPageRoot = 'fee-updates';

// Coincide con `data.pageRoot` de la ruta real de Alerts (ver alerts.routes.ts).
export const alertsPageRoot = 'FeeAlerts';

// Coincide con `data.pageRoot` de la ruta real de Fee Detail (ver app.routes.ts, path 'detail/:feeId/:bankId').
export const feeDetailPageRoot = 'fee-detail-migration';

// Mismas rutas reales que app.routes.ts (IntelicaFeeExternalWeb): '/fee/filesharing', '/fee/library'
// y '/fee/opt-out-service' (con sus hijos: dashboard/top-subscriptions/savings/upcoming, igual que
// opt-out-service.routes.ts). Se usan en CUALQUIER story que monte el shell (no solo Layout/Full
// Page) para que el <RouterLink> del sidebar/header tenga un Router real y navegar funcione
// siempre, sin importar desde qué pantalla arrancó la story. `defaultPath` es a qué ruta redirige
// el path vacío (ej. 'fee/library' para que la story de Fee Library arranque ahí en vez del
// dashboard genérico).
export function shellRoutes(variant: ShellVariant, defaultPath = 'fee/landing/dashboard'): Route[] {
  const m = moduleRouteClasses[variant];
  return [
    { path: 'fee/filesharing', component: m.FileSharing },
    { path: 'fee/library', component: m.Library, data: { pageRoot: libraryPageRoot } },
    { path: 'fee/updates', component: m.FeeUpdates, data: { pageRoot: feeUpdatesPageRoot } },
    { path: 'fee/alerts', component: m.Alerts, data: { pageRoot: alertsPageRoot } },
    // El feeId/bankId real de la URL no importa -> el mock de FeeDetailService siempre devuelve el
    // mismo fee "flagship" (3F4030508), sin importar desde qué módulo se navegó hasta acá.
    { path: 'fee/detail/:feeId/:bankId', component: m.FeeDetail, data: { pageRoot: feeDetailPageRoot } },
    {
      path: 'fee/opt-out-service',
      component: m.OptOutService,
      data: { pageRoot: optOutServicePageRoot },
      canActivateChild: [PageRootChildGuard],
      children: [
        { path: 'dashboard', component: m.OptOutDashboard },
        { path: 'top-subscriptions', component: m.OptOutTopSubscriptions },
        { path: 'top-subscriptions/:returnFrom', component: m.OptOutTopSubscriptions },
        { path: 'savings', component: m.OptOutSavings },
        { path: 'savings/:returnFrom', component: m.OptOutSavings },
        { path: 'upcoming', component: m.OptOutUpcoming },
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: '**', redirectTo: 'dashboard' },
      ],
    },
    {
      path: 'fee/tpe',
      component: m.Tpe,
      data: { pageRoot: tpePageRoot },
      canActivateChild: [PageRootChildGuard],
      children: [
        { path: 'dashboard', component: m.TpeDashboard },
        { path: 'penalties-paid', component: m.TpePenaltiesPaid },
        { path: 'merchant-report', component: m.TpeMerchantReport },
        { path: 'merchant-report/:returnFrom', component: m.TpeMerchantReport },
        { path: 'recomendations', component: m.TpeRecomendations },
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: '**', redirectTo: 'dashboard' },
      ],
    },
    {
      path: 'fee/landing',
      component: m.LandingDashboard,
      data: { pageRoot: landingPageRoot },
      canActivateChild: [PageRootChildGuard],
      children: [
        { path: 'dashboard', component: m.LandingDashboard },
        { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
        { path: '**', redirectTo: 'dashboard' },
      ],
    },
    // Misma forma que la ruta real (security.routes.ts, IntelicaSecurityExternalWeb), pero
    // rooteada en 'security/settings' — así resuelve la URL '/security/settings/profile' que usa
    // literalmente `navigateToUrl()` en el Header real (onSettings(), notification-bell-admin).
    {
      path: 'security/settings',
      component: m.AccountSettings,
      data: { pageRoot: 'Security-Settings' },
      canActivateChild: [PageRootChildGuard],
      children: [
        { path: '', redirectTo: 'profile', pathMatch: 'full' },
        { path: 'profile', component: m.Profile },
        { path: 'teams', component: m.Teams, canActivate: [adminGuard] },
        { path: 'security', component: m.Security },
        { path: 'notifications', component: m.Notifications },
      ],
    },
    { path: '', pathMatch: 'full', redirectTo: defaultPath },
    { path: '**', redirectTo: defaultPath },
  ];
}

// businessuserTypeName por defecto SÍ se fuerza a 'Intelica' acá: `mirrors/header/app.ts` solo
// muestra `<language />` (el selector "Esp ⌄") cuando `SessionInformation.businessuserTypeName`
// (en minúsculas) es "intelica" — igual que la cuenta real usada para las capturas de este showcase
// (Wilfredo Tito, @intelica.com), por eso el selector debe verse en todos los módulos del shell, no
// solo en la demo puntual de header-bar/full-page (que ya usaba este mismo valor).
// El sidebar de Fee Manager (Menu) se oculta/muestra según la ruta activa, no según con qué story
// arrancó — ver el comentario grande en mocks/header/menu-products.mocks.ts
// (`createMockGlobalMenuServiceBase`, `FORCE_MENU_HIDDEN_PREFIXES`): se recalcula en cada
// `NavigationEnd`, así que sigue funcionando bien al navegar de Security/Account Settings o
// Fee/Alerts de vuelta a un módulo normal de Fee dentro de la MISMA story (bug real corregido acá:
// antes quedaba oculto para siempre una vez fijado al arrancar la story).
const defaultShellConfigOverrides: Parameters<typeof createMockConfigService>[0] = { businessuserTypeName: 'Intelica', fullName: 'Wilfredo Tito' };

export function shellProviders(variant: ShellVariant, configOverrides: Parameters<typeof createMockConfigService>[0] = defaultShellConfigOverrides): Provider[] {
  const c = shellClasses[variant];
  const libraryCurrentPage = { pageName: 'Fee Library', pageUrl: '/fee/library', pageRoot: libraryPageRoot };
  return [
    { provide: ConfigService, useValue: createMockConfigService(configOverrides) },
    { provide: GlobalTermService, useValue: createMockGlobalTermService('ES', libraryPageRoot) },
    { provide: GlobalMenuService, useFactory: (router: Router) => createMockGlobalMenuServiceBase(router, 'FEE'), deps: [Router] },
    { provide: GlobalFavoriteService, useValue: createMockGlobalFavoriteService(libraryCurrentPage) },
    // Real SessionInactivityService (mirrors/header/common/service/session-inactivity.service.ts)
    // depende de un WebSocket (SignalR) a un backend real que no existe en este showcase — el mock
    // (mocks/header/session-inactivity.mocks.ts) reemplaza esa conexión por un `setTimeout` de 5
    // minutos que muestra exactamente el mismo modal ("It seems you were absent...") vía el
    // AlertService/TermPipe/GlobalTermService REALES (por eso useFactory + deps, no useValue: el
    // mock necesita poder inyectarlos igual que el servicio real que reemplaza).
    {
      provide: variant === 'actual' ? SessionInactivityServiceActual : SessionInactivityServicePropuesta,
      useFactory: (alertService: AlertService, termPipe: TermPipe, globalTermService: GlobalTermService) =>
        createMockSessionInactivityService(alertService, termPipe, globalTermService),
      deps: [AlertService, TermPipe, GlobalTermService],
    },
    { provide: c.ProductsHttpService, useValue: createMockProductsHttpService() },
    { provide: c.UserProfileHttpService, useValue: createMockUserProfileHttpService() },
    { provide: c.SearchService, useValue: createMockSearchService() },
    { provide: NotificationOrchestratorService, useValue: createMockNotificationOrchestratorService() },
    { provide: c.MenuHttpService, useValue: createMockMenuHttpService() },
    { provide: c.StatusLastUpdateHttpService, useValue: createMockStatusLastUpdateHttpService() },
    // Servicios de los módulos ruteables (shellRoutes) — necesarios para que naveguen sin pegarle a HTTP real.
    { provide: variant === 'actual' ? FileSharingServiceActual : FileSharingServicePropuesta, useValue: createMockFileSharingService() },
    { provide: variant === 'actual' ? LibraryServiceActual : LibraryServicePropuesta, useValue: createMockLibraryService() },
    { provide: variant === 'actual' ? OptOutServicesServiceActual : OptOutServicesServicePropuesta, useValue: createMockOptOutServiceService() },
    { provide: variant === 'actual' ? TpeServiceActual : TpeServicePropuesta, useValue: createMockTpeService() },
    { provide: variant === 'actual' ? LandingServiceActual : LandingServicePropuesta, useValue: createMockLandingService() },
    { provide: variant === 'actual' ? FeeUpdatesServiceActual : FeeUpdatesServicePropuesta, useValue: createMockFeeUpdatesService() },
    { provide: variant === 'actual' ? AlertsServiceActual : AlertsServicePropuesta, useValue: createMockAlertsService() },
    { provide: variant === 'actual' ? FeeDetailServiceActual : FeeDetailServicePropuesta, useValue: createMockFeeDetailService() },
    { provide: variant === 'actual' ? CustomConfigurationServiceActual : CustomConfigurationServicePropuesta, useValue: createMockCustomConfigurationService() },
    { provide: variant === 'actual' ? ProfileServiceActual : ProfileServicePropuesta, useValue: createMockProfileService() },
    { provide: variant === 'actual' ? SecurityServiceActual : SecurityServicePropuesta, useValue: createMockSecurityService() },
    { provide: variant === 'actual' ? TeamsServiceActual : TeamsServicePropuesta, useValue: createMockTeamsService() },
    { provide: variant === 'actual' ? NotificationsServiceActual : NotificationsServicePropuesta, useValue: createMockNotificationsService() },
    // Alias hacia los mismos mocks de arriba para las clases de 'intelica-library-components' que
    // mirrors/menu/menu/menu.ts (Actual) inyecta directo — ver comentario junto al import de más
    // arriba. Solo aplica a 'actual': prototypes/menu/menu/menu.ts sigue en 'intelica-library-base'.
    ...(variant === 'actual'
      ? [
          { provide: ConfigServiceComponents, useExisting: ConfigService },
          { provide: GlobalTermServiceComponents, useExisting: GlobalTermService },
          { provide: GlobalMenuServiceComponents, useExisting: GlobalMenuService },
          { provide: GlobalFavoriteServiceComponents, useExisting: GlobalFavoriteService },
        ]
      : []),
  ];
}

// Envuelve el contenido de un módulo (ej. <fee-file-sharing>) con el layout real
// (header arriba + sidebar al lado). `mainContent` es el HTML que va dentro de lyDashboard__main.
//
// INTENTOS REVERTIDOS (2026-09-10) — pendiente, ver [[bug: lista de Alerts invisible]]: se probó 2
// veces darle a <showcase-module-boundary> un `id="single-spa-application:..."` para reusar la
// regla real de _dashboard.scss (`.lyDashboard :is(&__main) [id^="single-spa-application"] { &, &
// > :first-child { display:flex; flex-direction:column; min-height:100%; } }`, la que en
// producción real single-spa activa sobre el div que monta cada microfrontend). Los 2 intentos
// rompieron TODOS los módulos (no solo Alerts), no solo el puntual:
// 1) Solo el `id`: `& > :first-child` apunta al PRIMER hijo de showcase-module-boundary, que
//    SIEMPRE es el propio `<router-outlet>` (mainContent es literal `<router-outlet />` en cada
//    *.stories.ts; Angular pone el componente ruteado real como HERMANO después, no como hijo del
//    outlet) — y ese mismo _dashboard.scss tiene además `router-outlet { display:none; }` en el
//    mismo bloque. La regla terminaba dándole la altura al outlet oculto, no al contenido real.
// 2) Se agregó un `<style>` con `showcase-module-boundary > :not(router-outlet)` para apuntarle al
//    hermano real en vez de al primer hijo — pero ese `<style>` vive dentro de un template Angular,
//    y la encapsulación por defecto (Emulated) le agrega un atributo de scoping a cada selector
//    (`_ngcontent-xyz`) que NO coincide con el del contenido proyectado real (pertenece a otro
//    componente, con su propio namespace de encapsulación) — la regla probablemente nunca llegó a
//    aplicarse, dejando activo solo el problema del intento 1.
// Revertido a la versión simple sin el id (vuelve el bug puntual de Alerts: la lista se ve vacía
// aunque el contador de arriba funciona bien — ver .ptStackContent--scroll en
// styleguide/css/patterns/stack-content/_stack-content.scroll.scss, `height: inherit` no recibe una
// altura real). Si se retoma, probar `::ng-deep` en el selector del intento 2 (sin scoping) o
// `ViewEncapsulation.None` en el componente que declare el estilo — y esta vez confirmar
// VISUALMENTE en el navegador antes de darlo por bueno, no alcanza con que compile.
export function shellTemplate(mainContent: string): string {
  return `
    <div class="lyDashboard">
      <div class="lyDashboard__header"><app-header /></div>
      <div class="lyDashboard__sidebar"><app-menu /></div>
      <div class="lyDashboard__main">
        <showcase-module-boundary>${mainContent}</showcase-module-boundary>
      </div>
    </div>
  `;
}
