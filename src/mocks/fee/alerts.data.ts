// Data fija de ejemplo para las stories de Alerts. No pega a ningún backend real.
// La mayoría de los ítems del Inbox (ver `inboxSeeds`) calcan 2 capturas reales de producción
// (cuenta de Wilfredo Tito) tomadas en momentos distintos — por eso el mismo "Week of Jul 27th"
// aparece DOS veces con conteos distintos (14 vs 35): son 2 alertas separadas para la misma
// semana de facturación, publicadas en fechas distintas (03 aug vs 10 aug) — el backend real
// genera una alerta nueva cuando llega data tardía/reconciliada para una semana ya alertada antes,
// no es un duplicado inventado. El resto (semanas Jun/Jul más viejas y el tab "Read", sin captura)
// usa cifras razonables e internamente consistentes, no pixel-exactas — documentado en
// README/memoria.
import { AlertFeeDetail, AlertGroupCard, AlertGroupDetailResponse, BrandTotal } from '../../mirrors/fee/alerts/dto/alerts-responses.dto';

const CURRENCY = 'EUR';
type Brand = 'Mastercard' | 'Visa';

function iso(date: string): string {
  return `${date}T00:00:00`;
}

interface CardSeed {
  alertType: 1 | 2; // 1 = New Fees, 2 = Penalties
  billingMonday: string; // 'YYYY-MM-DD' — lunes de la semana de facturación (título "Week of ...")
  createdRealDate: string; // 'YYYY-MM-DD' — fecha de publicación real (columna derecha de la lista)
  brands: Brand[];
  totalCount: number;
  totalAmount: number;
  brandAmounts?: Partial<Record<Brand, number>>; // split por marca para "Total Amounts" (si hay más de 1 marca)
  firstFee?: AlertFeeDetail; // fila EXACTA de captura para el detalle (si no, se genera una del pool)
}

function buildCard(seed: CardSeed): AlertGroupCard {
  // La lista (AlertsListComponent.buildStats()) muestra, además del conteo, o el desglose por
  // marca O el monto total — NUNCA los 2 — y cuál de los 2 depende del TIPO de alerta, no de
  // cuántas marcas tenga: en la captura real, las tarjetas "New Fees" siempre traen
  // brandBreakdown (ej. "New Fees: 18 | Mastercard: 18", sin monto) y las "Penalties" siempre
  // traen el monto (ej. "Penalties: 14 | EUR 1,140.35", sin desglose de marca) — incluso la única
  // Penalties multi-marca (35, Mastercard+Visa) se ve con solo 2 líneas, igual que las demás.
  const isNewFees = seed.alertType === 1;
  return {
    alertType: seed.alertType,
    alertTypeName: isNewFees ? 'New Fees' : 'Penalties',
    title: '',
    billingDate: iso(seed.billingMonday),
    createdRealDate: iso(seed.createdRealDate),
    totalCount: seed.totalCount,
    brands: seed.brands,
    brandBreakdown: isNewFees ? [{ brandName: seed.brands[0], count: seed.totalCount }] : [],
    totalAmount: isNewFees ? null : seed.totalAmount,
    currencyCode: isNewFees ? null : CURRENCY,
    isRead: false,
    isViewed: false,
  };
}

// La primera fila EXACTA de la captura para "New Fees - Week of Aug 3rd".
const AUG_3RD_FIRST_FEE: AlertFeeDetail = {
  alertId: 1,
  feeId: 2001,
  bankId: 1,
  feeName: 'Mastercard Payment Gateway Service (MPGS) - Account to Account',
  feeCode: '2PG2035',
  brandName: 'Mastercard',
  amount: 11.75,
  currencyCode: CURRENCY,
  billingDate: iso('2026-08-08'),
  businessName: 'Acquirer',
  productCode: '32208',
  productActivityDescription: '32208',
};

// La primera fila EXACTA de la captura para "Penalties - Week of Jul 27th" (v1, publicada 03 aug).
const JUL_27TH_V1_FIRST_PENALTY: AlertFeeDetail = {
  alertId: 2,
  feeId: 3001,
  bankId: 1,
  feeName: 'Penalty - Transaction Processing Excellence (TPE) | PSD2 Keyed Card Present',
  feeCode: '2PI2012',
  brandName: 'Mastercard',
  amount: 85.6,
  currencyCode: CURRENCY,
  billingDate: iso('2026-07-27'),
  businessName: 'Acquirer',
  productCode: '32208',
  productActivityDescription: '32208',
};

// La primera fila EXACTA de la captura para "Penalties - Week of Aug 24th".
const AUG_24TH_FIRST_PENALTY: AlertFeeDetail = {
  alertId: 3,
  feeId: 3050,
  bankId: 1,
  feeName: 'Penalty - Data Integrity Monitoring Program',
  feeCode: 'TDC0100',
  brandName: 'Mastercard',
  amount: 2500.0,
  currencyCode: CURRENCY,
  billingDate: iso('2026-08-30'),
  businessName: 'Member',
  productCode: '32208',
  productActivityDescription: '32208',
};

// --- INBOX: 18 alertas -> "Showing 18 active alerts" con los 3 chips (New Fees/Penalties/Custom)
// activos por defecto, ya que no hay ninguna alerta Custom sembrada. Los primeros 8 calcan las
// 2 capturas reales; los últimos 10 (semanas Jun/Jul más viejas) son padding razonable.
const inboxSeeds: CardSeed[] = [
  { alertType: 1, billingMonday: '2026-08-03', createdRealDate: '2026-08-10', brands: ['Mastercard'], totalCount: 18, totalAmount: 5725.65, firstFee: AUG_3RD_FIRST_FEE },
  { alertType: 2, billingMonday: '2026-07-27', createdRealDate: '2026-08-03', brands: ['Mastercard'], totalCount: 14, totalAmount: 1140.35, firstFee: JUL_27TH_V1_FIRST_PENALTY },
  { alertType: 1, billingMonday: '2026-07-27', createdRealDate: '2026-08-03', brands: ['Mastercard'], totalCount: 3, totalAmount: 842.1 },
  { alertType: 2, billingMonday: '2026-07-20', createdRealDate: '2026-07-27', brands: ['Mastercard'], totalCount: 17, totalAmount: 7993.01 },
  { alertType: 2, billingMonday: '2026-07-27', createdRealDate: '2026-08-10', brands: ['Mastercard', 'Visa'], totalCount: 35, totalAmount: 6350.55, brandAmounts: { Mastercard: 5000.0, Visa: 1350.55 } },
  { alertType: 2, billingMonday: '2026-08-10', createdRealDate: '2026-08-17', brands: ['Mastercard'], totalCount: 13, totalAmount: 1292.27 },
  { alertType: 2, billingMonday: '2026-08-17', createdRealDate: '2026-08-24', brands: ['Mastercard'], totalCount: 14, totalAmount: 1329.47 },
  { alertType: 2, billingMonday: '2026-08-24', createdRealDate: '2026-08-31', brands: ['Mastercard'], totalCount: 18, totalAmount: 8190.92, firstFee: AUG_24TH_FIRST_PENALTY },
  { alertType: 2, billingMonday: '2026-07-13', createdRealDate: '2026-07-20', brands: ['Mastercard'], totalCount: 11, totalAmount: 980.2 },
  { alertType: 1, billingMonday: '2026-07-13', createdRealDate: '2026-07-20', brands: ['Mastercard'], totalCount: 7, totalAmount: 2100.0 },
  { alertType: 2, billingMonday: '2026-07-06', createdRealDate: '2026-07-13', brands: ['Visa'], totalCount: 6, totalAmount: 455.6 },
  { alertType: 1, billingMonday: '2026-07-06', createdRealDate: '2026-07-13', brands: ['Mastercard'], totalCount: 12, totalAmount: 3890.5 },
  { alertType: 2, billingMonday: '2026-06-29', createdRealDate: '2026-07-06', brands: ['Mastercard'], totalCount: 8, totalAmount: 712.3 },
  { alertType: 1, billingMonday: '2026-06-29', createdRealDate: '2026-07-06', brands: ['Visa'], totalCount: 4, totalAmount: 640.0 },
  { alertType: 2, billingMonday: '2026-06-22', createdRealDate: '2026-06-29', brands: ['Mastercard'], totalCount: 15, totalAmount: 1560.9 },
  { alertType: 1, billingMonday: '2026-06-22', createdRealDate: '2026-06-29', brands: ['Mastercard'], totalCount: 9, totalAmount: 2750.25 },
  { alertType: 2, billingMonday: '2026-06-15', createdRealDate: '2026-06-22', brands: ['Visa'], totalCount: 5, totalAmount: 398.45 },
  { alertType: 1, billingMonday: '2026-06-15', createdRealDate: '2026-06-22', brands: ['Mastercard'], totalCount: 6, totalAmount: 1875.6 },
];

// --- READ: sin captura de referencia -> set más chico, cifras razonables (no pixel-exactas).
const readSeeds: CardSeed[] = [
  { alertType: 1, billingMonday: '2026-05-25', createdRealDate: '2026-06-01', brands: ['Mastercard'], totalCount: 10, totalAmount: 3120.4 },
  { alertType: 2, billingMonday: '2026-05-18', createdRealDate: '2026-05-25', brands: ['Visa'], totalCount: 7, totalAmount: 610.2 },
  { alertType: 1, billingMonday: '2026-05-18', createdRealDate: '2026-05-25', brands: ['Mastercard'], totalCount: 5, totalAmount: 1450.0 },
  { alertType: 2, billingMonday: '2026-05-11', createdRealDate: '2026-05-18', brands: ['Mastercard'], totalCount: 9, totalAmount: 830.9 },
  { alertType: 1, billingMonday: '2026-05-04', createdRealDate: '2026-05-11', brands: ['Visa'], totalCount: 6, totalAmount: 1980.55 },
];

export const alertsInboxCards: AlertGroupCard[] = inboxSeeds.map(buildCard);
export const alertsReadCards: AlertGroupCard[] = readSeeds.map(card => ({ ...buildCard(card), isRead: true, isViewed: true }));

// --- Fee/Penalty detail pools (nombres/códigos genéricos para las filas que NO están en captura) ---
const NEW_FEE_NAMES: [string, string][] = [
  ['Mastercard Payment Gateway Service (MPGS) - Account to Account', '2PG2035'],
  ['Mastercard Digital Enablement Service (MDES) - Tokenization', '2MD1042'],
  ['Visa Digital Enablement Program - Provisioning', '3VD2210'],
  ['MasterCom - Filing', '2MS2400'],
  ['Client Implementation - Project Management', '3C2163441'],
  ['Account Verifications (AV) - Domestic', '3J4255125'],
  ['Visa Resolve Online (VROL) - Cases Filed', '3H4010123'],
  ['Mastercard Send - Payment Facilitation', '2SD1187'],
  ['Clearing - Intraregional | Purchase | Representment', '3F3516775'],
  ['Non-Local Currency Settlement - Single Currency', '3VAS03153'],
];

const PENALTY_NAMES: [string, string][] = [
  ['Penalty - Data Integrity Monitoring Program', 'TDC0100'],
  ['Penalty - Transaction Processing Excellence (TPE) | PSD2 Keyed Card Present', '2PI2012'],
  ['Penalty - Acquirer Performance Development', '2APD210'],
  ['Penalty - System Integrity | Interregional | Issuer Will Never Approve', '3J4296051'],
  ['Penalty - Transaction Non-Chip & Non-Contactless', '2HN8341'],
  ['Penalty - Excessive Chargebacks Program', '2EC4410'],
  ['Penalty - Account Data Compromise', '2AD3390'],
  ['Penalty - Fraud Volume Above Threshold', '3FR5521'],
  ['Penalty - Late Presentment', '2LP1120'],
  ['Penalty - Authorization Standards Non-Compliance', '3AS7734'],
  ['Penalty - System Integrity | Interregional | Excess Reattempted Transaction', '3J4296057'],
  ['Penalty - Chip Liability Shift Non-Compliance', '2CL9902'],
];

// Reparte fechas de facturación DENTRO de la semana (lunes..domingo) para las filas generadas —
// en la captura real la fecha de una fila individual no siempre es el lunes del título del grupo
// (ej. "New Fees - Week of Aug 3rd" trae una fila con Billing Date 08 Aug, un sábado de esa semana).
function scatterDateInWeek(billingMonday: string, index: number): string {
  const d = new Date(`${billingMonday}T00:00:00`);
  d.setDate(d.getDate() + (index % 7));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildFees(seed: CardSeed, pool: [string, string][]): AlertFeeDetail[] {
  const fees: AlertFeeDetail[] = [];
  const perItem = seed.totalAmount / seed.totalCount;
  for (let i = 0; i < seed.totalCount; i++) {
    if (i === 0 && seed.firstFee) {
      fees.push(seed.firstFee);
      continue;
    }
    const [feeName, feeCode] = pool[i % pool.length];
    const brand = seed.brands[i % seed.brands.length];
    const isMastercard = brand === 'Mastercard';
    fees.push({
      alertId: 1000 + i,
      feeId: 2000 + i,
      bankId: 1,
      feeName,
      feeCode,
      brandName: brand,
      amount: Math.round(perItem * (0.7 + (i % 5) * 0.15) * 100) / 100,
      currencyCode: CURRENCY,
      billingDate: iso(scatterDateInWeek(seed.billingMonday, i)),
      businessName: i % 2 === 0 ? 'Acquirer' : 'Member',
      productCode: isMastercard ? '32208' : null,
      productActivityDescription: isMastercard ? '32208' : null,
    });
  }
  return fees;
}

function totalsByBrand(seed: CardSeed): BrandTotal[] {
  if (seed.brands.length > 1 && seed.brandAmounts) {
    return seed.brands.map(b => ({ brandName: b, totalAmount: seed.brandAmounts![b] ?? 0, currencyCode: CURRENCY }));
  }
  return [{ brandName: seed.brands[0], totalAmount: seed.totalAmount, currencyCode: CURRENCY }];
}

function buildDetail(seed: CardSeed): AlertGroupDetailResponse {
  const pool = seed.alertType === 1 ? NEW_FEE_NAMES : PENALTY_NAMES;
  return {
    alertType: seed.alertType,
    alertTypeName: seed.alertType === 1 ? 'New Fees' : 'Penalties',
    title: '',
    createdRealDate: iso(seed.createdRealDate),
    totalCount: seed.totalCount,
    totalAmountsByBrand: totalsByBrand(seed),
    fees: buildFees(seed, pool),
    isRead: false,
  };
}

const detailByKey = new Map<string, AlertGroupDetailResponse>();
for (const seed of [...inboxSeeds, ...readSeeds]) {
  detailByKey.set(`${seed.alertType}-${iso(seed.createdRealDate)}`, buildDetail(seed));
}

export function getAlertDetailFixture(alertType: number, createdRealDate: string): AlertGroupDetailResponse | null {
  return detailByKey.get(`${alertType}-${createdRealDate}`) ?? null;
}
