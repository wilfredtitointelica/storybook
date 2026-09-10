// Mocks reutilizables en cualquier story: reemplazan los servicios que en la app real
// hacen llamadas HTTP (ConfigService, GlobalTermService) por versiones estáticas.
// El TermPipe SÍ se usa real (viene de intelica-library-base): solo necesita
// que GlobalTermService.terms tenga los códigos usados por la pantalla (ver terms.es.ts/terms.en.ts).
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { termsEs } from './terms.es';
import { termsEn } from './terms.en';

// Fuerza ~1s de delay en cualquier observable de mock, para que los skeletons reales
// (@if(isLoadingX()) ... ya copiados verbatim en los componentes) se alcancen a ver en la demo.
export function delayedOf<T>(value: T, ms = 1000) {
  return of(value).pipe(delay(ms));
}

export function createMockConfigService(overrides?: {
  isGroup?: boolean;
  isAdmin?: boolean;
  isInternal?: boolean;
  businessuserTypeName?: string;
  fullName?: string;
  businessUserID?: string;
  // clientID: 'ExternalNew' es el valor real de la plataforma externa (InControl); varias
  // pantallas (ej. la barra de búsqueda del header) solo se renderizan cuando calza este valor.
  clientID?: string;
}) {
  return {
    environment: {
      feePath: '/mock/fee-api',
      securityPath: '/mock/security-api',
      clientID: overrides?.clientID ?? 'ExternalNew',
    },
    SessionInformation: {
      isGroup: overrides?.isGroup ?? false,
      isAdmin: overrides?.isAdmin ?? false,
      isInternal: overrides?.isInternal ?? false,
      businessuserTypeName: overrides?.businessuserTypeName,
      fullName: overrides?.fullName ?? 'Demo User',
      businessUserID: overrides?.businessUserID,
    },
  };
}

// Por defecto ES: la cuenta real (cliente externo) siempre ve la plataforma en español — el
// selector de idioma del header solo aparece para usuarios internos de Intelica (ver
// header-bar.stories.ts, businessuserTypeName: 'Intelica'), que sí pueden pedir 'EN' explícito.
export function createMockGlobalTermService(languageCode: 'EN' | 'ES' = 'ES', pageRoot = '') {
  return {
    terms: languageCode === 'ES' ? termsEs : termsEn,
    languageCode,
    TermsReady: () => true,
    Initialize: () => {},
    refreshTerms: () => {},
    SetLanguage: () => {},
    // Usado por AddFavoritesService (intelica-library-project) para saber "la página actual"
    // cuando un componente pide favorito/quitar-favorito sin pasar pageRoot explícito.
    GetPageRoot: () => pageRoot,
  };
}

export const mockActivatedRoute: Partial<ActivatedRoute> = {
  queryParams: of({}),
};
