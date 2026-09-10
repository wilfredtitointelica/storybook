// Mocks para el header completo (app.ts): reemplazan los servicios HTTP/tiempo-real por
// versiones estáticas. Servicios reales que se dejan sin mockear porque no llaman a nada
// mientras SessionInformation.businessUserID esté vacío y no haya cookie "refreshToken":
// NotificationBellDomain, SessionInactivityService, SecurityHttpService, CloseSessionService.
import { of } from 'rxjs';
import { signal, computed } from '@angular/core';
import { SearchType } from '../../mirrors/header/search-main/dto/search-commands';
import { SearchResultItemResponse } from '../../mirrors/header/search-main/dto/search-responses';
import {
  searchTopFees,
  searchReports,
  searchDashboards,
  searchRecents,
  searchFeeSections,
  searchFavorites,
  searchCustoms,
} from './search.data';
import { userProfileClientGroups } from './user-profile.data';

// Réplica de SearchService.normalizeText()/getRelevanceScore() (search.service.ts real): minúsculas,
// sin tildes, colapsa espacios; el score prioriza match exacto > empieza-con > alguna palabra
// empieza-con > contiene, igual que rankByRelevance() en producción.
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRelevanceScore(title: string, normalizedSearch: string): number {
  const normalizedTitle = normalizeText(title);
  if (normalizedTitle === normalizedSearch) return 1000;
  if (normalizedTitle.startsWith(normalizedSearch)) return 900;
  if (normalizedTitle.split(' ').some(word => word.startsWith(normalizedSearch))) return 800;
  const index = normalizedTitle.indexOf(normalizedSearch);
  if (index >= 0) return 700 - Math.min(index, 300);
  return 0;
}

// Pool "buscable" de ejemplo: top fees + reports + dashboards + cualquier recent que no esté ya
// ahí (ej. el fee "3CSF07105...") — no hay HTTP real (ver nota en createMockSearchService), así que
// esto hace de stand-in fijo del backend de búsqueda.
const searchPool: SearchResultItemResponse[] = [...searchTopFees, ...searchReports, ...searchDashboards];
searchRecents.forEach(recent => {
  if (!searchPool.some(item => item.type === recent.type && item.entityId === recent.entityId)) {
    searchPool.push(recent);
  }
});

export function createMockUserProfileHttpService() {
  return {
    getClientGroupsByUser: () => of(userProfileClientGroups),
    validateAuthentication: () => of({} as any),
  };
}

// NotificationOrchestratorService (intelica-library-notification): solo se usa si
// SessionInformation.businessUserID tiene valor (ver ngOnInit de NotificationBell). Con el
// ConfigService mock por defecto no se llama nunca, pero igual hay que darle forma porque
// Angular necesita poder construir NotificationBell (se inyecta por constructor).
// ensureCreateJobNotifications: llamado por Security/Teams y Security/Security (invitar/rechazar
// miembro, aviso de cambio de contraseña) para disparar un correo — no-op acá, no hay backend real.
export function createMockNotificationOrchestratorService() {
  return {
    getUserNotificacions: async () => [],
    watchUserInbox: async () => of(null),
    unwatchUserInbox: async () => {},
    markAllAsRead: async () => [],
    ensureCreateJobNotifications: async () => {},
  };
}

// SearchService: en producción solo pide data real si environment.clientID === 'ExternalNew'.
// Como el showcase sí simula ese clientID (para que se vea la barra de búsqueda), hay que
// reemplazar el servicio completo para no disparar HTTP real.
// searchText/searchType son signals reales (no funciones fijas): así los botones "All/Fees/Reports"
// y el campo de búsqueda quedan interactivos de verdad, igual que en producción.
// searchResults ya NO es fijo-vacío: el real searchEffect() debounce (250ms) + minSearchChars (2) +
// rankByRelevance() se reimplementa acá contra `searchPool` (arriba), porque SearchHttpService real
// nunca se llama en el showcase (SearchService entero se reemplaza via `useValue` en shell.ts).
const SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH_CHARS = 2;

export function createMockSearchService() {
  const _searchText = signal<string>('');
  const _searchType = signal<SearchType>(SearchType.ALL);
  const _debouncedText = signal<string>('');
  const _isSearching = signal<boolean>(false);
  let debounceHandle: ReturnType<typeof setTimeout> | undefined;

  const runSearch = (text: string) => {
    if (debounceHandle) clearTimeout(debounceHandle);
    if (text.trim().length < MIN_SEARCH_CHARS) {
      _isSearching.set(false);
      _debouncedText.set(text);
      return;
    }
    _isSearching.set(true);
    debounceHandle = setTimeout(() => {
      _debouncedText.set(text);
      _isSearching.set(false);
    }, SEARCH_DEBOUNCE_MS);
  };

  const searchResults = computed<SearchResultItemResponse[]>(() => {
    const text = _debouncedText();
    if (text.trim().length < MIN_SEARCH_CHARS) return [];
    const type = _searchType();
    const normalizedSearch = normalizeText(text);
    return searchPool
      .filter(item => type === SearchType.ALL || item.type === type)
      .map(item => ({ item, score: getRelevanceScore(item.title, normalizedSearch) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  });

  return {
    searchText: _searchText.asReadonly(),
    searchType: _searchType.asReadonly(),
    searchResults,
    isSearching: _isSearching.asReadonly(),
    recents: () => searchRecents,
    favorites: () => searchFavorites,
    customs: () => searchCustoms,
    sections: () => searchFeeSections,
    topFees: () => searchTopFees,
    reports: () => searchReports,
    dashboards: () => searchDashboards,
    clearText: () => {
      _searchText.set('');
      runSearch('');
    },
    updateSearchType: (type: SearchType) => _searchType.set(type),
    updateSearchText: (text: string) => {
      _searchText.set(text);
      runSearch(text);
    },
    saveRecentSearch: () => {},
  };
}
