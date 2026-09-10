// Data fija de ejemplo para las stories de Opt-Out Services. No pega a ningún backend real.
// Las 3 cards y el gráfico calcan una captura real de producción (cuenta de Wilfredo Tito).
import {
  CardOptOutSavingsResponse,
  CardUpcomingOptOutsResponse,
  GraphOptOutBillingEvolutionResponse,
  OptOutFlowResponse,
  OptOutSavingsListSummaryResponse,
  OptOutSavingsSummaryResponse,
  OptOutServicesFilterResponse,
  TopOptOutSubscriptionsCardResponse,
  TopOptOutSubscriptionsListResponse,
  UpcomingListResponse,
} from '../../mirrors/fee/opt-out-service/dto/opt-out-service-responses.dto';
import { BrandEnum } from '../../mirrors/fee/library/common/enums';
import { ContactTypeEnum, PeriodFilterTypeEnum, UpcomingOptOutStatusEnum, UsageLevelEnum, VariationTrendEnum } from '../../mirrors/fee/opt-out-service/common/enums/opt-out-service.enum';
import { FinancialCategoryEnum } from '../../mirrors/fee/library/common/enums';

export const optOutFilterOptions: OptOutServicesFilterResponse = {
  clients: [{ bankId: 501, bankName: 'MBH Bank', regionId: 1, countryId: 1 }],
  brands: [
    { id: 1, name: 'Mastercard' },
    { id: 2, name: 'Visa' },
  ],
  business: [
    { id: 1, name: 'Acquirer' },
    { id: 2, name: 'Issuer' },
  ],
  // Custom: boundaries amplios para no recortar los presets Last12Months/CurrentYear del datepicker
  // (se calculan desde la fecha real del sistema, igual que en producción).
  periods: [{ filterType: PeriodFilterTypeEnum.Custom, term: '', suffix: '', startDate: '2020-01-01', endDate: '2030-12-31' }],
  currency: { id: 1, name: 'Euro', code: 'EUR' },
};

export const optOutSubscriptionsCard: TopOptOutSubscriptionsCardResponse = {
  periodShortStart: 'Jan 26',
  periodShortEnd: 'Dec 26',
  totalOptOutSubscriptions: 22,
  items: [
    { optOutCode: 'TPK70115', feeCode: 'TPK70115', feeName: 'Token Provisioning - Key Fee', totalSavingsAmount: 80990, regionalAdoptionRate: 84, usageLevel: UsageLevelEnum.High },
    { optOutCode: 'TII1001', feeCode: 'TII1001', feeName: 'Transaction Integrity Insight Fee', totalSavingsAmount: 53600, regionalAdoptionRate: 98, usageLevel: UsageLevelEnum.High },
    { optOutCode: '3C2123111', feeCode: '3C2123111', feeName: 'Cross-Border Conversion Fee', totalSavingsAmount: 34790, regionalAdoptionRate: 100, usageLevel: UsageLevelEnum.High },
  ],
};

// NO se reconcilia con `optOutSavingsSummary.totalOptOutSavings` (10,135.64, más abajo) a propósito:
// en el componente real (opt-out-services-dashboard.ts's `overrideSavings`), esta card SIEMPRE
// pide el rango fijo "1 Ene - hoy" (Current Year to date) sin importar el filtro global activo,
// mientras que la pantalla de detalle "Ahorro generado" (opt-out-savings.ts) usa el rango que
// tenga seleccionado el filtro global en ese momento — son dos consultas con ventanas de fecha
// distintas por diseño, así que en producción real también pueden diferir (aunque sea por poco).
// Este valor (10140) ya calcaba una captura real de producción antes de esta tarea; se deja intacto.
export const optOutSavingsCard: CardOptOutSavingsResponse = {
  currentSavings: 10140,
  previousSavings: 5070,
  variationPercentage: 100,
  trend: VariationTrendEnum.Increase,
};

export const optOutUpcomingCard: CardUpcomingOptOutsResponse = {
  pendingOptOuts: 21,
  status: UpcomingOptOutStatusEnum.ActionRequired,
};

// Jan-Aug = actual (Expenses), Aug también arranca el Forecast (para que la línea teal conecte
// visualmente en el punto de "Last Month"), Sep-Dec = forecast. Suma Jan-Aug = 298,280 (Current
// Year) y Aug = 44,480 (Last Month); suma Sep-Dec = 59,260 (Forecast) — igual que la captura real.
export const optOutBillingGraph: GraphOptOutBillingEvolutionResponse = {
  currency: 'EUR',
  periodType: PeriodFilterTypeEnum.CurrentYear,
  periodStart: '2026-01-01',
  periodEnd: '2026-12-31',
  periodShortStart: 'Jan 26',
  periodShortEnd: 'Dec 26',
  lastMonth: { month: 'August 2026', monthShort: 'Aug 26', amount: 44480 },
  selectedPeriod: { totalAmount: 298280 },
  annualForecast: { amount: 59260 },
  showForecastArea: true,
  showTodayDivider: true,
  todayMarkerMonth: 'Aug 26',
  todayShort: 'Aug 26',
  months: [
    { month: 1, monthShort: 'Jan 26', actualAmount: 29800, isFuture: false, isDrillDownEnabled: true },
    { month: 2, monthShort: 'Feb 26', actualAmount: 40100, isFuture: false, isDrillDownEnabled: true },
    { month: 3, monthShort: 'Mar 26', actualAmount: 29500, isFuture: false, isDrillDownEnabled: true },
    { month: 4, monthShort: 'Apr 26', actualAmount: 44700, isFuture: false, isDrillDownEnabled: true },
    { month: 5, monthShort: 'May 26', actualAmount: 48200, isFuture: false, isDrillDownEnabled: true },
    { month: 6, monthShort: 'Jun 26', actualAmount: 35400, isFuture: false, isDrillDownEnabled: true },
    { month: 7, monthShort: 'Jul 26', actualAmount: 26100, isFuture: false, isDrillDownEnabled: true },
    { month: 8, monthShort: 'Aug 26', actualAmount: 44480, forecastAmount: 44480, isFuture: false, isDrillDownEnabled: true },
    // actualAmount va en null (no 0) para los meses futuros: el gráfico usa `actualAmount ?? null`
    // para la serie "Expenses" — con 0 la línea gris caería a cero en vez de cortar limpio donde
    // empieza el Forecast (teal). El tipo del DTO dice `number`, pero acá se refleja la forma real
    // del JSON (puede venir null), no lo que dice la interfaz TS.
    { month: 9, monthShort: 'Sep 26', actualAmount: null as unknown as number, forecastAmount: 19200, isFuture: true, isDrillDownEnabled: false },
    { month: 10, monthShort: 'Oct 26', actualAmount: null as unknown as number, forecastAmount: 12500, isFuture: true, isDrillDownEnabled: false },
    { month: 11, monthShort: 'Nov 26', actualAmount: null as unknown as number, forecastAmount: 12600, isFuture: true, isDrillDownEnabled: false },
    { month: 12, monthShort: 'Dec 26', actualAmount: null as unknown as number, forecastAmount: 14960, isFuture: true, isDrillDownEnabled: false },
  ],
};

// --- Opt-Out Savings (pantalla "Ahorro generado" — /fee/opt-out-service/savings) ---
// Alimentado con una captura real de producción (cuenta de Wilfredo Tito). Las 3 cards de resumen
// (dataSummary(): totalOptOutSavings/potentialSavings/captureRate) y las 2 filas de la tabla
// (dataResponse()?.summary: totalBilled/monthlySavings/annualSavings/items) calcan la captura.
// `captureRate: 0.26` es literal (no 0.0026) porque FormatValuePipe.formatPercent() hace
// `value.toFixed(2) + '%'` sin dividir entre 100. El resto de campos de OptOutSavingsListResponse
// que la captura no mostraba (documentId, announcementCode, announcementTitle, feeId, minDate,
// maxDate) son valores razonables e internamente consistentes, no verificados pixel a pixel.
export const optOutSavingsSummary: OptOutSavingsSummaryResponse = {
  totalOptOutSavings: 10135.64,
  potentialSavings: 3850510.54,
  captureRate: 0.26,
  totalBilled: 340320.85,
  totalMonthlySavings: 10135.64,
  totalAnnualSavings: 73627.68,
};

export const optOutSavingsListSummary: OptOutSavingsListSummaryResponse = {
  totalBilled: 340320.85,
  monthlySavings: 10135.64,
  annualSavings: 73627.68, // 24000.00 + 49627.68 — verificado que suma con los 2 items de abajo.
  items: [
    {
      brandId: BrandEnum.Mastercard,
      brandName: 'Mastercard',
      lastBillingDate: '2026-08-30',
      documentId: 2001,
      announcementCode: 'AN11500',
      announcementTitle: 'Operational Insight Program pricing update',
      clientId: 501,
      clientName: 'MBH Bank',
      opcId: 401,
      opcName: 'Mastercard Principal Member - Understand',
      opcBusinessName: 'Miembro',
      feeId: 5001,
      feeCode: '2RP5254',
      feeName: 'Informe - Operational Insight Tramo 3',
      billedMonths: 35,
      amountBilled: 210000.0,
      amountMonthlySavings: 6000.0,
      amountAnnualSavings: 24000.0,
      minDate: '2023-10-01',
      maxDate: '2026-08-30',
    },
    {
      brandId: BrandEnum.Visa,
      brandName: 'Visa',
      lastBillingDate: '2026-08-31',
      documentId: 2002,
      announcementCode: 'AI14200',
      announcementTitle: 'Visa Account Screen Program',
      clientId: 501,
      clientName: 'MBH Bank',
      opcId: 402,
      opcName: 'Visa Account Screen',
      opcBusinessName: 'Emisor',
      feeId: 5002,
      feeCode: '3C2123111',
      // "Archivo Pantalla Autorización (A..." se cortó en la captura por el ancho de columna;
      // se completó con un nombre plausible que sigue ese prefijo — no verificado pixel a pixel.
      feeName: 'Archivo Pantalla Autorización (Account Screen)',
      billedMonths: 132,
      amountBilled: 130320.85,
      amountMonthlySavings: 4135.64,
      amountAnnualSavings: 49627.68,
      minDate: '2015-09-01',
      maxDate: '2026-08-31',
    },
  ],
};

// --- Unsubscribe (modal "Cómo excluirse" — getUnsubscribe) ---
// El step 1 (timeline de 5 hitos + warningMessage) calca una captura real de producción para el
// programa "Visa Risk Essentials Program" (mismo opcId 301 que ya existía como hijo en
// optOutUpcomingList, ver más abajo). La primera captura (step 1) nunca avanzó más allá, así que
// contactType/to/subject/body/url quedaron como valores razonables e internamente consistentes, NO
// verificados. Se eligió ContactTypeEnum.ExternalForm (portal/formulario) en vez de Email porque un
// programa de riesgo de Visa dirigido a Issuers plausiblemente usa un portal formal en vez de un
// correo suelto — de haber elegido Email, hubiera bastado con mover el mismo string a
// `to`/`subject`/`body` en vez de `url`.
// `confirmFormMessage`/`completeMessage` SÍ están confirmados por 2 capturas nuevas de los steps 3
// y 4 (en inglés, para un programa DISTINTO "Acquirer Security Program" — el texto es genérico/
// reutilizable entre programas, solo `completeMessage` inserta el nombre del programa). Se tradujo
// al español (igual que `warningMessage`, que ya estaba en español desde la 1ra captura) para que
// el demo se vea consistente en el idioma por defecto de la cuenta, sustituyendo el nombre real de
// la captura ("Acquirer Security Program") por el de nuestro fixture flagship ya establecido
// ("Visa Risk Essentials Program") — mismo texto/plantilla, mismo programa que en el step 1.
export const optOutFlowVisaRiskEssentials: OptOutFlowResponse = {
  optOutName: 'Visa Risk Essentials Program',
  announcementCode: 'AI16306',
  brand: 'Visa',
  publicationDate: new Date('2026-03-19'),
  trialPeriodStart: new Date('2025-10-01'),
  lastDayOptOut: new Date('2026-10-01'),
  billingStart: new Date('2026-10-01'),
  nextOptOutWindow: new Date('2026-10-01'),
  warningMessage:
    'Para darse de baja, debe enviar una solicitud a través de uno de los canales oficiales antes de 1 de octubre de 2026. Después de enviarla, regrese aquí para confirmar su acción en nuestros registros.',
  contactType: ContactTypeEnum.ExternalForm,
  to: 'https://risk.visa.com/opt-out/request',
  subject: '',
  body: '',
  url: 'https://risk.visa.com/opt-out/request',
  confirmFormMessage: 'Enviaste una solicitud de exclusión a través de un formulario externo.',
  confirmEmailMessage: 'Confirma que enviaste el correo de solicitud de exclusión y que estás a la espera de respuesta de Visa.',
  completeMessage:
    '¡Gracias! Registramos que enviaste tu solicitud de exclusión para Visa Risk Essentials Program. Tu confirmación quedó guardada en nuestro sistema con fines de seguimiento.',
  windowFrequencyId: 1,
  windowBeginningDate: new Date('2026-10-01'),
  windowBeginningTypeFlag: 1,
  publicationDateParse: '19 Mar 2026',
  trialPeriodStartParse: '1 Oct 2025',
  lastDayOptOutParse: '1 Oct 2026',
  billingStartParse: '1 Oct 2026',
  nextOptOutWindowParse: '1 Oct 2026',
};

// --- Top Opt-Out Subscriptions (tabla "Fee Chart") ---
// Cada grupo (padre) representa un programa de opt-out; el hijo es la tarifa concreta que lo
// compone. El Total de la tabla (10,312.54) es la suma exacta de los `amount` de los hijos.
export const optOutTopSubscriptionsList: TopOptOutSubscriptionsListResponse[] = [
  {
    documentId: 1,
    brandId: BrandEnum.Mastercard,
    brandName: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    opcBusinessName: 'Acquirer',
    opcId: 201,
    opcName: 'Transaction Investigator and PortfolioAnalytics Fees',
    lastBillingDate: '2026-08-09',
    feeId: 0,
    feeCode: '1 Fees',
    feeName: '',
    feeBusinessName: 'Acquirer',
    consecutiveBilling: 0,
    amount: 9331.0,
    regionalAdoptionRate: null,
    stepsToOptOut: false,
    children: [
      {
        documentId: 1,
        brandId: BrandEnum.Mastercard,
        brandName: 'Mastercard',
        clientId: 501,
        clientName: 'MBH Bank',
        opcBusinessName: 'Acquirer',
        opcId: 201,
        opcName: '',
        lastBillingDate: '2026-08-09',
        feeId: 3011,
        feeCode: 'TTR1046',
        feeName: 'Transaction Investigator - SBF Miscellaneous',
        feeBusinessName: 'Acquirer',
        consecutiveBilling: 4,
        amount: 9331.0,
        regionalAdoptionRate: 100,
        stepsToOptOut: true,
        children: [],
      },
    ],
  },
  {
    documentId: 2,
    brandId: BrandEnum.Visa,
    brandName: 'Visa',
    clientId: 501,
    clientName: 'MBH Bank',
    opcBusinessName: 'Acquirer',
    opcId: 202,
    opcName: 'Visa Digital Credential Updater',
    lastBillingDate: '2026-08-31',
    feeId: 0,
    feeCode: '1 Fees',
    feeName: '',
    feeBusinessName: 'Acquirer',
    consecutiveBilling: 0,
    amount: 981.54,
    regionalAdoptionRate: null,
    stepsToOptOut: false,
    children: [
      {
        documentId: 2,
        brandId: BrandEnum.Visa,
        brandName: 'Visa',
        clientId: 501,
        clientName: 'MBH Bank',
        opcBusinessName: 'Acquirer',
        opcId: 202,
        opcName: '',
        lastBillingDate: '2026-08-31',
        feeId: 3012,
        feeCode: '3VASO0802',
        feeName: 'Visa Digital Credential Updater (VDCU) - Updated Credential',
        feeBusinessName: 'Acquirer',
        consecutiveBilling: 10,
        amount: 981.54,
        regionalAdoptionRate: 100,
        stepsToOptOut: true,
        children: [],
      },
    ],
  },
];

export const optOutTopSubscriptionsSummary = {
  totalAmount: optOutTopSubscriptionsList.reduce((sum, group) => sum + group.amount, 0),
  items: optOutTopSubscriptionsList,
};

// --- Upcoming Opt-Outs (tabla "Announcements & Related Fees") ---
// `opcId`/`opcName`/`annualForecast`/`countryName` NO están en la interfaz UpcomingListResponse
// (ver dto/opt-out-service-responses.dto.ts) pero SÍ los usa el template real
// (upcoming-opt-outs.component.html) — el DTO está incompleto respecto a lo que realmente devuelve
// el backend; se extiende acá con un tipo local en vez de inventar una interfaz nueva.
// `stepsToOptOut` tiene el mismo problema: el template real
// (`[disabled]="!rowData.stepsToOptOut"` sobre el ícono de tuerca) lo lee, pero tampoco está
// declarado en UpcomingListResponse (sí existe en TopOptOutSubscriptionsListResponse, la interfaz
// "hermana" de la otra tabla) — mismo criterio, se agrega acá en vez de tocar el DTO mirror.
type UpcomingRow = UpcomingListResponse & { opcId?: number; opcName?: string; annualForecast?: string; countryName?: string; stepsToOptOut?: boolean };

function upcomingChild(opcId: number, opcName: string, businessName: string, cancellationDeadline: string, billingStarts: string, stepsToOptOut = false): UpcomingRow {
  return {
    documentId: 0,
    announcementCode: '',
    brandId: 0,
    announcementTitle: '',
    announcementBusinessName: businessName,
    clientId: 501,
    clientName: 'MBH Bank',
    cancellationDeadline,
    billingStarts,
    isPendingConfirmation: false,
    opcId,
    opcName,
    annualForecast: "Can't be estimated",
    stepsToOptOut,
    children: [],
  };
}

export const optOutUpcomingList: UpcomingRow[] = [
  {
    documentId: 1001,
    announcementCode: 'AI16306',
    brandId: BrandEnum.Visa,
    announcementTitle: 'Visa Risk Essentials and Visa Provisioning Intelligence',
    announcementBusinessName: 'Issuer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-08-01',
    trialPeriodStarts: '2026-09-01',
    cancellationDeadline: '2026-10-01',
    billingStarts: '2026-10-01',
    isPendingConfirmation: true,
    // stepsToOptOut: true -> activa el ícono de tuerca (deshabilitado en el resto de filas de esta
    // pantalla): es el único programa cuyo modal "Cómo excluirse" está alimentado con datos reales
    // (ver optOutFlowVisaRiskEssentials, más arriba), calcando una captura real de producción.
    children: [upcomingChild(301, 'Visa Risk Essentials Program', 'Issuer', '2026-10-01', '2026-10-01', true)],
  },
  {
    documentId: 1002,
    announcementCode: 'AI16103',
    brandId: BrandEnum.Visa,
    announcementTitle: 'Cloud Token Framework for Small Business & Commerce',
    announcementBusinessName: 'Issuer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-08-03',
    trialPeriodStarts: '2026-09-03',
    cancellationDeadline: '2026-10-03',
    billingStarts: '2026-10-23',
    isPendingConfirmation: true,
    children: [upcomingChild(302, 'Cloud Token Framework - Commercial/SMB', 'Issuer', '2026-10-03', '2026-10-23')],
  },
  {
    documentId: 1003,
    announcementCode: 'AI15832',
    brandId: BrandEnum.Visa,
    announcementTitle: 'Cloud Token Framework for Business & Commercial',
    announcementBusinessName: 'Issuer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-03-27',
    trialPeriodStarts: '2026-04-01',
    cancellationDeadline: '2026-04-27',
    billingStarts: '2026-10-23',
    isPendingConfirmation: true,
    children: [upcomingChild(303, 'Cloud Token Framework - Business & Commercial', 'Issuer', '2026-04-27', '2026-10-23')],
  },
  {
    documentId: 1004,
    announcementCode: 'AN12977',
    brandId: BrandEnum.Mastercard,
    announcementTitle: 'Updating Acquirer Security Program pricing in select markets',
    announcementBusinessName: 'Acquirer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-08-25',
    trialPeriodStarts: '2026-09-01',
    cancellationDeadline: '2026-09-25',
    billingStarts: '2026-10-31',
    isPendingConfirmation: true,
    children: [upcomingChild(304, 'Acquirer Security Program', 'Acquirer', '2026-09-25', '2026-10-31')],
  },
  {
    documentId: 1005,
    announcementCode: 'AN12977',
    brandId: BrandEnum.Mastercard,
    announcementTitle: 'Updating Acquirer Security Program pricing',
    announcementBusinessName: 'Acquirer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-08-25',
    trialPeriodStarts: '2026-09-01',
    cancellationDeadline: '2026-09-25',
    billingStarts: '2026-10-31',
    isPendingConfirmation: true,
    children: [upcomingChild(305, 'Acquirer Security Program', 'Acquirer', '2026-09-25', '2026-10-31')],
  },
  {
    documentId: 1006,
    announcementCode: 'AN12977',
    brandId: BrandEnum.Mastercard,
    announcementTitle: 'Introducing the Acquirer Security Program pricing',
    announcementBusinessName: 'Acquirer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-08-25',
    trialPeriodStarts: '2026-09-01',
    cancellationDeadline: '2026-09-25',
    billingStarts: '2026-10-31',
    isPendingConfirmation: true,
    children: [upcomingChild(306, 'Acquirer Security Program', 'Acquirer', '2026-09-25', '2026-10-31')],
  },
  {
    documentId: 1007,
    announcementCode: 'AN13899',
    brandId: BrandEnum.Mastercard,
    announcementTitle: 'Introducing pricing and free trial for Cross-Border Program',
    announcementBusinessName: 'Issuer',
    clientId: 501,
    clientName: 'MBH Bank',
    publicationDate: '2026-09-09',
    trialPeriodStarts: '2026-09-15',
    cancellationDeadline: '2026-10-09',
    billingStarts: '2026-11-08',
    isPendingConfirmation: true,
    children: [upcomingChild(307, 'Cross-Border Program', 'Issuer', '2026-10-09', '2026-11-08')],
  },
];

// totalAnnouncements/totalPendings son campos agregados aparte (sobre TODO el set filtrado, no solo
// esta página) — coinciden con las cards "Total Announcements" / "Pending confirmation: 19" de la
// captura, aunque acá solo se modelaron 7 filas reales (el resto de la captura queda cortado).
// totalAnnouncements se actualizó de 14 a 16: se lee "Total anuncios: 16" muy débilmente de fondo,
// detrás del modal de Unsubscribe, en la 2da captura usada para alimentar ese modal — lectura de
// BAJA confianza (muy tapado por el overlay del modal), no re-verificada pixel a pixel.
export const optOutUpcomingSummary = {
  totalAnnouncements: 16,
  totalPendings: 19,
  items: optOutUpcomingList,
};
