// Reemplazo de SessionInactivityService real (mirrors/header/common/service/session-inactivity.service.ts).
// El real abre una conexión SignalR (WebSocket) a un backend real (`${environment.signalPath}/session-inactivity`)
// y solo arranca si existe la cookie "refreshToken" — el servidor es quien decide cuándo el usuario
// estuvo inactivo y empuja un evento "Disconnect" al cliente, que ahí recién muestra el modal
// "It seems you were absent. Do you want to continue?" (AlertService.warning + AlertButtonMode.CONFIRM_CANCEL,
// mismo texto/botones que la captura real). Como este showcase no tiene un backend real (ni SignalR),
// ese mecanismo servidor->cliente no se puede replicar tal cual — se simula el mismo resultado VISIBLE
// con un simple `setTimeout` en el cliente en vez de la conexión real, forzado a 5 minutos (pedido
// explícito del usuario) en vez de lo que sea que dure la inactividad real en producción.
import { AlertButtonMode, AlertService, GlobalTermService, TermPipe } from 'intelica-library-base';

const FORCED_INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos, forzado para la demo.

export function createMockSessionInactivityService(alertService: AlertService, termPipe: TermPipe, globalTermService: GlobalTermService) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  function scheduleAlert(): void {
    if (timeoutHandle) clearTimeout(timeoutHandle);
    timeoutHandle = setTimeout(() => {
      void showInactivityAlert();
    }, FORCED_INACTIVITY_MS);
  }

  async function showInactivityAlert(): Promise<void> {
    const title = termPipe.transform('SessionInactivity', globalTermService.languageCode);
    const result = await alertService.warning(title, undefined, AlertButtonMode.CONFIRM_CANCEL);
    if (result.isConfirmed) {
      // "Ok" -> el real llama UpdateLastActivity() (extiende la sesión contra el backend real) y
      // sigue escuchando el mismo hub. Acá no hay backend que avisar; solo se vuelve a programar el
      // mismo timer para poder ver el modal de nuevo sin tener que recargar la story.
      scheduleAlert();
    }
    // "Cancel" -> el real llama UpdateExpirationDate() y después CloseSessionService.closeSession(),
    // que en producción borra TODAS las cookies del navegador y redirige (`window.location.href`) al
    // login real. CloseSessionService sigue sin mockear en este showcase (nunca se había disparado
    // antes) — dejar que corra tal cual acá rompería la demo (borra las cookies de sesión que arma
    // stories/shell.ts y navega a una URL de login que no existe). Por eso, a propósito, "Cancel" acá
    // no hace nada más que cerrar el diálogo — no se intenta replicar ese efecto colateral destructivo.
  }

  return {
    initialize(): void {
      scheduleAlert();
    },
  };
}
