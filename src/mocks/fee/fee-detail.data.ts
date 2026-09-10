// Data fija de ejemplo para la story de Fee Detail. No pega a ningún backend real.
// Calca 2 capturas reales de producción (cuenta de Wilfredo Tito) para la tarifa
// "Autorización - Interregional Compra" (código 3J4299575) — es el fee "flagship" que se muestra
// sin importar desde qué módulo se navegue a Fee Detail (Fee Updates, Alerts, Library, TPE), igual
// que otros módulos de este showcase muestran siempre el mismo ejemplo fijo sin simular routing
// dinámico real por feeId.
import { FeeDetailInfoResponse, FeeSummaryResponse, FeeRateVersionsResponse, FeeDetailKpiResponse, FeeDetailChartItem, BillingHistoryResponse, BillingHistoryItem, FeeReferenceItem } from '../../mirrors/fee/fee-detail/dto/fee-detail.dto';
import { CustomConfigurationByFeeResponse } from '../../mirrors/fee/fee-detail/modal-set-alert/DTO/response';
import { RateStructureEnum, RateVersionEnum } from '../../mirrors/fee/fee-detail/common/enums';

export const feeDetailFeeId = '1105';
export const feeDetailBankId = 501;

export const feeDetailInfo: FeeDetailInfoResponse = {
  feeId: feeDetailFeeId,
  feeName: 'Autorización - Interregional Compra',
  brandId: 2,
  brand: 'Visa',
  businessId: 1,
  business: 'Adquirente',
  feeOCode: '3J4299575',
  feeCode: '3J4299575',
  description: 'Los adquirentes pagan, mensualmente, una tarifa plana basada en el número de transacciones de autorización interregional de compras procesadas por VisaNet.',
  // El mapeo real (FeeDetailService.toFeeDetailInfo) SIEMPRE deja estos 5 campos en blanco/vacío —
  // la data real vive en FeeSummaryResponse/FeeRateVersionsResponse (2 llamadas separadas), no acá.
  currentRate: '',
  billingFrequency: '',
  rateStructure: RateStructureEnum.NotAvailable,
  rateVersions: [],
  additionalDetails: { scope: [], transactionTypes: [], productTypes: [], associatedFees: [], isAssociated: false, isDependent: false, isMultipleRate: false },
  // minDate/maxDate en meses distintos -> isNewFee()=false (activePeriod se queda en Last12Months,
  // no salta a CurrentMonth) — coincide con la captura ("Últimos 12 meses", no "Cierre mensual").
  minDate: '2025-10-01',
  maxDate: '2026-08-31',
  isSinglePeriod: false,
  // Nota (captura 2, "Configure Custom Alert"): el titulo del botón (EDIT_ALERT vs SET_ALERT, ver
  // title.html linea ~73) se lee de este campo via fee-detail.ts -> <fee-title [hasAlert]>. OJO: el
  // estado "choose" vs "manage" del propio modal (modal-set-alert.ts.loadConfig()) NO depende de este
  // campo, sino de si CustomConfigurationService.getByFee() devuelve configuration !== null (ver
  // feeDetailActiveAlert / createMockCustomConfigurationService().getByFee mas abajo) — se deja este
  // campo en true por consistencia con esa misma fuente de verdad.
  hasAlert: true,
  associatedBanks: [{ bankId: feeDetailBankId, bankName: 'MBH Bank' }],
  // 1 documento asociado (captura 3, botón "References (1)") -> muestra el botón junto a las badges
  // de marca/negocio en title.html linea ~59.
  referencesCount: 1,
};

export const feeDetailSummary: FeeSummaryResponse = {
  currency: 'EUR',
  currentRate: '0.0425',
  billingFrequency: 'Mensual',
  rateStructure: 'Plana',
  rateStructureCode: 1, // RateStructureEnum.Flat
  rateUnit: 'EUR', // NO es '%' esta vez -> monto plano por evento, no un porcentaje.
};

export const feeDetailRateVersions: FeeRateVersionsResponse = {
  currency: 'EUR',
  rateStructure: 'Plana',
  rateStructureCode: 1,
  rateUnit: 'EUR',
  versions: [
    {
      version: RateVersionEnum.Current,
      label: 'Current',
      status: 'Active',
      // begin: null -> formatEffectivePeriod() devuelve solo "Vigente" (sin fecha de inicio),
      // igual que la captura ("Período Vigente: Vigente", sin un "<fecha> - Vigente").
      begin: null,
      end: null,
      minAmount: null,
      maxAmount: null,
      rateStructureCode: 1,
      rateStructure: 'Plana',
      rateUnit: 'EUR',
      currency: 'EUR',
      isMultipleRate: false,
      isDependent: false,
      tiers: [{ tier: 1, minimum: 1, maximum: null, rate: '0.0425', description: null }],
    },
  ],
  additionalDetails: {
    scope: ['Interregional'],
    transactions: [{ code: 'PURCHASE', items: ['Compras', 'Provisión de Fondos', 'Crédito Original'] }],
    products: [{ code: 'ALL', items: ['ALL'] }],
    associatedFees: [],
  },
};

// vs. Período anterior: +11.2% (EUR 38,639.40) -> anterior = 383,608.27 - 38,639.40 = 344,968.87.
export const feeDetailKpi: FeeDetailKpiResponse = {
  totalFeeAmount: 383608.27,
  currency: 'EUR',
  totalEvents: 9026076,
  totalFeeAmountPrevious: 344968.87,
  hasEnoughHistory: true,
  isSinglePeriod: false,
  hasIncompleteHistory: false,
};

// 12 meses (Oct25-Ago26). Confirmados por captura: Oct25 (EUR 34,963.99, vs. Oct24 EUR 30,245.17,
// visible en el tooltip) y Ago26 (deriva de las 2 filas confirmadas del Historial de Facturación:
// 42,802.30 + 25,407.14 = 68,209.44). El resto de los meses interpola una curva creciente (con una
// baja en Dic) que suma EXACTO con esos 2 al total de "Últimos 12 meses" (EUR 383,608.27) — no son
// pixel-exactos mes a mes, solo Oct25 y Ago26 lo son.
export const feeDetailChart: FeeDetailChartItem[] = [
  { year: 2025, month: 10, amount: 34963.99, previousYearAmount: 30245.17, events: 822661 },
  { year: 2025, month: 11, amount: 29445.66, previousYearAmount: null, events: 692933 },
  { year: 2025, month: 12, amount: 21032.61, previousYearAmount: null, events: 494897 },
  { year: 2026, month: 1, amount: 22434.79, previousYearAmount: null, events: 527884 },
  { year: 2026, month: 2, amount: 22434.79, previousYearAmount: null, events: 527884 },
  { year: 2026, month: 3, amount: 25239.14, previousYearAmount: null, events: 594000 },
  { year: 2026, month: 4, amount: 26641.31, previousYearAmount: null, events: 626999 },
  { year: 2026, month: 5, amount: 39260.88, previousYearAmount: null, events: 923876 },
  { year: 2026, month: 6, amount: 47673.92, previousYearAmount: null, events: 1121777 },
  { year: 2026, month: 7, amount: 46271.75, previousYearAmount: null, events: 1088776 },
  { year: 2026, month: 8, amount: 68209.44, previousYearAmount: null, events: 1604928 },
];

const BILLING_NUMBER_BY_MONTH: Record<number, string> = {
  10: '260510-09214', 11: '260511-09258', 12: '260512-09301',
  1: '260601-09339', 2: '260602-09372', 3: '260603-09401',
  4: '260604-09428', 5: '260605-09461', 6: '260606-09498',
  7: '260700-09386', 8: '260800-09545',
};

function monthLastDay(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

// Las 2 filas de Ago26 son EXACTAS de la captura (código de entidad/actividad, precio, eventos y
// monto). Para el resto de los meses se reparte el monto del gráfico entre las 2 mismas
// entidades-actividad con la misma proporción confirmada en Ago26 (62.75% / 37.25%) — no son
// pixel-exactas, solo Ago26 lo es.
const ENTITY_A = '900077405410066';
const ENTITY_B = '9000645045400312';
const RATIO_A = 42802.3 / 68209.44;

function buildBillingRows(): BillingHistoryItem[] {
  const rows: BillingHistoryItem[] = [];
  for (const point of feeDetailChart) {
    const date = monthLastDay(point.year, point.month);
    const isAug26 = point.year === 2026 && point.month === 8;
    const amountA = isAug26 ? 42802.3 : Math.round(point.amount! * RATIO_A * 100) / 100;
    const amountB = isAug26 ? 25407.14 : Math.round((point.amount! - amountA) * 100) / 100;
    const eventsA = isAug26 ? 1007113 : Math.round(point.events! * RATIO_A);
    const eventsB = isAug26 ? 597815 : point.events! - eventsA;
    const billingNumber = BILLING_NUMBER_BY_MONTH[point.month];
    rows.push(
      { date, billingNumber, billingActivity: ENTITY_A, entityActivity: ENTITY_A, description: 'ACQUIRER AUTHORISATION INTER VISA POS**', price: 0.0425, events: eventsA, originalCurrency: 'EUR', originalAmount: amountA, exchangeRate: 1, targetCurrency: 'EUR', targetAmount: amountA, isUnallocated: false },
      { date, billingNumber, billingActivity: ENTITY_B, entityActivity: ENTITY_B, description: 'ACQUIRER AUTHORISATION INTER VISA POS**', price: 0.0425, events: eventsB, originalCurrency: 'EUR', originalAmount: amountB, exchangeRate: 1, targetCurrency: 'EUR', targetAmount: amountB, isUnallocated: false }
    );
  }
  return rows.sort((a, b) => (a.date < b.date ? 1 : -1));
}

// Fila real adicional, verificada contra captura (Historial de Facturación con el ícono de alerta
// "Unallocated" junto a la fecha, ver history-billing.html linea ~78:
// `@if (row.isUnallocated) { <i class="icon icon-alert" [pTooltip]="...UNALLOCATED"> }`). NO forma
// parte del patrón mensual sintético Oct25-Ago26 de buildBillingRows() (entidad/descripción
// distintas) — se agrega como una fila extra e independiente, sin reemplazar ni renumerar las demás.
// Math: price * events = 0.5500 * 253 = 139.15 = "Total Amount (EUR): EUR 139.15" de la captura.
const feeDetailUnallocatedRow: BillingHistoryItem = {
  date: '2026-06-14',
  billingNumber: '268100300044810',
  billingActivity: '19843',
  entityActivity: '19843',
  description: 'Transaction Processing Excellence-Excessive Authorization Attempts',
  price: 0.55,
  events: 253,
  originalCurrency: 'EUR',
  originalAmount: 139.15,
  exchangeRate: 1,
  targetCurrency: 'EUR',
  targetAmount: 139.15,
  isUnallocated: true,
};

const feeDetailBillingRows = [...buildBillingRows(), feeDetailUnallocatedRow];

export const feeDetailBillingHistory: BillingHistoryResponse = {
  items: feeDetailBillingRows,
  totalCount: feeDetailBillingRows.length, // se ajusta solo con la fila extra de arriba.
  hasMultipleCurrencies: false, // la fila extra tambien es EUR->EUR, no rompe el patrón todo-EUR.
  unifiedCurrency: 'EUR',
};

// Sin alerta configurada todavía -> el modal abriría en la sección "choose" (Configurar alerta
// personalizada). Ya NO se usa en createMockCustomConfigurationService().getByFee (ver
// fee-detail.mocks.ts, ahora devuelve feeDetailActiveAlert) — se deja el export como referencia
// documentada de cómo se veía el estado vacío antes de fijar la alerta activa de la captura 2.
export const feeDetailNoAlert: CustomConfigurationByFeeResponse = {
  clientId: feeDetailBankId,
  configuration: null,
};

// Captura 2 ("Configure Custom Alert" / "Active Alert Configured"): Expected Amount fijo en EUR 2,
// activo, disparado en la facturación mensual -> modal-set-alert.ts.loadConfig() ve
// `configuration !== null` y abre en la sección "manage" (no "choose"). thresholdValue/currencyId
// exactos de la captura; el resto de campos (id, businessUserId, fechas) son plausibles, no
// verificados pixel a pixel. businessUserId = mismo id de demo usado en todo el showcase (ver
// activeBusinessUserID en ../../stories/shell.ts y accountSettingsUserID en
// ../security/account-settings.data.ts): 'usr-001-wilfredo-tito'.
export const feeDetailActiveAlert: CustomConfigurationByFeeResponse = {
  clientId: feeDetailBankId,
  configuration: {
    customConfigurationId: 9001,
    clientId: feeDetailBankId,
    businessUserId: 'usr-001-wilfredo-tito',
    feeId: Number(feeDetailFeeId),
    configurationType: 1, // AlertMethod.ExpectedAmount (ver ConfigurationTypeMap en modal-set-alerts.interface.ts)
    thresholdValue: 2, // EUR 2, exacto de la captura.
    thresholdUnit: 1, // ThresholdUnit.Amount
    currencyId: 978, // EUR (ver currencyMap privado en modal-set-alert.ts)
    isActive: true,
    createdDate: '2026-06-02T09:15:00Z',
    updatedDate: null,
  },
};

// Captura 3 ("References (1)" + modal de referencias): único documento asociado a esta tarifa.
// `path` es un identificador cualquiera que solo se reenvía a downloadReferencePdf(path) en el mock.
export const feeDetailReference: FeeReferenceItem = {
  documentId: 1,
  fileName: 'AI13992 - Cross Border AFT Client to Client, Issuer and Acquirer Fees Will Be Modified (AI13992)',
  documentCode: 'AI13992',
  documentType: 'Announcements',
  documentCategory: 'Announcements',
  publicationDate: '25 apr, 2024',
  path: 'references/AI13992.pdf',
};

// PDF real (no un blob vacío/placeholder): generado localmente con la librería `pdfkit` (no es una
// dependencia del proyecto, se corrió una vez fuera del repo -ver scratchpad de la sesión- para
// producir este PDF estático con el contenido del artículo "Visa Business News" de la captura),
// mismo precedente que el QR de 2FA en ../security/account-settings.data.ts (accountSettingsSetupTwoFactor).
// Verificado antes de embeber: los primeros 4 bytes decodificados son la firma ASCII "%PDF". El
// componente (modal-reference.ts.onViewReference) mete este blob directo en un <iframe> vía
// URL.createObjectURL, así que un blob vacío se vería como un visor roto/en blanco en la demo.
export const feeDetailReferencePdfBase64 =
  'JVBERi0xLjMKJf////8KNyAwIG9iago8PAovVHlwZSAvUGFnZQovUGFyZW50IDEgMCBSCi9NZWRpYUJveCBbMCAwIDU5NS4yOCA4NDEuODldCi9Db250ZW50cyA1IDAgUgovUmVzb3VyY2VzIDYgMCBSCi9Vc2VyVW5pdCAxCj4+CmVuZG9iago2IDAgb2JqCjw8Ci9Qcm9jU2V0IFsvUERGIC9UZXh0IC9JbWFnZUIgL0ltYWdlQyAvSW1hZ2VJXQovRm9udCA8PAovRjEgOCAwIFIKL0YyIDkgMCBSCj4+Ci9Db2xvclNwYWNlIDw8Cj4+Cj4+CmVuZG9iago1IDAgb2JqCjw8Ci9MZW5ndGggNzY3Ci9GaWx0ZXIgL0ZsYXRlRGVjb2RlCj4+CnN0cmVhbQp4nMVWTY8TMQy991fkDzDYjv08kVZzQHxI3EC9IQ5oOpE4gISQ+P3ISduddpalrASsVG0nTRy/5+fn4USJ0jNOlEblYSxp/rJ7/nL58Xle3r95kebvOxry1V+6ben7/HX3bccP3fBif1znZEjuZVAZ0/7L7vlrTiXt6+7DnQHFM1hIxc0zChaYZ89CusCmJJTu3D1PiT6m/dvdq/3u3b9PHmUg0avks2QTUnZymdIztnSHglkoS46PCvkspI4ZFQLG/CgKJi4gHzVzdjEt6da124EoD0xFOhJJjA5Fc0AIrlEb+wcV1POawlwCqsJUSDNmFBgWVzm4osrhYm2eklK6E9IS0dz6eTAWxHlGdnZDcTlGBmJPFrpg6DZMIgNhi8k8qhH1UEEU6oAKRQFanvq/a4HRB/NV3nysRXUEKyGpEH9Ld0ohL/f86Q8JYhoHEy1lvLqQzxcKqQHAlHIU25BdURxTkpC0CWXORUhr+yWk3Ip2lvkcZTNKq3b2M/nR0q4uQb4bcsSLHVi1t9DqdhOKjkKFT6kxIP0/GIfVztoklWNnlyyaZE9i/XMhwXUYkTf8gJGRUb2Lm4D41qS0wIUC3TnDJfB3BlHjSUjG3jiepcgyJbTWODKmGIOz32BuOxqysEgP7qAbLurah7ylx1Ewl3aBYwyqTgTfbz2A22OE8vIk6iADq2+oa57O8Fb0DjMA25ZEVCBWe9ZYEEC5CeiC/pgEkfaDRJq3Tl+Jrz1jQW1CPDj14rQ86mPyeZDMFjKOWCQeYZ5AlZZBM2+pekRFcevWci/WLjpoTdJ/NjnJQylbzzGdEvd5IxSVw+wkdC9/1JPlnRVgHlXr2rD7aXKhsa6iX1b11IhHeqKcf9H6niAO5kHGByzoJhM9zefHrKS5QEHG2K05ROTWrWVjyr8T3dy7ejvhsZnwN8jzJobMx8Hd7qemHKcmtybg4/vWUSVPiG9lMNq2p3LPv3HV8Ef8GMfW33SuEDevi3ePletc7T43dztxPnv1ZvIT44R84QplbmRzdHJlYW0KZW5kb2JqCjExIDAgb2JqCihQREZLaXQpCmVuZG9iagoxMiAwIG9iagooUERGS2l0KQplbmRvYmoKMTMgMCBvYmoKKEQ6MjAyNjA5MDgyMDQ1NThaKQplbmRvYmoKMTAgMCBvYmoKPDwKL1Byb2R1Y2VyIDExIDAgUgovQ3JlYXRvciAxMiAwIFIKL0NyZWF0aW9uRGF0ZSAxMyAwIFIKPj4KZW5kb2JqCjggMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL0Jhc2VGb250IC9IZWx2ZXRpY2EKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iago5IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9CYXNlRm9udCAvSGVsdmV0aWNhLUJvbGQKL1N1YnR5cGUgL1R5cGUxCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iago0IDAgb2JqCjw8Cj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAxIDAgUgovTmFtZXMgMiAwIFIKPj4KZW5kb2JqCjEgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9Db3VudCAxCi9LaWRzIFs3IDAgUl0KPj4KZW5kb2JqCjIgMCBvYmoKPDwKL0Rlc3RzIDw8CiAgL05hbWVzIFsKXQo+Pgo+PgplbmRvYmoKeHJlZgowIDE0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMTUzNyAwMDAwMCBuIAowMDAwMDAxNTk0IDAwMDAwIG4gCjAwMDAwMDE0NzUgMDAwMDAgbiAKMDAwMDAwMTQ1NCAwMDAwMCBuIAowMDAwMDAwMjU0IDAwMDAwIG4gCjAwMDAwMDAxMzcgMDAwMDAgbiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAxMjU1IDAwMDAwIG4gCjAwMDAwMDEzNTIgMDAwMDAgbiAKMDAwMDAwMTE3OSAwMDAwMCBuIAowMDAwMDAxMDkzIDAwMDAwIG4gCjAwMDAwMDExMTggMDAwMDAgbiAKMDAwMDAwMTE0MyAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDE0Ci9Sb290IDMgMCBSCi9JbmZvIDEwIDAgUgovSUQgWzxlYTM0YmQ4NTgyZThlZGU3ZjRhZWViMjcxYWFkNmM5Mj4gPGVhMzRiZDg1ODJlOGVkZTdmNGFlZWIyNzFhYWQ2YzkyPl0KPj4Kc3RhcnR4cmVmCjE2NDEKJSVFT0YK';
