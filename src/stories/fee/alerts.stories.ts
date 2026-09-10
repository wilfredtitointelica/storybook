import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) — EXCEPTO Alerts (y File Sharing): en producción real, `App` (Header,
// mirrors/header/app.ts) hace `globalMenuService.setMenuVisibility(false)` cuando la ruta es
// '/fee/alerts', y `MenuApp` (mirrors/menu/app.html) ya envuelve TODO su contenido en
// `@if (... && isMenuVisible())` — o sea que el sidebar se auto-oculta de verdad en esta pantalla
// (confirmado también por el CSS real `&:has(app-menu:empty) &__sidebar { display: none; }` en
// _dashboard.scss). El mock de GlobalMenuService (mocks/header/menu-products.mocks.ts) ya sabe
// ocultar el sidebar para '/fee/alerts' de forma reactiva a la ruta activa — no hace falta pasarle
// nada especial acá, `shellProviders('actual')` alcanza, igual que las 3 capturas de referencia (sin
// columna de sidebar, solo el link "Alerts" en el header, al lado de "Products").
const meta: Meta = {
  title: 'Fee/Alerts',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de Alerts (Fee External), montada dentro del layout real (header, sin sidebar — igual que en producción). Data de ejemplo fija, sin backend.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

export const Actual: Story = {
  name: 'Actual (producción)',
  decorators: [
    applicationConfig({
      providers: [provideRouter(shellRoutes('actual', 'fee/alerts')), ...shellProviders('actual')],
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
      providers: [provideRouter(shellRoutes('propuesta', 'fee/alerts')), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
