import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) con ruteo real (para que el sidebar/header también naveguen desde acá) —
// en producción TPE Analytics nunca se ve sin ese layout alrededor. Los "filtros globales" de esta
// pantalla son la barra de filtros propia del módulo (fee-tpe-filter, con fecha/marca/ICA), ya
// incluida en <fee-tpe> arriba del <router-outlet> hijo (dashboard/penalties-paid/merchant-report/
// recomendations) — no es un componente aparte del shell.
const meta: Meta = {
  title: 'Fee/TPE Analytics',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de TPE Analytics (Fee External), montada dentro del layout real (header + sidebar). Data de ejemplo fija, sin backend.',
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
      providers: [provideRouter(shellRoutes('actual', 'fee/tpe')), ...shellProviders('actual')],
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
      providers: [provideRouter(shellRoutes('propuesta', 'fee/tpe')), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
