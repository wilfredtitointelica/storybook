// Data fija de ejemplo para el switcher de perfil/cliente del header (popover de usuario).
import { BusinessUserClientGroupsResponse } from '../../mirrors/header/user-profile/dto/profile.dto';

function client(clientID: string, intelicaName: string): BusinessUserClientGroupsResponse {
  return {
    businessUserClientGroupID: `BUCG-${clientID}`,
    clientGroupID: `CG-${clientID}`,
    intelicaName,
    bankName: intelicaName,
    projectName: intelicaName,
    isDefault: false,
    isGroup: false,
    isInternal: false,
    languageID: 'EN',
    clientDetails: [{ clientID, intelicaName, bankName: intelicaName, projectName: intelicaName, associnvBankID: 0, languageID: 'EN' }],
  };
}

export const userProfileClientGroups: BusinessUserClientGroupsResponse[] = [
  client('MBH-HU', 'Hungary - MBH Bank'),
  client('MBH-HU-BUD', 'Hungary - MBH Bank - Budapest'),
  client('MBH-HU-TAK', 'Hungary - MBH Bank - Takarékbank'),
  client('METROBANK-PH', 'Philippines - Metrobank'),
  client('NCB-JM', 'Jamaica - NCB'),
  client('NEDBANK-ZA', 'South Africa - Nedbank'),
  client('NEDBANK-TPE-ZA', 'South Africa - Nedbank - TPE'),
  client('NEONET-GT', 'Guatemala - Neonet'),
  client('NEXI-GR', 'Greece - Nexi'),
  client('NEXI-IT', 'Italy - Nexi'),
  client('NOMO-UK', 'United Kingdom - Nomo Bank'),
  client('OCA-ITAU-UY', 'Uruguay - OCA - Itaú'),
  client('ORCO-GROUP', 'Group - Orco'),
  client('ORCO-AW', 'Aruba - Orco'),
  client('ORCO-BQ', 'Bonaire - Orco'),
  client('ORCO-CW', 'Curaçao - Orco'),
  client('NBG-GR', 'Greece - NBG'),
  client('NBG-PAY-GR', 'Greece - NBG Pay'),
];

// Coincide con el clientID del último item de arriba: hace que quede preseleccionado como
// perfil activo, igual que en la captura real. Se setea como cookie en la story (defaultClientID).
export const activeClientID = 'NBG-PAY-GR';
