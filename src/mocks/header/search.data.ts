// Data fija de ejemplo para el popover de búsqueda del header, calcada de la búsqueda real.
import { SearchType, FeeSection } from '../../mirrors/header/search-main/dto/search-commands';
import { SearchResultItemResponse, SearchSectionResponse } from '../../mirrors/header/search-main/dto/search-responses';
import { BrandType } from '../../mirrors/header/common/enums/brand.enum';
import { feeDetailFeeId } from '../fee/fee-detail.data';

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

// --- "Fees" (tab ALL / topFees) ---
// action.route apunta a "/fee/detail": SearchResult.onSelectSearchResult() para cualquier tipo
// distinto de REPORTS navega con `router.navigate([item.action.route, item.action.params.feeId, "-1"])`
// (bankId siempre hardcodeado a "-1") — por eso el route debe ser exactamente el path real de Fee
// Detail para que el click funcione, igual que en producción.
export const searchTopFees: SearchResultItemResponse[] = [
  {
    type: SearchType.FEES,
    entityId: 1,
    title: '2DN1800 Cross Border - Mastercard | Interregional | Purchase | Local',
    brandId: BrandType.Mastercard,
    selectedAt: daysAgo(2),
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 1 } },
  },
  {
    type: SearchType.FEES,
    entityId: 2,
    title: '2AE4940L3GR Marketing Fund - Mastercard | Domestic | Purchase',
    brandId: BrandType.Mastercard,
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 2 } },
  },
  {
    type: SearchType.FEES,
    entityId: 3,
    title: '2GB2001S Global Wholesale Travel Transaction Program - Processing',
    brandId: BrandType.Mastercard,
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 3 } },
  },
  {
    type: SearchType.FEES,
    entityId: 4,
    title: 'TGC1501TFA Volume - Purchase',
    brandId: BrandType.Mastercard,
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 4 } },
  },
  // Coincide con la tarifa mostrada en el módulo Fee Detail (mocks/fee/fee-detail.data.ts) — al
  // buscar y hacer click acá se ve el mismo fee que se ve entrando desde Fee Library/Updates/Alerts.
  {
    type: SearchType.FEES,
    entityId: 6,
    title: '3J4299575 Autorización - Interregional Compra - Visa | Adquirente',
    brandId: BrandType.Visa,
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: feeDetailFeeId } },
  },
];

// --- "Reports" (tab ALL / reports) ---
export const searchReports: SearchResultItemResponse[] = [
  {
    type: SearchType.REPORTS,
    entityId: 101,
    title: 'AH-200428B - All MasterCard fees - by Subcategory',
    action: { kind: 'navigate', route: '/fee/reports', params: { reportId: 101 } },
  },
  {
    type: SearchType.REPORTS,
    entityId: 102,
    title: 'AH-241031 - Mastercard & Visa Acquirer Merchant - Monthly Expenses',
    action: { kind: 'navigate', route: '/fee/reports', params: { reportId: 102 } },
  },
  {
    type: SearchType.REPORTS,
    entityId: 103,
    title: 'AH-26030302 - Variation - Top Group Fees - Quarterly - Issuer',
    action: { kind: 'navigate', route: '/fee/reports', params: { reportId: 103 } },
  },
  {
    type: SearchType.REPORTS,
    entityId: 104,
    title: 'AH-26030303 - Variation - Top Group Fees - Annual - Issuer',
    action: { kind: 'navigate', route: '/fee/reports', params: { reportId: 104 } },
  },
];

export const searchDashboards: SearchResultItemResponse[] = [];

// --- "Recents" (compartido: se filtra por type en cada tab) ---
export const searchRecents: SearchResultItemResponse[] = [
  {
    type: SearchType.FEES,
    entityId: 1,
    title: '2DN1800 Cross Border - Mastercard | Interregional | Purchase | Local',
    brandId: BrandType.Mastercard,
    selectedAt: daysAgo(2),
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 1 } },
  },
  {
    type: SearchType.FEES,
    entityId: 5,
    title: '3CSF07105 Volume - Domestic, Interregional & Intraregional Purchase',
    brandId: BrandType.Visa,
    selectedAt: daysAgo(4),
    action: { kind: 'navigate', route: '/fee/detail', params: { feeId: 5 } },
  },
  {
    type: SearchType.REPORTS,
    entityId: 105,
    title: 'AH-032026 - Intelica - Fees by Frequency',
    selectedAt: daysAgo(4),
    action: { kind: 'navigate', route: '/fee/reports', params: { reportId: 105 } },
  },
];

// --- "Fee Category" (tab Fees) ---
export const searchFeeSections: SearchSectionResponse[] = [
  {
    title: FeeSection.Core,
    items: [
      { id: 1, name: 'Association Fees' },
      { id: 2, name: 'Authorization Fees' },
      { id: 3, name: 'Clearing Fees' },
    ],
  },
  {
    title: FeeSection.NonCore,
    items: [
      { id: 4, name: 'Mandatory Fees' },
      { id: 5, name: 'Penalties' },
      { id: 6, name: 'Optional Services' },
    ],
  },
];

// favorites/customs vacíos: coincide con lo que se ve en la búsqueda real (sin favoritos ni reportes custom todavía).
export const searchFavorites: SearchResultItemResponse[] = [];
export const searchCustoms: SearchResultItemResponse[] = [];
