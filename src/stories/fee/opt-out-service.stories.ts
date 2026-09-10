import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) con ruteo real (para que el sidebar/header también naveguen desde acá) —
// en producción Opt-Out Services nunca se ve sin ese layout alrededor. Los "filtros globales" de
// esta pantalla son la barra de filtros propia del módulo (fee-opt-out-service-filter, con
// marca/negocio/fecha), ya incluida en <fee-opt-out-service> arriba del <router-outlet> hijo
// (dashboard/top-subscriptions/savings/upcoming) — no es un componente aparte del shell.
const meta: Meta = {
  title: 'Fee/Opt-Out Services',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de Opt-Out Services (Fee External), montada dentro del layout real (header + sidebar). Data de ejemplo fija, sin backend.',
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
      providers: [provideRouter(shellRoutes('actual', 'fee/opt-out-service')), ...shellProviders('actual')],
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
      providers: [provideRouter(shellRoutes('propuesta', 'fee/opt-out-service')), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
