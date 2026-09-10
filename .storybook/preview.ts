import { applicationConfig, type Preview } from '@storybook/angular';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors, HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import { of } from 'rxjs';
import Aura from '@primeuix/themes/aura';

// El tema (IntelicaStyleGuide + PrimeNG) se carga vía angular.json -> projects.IntelicaShowcase.architect.build.options.styles,
// igual que el resto de la plataforma. No se importa aquí porque el builder de Angular ya lo inyecta en el preview iframe.

// En producción, Google Tag Manager inicializa window.dataLayer antes de que Angular arranque.
// Acá no hay GTM real: si no se inicializa, GoogleTaskManagerService.pushEvent() de
// intelica-library-base revienta con "Cannot read properties of undefined (reading 'push')".
(window as any).dataLayer = (window as any).dataLayer || [];

// Varios servicios REALES (sin mockear) de intelica-library-components/base/notification
// necesitan que HttpClient y ConfirmationService (PrimeNG) existan en el árbol de inyección,
// aunque nunca lleguen a usarlos con la data de ejemplo (ej. GlobalFeatureFlagService,
// SessionInactivityService -> AlertService -> ConfirmationService, CloseSessionService).
// Este interceptor es una red de seguridad extra: si por algún camino no mockeado se dispara
// una llamada HTTP real, la bloquea en vez de pegarle a un backend real o colgarse.
const blockRealHttpInterceptor: HttpInterceptorFn = (req, next) => {
  console.warn(`[IntelicaShowcase] Llamada HTTP real bloqueada (no hay backend en el showcase): ${req.method} ${req.url}`);
  return of(new HttpResponse({ status: 200, body: [] }));
};

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // INTENTO REVERTIDO (2026-09-10): se probó `options.storySort` acá para forzar
    // "Fee/Incontrol Panel (Landing)" como primera story (pantalla inicial al abrir Storybook sin
    // `?path=`). Rompió el manager entero: "Error fetching `/index.json`" + "SyntaxError:
    // Unexpected token ':'" en globals-runtime.js, dejando el sidebar atascado en "Get started 25%"
    // para TODOS los módulos, no solo Landing. Hipótesis (no confirmada del todo): Storybook indexa
    // `storySort` en un paso aparte que corre ANTES/fuera del compilador de Angular/TS normal para
    // poder generar index.json en build-time — las anotaciones de tipo TypeScript de la función
    // (`a: {title, id}`) podrían no sobrevivir ese paso y terminar evaluándose como JS crudo, de ahí
    // el "Unexpected token ':'". Revertido sin volver a intentarlo a ciegas — si se retoma, probar
    // primero SIN anotaciones de tipo explícitas y validar sirviendo `storybook-static/index.json`
    // (o el nombre real que genere esa versión) con un fetch real antes de darlo por bueno, no
    // alcanza con que el build en sí compile sin errores (ver lección de webpackFinal más abajo).
  },
  decorators: [
    applicationConfig({
      providers: [
        provideAnimationsAsync(),
        provideHttpClient(withInterceptors([blockRealHttpInterceptor])),
        ConfirmationService,
        MessageService,
        providePrimeNG({
          theme: {
            preset: Aura,
            options: { darkModeSelector: false },
          },
        }),
      ],
    }),
  ],
};

export default preview;
