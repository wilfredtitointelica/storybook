// Data fija de ejemplo para las stories de TPE Analytics. No pega a ningún backend real.
// Las 3 cards, el rating y el gráfico calcan una captura real de producción (cuenta de Wilfredo Tito).
import {
  ClientCountryTpeResponse,
  FiltersTpeResponse,
  MerchantNonComplianceSummaryResponse,
  MerchantNonComplianceTopMerchantResponse,
  MerchantReportResponse,
  MonthlyExpenseResponse,
  PenaltyFeeResponse,
  PenaltyFeesOverviewResponse,
  PenaltyMccDetailResponse,
  PenaltyMccResponse,
  PenaltyMerchantDetailResponse,
  RatingResponse,
  TariffDetailPopupSimpleResponse,
} from '../../mirrors/fee/tpe/dto/tpe-responses.dto';

// enabledDates cubre TODO el rango [minDate, maxDate] día a día: si faltara alguno,
// TpeFilterService lo trataría como "fecha deshabilitada" (disabledDates) en el datepicker.
function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (cursor.getTime() <= last.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// minDate/maxDate son la razón real de por qué el filtro por defecto (preset "Current Year")
// termina mostrando "04 jan, 2026 - 23 aug, 2026" en vez de "01 jan - 31 dec": el preset se
// recorta a los bounds reales del cliente (ver TpeFilterService.getPresetRange).
export const tpeClients: ClientCountryTpeResponse[] = [
  {
    clientId: 1,
    clientName: 'MBH Bank',
    clientCurrency: 'EUR',
    countryId: 1,
    countryName: 'Greece',
    minDate: '2026-01-04',
    maxDate: '2026-08-23',
    lastUpdate: '2026-07-21',
    enabledDates: enumerateDates('2026-01-04', '2026-08-23'),
  },
];

// IDs referenciados por resolveTpeMonthlyExpense() más abajo, para devolver datos distintos del
// gráfico "Expense Evolution" según qué comercio/tarifa se seleccione en esos dos selects.
const MERCHANT_360_RESIDENCES_ID = 'M-0002';
const FEE_2PI2012_ID = 102;

// `fees[].name` es el CÓDIGO de tarifa (ej. "2PI2009"), no una descripción — TpeMerchantReport
// resuelve `hasFeeDetail(feeCode)` buscando `fees.find(f => f.name === feeCode)`, así que si el
// nombre fuera una descripción larga el código de la tabla nunca se vería como link (ver captura).
export const tpeFilterOptions: FiltersTpeResponse = {
  icas: ['1234567', '7654321'],
  fees: [
    { id: 101, name: '2PI2009' },
    { id: 102, name: '2PI2012' },
    { id: 103, name: '2PI2011' },
    { id: 104, name: '2PI2010' },
    { id: 105, name: '2PI2014' },
    { id: 106, name: '2PI2003Q' },
    { id: 107, name: '2PI2003A' },
  ],
  merchants: [
    { id: 'M-0001', name: '33 SOLONOS SUITES ATHINA GRC' },
    { id: MERCHANT_360_RESIDENCES_ID, name: '360 RESIDENCES KEF ARGOSTOLI GRC' },
    { id: 'M-0003', name: '4ALL 4COFFEE KOUFALIA GRC' },
    { id: 'M-0004', name: '4ALL 4COFFEE THESSALONIKI GRC' },
    { id: 'M-0005', name: '75 STEPS KASTELLANOI GRC' },
  ],
  feeToIcas: {},
  icaToFees: {},
  // Sin esto, seleccionar un comercio deja el multiselect de tarifas en 0 opciones (ver
  // availableFeeOptions() en tpe-dashboard.component.ts: filtra por merchantToFees[merchantId]).
  merchantToFees: {
    'M-0001': [101, 102, 103, 104, 105, 106, 107],
    [MERCHANT_360_RESIDENCES_ID]: [101, 102, 103, 104, 105, 106, 107],
    'M-0003': [101, 102, 103, 104, 105, 106, 107],
    'M-0004': [101, 102, 103, 104, 105, 106, 107],
    'M-0005': [101, 102, 103, 104, 105, 106, 107],
  },
};

export const tpePenaltiesOverview: PenaltyFeesOverviewResponse = {
  amountPaid: 58230,
  mostCommonFeeCode: '2PI2012',
  mostCommonFeeName: 'PSD2 Keyed Card Present',
};

export const tpeMerchantNonComplianceTopMerchant: MerchantNonComplianceTopMerchantResponse = {
  merchantWithMostPenalties: 'OASA Athens Athens GRC',
};

export const tpeMerchantNonComplianceSummary: MerchantNonComplianceSummaryResponse = {
  totalMerchants: 5336,
};

// value = score crudo (0-1); el dashboard calcula el % mostrado como (1 - value) * 100 = 16.51%,
// letter/description/color alimentan directo el badge y el gauge (ver ratingChartConfig()).
export const tpeRating: RatingResponse = {
  letter: 'C',
  description: 'MODERATE_ISSUES',
  color: '#F2994A',
  value: 0.8349,
};

// Sin filtro de comercio/tarifa (todos) — vista por defecto del dashboard.
export const tpeMonthlyExpense: MonthlyExpenseResponse[] = [
  { yearMonth: 202601, amount: 3500, convertedAmount: 3500, quantity: 210 },
  { yearMonth: 202602, amount: 3000, convertedAmount: 3000, quantity: 185 },
  { yearMonth: 202603, amount: 4300, convertedAmount: 4300, quantity: 260 },
  { yearMonth: 202604, amount: 4000, convertedAmount: 4000, quantity: 240 },
  { yearMonth: 202605, amount: 13200, convertedAmount: 13200, quantity: 780 },
  { yearMonth: 202606, amount: 11500, convertedAmount: 11500, quantity: 690 },
  { yearMonth: 202607, amount: 4700, convertedAmount: 4700, quantity: 270 },
  { yearMonth: 202608, amount: 1900, convertedAmount: 1900, quantity: 110 },
];

// Filtrado por comercio "360 Residences Kef Argostoli GRC" (todas las tarifas) — solo tiene
// actividad Abr-Jul, el resto de meses queda en 0 (sin barra), igual que en la captura real.
const tpeMonthlyExpenseMerchant360: MonthlyExpenseResponse[] = [
  { yearMonth: 202601, amount: 0, convertedAmount: 0, quantity: 0 },
  { yearMonth: 202602, amount: 0, convertedAmount: 0, quantity: 0 },
  { yearMonth: 202603, amount: 0, convertedAmount: 0, quantity: 0 },
  { yearMonth: 202604, amount: 1800, convertedAmount: 1800, quantity: 42 },
  { yearMonth: 202605, amount: 2800, convertedAmount: 2800, quantity: 65 },
  { yearMonth: 202606, amount: 1100, convertedAmount: 1100, quantity: 26 },
  { yearMonth: 202607, amount: 350, convertedAmount: 350, quantity: 9 },
  { yearMonth: 202608, amount: 0, convertedAmount: 0, quantity: 0 },
];

// Filtrado por tarifa "2PI2012" (todos los comercios) — actividad los 8 meses, pico en Jun.
const tpeMonthlyExpenseFee2PI2012: MonthlyExpenseResponse[] = [
  { yearMonth: 202601, amount: 350, convertedAmount: 350, quantity: 120 },
  { yearMonth: 202602, amount: 450, convertedAmount: 450, quantity: 150 },
  { yearMonth: 202603, amount: 500, convertedAmount: 500, quantity: 165 },
  { yearMonth: 202604, amount: 2200, convertedAmount: 2200, quantity: 730 },
  { yearMonth: 202605, amount: 4800, convertedAmount: 4800, quantity: 1590 },
  { yearMonth: 202606, amount: 6200, convertedAmount: 6200, quantity: 2050 },
  { yearMonth: 202607, amount: 3900, convertedAmount: 3900, quantity: 1290 },
  { yearMonth: 202608, amount: 2200, convertedAmount: 2200, quantity: 730 },
];

// El gráfico "Expense Evolution" pasa `merchant`/`fees` al pedir los datos (ver
// tpe-dashboard.component.ts: getMonthlyExpense({..., merchant, fees})) — acá se elige el dataset
// según esa selección, igual que haría el backend real.
export function resolveTpeMonthlyExpense(merchant?: string | null, fees?: number[] | null): MonthlyExpenseResponse[] {
  if (merchant === MERCHANT_360_RESIDENCES_ID) return tpeMonthlyExpenseMerchant360;
  if (merchant == null && fees?.length === 1 && fees[0] === FEE_2PI2012_ID) return tpeMonthlyExpenseFee2PI2012;
  return tpeMonthlyExpense;
}

// --- Top penalties paid by Fee (tpe-penalties-paid, tab "Fee") ---
// El componente ordena descendente y auto-selecciona la barra más alta (2PI2012) al cargar.
export const tpePenaltiesByFee: PenaltyFeeResponse[] = [
  {
    feeId: 102,
    feeCode: '2PI2012',
    feeName: 'PSD2 Keyed Card Present',
    feeDescription:
      'Acquirers pay a weekly flat fee based on the number of keyed transaction occurring in a card-present environment. The purpose of the TPE program and platform is to identify unfavorable transaction processing behavior trends and drive positive processing behavior change resulting in a more seamless network experience for all parties involved.',
    amount: 35180,
  },
  { feeId: 101, feeCode: '2PI2009', feeName: 'Excessive Card-Not-Present Fraud', feeDescription: 'Acquirers pay a fee for merchants with excessive card-not-present fraud levels.', amount: 18250 },
  { feeId: 103, feeCode: '2PI2011', feeName: 'Excessive Authorization Reversals', feeDescription: 'Acquirers pay a fee for merchants with an excessive rate of authorization reversals.', amount: 2210 },
  { feeId: 104, feeCode: '2PI2010', feeName: 'Excessive Chargebacks', feeDescription: 'Acquirers pay a fee for merchants with an excessive chargeback ratio.', amount: 1440 },
  { feeId: 105, feeCode: '2PI2014', feeName: 'Excessive Authorization Attempts', feeDescription: 'Acquirers pay a fee for merchants with an excessive number of authorization attempts per transaction.', amount: 1160 },
  { feeId: 106, feeCode: '2PI2003Q', feeName: 'Quarterly Non-Compliance Assessment', feeDescription: 'Quarterly assessment applied to merchants that remain non-compliant after the warning period.', amount: 0.4 },
  { feeId: 107, feeCode: '2PI2003A', feeName: 'Annual Non-Compliance Assessment', feeDescription: 'Annual assessment applied to merchants that remain non-compliant after the warning period.', amount: 0.04 },
];

// Tarifa mostrada al seleccionar una barra (por defecto, la primera = feeId 102). Solo se modeló
// el detalle real para 2PI2012 (la que se ve en la captura); las demás caen al fallback genérico.
const tpeTariffByFeeId: Record<number, TariffDetailPopupSimpleResponse> = {
  102: buildTariff('Transaction Processing Excellence (TPE) - Payment Service Directives (PSD2) Keyed Card-Present', 0.3),
};

function buildTariff(description: string, tierValue: number): TariffDetailPopupSimpleResponse {
  return {
    tariffId: 1,
    tariffDetailId: 1,
    begin: null,
    end: null,
    unitId: null,
    methodId: 1, // != 0 => tariffMethod = "Volumen" (ver tpe-penalties-paid.component.ts)
    currencyId: null,
    status: true,
    frecuencyId: null,
    tariffMultipleRateFlag: null,
    tariffMultipleCountryFlag: null,
    additionalConfigurationId: null,
    minAmount: null,
    maxAmount: null,
    dependantFees: [],
    associatedFees: [],
    tiers: [{ tariffTierId: 1, order: 1, description, minValue: null, maxValue: null, tierValue }],
    rules: [],
    currencyCode: null,
    transactionTypes: null,
    scopes: null,
    productTypes: null,
    associatedFeeCodes: null,
    frecuencyName: null,
    rateUnit: null,
  };
}

export function getTpeTariff(feeId: number): TariffDetailPopupSimpleResponse {
  const fee = tpePenaltiesByFee.find(f => f.feeId === feeId);
  return tpeTariffByFeeId[feeId] ?? buildTariff(fee ? `${fee.feeCode} - ${fee.feeName}` : 'TPE Fee', 0.3);
}

// --- Top penalties paid by MCC (tpe-penalties-paid, tab "MCC") ---
// El componente ordena ascendente y auto-selecciona la ÚLTIMA barra visual (= la más alta, Lodging).
// El chart usa un canvas de alto FIJO (mccChartContainerStyle = 1200px, ver
// tpe-penalties-paid.component.ts) con barras de grosor fijo (barWidth 32px) — con pocos items
// (ej. solo 10) esa altura fija se reparte entre pocas barras y se ven separaciones enormes. La
// cantidad real de MCCs llena ese espacio de forma pareja; por eso se amplió la lista a ~20 (cerca
// del tope real MAX_MCCS=25) en vez de tocar el componente — el espaciado no era un bug de código,
// era el fixture con muy pocos ítems para ese layout.
export const tpePenaltiesByMcc: PenaltyMccResponse[] = [
  { mccId: 1, mccDescription: 'Lodging-Hotels,Motels,Resorts-Not Classified', amount: 34590 },
  { mccId: 2, mccDescription: 'Bus Lines', amount: 18660 },
  { mccId: 3, mccDescription: 'Utilities-Electric, Gas, Water, Sanitary', amount: 1800 },
  { mccId: 4, mccDescription: 'Transportation-Suburban and Local Commuter Passenger', amount: 1140 },
  { mccId: 5, mccDescription: 'Grocery Stores, Supermarkets', amount: 469.34 },
  { mccId: 6, mccDescription: 'Professional Services (Not Elsewhere Classified)', amount: 286.0 },
  { mccId: 7, mccDescription: 'Insurance Sales, Underwriting, and Premiums', amount: 227.69 },
  { mccId: 8, mccDescription: 'Service Stations (With or Without Ancillary Services)', amount: 204.91 },
  { mccId: 9, mccDescription: 'Travel Agencies and Tour Operators', amount: 183.07 },
  { mccId: 10, mccDescription: 'Campgrounds and Trailer Parks', amount: 130.13 },
  { mccId: 11, mccDescription: 'Restaurants and Eating Places', amount: 118.4 },
  { mccId: 12, mccDescription: 'Taxicabs and Limousines', amount: 102.75 },
  { mccId: 13, mccDescription: 'Drug Stores and Pharmacies', amount: 94.6 },
  { mccId: 14, mccDescription: 'Automobile Parking Lots and Garages', amount: 86.2 },
  { mccId: 15, mccDescription: 'Discount Stores', amount: 79.9 },
  { mccId: 16, mccDescription: 'Bakeries', amount: 68.3 },
  { mccId: 17, mccDescription: 'Bookstores', amount: 55.1 },
  { mccId: 18, mccDescription: 'Florists', amount: 41.75 },
  { mccId: 19, mccDescription: 'Hardware Stores', amount: 33.2 },
  { mccId: 20, mccDescription: 'Laundry and Cleaning Services', amount: 24.6 },
];

// Detalle de comercios por MCC — solo se modeló el de la captura (mccId 1, Lodging); el resto cae
// a lista vacía (estado "No data"), real pero no verificado pixel a pixel.
const tpeMccMerchantDetails: Record<number, PenaltyMccDetailResponse[]> = {
  1: [
    { merchantId: '3305414', merchantName: 'ZEUS HOTEL ATHINA GRC', amount: 360.9 },
    { merchantId: '5574463', merchantName: 'COLORS HOTELS THESSALONIK GRC', amount: 303.0 },
    { merchantId: '4402502', merchantName: 'MARBLE HOUSE ATHINA GRC', amount: 288.9 },
    { merchantId: '3305732', merchantName: 'PELLA INN ATHINA GRC', amount: 284.4 },
    { merchantId: '1946838', merchantName: 'KALLISTI HOTEL THIRA GRC', amount: 282.0 },
    { merchantId: '1341', merchantName: 'CORFU HOLIDAY PALA KERKYRA GRC', amount: 272.1 },
    { merchantId: '5202922', merchantName: 'AMVROSIA SOUITES ATHINA GRC', amount: 235.2 },
    { merchantId: '5046505', merchantName: 'KRESTEN PALACE RODOS GRC', amount: 228.65 },
    { merchantId: '5501903', merchantName: 'ATHENS HABITAT MAROUSI GRC', amount: 225.0 },
    { merchantId: '5098262', merchantName: 'HOTELNET EE ATHINA GRC', amount: 215.4 },
  ],
};

export function getTpeMccMerchantDetails(mccId: number): PenaltyMccDetailResponse[] {
  return tpeMccMerchantDetails[mccId] ?? [];
}

// Detalle de penalidades al abrir el modal "Fee Detail | Merchant: ..." (clic en el ícono de una
// fila del detalle de MCC). Solo se modeló el de ZEUS HOTEL (el de la captura).
const tpeMerchantPenaltyDetails: Record<string, PenaltyMerchantDetailResponse[]> = {
  '3305414': [
    { date: '2026-08-22', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 74, currencyBilling: 'EUR', amount: 22.2 },
    { date: '2026-08-15', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 81, currencyBilling: 'EUR', amount: 24.3 },
    { date: '2026-08-08', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 84, currencyBilling: 'EUR', amount: 25.2 },
    { date: '2026-08-01', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 71, currencyBilling: 'EUR', amount: 21.3 },
    { date: '2026-07-25', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 83, currencyBilling: 'EUR', amount: 24.9 },
    { date: '2026-07-18', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 31, currencyBilling: 'EUR', amount: 9.3 },
    { date: '2026-07-11', feeId: 102, feeCode: '2PI2012', feeName: 'PSD2 Keyed Card Present', currencyRate: 'EUR', rate: 0.3, events: 74, currencyBilling: 'EUR', amount: 22.2 },
  ],
};

export function getTpeMerchantPenaltyDetails(merchantId: string): PenaltyMerchantDetailResponse[] {
  return tpeMerchantPenaltyDetails[merchantId] ?? [];
}

// --- Merchant Report (tpe-merchant-report) ---
export const tpeMerchantReportRows: MerchantReportResponse[] = [
  { documentDate: '2026-04-12', documentDateFormat: '12 Apr, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 18670, convertedAmount: 0, tierValue: 0.045, feeValue: 840.15 },
  { documentDate: '2026-04-05', documentDateFormat: '05 Apr, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 18563, convertedAmount: 0, tierValue: 0.045, feeValue: 835.34 },
  { documentDate: '2026-05-20', documentDateFormat: '20 May, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 18197, convertedAmount: 0, tierValue: 0.045, feeValue: 818.87 },
  { documentDate: '2026-04-19', documentDateFormat: '19 Apr, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 17751, convertedAmount: 0, tierValue: 0.045, feeValue: 798.8 },
  { documentDate: '2026-05-31', documentDateFormat: '31 May, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 17724, convertedAmount: 0, tierValue: 0.045, feeValue: 797.58 },
  { documentDate: '2026-05-10', documentDateFormat: '10 May, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 17674, convertedAmount: 0, tierValue: 0.045, feeValue: 795.33 },
  { documentDate: '2026-03-29', documentDateFormat: '29 Mar, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 17438, convertedAmount: 0, tierValue: 0.045, feeValue: 784.71 },
  { documentDate: '2026-03-08', documentDateFormat: '08 Mar, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 16973, convertedAmount: 0, tierValue: 0.045, feeValue: 763.79 },
  { documentDate: '2026-03-15', documentDateFormat: '15 Mar, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 16950, convertedAmount: 0, tierValue: 0.045, feeValue: 762.75 },
  { documentDate: '2026-05-24', documentDateFormat: '24 May, 2026', feeCode: '2PI2009', ica: '32208', merchantName: 'OASA Athens Athens GRC', merchantId: 5244587, quantityNumber: 16875, convertedAmount: 0, tierValue: 0.045, feeValue: 759.38 },
];

// totalAmount/totalCount son un campo aparte del backend (agregado sobre TODO el set filtrado, no
// solo la página actual) — coincide con la fila "Total" (58,231.79) y "Page 1 of 2748" (pageSize 10).
export const tpeMerchantReportSummary = { totalAmount: 58231.79, totalCount: 27480 };
