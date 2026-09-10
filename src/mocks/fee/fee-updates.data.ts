// Data fija de ejemplo para las stories de Fee Updates. No pega a ningún backend real.
// Los 3 tabs (New Fees, Tariff Changes, Ceased Fees) calcan una captura real de producción
// (cuenta de Wilfredo Tito): mismos fee codes, nombres, categorías, montos y tasas.
import { CeasedFeesResponse, CeasedFeeItem, FeeUpdatesBrandItem, FeeUpdatesBusinessItem, FeeUpdatesEntityItem, FeeUpdatesFiltersBootstrapResponse, FeeUpdatesSummaryResponse, NewFeeItem, NewFeesResponse, TariffChangeItem, TariffChangesResponse } from '../../mirrors/fee/fee-updates/dto/fee-updates-responses.dto';

// Un solo cliente -> showEntitiesSelect() da false y el header no muestra el multiselect de
// instituciones, igual que en la captura (no hay dropdown de instituciones visible).
export const feeUpdatesFiltersBootstrap: FeeUpdatesFiltersBootstrapResponse = {
  entities: [{ entityId: 1, entityName: 'MBH Bank' }],
  brands: [
    { brandId: 2, brandName: 'Visa' },
    { brandId: 1, brandName: 'Mastercard' },
  ],
  businesses: [
    { businessId: 1, businessName: 'Member' },
    { businessId: 2, businessName: 'Issuer' },
    { businessId: 3, businessName: 'Acquirer' },
  ],
  // maxDate fijo en 31 ago 2026: el preset "Last 12 Months" del datepicker usa la fecha real del
  // navegador para calcular el inicio (hoy - 11 meses) pero recorta el FIN a este maxDate — por eso
  // en la captura se ve "01 oct, 2025 - 31 aug, 2026" en vez de un rango que llegue hasta hoy (no es
  // un bug, es DatepickerRange.setPreset() + clampDate() reales, igual que el rango raro de TPE).
  minDate: '2015-01-01',
  maxDate: '2026-08-31',
};

export const feeUpdatesSummary: FeeUpdatesSummaryResponse = {
  newFeesCount: 123,
  tariffChangesCount: 13,
  ceasedFeesCount: 77,
};

function newFee(partial: Pick<NewFeeItem, 'feeId' | 'feeCode' | 'feeName' | 'category' | 'business' | 'brand' | 'firstBillingDate' | 'amountByCurrency'>): NewFeeItem {
  return {
    feeId: partial.feeId,
    feeCode: partial.feeCode,
    feeName: partial.feeName,
    clientId: 1,
    clientName: 'MBH Bank',
    categoryId: 0,
    category: partial.category,
    brandId: partial.brand === 'Visa' ? 2 : 1,
    brand: partial.brand,
    brandCode: null,
    business: partial.business,
    firstBillingDate: partial.firstBillingDate,
    amountByCurrency: partial.amountByCurrency,
  };
}

const newFeesItems: NewFeeItem[] = [
  newFee({ feeId: 'NF-1', feeCode: '3F3516775', feeName: 'Clearing - Intraregional | Purchase | Representment | Reversal', category: 'Clearing and Settlement Services', business: 'Member', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 0.27 } }),
  newFee({ feeId: 'NF-2', feeCode: '3F3516800', feeName: 'Clearing - Intraregional | Purchase | Chargeback | Reversal', category: 'Clearing and Settlement Services', business: 'Member', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 0.81 } }),
  newFee({ feeId: 'NF-3', feeCode: '3F3523700', feeName: 'Clearing - Domestic | Debit | Monetary Returned Item', category: 'Clearing and Settlement Services', business: 'Issuer', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 0.02 } }),
  newFee({ feeId: 'NF-4', feeCode: '3H4010123', feeName: 'Visa Resolve Online (VROL) - Cases Filed', category: 'Mandated Services', business: 'Member', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 12.5 } }),
  newFee({ feeId: 'NF-5', feeCode: '3M6145029', feeName: 'Visa Resolve Online (VROL) - International | Case Filing Review', category: 'Mandated Services', business: 'Member', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 514.54 } }),
  newFee({ feeId: 'NF-6', feeCode: '3C2163441', feeName: 'Client Implementation - Project Management', category: 'Optional Services', business: 'Member', brand: 'Visa', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 55741.42 } }),
  newFee({ feeId: 'NF-7', feeCode: '2MS2400', feeName: 'MasterCom - Filing', category: 'Mandated Services', business: 'Member', brand: 'Mastercard', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 400 } }),
  newFee({ feeId: 'NF-8', feeCode: '2MS2410', feeName: 'MasterCom - Technical Violation', category: 'Mandated Services', business: 'Member', brand: 'Mastercard', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 200 } }),
  newFee({ feeId: 'NF-9', feeCode: '2MS2420', feeName: 'MasterCom - Administrative', category: 'Mandated Services', business: 'Member', brand: 'Mastercard', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 350 } }),
  newFee({ feeId: 'NF-10', feeCode: '2MS2430', feeName: 'MasterCom - Processing Arbitration', category: 'Mandated Services', business: 'Member', brand: 'Mastercard', firstBillingDate: '2026-08-31', amountByCurrency: { EUR: 50 } }),
];

// totalCount=123 (coincide con la card "New Fees") aunque solo se cargan 10 items de ejemplo —
// igual que TPE Merchant Report, el mock no simula paginado/orden real de backend, siempre
// devuelve esta misma página fija.
export const feeUpdatesNewFees: NewFeesResponse = {
  items: newFeesItems,
  totalCount: 123,
  availableCurrencies: ['EUR', 'USD'],
  currencyTotals: [
    { code: 'EUR', totalAmount: 108346.96 },
    { code: 'USD', totalAmount: 112.75 },
  ],
};

function tariffChange(partial: Pick<TariffChangeItem, 'feeId' | 'feeCode' | 'feeName' | 'category' | 'business' | 'brand' | 'changeDate' | 'previousRate' | 'newRate'>): TariffChangeItem {
  return {
    feeId: partial.feeId,
    feeCode: partial.feeCode,
    feeName: partial.feeName,
    clientId: 1,
    clientName: 'MBH Bank',
    categoryId: 0,
    category: partial.category,
    brandId: partial.brand === 'Visa' ? 2 : 1,
    brand: partial.brand,
    brandCode: null,
    business: partial.business,
    previousRate: partial.previousRate,
    newRate: partial.newRate,
    changeDate: partial.changeDate,
    absoluteChange: partial.newRate - partial.previousRate,
  };
}

const tariffChangesItems: TariffChangeItem[] = [
  tariffChange({ feeId: 'TC-1', feeCode: '2EA3803', feeName: 'Mastercard Digital Enablement Service (MDES) - Domestic & Intraregional', category: 'Authorization Services', business: 'Acquirer', brand: 'Mastercard', changeDate: '2026-07-19', previousRate: 0.00023, newRate: 0.00018 }),
  tariffChange({ feeId: 'TC-2', feeCode: '3J4296051', feeName: 'Penalty - System Integrity | Interregional | Issuer Will Never Approve', category: 'Penalties', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-25', previousRate: 0.128557, newRate: 0.214261 }),
  tariffChange({ feeId: 'TC-3', feeCode: '3J4296057', feeName: 'Penalty - System Integrity | Interregional | Excess Reattempted Transaction', category: 'Penalties', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-25', previousRate: 0.128557, newRate: 0.214261 }),
  tariffChange({ feeId: 'TC-4', feeCode: '3CSF07105', feeName: 'Volume - Domestic, Interregional & Intraregional Purchase | Domestic', category: 'Association Assessment', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-01', previousRate: 0.00025, newRate: 0.00028 }),
  tariffChange({ feeId: 'TC-5', feeCode: '3J4255125', feeName: 'Account Verifications (AV) - Domestic', category: 'Authorization Services', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-01', previousRate: 0.0032, newRate: 0.0059 }),
  tariffChange({ feeId: 'TC-6', feeCode: '3J4255126', feeName: 'Account Verifications (AV) - Interregional', category: 'Authorization Services', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-01', previousRate: 0.0425, newRate: 0.06 }),
  tariffChange({ feeId: 'TC-7', feeCode: '3J4255128', feeName: 'Account Verifications (AV) - Intrarregional', category: 'Authorization Services', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-01', previousRate: 0.0068, newRate: 0.0095 }),
  tariffChange({ feeId: 'TC-8', feeCode: '3VAS03153', feeName: 'Non-Local Currency Settlement - Single Currency', category: 'Clearing and Settlement Services', business: 'Acquirer', brand: 'Visa', changeDate: '2026-04-01', previousRate: 0.000874, newRate: 0.001311 }),
  tariffChange({ feeId: 'TC-9', feeCode: '3F4000102', feeName: 'Edit Package - Maintenance & Support | PC', category: 'Optional Services', business: 'Member', brand: 'Visa', changeDate: '2026-01-01', previousRate: 425.8215, newRate: 1703.286 }),
  tariffChange({ feeId: 'TC-10', feeCode: '2HN8341', feeName: 'Penalty - Transaction Non-Chip & Non-Contactless', category: 'Penalties', business: 'Acquirer', brand: 'Mastercard', changeDate: '2025-10-19', previousRate: 0.00029, newRate: 0.0005 }),
];

export const feeUpdatesTariffChanges: TariffChangesResponse = {
  items: tariffChangesItems,
  totalCount: 13,
  total: tariffChangesItems.reduce((sum, x) => sum + x.absoluteChange, 0),
};

function ceasedFee(partial: Pick<CeasedFeeItem, 'feeId' | 'feeCode' | 'feeName' | 'category' | 'business' | 'brand' | 'ceasedDate' | 'lastKnownRate'>): CeasedFeeItem {
  return {
    feeId: partial.feeId,
    feeCode: partial.feeCode,
    feeName: partial.feeName,
    clientId: 1,
    clientName: 'MBH Bank',
    categoryId: 0,
    category: partial.category,
    brandId: partial.brand === 'Visa' ? 2 : 1,
    brand: partial.brand,
    brandCode: null,
    business: partial.business,
    lastKnownRate: partial.lastKnownRate,
    currencyId: 1,
    currency: 'EUR',
    ceasedDate: partial.ceasedDate,
  };
}

const ceasedFeesItems: CeasedFeeItem[] = [
  ceasedFee({ feeId: 'CF-1', feeCode: '3F3520300', feeName: 'Clearing - Interregional | Credit Original | Chargeback', category: 'Clearing and Settlement Services', business: 'Acquirer', brand: 'Visa', ceasedDate: '2026-08-31', lastKnownRate: 0.07 }),
  ceasedFee({ feeId: 'CF-2', feeCode: '2EL45031RHF', feeName: 'Dispute Administration - Chargeback Reversal', category: 'Mandated Services', business: 'Acquirer', brand: 'Mastercard', ceasedDate: '2026-08-31', lastKnownRate: -15 }),
  ceasedFee({ feeId: 'CF-3', feeCode: '3VAS03153', feeName: 'Non-Local Currency Settlement - Single Currency', category: 'Clearing and Settlement Services', business: 'Acquirer', brand: 'Visa', ceasedDate: '2026-08-31', lastKnownRate: 0 }),
  ceasedFee({ feeId: 'CF-4', feeCode: '2DN1000', feeName: 'Cross Border - Maestro & Cirrus | Interregional | Purchase | Foreign', category: 'Mandated Services', business: 'Acquirer', brand: 'Mastercard', ceasedDate: '2026-08-24', lastKnownRate: 0.08 }),
  ceasedFee({ feeId: 'CF-5', feeCode: '2AN1911', feeName: 'Mail Order/Telephone Order (MO/TO) - Authorization | Domestic', category: 'Mandated Services', business: 'Acquirer', brand: 'Mastercard', ceasedDate: '2026-08-17', lastKnownRate: 266.29 }),
  ceasedFee({ feeId: 'CF-6', feeCode: '2EA1136', feeName: 'Preauthorization - PN Purchase Upper', category: 'Authorization Services', business: 'Acquirer', brand: 'Mastercard', ceasedDate: '2026-08-03', lastKnownRate: 0.1 }),
  ceasedFee({ feeId: 'CF-7', feeCode: '3F3516800', feeName: 'Clearing - Intraregional | Purchase | Chargeback | Reversal', category: 'Clearing and Settlement Services', business: 'Member', brand: 'Visa', ceasedDate: '2026-08-01', lastKnownRate: 1.63 }),
  ceasedFee({ feeId: 'CF-8', feeCode: '3F3516780', feeName: 'Clearing - Intraregional | Credit Original | Reversal', category: 'Clearing and Settlement Services', business: 'Member', brand: 'Visa', ceasedDate: '2026-08-01', lastKnownRate: 0.27 }),
  ceasedFee({ feeId: 'CF-9', feeCode: '3M6145029', feeName: 'Visa Resolve Online (VROL) - International | Case Filing Review', category: 'Mandated Services', business: 'Member', brand: 'Visa', ceasedDate: '2026-08-01', lastKnownRate: 470.46 }),
  ceasedFee({ feeId: 'CF-10', feeCode: '2MS2400', feeName: 'MasterCom - Filing', category: 'Mandated Services', business: 'Member', brand: 'Mastercard', ceasedDate: '2026-08-01', lastKnownRate: 200 }),
];

export const feeUpdatesCeasedFees: CeasedFeesResponse = {
  items: ceasedFeesItems,
  totalCount: 77,
};
