// Data fija de ejemplo para las stories de Landing (Incontrol Panel). No pega a ningún backend real.
// Los números de Total Fee Expenses / Main Opportunities calcan capturas reales de producción
// (cuenta de Wilfredo Tito). Net Fees by Scheme, Performance Score (monto) y Unit Cost by Product
// no tenían todos los valores legibles en la captura -> se completaron con cifras razonables
// y consistentes con el resto (documentado en README/memoria), NO son pixel-exactos.
import {
  BannerFinancialImpactResponse,
  FeeExpensesResponse,
  MainOpportunitiesResponse,
  NetFeesBySchemeTableResponse,
  PerformanceScoreResponse,
  UnitCostByProductDataResponse,
  UnitCostByProductResponse,
  UnitCostByProductTableResponse,
  UpcomingAnnouncementsResponse,
} from '../../mirrors/fee/landing/dto/landing-responses.dto';
import { BrandEnum } from '../../mirrors/fee/library/common/enums';
import { BusinessEnum, CategoryEnum, TransactionEnum } from '../../mirrors/fee/landing/common/enums/landing.enum';

const CURRENCY = 'EUR';

// --- Total Fee Expenses (3 tabs) ---
// Last Month (Jul26): Mastercard 3.21M + Visa 2.25M = 5.46M, todo Acquirer/Purchase (Acquirer Merchant).
// Current Month (Aug26, parcial): Mastercard 2.68M (Acquirer/Purchase) + Visa -18.07K (NotSpecified -> "Not allocated") = 2.66M.
// Last 12 Months (Sep25-Aug26): Mastercard 20.71M + Visa 10.75M = 31.46M; por negocio: Acquirer Merchant 31.48M + Not allocated -18.07K
// (esa fila -18.07K es la MISMA de Current Month, incluida dentro del rango de 12 meses).
export const landingFeeExpenses: FeeExpensesResponse = {
  totalFees: {
    currencyCode: CURRENCY,
    monthShort: 'Aug26',
    monthShortComparison: 'Jul26',
    lastMonthShort: 'Jul26',
    lastMonthShortComparison: 'Jun26',
    last12MonthShortComparison: 'Sep24-Aug25',
    // Current month (parcial, sin comparación mostrada en UI)
    lastValueAmount: [
      { brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 8, amount: 2680000 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.NotSpecified, transactionId: 0, monthId: 8, amount: -18070 },
    ],
    lastValueAmountComparison: [],
    // Last month (Jul26)
    lastMonthAmount: [
      { brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 7, amount: 3210000 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 7, amount: 2250000 },
    ],
    lastMonthAmountComparison: [
      { brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 6, amount: 3070000 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 6, amount: 2340000 },
    ],
    // Last 12 months (Sep25-Aug26)
    last12MonthAmount: [
      { brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 0, amount: 20710000 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 0, amount: 10768070 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.NotSpecified, transactionId: 0, monthId: 8, amount: -18070 },
    ],
    last12MonthAmountComparison: [
      { brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 0, amount: 19850000 },
      { brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, transactionId: TransactionEnum.Purchase, monthId: 0, amount: 11020000 },
    ],
  },
  // --- Net Fees by Scheme (Sep25-Aug26), Mastercard + Visa ---
  netFees: {
    currencyCode: CURRENCY,
    startDateLabel: 'Sep 2025',
    endDateLabel: 'Aug 2026',
    table: buildNetFeesTable(),
  },
};

function buildNetFeesTable(): NetFeesBySchemeTableResponse[] {
  const months = [
    { id: 1, short: 'Sep', label: 'September 2025' },
    { id: 2, short: 'Oct', label: 'October 2025' },
    { id: 3, short: 'Nov', label: 'November 2025' },
    { id: 4, short: 'Dec', label: 'December 2025' },
    { id: 5, short: 'Jan', label: 'January 2026' },
    { id: 6, short: 'Feb', label: 'February 2026' },
    { id: 7, short: 'Mar', label: 'March 2026' },
    { id: 8, short: 'Apr', label: 'April 2026' },
    { id: 9, short: 'May', label: 'May 2026' },
    { id: 10, short: 'Jun', label: 'June 2026' },
    { id: 11, short: 'Jul', label: 'July 2026' },
    { id: 12, short: 'Aug', label: 'August 2026' },
  ];
  const mastercardGross = [265000, 258000, 271000, 290000, 233000, 248000, 261000, 255000, 270000, 281000, 296000, 305000];
  const visaGross = [178000, 182000, 175000, 190000, 165000, 171000, 180000, 176000, 185000, 192000, 198000, 205000];
  const returnsRate = 0.03;
  const exclusionsRate = 0.015;

  const rows: NetFeesBySchemeTableResponse[] = [];
  months.forEach((m, i) => {
    for (const [brandId, gross] of [
      [BrandEnum.Mastercard, mastercardGross[i]],
      [BrandEnum.Visa, visaGross[i]],
    ] as const) {
      const returns = Math.round(gross * returnsRate);
      const exclusions = Math.round(gross * exclusionsRate);
      rows.push({
        brandId,
        monthId: m.id,
        monthShort: m.short,
        monthLabel: m.label,
        amount: gross - returns - exclusions,
        grossFees: gross,
        returns,
        exclusions,
      });
    }
  });
  return rows;
}

// --- Performance Score: "B" (76/100) ---
export const landingPerformanceScore: PerformanceScoreResponse = {
  currencyCode: CURRENCY,
  score: 76,
  amount: 120650,
};

// --- Main Opportunities: Penalties / Opt-Out Services tabs ---
// Penalties: Aug26 18.38K/-42.06%, YTD 110.34K/-45.28% (Mastercard 13.17K/72.73K, Visa 5.21K/37.61K)
// Opt-Out Services: Aug26 1.46K/+9.86%, YTD 10.31K/+93.41% (Mastercard 1.33K/9.33K, Visa 131.41/981.54)
const mainOpportunitiesByCategory: Record<number, MainOpportunitiesResponse> = {
  [CategoryEnum.Penalties]: {
    currencyCode: CURRENCY,
    monthShort: 'Aug26',
    monthShortComparison: 'Jul26',
    yearShort: '2026',
    yearShortComparison: '2025',
    amountMonth: 18380,
    percentMonth: -42.06,
    amountYear: 110340,
    percentYear: -45.28,
    table: [
      { brandId: BrandEnum.Mastercard, monthAmount: 13170, yearAmount: 72730, monthShort: 'Aug26', yearShort: '2026' },
      { brandId: BrandEnum.Visa, monthAmount: 5210, yearAmount: 37610, monthShort: 'Aug26', yearShort: '2026' },
    ],
  },
  [CategoryEnum.OptOutServices]: {
    currencyCode: CURRENCY,
    monthShort: 'Aug26',
    monthShortComparison: 'Jul26',
    yearShort: '2026',
    yearShortComparison: '2025',
    amountMonth: 1461.41,
    percentMonth: 9.86,
    amountYear: 10311.54,
    percentYear: 93.41,
    table: [
      { brandId: BrandEnum.Mastercard, monthAmount: 1330, yearAmount: 9330, monthShort: 'Aug26', yearShort: '2026' },
      { brandId: BrandEnum.Visa, monthAmount: 131.41, yearAmount: 981.54, monthShort: 'Aug26', yearShort: '2026' },
    ],
  },
};

export function getLandingMainOpportunities(categoryId: number): MainOpportunitiesResponse {
  return mainOpportunitiesByCategory[categoryId] ?? mainOpportunitiesByCategory[CategoryEnum.Penalties];
}

// --- Upcoming Announcements ---
function announcement(partial: Partial<BannerFinancialImpactResponse> & Pick<BannerFinancialImpactResponse, 'documentId' | 'brandId' | 'businessId' | 'finantialTitle'>): BannerFinancialImpactResponse {
  return {
    documentCode: `DOC-${partial.documentId}`,
    regionIds: [1],
    countryIds: [1],
    jurisdiction: 'Europe',
    finantialDescription: 'Detalle del anuncio: revisa el documento adjunto para conocer el impacto financiero completo y las fechas de aplicación.',
    impactTypeIds: [1],
    financialImpactType: [{ id: 1, name: 'Fee change' }],
    business: [{ id: partial.businessId, name: partial.businessId === BusinessEnum.Acquirer ? 'Acquirer' : 'Issuer' }],
    effectiveDate: new Date('2026-09-01'),
    effectiveDateShort: '01 Sep 2026',
    ...partial,
  };
}

export const landingUpcomingAnnouncements: UpcomingAnnouncementsResponse = {
  bannerCount: 14,
  table: [
    announcement({ documentId: 1, brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Acquirer, finantialTitle: 'Mastercard Cross-Border Fee Update — Europe Region', effectiveDateShort: '01 Sep 2026' }),
    announcement({ documentId: 2, brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, finantialTitle: 'Visa Interregional Interchange Adjustment', effectiveDateShort: '15 Sep 2026' }),
    announcement({ documentId: 3, brandId: BrandEnum.Mastercard, businessId: BusinessEnum.Isssuer, finantialTitle: 'Mastercard Issuer Assessment Fee Increase', effectiveDateShort: '01 Oct 2026' }),
    announcement({ documentId: 4, brandId: BrandEnum.Visa, businessId: BusinessEnum.Acquirer, finantialTitle: 'Visa Digital Enablement Program — New Service Fee', effectiveDateShort: '10 Oct 2026' }),
  ],
};

// --- Unit Cost by Product ---
// 4 productos x 4 scopes (Domestic Off-Us / Intraregional / Interregional / Non-EEA) = 16 filas -> 4 páginas de 4.
// Página 1 (Visa Credit Acquiring) calca la captura: 4 scopes con valores trimestrales EUR y variación QoQ.
const unitCostQuarters = [
  { value: 1, label: "Q3'25" },
  { value: 2, label: "Q4'25" },
  { value: 3, label: "Q1'26" },
  { value: 4, label: "Q2'26" },
  { value: 5, label: "Q3'26" },
];

interface ProductScopeSeed {
  brandIndId: number;
  brandIndDesc: string;
  scopeId: number;
  scopeDesc: string;
  fixedCols: [number, number, number, number, number];
  variableCols: [number, number, number, number, number];
}

const unitCostProducts: ProductScopeSeed[] = [
  {
    brandIndId: 1,
    brandIndDesc: 'Visa Credit Acquiring',
    scopeId: 1,
    scopeDesc: 'Domestic Off-Us',
    fixedCols: [0.045, 0.046, 0.044, 0.047, 0.049],
    variableCols: [1.85, 1.82, 1.88, 1.9, 1.94],
  },
  {
    brandIndId: 1,
    brandIndDesc: 'Visa Credit Acquiring',
    scopeId: 2,
    scopeDesc: 'Intraregional',
    fixedCols: [0.062, 0.061, 0.063, 0.065, 0.067],
    variableCols: [2.1, 2.05, 2.12, 2.18, 2.2],
  },
  {
    brandIndId: 1,
    brandIndDesc: 'Visa Credit Acquiring',
    scopeId: 3,
    scopeDesc: 'Interregional',
    fixedCols: [0.088, 0.09, 0.087, 0.092, 0.095],
    variableCols: [2.65, 2.7, 2.6, 2.75, 2.8],
  },
  {
    brandIndId: 1,
    brandIndDesc: 'Visa Credit Acquiring',
    scopeId: 4,
    scopeDesc: 'Non-EEA',
    fixedCols: [0.11, 0.112, 0.109, 0.115, 0.118],
    variableCols: [3.05, 3.1, 3.0, 3.15, 3.2],
  },
  {
    brandIndId: 2,
    brandIndDesc: 'Visa Debit Acquiring',
    scopeId: 1,
    scopeDesc: 'Domestic Off-Us',
    fixedCols: [0.038, 0.037, 0.039, 0.04, 0.041],
    variableCols: [1.2, 1.18, 1.22, 1.25, 1.27],
  },
  {
    brandIndId: 2,
    brandIndDesc: 'Visa Debit Acquiring',
    scopeId: 2,
    scopeDesc: 'Intraregional',
    fixedCols: [0.052, 0.051, 0.053, 0.055, 0.056],
    variableCols: [1.55, 1.52, 1.58, 1.6, 1.63],
  },
  {
    brandIndId: 2,
    brandIndDesc: 'Visa Debit Acquiring',
    scopeId: 3,
    scopeDesc: 'Interregional',
    fixedCols: [0.071, 0.073, 0.07, 0.075, 0.077],
    variableCols: [2.0, 2.05, 1.98, 2.1, 2.12],
  },
  {
    brandIndId: 2,
    brandIndDesc: 'Visa Debit Acquiring',
    scopeId: 4,
    scopeDesc: 'Non-EEA',
    fixedCols: [0.09, 0.093, 0.089, 0.095, 0.097],
    variableCols: [2.4, 2.45, 2.38, 2.5, 2.55],
  },
  {
    brandIndId: 3,
    brandIndDesc: 'Mastercard Credit Acquiring',
    scopeId: 1,
    scopeDesc: 'Domestic Off-Us',
    fixedCols: [0.047, 0.048, 0.046, 0.049, 0.051],
    variableCols: [1.9, 1.87, 1.93, 1.96, 2.0],
  },
  {
    brandIndId: 3,
    brandIndDesc: 'Mastercard Credit Acquiring',
    scopeId: 2,
    scopeDesc: 'Intraregional',
    fixedCols: [0.064, 0.063, 0.065, 0.067, 0.069],
    variableCols: [2.15, 2.1, 2.18, 2.22, 2.25],
  },
  {
    brandIndId: 3,
    brandIndDesc: 'Mastercard Credit Acquiring',
    scopeId: 3,
    scopeDesc: 'Interregional',
    fixedCols: [0.091, 0.093, 0.09, 0.095, 0.098],
    variableCols: [2.7, 2.75, 2.65, 2.8, 2.85],
  },
  {
    brandIndId: 3,
    brandIndDesc: 'Mastercard Credit Acquiring',
    scopeId: 4,
    scopeDesc: 'Non-EEA',
    fixedCols: [0.113, 0.115, 0.112, 0.118, 0.121],
    variableCols: [3.1, 3.15, 3.05, 3.2, 3.25],
  },
  {
    brandIndId: 4,
    brandIndDesc: 'Mastercard Debit Acquiring',
    scopeId: 1,
    scopeDesc: 'Domestic Off-Us',
    fixedCols: [0.04, 0.039, 0.041, 0.042, 0.043],
    variableCols: [1.25, 1.22, 1.28, 1.3, 1.32],
  },
  {
    brandIndId: 4,
    brandIndDesc: 'Mastercard Debit Acquiring',
    scopeId: 2,
    scopeDesc: 'Intraregional',
    fixedCols: [0.054, 0.053, 0.055, 0.057, 0.058],
    variableCols: [1.6, 1.57, 1.63, 1.65, 1.68],
  },
  {
    brandIndId: 4,
    brandIndDesc: 'Mastercard Debit Acquiring',
    scopeId: 3,
    scopeDesc: 'Interregional',
    fixedCols: [0.073, 0.075, 0.072, 0.077, 0.079],
    variableCols: [2.05, 2.1, 2.02, 2.15, 2.18],
  },
  {
    brandIndId: 4,
    brandIndDesc: 'Mastercard Debit Acquiring',
    scopeId: 4,
    scopeDesc: 'Non-EEA',
    fixedCols: [0.092, 0.095, 0.091, 0.097, 0.099],
    variableCols: [2.45, 2.5, 2.4, 2.55, 2.58],
  },
];

function qoq(cols: readonly number[]): number {
  const prev = cols[cols.length - 2];
  const current = cols[cols.length - 1];
  if (!prev) return 0;
  return ((current - prev) / prev) * 100;
}

function buildUnitCostTable(unitCostTypeId: number): UnitCostByProductTableResponse[] {
  return unitCostProducts.map(p => {
    const cols = unitCostTypeId === 1 /* Fixed */ ? p.fixedCols : p.variableCols;
    return {
      brandIndId: p.brandIndId,
      scopeId: p.scopeId,
      brandIndDesc: p.brandIndDesc,
      scopeDesc: p.scopeDesc,
      col1: cols[0],
      col2: cols[1],
      col3: cols[2],
      col4: cols[3],
      col5: cols[4],
      qoq: qoq(cols),
    };
  });
}

function buildUnitCostTotal(unitCostTypeId: number): UnitCostByProductTableResponse {
  const rows = buildUnitCostTable(unitCostTypeId);
  const avg = (pick: (r: UnitCostByProductTableResponse) => number) => rows.reduce((sum, r) => sum + pick(r), 0) / rows.length;
  const cols: [number, number, number, number, number] = [avg(r => r.col1), avg(r => r.col2), avg(r => r.col3), avg(r => r.col4), avg(r => r.col5)];
  return {
    brandIndId: -1,
    scopeId: -1,
    brandIndDesc: 'Total',
    scopeDesc: 'Weighted average',
    col1: cols[0],
    col2: cols[1],
    col3: cols[2],
    col4: cols[3],
    col5: cols[4],
    qoq: qoq(cols),
  };
}

const unitCostDataRows: UnitCostByProductDataResponse[] = unitCostProducts.flatMap(p =>
  [1, 0].map(unitCostTypeId => {
    const cols = unitCostTypeId === 1 ? p.fixedCols : p.variableCols;
    return {
      id: p.brandIndId * 10 + p.scopeId,
      brandIndId: p.brandIndId,
      brandIndIds: [p.brandIndId],
      brandCredit: p.brandIndDesc,
      quarterId: unitCostQuarters[unitCostQuarters.length - 1].value,
      unitCostTypeId,
      value: cols[cols.length - 1].toString(),
    };
  })
);

export function getLandingUnitCostByProduct(unitCostTypeId: number, _businessTransactionId: number): UnitCostByProductResponse {
  const total = buildUnitCostTotal(unitCostTypeId);
  return {
    currencyCode: CURRENCY,
    quarters: unitCostQuarters,
    data: unitCostDataRows,
    // El componente (unit-cost.ts) deriva `rows()`/`total()` filtrando ESTE mismo array por
    // brandIndId !== -1 / === -1 -> la fila total debe ir DENTRO de `table`, no solo en el campo
    // `total` de arriba (que el componente real nunca lee).
    table: [...buildUnitCostTable(unitCostTypeId), total],
    total,
  };
}
