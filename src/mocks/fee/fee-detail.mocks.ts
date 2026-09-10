// Reemplazo de FeeDetailService y CustomConfigurationService reales: mismos métodos públicos, sin
// HttpClient, fixtures fijas. Siempre devuelve la MISMA tarifa de ejemplo (3F4030508) sin importar
// el feeId/bankId real de la ruta — igual que el resto de mocks de este showcase, no simulan
// backend real por-fee, solo el "flagship" verificado contra la captura.
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { delayedOf } from '../shared.mocks';
import { CustomConfigurationByFeeResponse, CustomConfigurationResponse } from '../../mirrors/fee/fee-detail/modal-set-alert/DTO/response';
import { CustomConfigurationMaintenanceRequest } from '../../mirrors/fee/fee-detail/modal-set-alert/DTO/request';
import {
  feeDetailActiveAlert,
  feeDetailBankId,
  feeDetailBillingHistory,
  feeDetailChart,
  feeDetailInfo,
  feeDetailKpi,
  feeDetailRateVersions,
  feeDetailReference,
  feeDetailReferencePdfBase64,
  feeDetailSummary,
} from './fee-detail.data';

// Decodifica el PDF real embebido (base64, ver comentario junto a feeDetailReferencePdfBase64 en
// fee-detail.data.ts) a un Blob válido `application/pdf` — así el <iframe> del modal de referencias
// (modal-reference.ts.onViewReference -> URL.createObjectURL) renderiza un documento real.
function decodeReferencePdfBlob(): Blob {
  const binary = atob(feeDetailReferencePdfBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: 'application/pdf' });
}

export function createMockFeeDetailService() {
  return {
    getFeeDetailInfo: () => delayedOf(feeDetailInfo),
    getFeeSummary: () => delayedOf(feeDetailSummary),
    getFeeRateVersions: () => delayedOf(feeDetailRateVersions),
    getFeeDetailKpi: () => delayedOf(feeDetailKpi),
    getFeeDetailChart: () => delayedOf(feeDetailChart),
    getFeeDetailHistory: () => delayedOf(feeDetailBillingHistory),
    getReferences: () => delayedOf([feeDetailReference]),
    downloadReferencePdf: () => of(decodeReferencePdfBlob()),
    downloadBillingHistory: () => of(new HttpResponse({ body: new Blob() })),
    downloadExpenseEvolutionComparison: () => of(new HttpResponse({ body: new Blob() })),
  };
}

// Estado MUTABLE en memoria (no un fixture estático): fee-detail.ts.loadHasAlert() (que decide si el
// botón del título dice "Set Alert" o "Edit Alert") y modal-set-alert.ts.loadConfig() (que decide la
// sección "choose" vs "manage") llaman a `getByFee()` de nuevo cada vez que el modal se cierra con
// `saved:true` (ver fee-detail.ts.onSetAlertClosed) — incluyendo después de un delete. Si `getByFee`
// siempre devolviera el mismo `feeDetailActiveAlert` fijo (como antes), borrar la alerta nunca se
// reflejaba: el botón se quedaba en "Edit Alert" y el modal seguía abriendo en "manage" para siempre.
// `create`/`update`/`delete` ahora mutan esta misma variable, igual que el patrón ya usado en otras
// partes mutables de este showcase (Teams: addMember/deleteMember, Notifications: updateSettings).
let currentAlertConfig: CustomConfigurationResponse | null = feeDetailActiveAlert.configuration;
let nextCustomConfigurationId = (feeDetailActiveAlert.configuration?.customConfigurationId ?? 9000) + 1;

export function createMockCustomConfigurationService() {
  return {
    getClientInformation: () => delayedOf({ regions: [], countries: [], banks: [], groups: [], brands: [] }),
    getByFee: () => delayedOf<CustomConfigurationByFeeResponse>({ clientId: feeDetailBankId, configuration: currentAlertConfig }),
    create: (command: CustomConfigurationMaintenanceRequest) => {
      const id = nextCustomConfigurationId++;
      currentAlertConfig = {
        customConfigurationId: id,
        clientId: feeDetailBankId,
        businessUserId: feeDetailActiveAlert.configuration?.businessUserId ?? 'usr-001-wilfredo-tito',
        feeId: command.feeId,
        configurationType: command.configurationType,
        thresholdValue: command.thresholdValue,
        thresholdUnit: command.thresholdUnit,
        currencyId: command.currencyId,
        isActive: true,
        createdDate: new Date().toISOString(),
        updatedDate: null,
      };
      return of({ customConfigurationId: id });
    },
    update: (id: number, command: CustomConfigurationMaintenanceRequest) => {
      if (currentAlertConfig) {
        currentAlertConfig = {
          ...currentAlertConfig,
          customConfigurationId: id,
          configurationType: command.configurationType,
          thresholdValue: command.thresholdValue,
          thresholdUnit: command.thresholdUnit,
          currencyId: command.currencyId,
          updatedDate: new Date().toISOString(),
        };
      }
      return of({ customConfigurationId: id });
    },
    delete: (id: number) => {
      currentAlertConfig = null;
      return of({ customConfigurationId: id });
    },
  };
}
