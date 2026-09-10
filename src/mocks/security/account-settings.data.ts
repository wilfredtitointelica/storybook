// Data fija de ejemplo para la story de Security/Account Settings. No pega a ningún backend real.
// No existen capturas de esta pantalla (a diferencia de la mayoría de módulos de este showcase) —
// toda la data acá es razonable-pero-no-verificada, igual que Opt-Out Savings o el bloque "Unit
// Cost by Product" de Landing cuando tampoco había captura de referencia. La identidad demo
// coincide con el resto del showcase: Wilfredo Tito / wilfredo.tito@intelica.com, cuenta "Intelica"
// (interna), igual que la cookie `data` seteada en ../../stories/shell.ts.
import { UserResponse, ConfigMetadataResponse, WorkRoleDto, BusinessWorkDto } from '../../mirrors/security/account-settings/profile/dto/profile-update.dto';
import { SecurityStatusResponse } from '../../mirrors/security/account-settings/security/dto/password-update.dto';
import { SetupTwoFactorResponse } from '../../mirrors/security/account-settings/security/dto/two-factor.dto';
import { TeamMembersResponse } from '../../mirrors/security/account-settings/teams/dto/member.dto';
import { NotificationSettingsResponse } from '../../mirrors/security/account-settings/notifications/dto/notification-settings.dto';

// Mismo id que `activeBusinessUserID` en ../../stories/shell.ts (la cookie `data` que lee
// SessionService) — no hace falta reimportarlo, solo mantenerlo igual a mano.
export const accountSettingsUserID = 'usr-001-wilfredo-tito';

// --- Profile / Master data ---------------------------------------------------------------

// `businessWorkId`: "¿A qué área de negocio perteneces?" (radio buttons, sección "Personal & Work
// Information" de Profile, y también usados en el modal Add/Edit Member de Teams). El id sentinela
// '00000...' es OTHER_BUSINESS_WORK_ID (hardcodeado igual en profile.component.ts y
// add-member-modal.component.ts): al seleccionarlo se revela un campo de texto libre.
export const OTHER_BUSINESS_WORK_ID = '00000000-0000-0000-0000-000000000000';

export const accountSettingsBusinessWorks: BusinessWorkDto[] = [
  { businessWorkId: 'bw-001-finance', name: 'BusinessWorkFinance' },
  { businessWorkId: 'bw-002-operations', name: 'BusinessWorkOperations' },
  { businessWorkId: 'bw-003-technology', name: 'BusinessWorkTechnology' },
  { businessWorkId: 'bw-004-marketing', name: 'BusinessWorkMarketing' },
  { businessWorkId: OTHER_BUSINESS_WORK_ID, name: 'BusinessWorkOther' },
];

// `workRoleId`: "¿Cuál es tu rol operativo?" (select, sección "Work Details" de Profile).
export const accountSettingsWorkRoles: WorkRoleDto[] = [
  { workRoleId: 'wr-001-analyst', name: 'WorkRoleAnalyst' },
  { workRoleId: 'wr-002-manager', name: 'WorkRoleManager' },
  { workRoleId: 'wr-003-director', name: 'WorkRoleDirector' },
  { workRoleId: 'wr-004-specialist', name: 'WorkRoleSpecialist' },
];

export const accountSettingsConfigMetadata: ConfigMetadataResponse = {
  workRoles: accountSettingsWorkRoles,
  businessWorks: accountSettingsBusinessWorks,
};

export const accountSettingsUser: UserResponse = {
  userID: accountSettingsUserID,
  name: 'Wilfredo',
  lastName: 'Tito',
  email: 'wilfredo.tito@intelica.com',
  userLoginID: 'wilfredo.tito@intelica.com',
  active: true,
  createdDate: '2024-03-12T14:30:00Z',
  department: 'Product',
  organizationName: 'Intelica',
  domain: 'intelica.com',
  workRoleId: 'wr-002-manager',
  businessWorkOther: null,
  businessWorkId: 'bw-003-technology',
};

// --- Security status -----------------------------------------------------------------------

// `passwordStrength: 'Secure'` -> isPasswordStrong() (security.domain.ts) trata 'Secure' y
// 'VerySecure' como fuerte, así el badge "Strong Password"/chip verde se ve en la demo.
// `twoFactorEnabled: false` a propósito -> deja visible el flujo completo de "activar 2FA" (dialog
// QR + código) en vez de arrancar ya habilitado.
export const accountSettingsSecurityStatus: SecurityStatusResponse = {
  twoFactorEnabled: false,
  passwordStrength: 'Secure',
  password: '••••••••••••',
  email: accountSettingsUser.email,
  active: true,
  lastSecurityUpdate: '2026-07-25T10:15:00Z',
  createdDate: '2024-03-12T14:30:00Z',
};

// QR real (no un placeholder en blanco): generado localmente con la librería `qrcode` (no es una
// dependencia del proyecto, se corrió una vez fuera del repo para producir este PNG estático),
// codificando una URL `otpauth://totp/...` de ejemplo con este mismo `manualEntryKey` — un
// autenticador real (Google Authenticator, Authy, etc.) SÍ puede escanear este QR y generar códigos
// válidos para él, aunque obviamente no está ligado a ninguna cuenta real. `manualEntryKey` coincide
// con el secreto codificado adentro, igual que en la captura de referencia.
export const accountSettingsSetupTwoFactor: SetupTwoFactorResponse = {
  manualEntryKey: 'NMN5FPSKK2N7BPK3IAU52N45FHSW5YRQ',
  qrCodeBase64:
    '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',
};

// Código "mágico" de demo: SecurityService.verifyTwoFactor() en account-settings.mocks.ts devuelve
// `{ verified: true }` solo cuando el código ingresado es EXACTAMENTE este valor, y
// `{ verified: false }` para cualquier otro — así la demo también puede mostrar el estado de
// "código incorrecto" del dialog de verificación.
export const accountSettingsTwoFactorMagicCode = '123456';

// --- Notifications --------------------------------------------------------------------------

// Mismos defaults que INITIAL_PREFERENCES en notifications.component.ts (mirrors), para que el
// estado inicial de los toggles calce con lo que el componente ya asume antes de que llegue la
// respuesta del backend.
export const accountSettingsNotificationSettings: NotificationSettingsResponse = {
  emailNotificationMaster: true,
  newFee: true,
  penalty: true,
  optOut: false,
  announcements: false,
  customFees: false,
  accessRequests: true,
  newUserRegistrations: false,
};

// --- Team members -----------------------------------------------------------------------------

// 6 miembros con variedad realista: aprobados (A) activos e inactivos, pendientes (PA) de admin y
// de cuenta normal, y uno rechazado (DE) — para que Teams muestre todos los estados/badges reales
// (team-member.html) sin necesitar interacción previa. `businessWorkId` reutiliza los mismos ids de
// accountSettingsBusinessWorks de arriba (nunca inventa uno nuevo).
export const accountSettingsTeamMembers: TeamMembersResponse[] = [
  {
    userID: accountSettingsUserID,
    name: 'Wilfredo',
    lastName: 'Tito',
    email: 'wilfredo.tito@intelica.com',
    userLoginID: 'wilfredo.tito@intelica.com',
    isAdmin: true,
    active: true,
    statusCode: 'A',
    statusDescription: 'Approved',
    requestType: null,
    createdDate: '2024-03-12T14:30:00Z',
    workRoleId: 'wr-002-manager',
    department: 'Product',
    businessWorkId: 'bw-003-technology',
    businessWorkOther: null,
  },
  {
    userID: 'usr-002-maria-gonzalez',
    name: 'Maria',
    lastName: 'Gonzalez',
    email: 'maria.gonzalez@intelica.com',
    userLoginID: 'maria.gonzalez@intelica.com',
    isAdmin: false,
    active: true,
    statusCode: 'A',
    statusDescription: 'Approved',
    requestType: 'Account Request',
    createdDate: '2025-01-20T09:00:00Z',
    workRoleId: 'wr-001-analyst',
    department: 'Finance',
    businessWorkId: 'bw-001-finance',
    businessWorkOther: null,
  },
  {
    userID: 'usr-003-carlos-ramirez',
    name: 'Carlos',
    lastName: 'Ramirez',
    email: 'carlos.ramirez@intelica.com',
    userLoginID: 'carlos.ramirez@intelica.com',
    isAdmin: true,
    active: false,
    statusCode: 'PA',
    statusDescription: 'Pending',
    requestType: 'New Administrator',
    createdDate: '2026-08-20T11:45:00Z',
    workRoleId: 'wr-003-director',
    department: 'Operations',
    businessWorkId: 'bw-002-operations',
    businessWorkOther: null,
  },
  {
    userID: 'usr-004-ana-torres',
    name: 'Ana',
    lastName: 'Torres',
    email: 'ana.torres@intelica.com',
    userLoginID: 'ana.torres@intelica.com',
    isAdmin: false,
    active: false,
    statusCode: 'PA',
    statusDescription: 'Pending',
    requestType: 'Account Request',
    createdDate: '2026-08-28T16:10:00Z',
    workRoleId: 'wr-004-specialist',
    department: 'Marketing',
    businessWorkId: 'bw-004-marketing',
    businessWorkOther: null,
  },
  {
    userID: 'usr-005-diego-fernandez',
    name: 'Diego',
    lastName: 'Fernandez',
    email: 'diego.fernandez@intelica.com',
    userLoginID: 'diego.fernandez@intelica.com',
    isAdmin: false,
    active: true,
    statusCode: 'A',
    statusDescription: 'Approved',
    requestType: null,
    createdDate: '2025-06-05T08:30:00Z',
    workRoleId: 'wr-001-analyst',
    department: 'Operations',
    businessWorkId: 'bw-002-operations',
    businessWorkOther: null,
  },
  {
    userID: 'usr-006-lucia-mendoza',
    name: 'Lucia',
    lastName: 'Mendoza',
    email: 'lucia.mendoza@intelica.com',
    userLoginID: 'lucia.mendoza@intelica.com',
    isAdmin: false,
    active: false,
    statusCode: 'DE',
    statusDescription: 'Rejected',
    requestType: 'Account Request',
    createdDate: '2026-05-14T13:20:00Z',
    workRoleId: null,
    department: null,
    businessWorkId: null,
    businessWorkOther: 'Legal & Compliance',
  },
];
