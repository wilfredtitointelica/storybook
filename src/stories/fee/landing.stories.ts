import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) con ruteo real — en producción el Incontrol Panel (landing) nunca se ve
// sin ese layout alrededor. A diferencia de Opt-Out Services/TPE, acá no hay una barra de filtros
// propia del módulo: LandingDashboard es a la vez el punto de entrada de la ruta y el contenido
// (ver landing.routes.ts), por eso no hace falta un componente padre con su propio <router-outlet>.
const meta: Meta = {
  title: 'Fee/Incontrol Panel (Landing)',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de Incontrol Panel / Landing (Fee External), montada dentro del layout real (header + sidebar). Data de ejemplo fija, sin backend.',
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
      providers: [provideRouter(shellRoutes('actual', 'fee/landing')), ...shellProviders('actual')],
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
      providers: [provideRouter(shellRoutes('propuesta', 'fee/landing')), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
