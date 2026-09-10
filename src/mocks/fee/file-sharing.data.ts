// Data fija de ejemplo para las stories de file-sharing. No pega a ningún backend real.
// El archivo y las categorías calcan una captura real de producción (cuenta de Wilfredo Tito).
import { FileCategoryResponse, FileSharingResponse, PeriodFilterResponse } from '../../mirrors/fee/file-sharing/DTO/response';
import { ClientBankResponse, ClientInformationResponse } from '../../mirrors/fee/common/DTO/client-response';

export const fileSharingCategories: FileCategoryResponse[] = [
  { categoryId: 1, categoryDescription: 'Default category' },
  { categoryId: 2, categoryDescription: 'Manuals' },
  { categoryId: 3, categoryDescription: 'Monthly analysis' },
  { categoryId: 4, categoryDescription: 'Quarterly analysis' },
  { categoryId: 5, categoryDescription: 'Annual analysis' },
  { categoryId: 6, categoryDescription: 'Various analysis' },
  { categoryId: 7, categoryDescription: 'Others' },
  { categoryId: 8, categoryDescription: 'Daily package' },
  { categoryId: 9, categoryDescription: 'Monthly package' },
  { categoryId: 10, categoryDescription: 'Quarterly package' },
  { categoryId: 11, categoryDescription: 'Presentation' },
  { categoryId: 12, categoryDescription: 'Annual validation' },
  { categoryId: 13, categoryDescription: 'Quarterly validation' },
  { categoryId: 14, categoryDescription: 'Monthly validation' },
];

export const fileSharingPeriods: PeriodFilterResponse[] = [
  {
    periodId: 1,
    description: 'PREVIOUSMONTH',
    descriptionTerm: '',
    startDateDefault: new Date('2026-08-01'),
    endDateDefault: new Date('2026-08-31'),
  },
  {
    periodId: 2,
    description: 'LAST12MONTHS',
    descriptionTerm: '',
    startDateDefault: new Date('2025-10-01'),
    endDateDefault: new Date('2026-09-04'),
  },
];

// Boundaries reales que consume fee-datepicker-range (FileSharingService.GetDateRange()) —
// coincide con "01 oct, 2025 - 04 sep, 2026" de la captura.
export const fileSharingDateRange = {
  minDate: '2025-10-01',
  maxDate: '2026-09-04',
};

export const fileSharingClientBanks: ClientBankResponse[] = [
  { bankId: 101, bankName: 'Banco Central', regionId: 1, countryId: 1 },
  { bankId: 102, bankName: 'Banco Norte', regionId: 1, countryId: 2 },
];

export const fileSharingClientInformation: ClientInformationResponse = {
  regions: [{ regionId: 1, regionName: 'LATAM' }],
  countries: [
    { countryId: 1, countryName: 'Perú', regionId: 1 },
    { countryId: 2, countryName: 'Colombia', regionId: 1 },
  ],
  banks: fileSharingClientBanks,
  groups: [{ groupId: 1, groupName: 'Grupo Financiero Demo' }],
  brands: [{ brandId: 1, brandName: 'Visa' }],
};

export const fileSharingFiles: FileSharingResponse[] = [
  {
    fileId: 1,
    fileNameOriginal: 'alerts-2026-07-17',
    fileNameUser: 'alerts-2026-07-17',
    fileNameSystem: 'sys_1.xlsx',
    filePath: '/files/sys_1.xlsx',
    categoryId: 1,
    categoryName: 'Default category',
    fileDtUploadDate: '2026-09-04T16:11:00',
    fileSize: 34509, // ~33.7 KB
    fileUploadedBy: 'Wilfredo Tito',
    fileDescription: null,
    userCompany: 'Banco Central',
    fileShared: 1,
    fileCanDelete: 1,
    flagDeleted: false,
    exeParams: null,
    sessionUser: 'Wilfredo Tito',
    flagPack: false,
    usersSharedByBank: null,
    fileExtension: 'xlsx',
    fileDownload: true,
  },
];

export const fileSharingFilesEmpty: FileSharingResponse[] = [];
