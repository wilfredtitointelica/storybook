// Reemplazo de los 4 servicios "leaf" reales de Security/Account Settings (ProfileService,
// SecurityService, TeamsService, NotificationsService): mismos métodos públicos, sin HttpClient.
// OJO: NO se mockea AccountSettingsStateService (mirrors/security/account-settings/account-settings-state.service.ts)
// — esa clase es real y sin editar, orquesta el forkJoin de los 4 servicios de abajo, igual que
// cualquier otro `providedIn: 'root'` real de este showcase.
// GETs con `delayedOf(...)` (~1s) para que los skeletons reales de las 4 pantallas/():
// (profile/security/notifications/teams.component.html, y sidebar/team-member) se alcancen a ver,
// igual que el resto de módulos del showcase (ver doc de `delayedOf` en shared.mocks.ts).
// Las mutaciones (update/addMember/updateMember/deleteMember/resolveRequest/updateSettings/
// changePassword/verifyTwoFactor) SÍ mutan el estado en memoria de este módulo, para que la demo
// reaccione visualmente después de cada acción (ej. aprobar/rechazar/borrar un miembro del equipo
// realmente saca/mete filas de la tabla, no queda "pegado" en la data fija original).
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import {
  accountSettingsUser,
  accountSettingsConfigMetadata,
  accountSettingsSecurityStatus,
  accountSettingsSetupTwoFactor,
  accountSettingsTwoFactorMagicCode,
  accountSettingsNotificationSettings,
  accountSettingsTeamMembers,
} from './account-settings.data';
import { UserResponse, UserUpdateCommand } from '../../mirrors/security/account-settings/profile/dto/profile-update.dto';
import { SecurityStatusResponse } from '../../mirrors/security/account-settings/security/dto/password-update.dto';
import { VerifyTwoFactorResponse } from '../../mirrors/security/account-settings/security/dto/two-factor.dto';
import { AddMemberResponse, TeamMembersResponse } from '../../mirrors/security/account-settings/teams/dto/member.dto';
import { NotificationSettingsResponse, UpdateNotificationCommand } from '../../mirrors/security/account-settings/notifications/dto/notification-settings.dto';

// --- estado mutable en memoria, compartido por los 4 factories de abajo (mismo patrón que otros
// mocks "con mutación" de este showcase, ej. createMockFileSharingService) ------------------------
let currentUser: UserResponse = { ...accountSettingsUser };
let currentSecurityStatus: SecurityStatusResponse = { ...accountSettingsSecurityStatus };
let currentNotificationSettings: NotificationSettingsResponse = { ...accountSettingsNotificationSettings };
let currentTeamMembers: TeamMembersResponse[] = accountSettingsTeamMembers.map(m => ({ ...m }));

export function createMockProfileService() {
  return {
    getById: (_userId: string) => delayedOf(currentUser),
    getConfigMetadata: (_include: string) => delayedOf(accountSettingsConfigMetadata),
    update: (command: UserUpdateCommand) => {
      currentUser = {
        ...currentUser,
        name: command.name,
        lastName: command.lastName,
        department: command.department,
        businessWorkId: command.businessWorkId,
        businessWorkOther: command.businessWorkOther,
        workRoleId: command.workRoleId,
      };
      return of(undefined);
    },
  };
}

export function createMockSecurityService() {
  return {
    getSecurityStatus: (_businessUserID: string) => delayedOf(currentSecurityStatus),
    setupTwoFactor: (_businessUserID: string) => delayedOf(accountSettingsSetupTwoFactor),
    // Código demo "mágico" 123456 (accountSettingsTwoFactorMagicCode): cualquier otro código
    // devuelve verified:false, así el dialog de verificación también puede mostrar su estado de error.
    verifyTwoFactor: (_businessUserID: string, code: string) => {
      const verified = code === accountSettingsTwoFactorMagicCode;
      if (verified) {
        currentSecurityStatus = { ...currentSecurityStatus, twoFactorEnabled: true, lastSecurityUpdate: new Date().toISOString() };
      }
      return delayedOf<VerifyTwoFactorResponse>({ verified }, 600);
    },
    changePassword: (_currentPassword: string, _newPassword: string) => {
      currentSecurityStatus = { ...currentSecurityStatus, passwordStrength: 'VerySecure', lastSecurityUpdate: new Date().toISOString() };
      return of(undefined);
    },
  };
}

export function createMockTeamsService() {
  return {
    getBusinessWorks: () => delayedOf(accountSettingsConfigMetadata.businessWorks ?? []),
    addMember: (data: { name: string; lastName: string; email: string; isAdmin: boolean; businessWorkId: string | null; businessWorkOther?: string; clientGroupID: string }) => {
      const newMember: TeamMembersResponse = {
        userID: `usr-demo-${Date.now()}`,
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        userLoginID: data.email,
        isAdmin: data.isAdmin,
        active: false,
        statusCode: 'PA',
        statusDescription: 'Pending',
        requestType: data.isAdmin ? 'New Administrator' : 'Account Request',
        createdDate: new Date().toISOString(),
        workRoleId: null,
        department: null,
        businessWorkId: data.businessWorkId,
        businessWorkOther: data.businessWorkOther ?? null,
      };
      currentTeamMembers = [...currentTeamMembers, newMember];
      return delayedOf<AddMemberResponse>({ userID: newMember.userID, activationToken: 'demo-activation-token', userEmailExist: false }, 600);
    },
    updateMember: (data: { userID: string; userLoginID: string; name: string; lastName: string; email: string; isAdmin: boolean; businessWorkId: string | null; businessWorkOther?: string }) => {
      currentTeamMembers = currentTeamMembers.map(m =>
        m.userID === data.userID
          ? {
              ...m,
              name: data.name,
              lastName: data.lastName,
              email: data.email,
              userLoginID: data.userLoginID,
              isAdmin: data.isAdmin,
              businessWorkId: data.businessWorkId,
              businessWorkOther: data.businessWorkOther ?? null,
            }
          : m
      );
      return of(undefined);
    },
    deleteMember: (businessUserID: string) => {
      currentTeamMembers = currentTeamMembers.filter(m => m.userID !== businessUserID);
      return of(undefined);
    },
    resolveRequest: (businessUserID: string, action: 'APPROVE' | 'REJECT') => {
      currentTeamMembers = currentTeamMembers.map(m =>
        m.userID === businessUserID
          ? { ...m, statusCode: action === 'APPROVE' ? 'A' : 'DE', statusDescription: action === 'APPROVE' ? 'Approved' : 'Rejected', active: action === 'APPROVE' }
          : m
      );
      return of(undefined);
    },
    listTeamMembers: () => delayedOf(currentTeamMembers),
  };
}

export function createMockNotificationsService() {
  return {
    getSettings: (_businessUserID: string) => delayedOf(currentNotificationSettings),
    updateSettings: (command: UpdateNotificationCommand) => {
      currentNotificationSettings = {
        emailNotificationMaster: command.emailNotificationMaster,
        newFee: command.newFee,
        penalty: command.penalty,
        optOut: command.optOut,
        announcements: command.announcements,
        customFees: command.customFees,
        accessRequests: command.accessRequests,
        newUserRegistrations: command.newUserRegistrations,
      };
      return of(currentNotificationSettings);
    },
  };
}
