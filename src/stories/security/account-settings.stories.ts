import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

// Security/Account Settings ("Configuración") NO se llega a través del sidebar de Fee (a
// diferencia de todos los módulos en `Fee/*`): en producción real es la ruta '/security/*' del
// container (IntelicaContainerExternal/src/microfrontend-layout.html), donde solo montan Header +
// Security (+ Footer) — la Menu microfrontend (el sidebar de productos de Fee) nunca se monta ahí.
// La propia pantalla real trae su PROPIO sidebar interno (account-settings.component.html ->
// `<app-sidebar/>`, clase `lySecurity__sidebar`, con Profile/Teams/Security/Notifications) — por
// eso, igual que Fee/Alerts, el sidebar de Fee se oculta acá. El mock de GlobalMenuService
// (mocks/header/menu-products.mocks.ts) ya lo hace de forma reactiva a la ruta activa
// ('/security/settings' está en `FORCE_MENU_HIDDEN_PREFIXES`) — y se vuelve a mostrar solo si el
// usuario navega de vuelta a un módulo de Fee dentro de la MISMA story (ej. clickeando "Productos"),
// no se queda pegado en oculto para siempre. No hace falta pasarle nada especial a
// `shellProviders('actual')`.
// El usuario llega acá haciendo click en el botón "Configuración" del popover de user-profile del
// Header (mirrors/header/user-profile/user-profile.ts -> onSettings() ->
// navigateToUrl('/security/settings/profile')) o desde notification-bell-admin
// (-> '/security/settings/teams') — ambos código real sin editar. En este showcase, donde
// single-spa nunca se inicializa, ese `navigateToUrl` se intercepta vía el shim de
// `window.history.pushState` en ../shell.ts y se reenvía al Router de Angular de la story activa.
// El tab "Teams" requiere `isAdmin: true` en la cookie de sesión demo (ver ../shell.ts) — ya está
// seteado así, igual para todo el showcase.
const meta: Meta = {
  title: 'Security/Account Settings',
  parameters: {
    docs: {
      description: {
        component:
          'Pantalla real de Security / Account Settings, montada dentro del layout real (header, sin el sidebar de productos de Fee — la pantalla trae su propio sidebar interno). Se llega acá desde el botón "Configuración" del user-profile del Header. Sin capturas de referencia para este módulo: data de ejemplo razonable, sin backend.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

const defaultPath = 'security/settings/profile';

export const Actual: Story = {
  name: 'Actual (producción)',
  decorators: [
    applicationConfig({
      providers: [provideRouter(shellRoutes('actual', defaultPath)), ...shellProviders('actual')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('actual'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};

export const Propuesta: Story = {
  name: 'Propuesta (mejora)',
  decorators: [
    applicationConfig({
      providers: [provideRouter(shellRoutes('propuesta', defaultPath)), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
