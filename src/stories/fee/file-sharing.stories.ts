import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';
import { createMockFileSharingService } from '../../mocks/fee/file-sharing.mocks';
import { FileSharingService as FileSharingServiceActual } from '../../mirrors/fee/file-sharing/file-sharing.service';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) con ruteo real (para que el sidebar/header también naveguen desde acá) —
// en producción File Sharing (y cualquier otro módulo) nunca se ve sin ese layout alrededor. Los
// "filtros globales" de File Sharing son la barra de filtros propia del módulo (fee-header, con
// cliente/fecha/categoría y el modal de filtros avanzados) — ya viene incluida dentro de
// <fee-file-sharing>, no es un componente aparte.
const meta: Meta = {
  title: 'Fee/File Sharing',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de File Sharing (Fee External), montada dentro del layout real (header + sidebar). Data de ejemplo fija, sin backend.',
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
      providers: [provideRouter(shellRoutes('actual', 'fee/filesharing')), ...shellProviders('actual')],
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
      providers: [provideRouter(shellRoutes('propuesta', 'fee/filesharing')), ...shellProviders('propuesta')],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};

export const SinArchivos: Story = {
  name: 'Actual - sin archivos',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter(shellRoutes('actual', 'fee/filesharing')),
        ...shellProviders('actual'),
        // Pisa el mock por defecto (con archivos) que ya puso shellProviders, para forzar el estado vacío.
        { provide: FileSharingServiceActual, useValue: createMockFileSharingService({ empty: true }) },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('actual'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
