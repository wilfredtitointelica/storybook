// Data fija de ejemplo para las stories de Fee Library. No pega a ningún backend real.
// Las 5 filas de "Allocated", el Total Portfolio y las categorías/tipos de tarifa calcan una
// captura real de producción (cuenta de Wilfredo Tito).
import { ClientInformationResponse } from '../../mirrors/fee/common/DTO/client-response';
import {
  EntityProductModel,
  FeeExcluded,
  FeeLibraryMaster,
  FeePaginationResult,
  FeeRefund,
  FeeResponse,
  FeeUnallocatedPaginationResult,
  GroupNameOption,
  InvoiceOption,
  LibraryDatesResponse,
  ResumeFee,
} from '../../mirrors/fee/library/DTO/response';
import { FinancialCategoryEnum } from '../../mirrors/fee/library/common/enums';

// Boundaries amplios para no recortar el preset "Last 12 months" del datepicker (se calcula desde
// la fecha real del sistema, igual que en producción).
export const libraryDates: LibraryDatesResponse = {
  minDate: '2020-01-01',
  maxDate: '2030-12-31',
};

export const libraryClientInformation: ClientInformationResponse = {
  regions: [{ regionId: 1, regionName: 'Europe' }],
  countries: [{ countryId: 1, countryName: 'Greece', regionId: 1 }],
  banks: [{ bankId: 501, bankName: 'MBH Bank', regionId: 1, countryId: 1 }],
  groups: [],
  brands: [
    { brandId: 1, brandName: 'Mastercard' },
    { brandId: 2, brandName: 'Visa' },
  ],
};

// categories: los 8 nombres top-level calcan el árbol "Categoría y subcategoría" del modal de
// filtros avanzados (captura real, Fee Library, cuenta de Wilfredo Tito) — el árbol nunca se vio
// expandido en la captura, así que cada subcategoría de abajo es un placeholder razonable ("General"),
// NO verificado contra producción.
// "Servicios Liquidación" y "Servicios Liquidación y Compensación" son dos categorías DISTINTAS tal
// como aparecen en la captura (no es un duplicado/typo mío).
export const libraryMasters: FeeLibraryMaster = {
  categories: [
    { id: 1, code: 'ASSOCIATION', description: 'Asociación' },
    { id: 2, code: 'INCENTIVES', description: 'Incentivos' },
    { id: 3, code: 'PENALTIES', description: 'Penalidades' },
    { id: 4, code: 'AUTH_SERVICES', description: 'Servicios Autorización' },
    { id: 5, code: 'CLEARING_SERVICES', description: 'Servicios Liquidación' },
    { id: 6, code: 'CLEARING_SETTLEMENT_SERVICES', description: 'Servicios Liquidación y Compensación' },
    { id: 7, code: 'MANDATORY_SERVICES', description: 'Servicios Mandatorios' },
    { id: 8, code: 'OPTIONAL_SERVICES', description: 'Servicios Opcionales' },
  ],
  subCategories: [
    { id: 1, categoryId: 1, code: 'ASSOCIATION-GEN', description: 'General', categoryCode: 'ASSOCIATION', categoryDesc: 'Asociación', order: 1 },
    { id: 2, categoryId: 2, code: 'INCENTIVES-GEN', description: 'General', categoryCode: 'INCENTIVES', categoryDesc: 'Incentivos', order: 1 },
    { id: 3, categoryId: 3, code: 'PENALTIES-GEN', description: 'General', categoryCode: 'PENALTIES', categoryDesc: 'Penalidades', order: 1 },
    { id: 4, categoryId: 4, code: 'AUTH-GEN', description: 'General', categoryCode: 'AUTH_SERVICES', categoryDesc: 'Servicios Autorización', order: 1 },
    { id: 5, categoryId: 5, code: 'CLEARING-GEN', description: 'General', categoryCode: 'CLEARING_SERVICES', categoryDesc: 'Servicios Liquidación', order: 1 },
    { id: 6, categoryId: 6, code: 'CLEARING-SETTLEMENT-GEN', description: 'General', categoryCode: 'CLEARING_SETTLEMENT_SERVICES', categoryDesc: 'Servicios Liquidación y Compensación', order: 1 },
    { id: 7, categoryId: 7, code: 'MANDATORY-GEN', description: 'General', categoryCode: 'MANDATORY_SERVICES', categoryDesc: 'Servicios Mandatorios', order: 1 },
    { id: 8, categoryId: 8, code: 'OPTIONAL-GEN', description: 'General', categoryCode: 'OPTIONAL_SERVICES', categoryDesc: 'Servicios Opcionales', order: 1 },
  ],
  // Orden y nombres calcan el multiselect "Tipo de tarifa" de la captura real (tab Rangos de
  // tarifas y montos).
  typeOfRates: [
    { id: 1, name: 'Escalonada Estandar' },
    { id: 2, name: 'Escalonada Plana' },
    { id: 3, name: 'Escalonada Progresiva' },
    { id: 4, name: 'Fija' },
    { id: 5, name: 'Plana' },
  ],
  // ICA (Mastercard) / BID, NUMID, SRENUMID (Visa) calcan el dropdown "Tipo de entidad" de la
  // captura real. Ids != 10 a propósito: ModalAdvancedFilter.requiresEntityLevelTwo() dispara un
  // segundo nivel de cascada solo cuando selectedEntityTypeId === 10, que no se ve en la captura.
  entityTypes: [
    { brandId: 1, brandName: 'Mastercard', categories: [{ id: 1, name: 'ICA' }] },
    { brandId: 2, brandName: 'Visa', categories: [{ id: 2, name: 'BID' }, { id: 3, name: 'NUMID' }, { id: 4, name: 'SRENUMID' }] },
  ],
  // business (tab Original): "All / Acquirer / Issuer" en inglés, 2 items — ya calzaba con la
  // captura real (screenshot 5), no se toca.
  business: [
    { id: 1, name: 'Acquirer' },
    { id: 2, name: 'Issuer' },
  ],
  // businessTransaction (tab Allocated): FIX — antes tenía 2 items en inglés ("Acquirer"/"Issuer"),
  // pero la captura real (screenshot 6) del selector "Todos los Negocios" en el tab Allocated
  // muestra 3 items en español ("Adquirente"/"Emisor"/"Miembro"). Este era el origen real del
  // reporte de "espaciado inconsistente" del selector de negocios entre tabs: el <p-multiselect>
  // de header.html es UN SOLO elemento compartido cuyo [options] cambia de fuente según el tab
  // activo (business para Original, businessTransaction para Allocated) — no era un bug de CSS,
  // era este dato mock incorrecto (inglés + 2 items en vez de español + 3 items).
  businessTransaction: [
    { id: 1, name: 'Adquirente', businessId: 1, transactionId: 1 },
    { id: 2, name: 'Emisor', businessId: 2, transactionId: 2 },
    { id: 3, name: 'Miembro', businessId: 3, transactionId: 3 },
  ],
  productTypes: {
    credit: [{ brandId: 1, brandName: 'Mastercard', items: [{ id: 1, code: 'MC-CREDIT', name: 'Mastercard Credit' }] }],
    debitPrepaid: [{ brandId: 1, brandName: 'Mastercard', items: [{ id: 2, code: 'MC-DEBIT', name: 'Mastercard Debit' }] }],
  },
  brands: [
    { id: 1, name: 'Mastercard' },
    { id: 2, name: 'Visa' },
  ],
  // customCategories: 2-3 entradas razonables (NO verificadas contra captura — la captura solo
  // muestra el dropdown "Categoría personalizada" cerrado), clientId = bank id de esta demo (501).
  customCategories: [
    { id: 1, clientId: 501, code: 'CC-OPS', description: 'Operaciones' },
    { id: 2, clientId: 501, code: 'CC-CARD', description: 'Tarjetas' },
    { id: 3, clientId: 501, code: 'CC-DIGITAL', description: 'Canales Digitales' },
  ],
  generalAccounts: [],
  costCenters: [],
  scopes: [],
  transactionTypes: [],
  productProgramIndPerBrand: [],
  scopesByClient: [],
  productTypesByClient: { credit: [], debitPrepaid: [] },
  businessByClient: [],
};

// libraryInvoices: las 5 facturas del dropdown "Factura" (tab Entidades y facturas) calcan la
// captura real — todas Mastercard, todas agrupadas bajo "Este mes" con label "hace 3 días -
// 05 sept 2026". feeDate fijo en '2026-09-05': el label relativo ("hace 3 días") lo calcula
// ModalAdvancedFilterService.buildInvoiceOptionGroups() contra `new Date()` real en el momento del
// render — es exacto solo el día en que esto se capturó (2026-09-08, "hoy" del timeline de esta
// demo). Cualquier otro día seguirá agrupando bien (Este mes/Anteriores) pero el texto "hace N
// días" cambiará; limitación aceptada, igual que otros fixtures relativos-a-fecha del proyecto.
export const libraryInvoices: InvoiceOption[] = [
  { invoiceNumber: '268100300066519', brandId: 1, brandName: 'Mastercard', feeDate: '2026-09-05' },
  { invoiceNumber: '268100300066520', brandId: 1, brandName: 'Mastercard', feeDate: '2026-09-05' },
  { invoiceNumber: '268100300066717', brandId: 1, brandName: 'Mastercard', feeDate: '2026-09-05' },
  { invoiceNumber: '268100300066844', brandId: 1, brandName: 'Mastercard', feeDate: '2026-09-05' },
  { invoiceNumber: '268100300066845', brandId: 1, brandName: 'Mastercard', feeDate: '2026-09-05' },
];

// libraryEntityProducts: relleno razonable (NO verificado contra captura, que nunca mostró el
// multiselect "Valores de entidad" abierto) — un par de productos por cada tipo de entidad de
// libraryMasters.entityTypes (ICA/BID/NUMID/SRENUMID), solo para que la cascada "Entity Values"
// del modal no quede vacía si alguien juega con la demo. prodCatId calza con el id de la categoría
// de tipo de entidad correspondiente (ver entityTypes arriba).
export const libraryEntityProducts: EntityProductModel[] = [
  { brandId: 1, brandName: 'Mastercard', prodId: 1, prodCod: 'ICA-00123', prodCatDescription: 'ICA', prodCatId: 1, entity: 1, entityDesc: 'ICA' },
  { brandId: 1, brandName: 'Mastercard', prodId: 2, prodCod: 'ICA-00456', prodCatDescription: 'ICA', prodCatId: 1, entity: 1, entityDesc: 'ICA' },
  { brandId: 2, brandName: 'Visa', prodId: 3, prodCod: 'BID-00789', prodCatDescription: 'BID', prodCatId: 2, entity: 2, entityDesc: 'BID' },
  { brandId: 2, brandName: 'Visa', prodId: 4, prodCod: 'BID-01012', prodCatDescription: 'BID', prodCatId: 2, entity: 2, entityDesc: 'BID' },
  { brandId: 2, brandName: 'Visa', prodId: 5, prodCod: 'NUMID-2001', prodCatDescription: 'NUMID', prodCatId: 3, entity: 3, entityDesc: 'NUMID' },
  { brandId: 2, brandName: 'Visa', prodId: 6, prodCod: 'NUMID-2002', prodCatDescription: 'NUMID', prodCatId: 3, entity: 3, entityDesc: 'NUMID' },
  { brandId: 2, brandName: 'Visa', prodId: 7, prodCod: 'SRENUMID-3001', prodCatDescription: 'SRENUMID', prodCatId: 4, entity: 4, entityDesc: 'SRENUMID' },
];

// libraryGroupNames: lista estática y razonable (NO verificada contra captura) para el autocomplete
// "Nombre de grupo" (tab Categorización) — searchGroupNames() en library.mocks.ts filtra este set
// por substring case-insensitive contra `name`.
export const libraryGroupNames: GroupNameOption[] = [
  { id: 1, code: 'GRP-001', name: 'Comisiones Interregionales' },
  { id: 2, code: 'GRP-002', name: 'Servicios de Liquidación EEA' },
  { id: 3, code: 'GRP-003', name: 'Penalidades DCC' },
  { id: 4, code: 'GRP-004', name: 'Autorización Non-EEA' },
];

// Resume (Total Portfolio): Gross 130,234,957.61 + Refunds (37,599,322.98) + Exclusions 0
// = Net Expenses 92,635,634.63 (fórmula real: gross + returns + exclusions para el tab Allocated).
export const libraryResumeAllocated: ResumeFee = {
  resumeFeeAmounts: [
    { code: 'EUR', financialCategory: FinancialCategoryEnum.Fee, totalAmount: 130234957.61 },
    { code: 'EUR', financialCategory: FinancialCategoryEnum.Refund, totalAmount: -37599322.98 },
    { code: 'EUR', financialCategory: FinancialCategoryEnum.ExcludedFee, totalAmount: 0 },
  ],
};

// Resume (Total Portfolio) del tab Original: Bruto EUR 30,608,205.40 + USD 22,352.00, Reembolsos
// EUR (179,229.90) sin fila USD (se ve "-"), Gastos netos = Bruto + Reembolsos - Exclusiones (fórmula
// real de Original, RESTA exclusiones — ver Library.getNetExpensesAmount()) = EUR 30,428,975.50 /
// USD 22,352.00 (calca una captura real de producción, cuenta de Wilfredo Tito).
export const libraryResumeUnallocated: ResumeFee = {
  resumeFeeAmounts: [],
  grossAmounts: [
    { code: 'EUR', financialCategory: FinancialCategoryEnum.Fee, totalAmount: 30608205.4 },
    { code: 'USD', financialCategory: FinancialCategoryEnum.Fee, totalAmount: 22352.0 },
  ],
  returnsAmounts: [{ code: 'EUR', financialCategory: FinancialCategoryEnum.Refund, totalAmount: -179229.9 }],
  exclusionAmounts: [{ code: 'EUR', financialCategory: FinancialCategoryEnum.ExcludedFee, totalAmount: 0 }],
};

function makeFeeRow(
  id: number,
  feeCode: string,
  feeName: string,
  category: string,
  typeOfRate: string,
  businessId: number,
  businessDescription: string,
  brandId: number,
  brandCode: string,
  brandDescription: string,
  feeAmount: number
): FeeResponse {
  return {
    id,
    brandId,
    brandCode,
    brandDescription,
    businessId,
    businessCode: businessDescription.slice(0, 3).toUpperCase(),
    businessDescription,
    clientId: 501,
    clientName: 'MBH Bank',
    countryId: 1,
    countryCode: 'GR',
    countryName: 'Greece',
    lastBillingDate: '2026-08-31',
    feeDetail: {
      id: 1000 + id,
      code: feeCode,
      codeIntelica: feeCode,
      name: feeName,
      description: feeName,
      categoryId: 1,
      category,
      subCategory: 'General',
      lastBillingCurrency: 'EUR',
      lastBillingAmount: feeAmount,
      lastBillingDate: '2026-08-31',
    },
    consecutiveMonths: 12,
    currencyId: 1,
    currencyDetail: { id: 1, code: 'EUR', description: 'Euro', feeAmount, feeCnt: 1, amountPercent: 0 },
    currencyDetailList: [{ id: 1, code: 'EUR', description: 'Euro', feeAmount, feeCnt: 1, amountPercent: 0 }],
    financialCategory: FinancialCategoryEnum.Fee,
    transactionId: businessId,
    typeOfRate,
  };
}

export const libraryAllocatedRows: FeeResponse[] = [
  makeFeeRow(1, '3F3528900', 'International Acquiring Fee (IAF) - EEA | Purchase', 'Mandated Services', 'Flat', 1, 'Acquirer', 2, 'VI', 'Visa', 4369117.33),
  makeFeeRow(2, 'TF15001P', 'Decision Intelligence - Transaction | Card Not Present <= EUR 2500', 'Mandated Services', 'Standard Tier', 2, 'Issuer', 1, 'MC', 'Mastercard', 2610949.95),
  makeFeeRow(3, 'TF11000', 'Safety Net Service - Single & Dual Message System (SMS & DMS)', 'Mandated Services', 'Progressive Tier', 2, 'Issuer', 1, 'MC', 'Mastercard', 2383746.91),
  makeFeeRow(4, '3F3519500', 'Clearing - Interregional | Purchase', 'Clearing and Settlement Services', 'Flat', 1, 'Acquirer', 2, 'VI', 'Visa', 1148426.41),
  makeFeeRow(5, '3I4299575', 'Authorization - Interregional | Purchase', 'Authorization Services', 'Flat', 1, 'Acquirer', 2, 'VI', 'Visa', 772027.99),
];

// totalFeeAmount es un campo aparte devuelto por el backend (total de TODAS las filas que calzan el
// filtro, no solo la página actual) — coincide con el card "Gross" del Total Portfolio.
export const libraryAllocatedPage: FeePaginationResult = {
  pagination: {
    items: libraryAllocatedRows,
    pageNumber: 1,
    pageSize: 10,
    totalCount: libraryAllocatedRows.length,
    totalPages: 1,
  },
  totalFeeAmount: 130234957.61,
};

// Filas del tab Original (tarifas no asignadas): calcan una captura real de producción (cuenta de
// Wilfredo Tito) — código, nombre, categoría y negocio ya vienen en español desde el backend
// (a diferencia de Fee Updates/TPE, que devuelven esos mismos campos en inglés siempre).
// "Intrarregional"/"Intraregional" (filas 2 y 3) es una inconsistencia real de los datos de
// producción, no un typo mío — se preserva tal cual se ve en la captura.
export const libraryUnallocatedRows: FeeResponse[] = [
  makeFeeRow(101, '3F4030508', 'Penalidad - Conversión Dinámica Moneda (DCC) - Tasa Comportamiento - Moneda Facturación Incorrecta', 'Penalidades', 'Plana', 1, 'Adquirente', 2, 'VI', 'Visa', 621.15),
  makeFeeRow(102, '3F3510122', 'Liquidación - Intrarregional No-EEA Microestados Compra', 'Servicios Liquidación y Compensación', 'Plana', 1, 'Adquirente', 2, 'VI', 'Visa', 47.4),
  makeFeeRow(103, '3F3516713', 'Liquidación - Intraregional Non-EEA Microestados Compra', 'Servicios Liquidación y Compensación', 'Plana', 1, 'Adquirente', 2, 'VI', 'Visa', 173.65),
  makeFeeRow(104, '3F3516723', 'Liquidación - Intraregional Non-EEA Microestados Crédito', 'Servicios Liquidación y Compensación', 'Plana', 1, 'Adquirente', 2, 'VI', 'Visa', 0.75),
  makeFeeRow(105, '3J4299588', 'Autorización - Intrarregional Non-EEA Microestados Compra', 'Servicios Autorización', 'Plana', 1, 'Adquirente', 2, 'VI', 'Visa', 149.13),
];

export const libraryUnallocatedPage: FeeUnallocatedPaginationResult = {
  pagination: {
    items: libraryUnallocatedRows,
    pageNumber: 1,
    pageSize: 10,
    totalCount: libraryUnallocatedRows.length,
    totalPages: 1,
  },
  // Coincide con "Gastos netos" del Portfolio Total (fila Total de la tabla = neto, no bruto).
  currencyTotals: [
    { code: 'EUR', totalAmount: 30428975.5 },
    { code: 'USD', totalAmount: 22352.0 },
  ],
};

// libraryRefundRows: filas del modal "Refunds Management" (fee-modal-allocated-refund, tab
// Allocated), calcadas de una captura real de producción (cuenta de Wilfredo Tito, UI en inglés).
// El componente (modal-allocated-refund.ts's mapRow()) lee `r.lastBillingDate` para la columna
// `date` de la tabla (NO un campo `date` propio del DTO) y calcula el total como
// `SUM(feeAmount)` client-side sobre `listData()/filteredListData()` (getter `totalFeeAmount`),
// sin negar ni transformar el signo para mostrarlo.
// Fila 1 ("MasterCom - Chargeback Support Documentation | Transaction Value | A...") venía
// truncada en la captura — se completó de forma plausible como "...Adjustment" siguiendo el mismo
// patrón "<Motivo> | Adjustment" de las filas 2-5, PERO NO está verificado carácter por carácter
// contra producción (a diferencia del resto de campos de esta fila, sí tomados de la captura).
// Total mostrado en la captura real: EUR (179,183.00) -- entre paréntesis, es decir NEGATIVO
// (los refunds restan del total de fees). La suma de estas 6 filas da EUR 4,412.10 (positivo): la
// captura solo mostraba la primera página de una tabla con scroll/paginación, por lo que el dataset
// real completo es más grande (y con signo neto negativo) que estas 6 filas verificadas. Se
// decidió NO inventar filas adicionales ni un campo de total aparte para forzar que cuadre con
// 179,183.00 — el total que se ve en esta demo (suma de las 6 filas de abajo, positivo) es
// correcto para el dataset que de verdad tenemos, simplemente no es el dataset completo de la
// captura. Los montos de fila en la captura tampoco traían signo negativo ni paréntesis, por eso
// feeAmount se guarda en positivo (el componente no los niega para mostrarlos).
export const libraryRefundRows: FeeRefund[] = [
  {
    id: 1,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3001,
    feeCode: '2MS5331A',
    feeName: 'MasterCom - Chargeback Support Documentation | Transaction Value | Adjustment',
    category: 'Mandated Services',
    lastBillingDate: '2026-08-09',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 1309.2,
  },
  {
    id: 2,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3002,
    feeCode: '2MS3501A',
    feeName: 'MasterCom - Chargeback | Excessive Page | Adjustment',
    category: 'Mandated Services',
    lastBillingDate: '2026-08-09',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 956.0,
  },
  {
    id: 3,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3003,
    feeCode: '2MS2410A',
    feeName: 'MasterCom - Technical Violation | Adjustment',
    category: 'Mandated Services',
    lastBillingDate: '2026-08-09',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 800.0,
  },
  {
    id: 4,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3004,
    feeCode: '2MS2420A',
    feeName: 'MasterCom - Administrative | Adjustment',
    category: 'Mandated Services',
    lastBillingDate: '2026-08-09',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 700.0,
  },
  {
    id: 5,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3005,
    feeCode: '2MS2400A',
    feeName: 'MasterCom - Filing | Adjustment',
    category: 'Mandated Services',
    lastBillingDate: '2026-08-09',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 600.0,
  },
  {
    id: 6,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    businessCode: 'ACQ',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 3006,
    feeCode: '2PG8019',
    feeName: 'Mastercard Payment Gateway Service (MPGS) - Transaction',
    category: 'Clearing and Settlement Services',
    lastBillingDate: '2026-09-03',
    currencyId: 1,
    currencyCode: 'EUR',
    feeAmount: 46.9,
  },
];

// libraryExcludedRows: filas del modal "Cargos Excluidos" (fee-modal-allocated-excluded, tab
// Allocated), calcadas de una captura real de producción (cuenta de Wilfredo Tito, UI en español
// esta vez -- por eso feeName/category quedan en español, a diferencia de libraryRefundRows). Mismo
// mecanismo de mapeo que el refund modal: modal-allocated-excluded.ts's mapRow() lee
// `r.lastBillingDate` para la columna `date`, y el total es `SUM(feeAmount)` client-side (getter
// `totalFeeAmount`), sin negar el signo.
// Total mostrado en la captura real: USD 128,582.33. La suma de estas 6 filas da USD 121,699.47:
// misma situación que libraryRefundRows arriba (la captura solo mostraba la primera página de una
// tabla más grande) -- se aplica la misma decisión: NO se inventan filas adicionales para forzar
// que el total cuadre; el total que se ve en esta demo es la suma real de las 6 filas verificadas.
// `category: 'Programa Recompensas'` es texto libre (campo `string` en el DTO FeeExcluded, no un id
// contra `FeeLibraryMaster.categories`/`subCategories` -- ese catálogo alimenta el modal de filtros
// avanzados, no esta tabla) y se muestra tal cual como texto de columna, sin badge/dropdown.
// currencyId: 2 (USD) es un id NO establecido en otro lugar de este proyecto (el resto de fixtures
// de Fee Library solo usa currencyId 1 = EUR) -- se eligió 2 de forma razonable ya que
// FeeExcludedRow (el view-model interno del componente) ni siquiera incluye currencyId/currencyCode,
// así que no afecta ningún render; el header "Monto en USD" lo controla el @Input `crncyCode` del
// padre, no este campo del DTO.
export const libraryExcludedRows: FeeExcluded[] = [
  {
    id: 1,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4001,
    feeCode: '2FR1002',
    feeName: 'Recompensa - Puntos Redimidos Mercadería',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-09-06',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 77337.7,
  },
  {
    id: 2,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4002,
    feeCode: '2FR1002',
    feeName: 'Recompensa - Puntos Redimidos Mercadería',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-09-06',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 27800.17,
  },
  {
    id: 3,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4003,
    feeCode: '2FR2006',
    feeName: 'Recompensa - Cuentas Participante',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-08-16',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 5965.65,
  },
  {
    id: 4,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4004,
    feeCode: '2FR2070',
    feeName: 'Recompensa - Administración Data Mart',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-08-16',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 5000.0,
  },
  {
    id: 5,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4005,
    feeCode: '2FR2006',
    feeName: 'Recompensa - Cuentas Participante',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-08-16',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 3095.95,
  },
  {
    id: 6,
    brandId: 1,
    brandCode: 'MC',
    brandDescription: 'Mastercard',
    clientId: 501,
    clientName: 'MBH Bank',
    feeId: 4006,
    feeCode: '2FR2070',
    feeName: 'Recompensa - Administración Data Mart',
    category: 'Programa Recompensas',
    lastBillingDate: '2026-08-16',
    currencyId: 2,
    currencyCode: 'USD',
    feeAmount: 2500.0,
  },
];
