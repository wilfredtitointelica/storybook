import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';
import { feeDetailBankId, feeDetailFeeId } from '../../mocks/fee/fee-detail.data';

// Todas las pantallas de un módulo se muestran DENTRO del shell real (header arriba + sidebar al
// lado, ver ../shell.ts) con ruteo real. Fee Detail no tiene un link propio en el sidebar/header —
// en producción real SOLO se llega acá haciendo click en un Fee Code desde otro módulo (Fee
// Library, Fee Updates, Alerts, TPE), vía `CommonGlobalService.navigateToFeeDetail(...)`. Por eso
// esta story navega directo a una URL fija (`/fee/detail/<feeId>/<bankId>`) en vez de partir de un
// link de sidebar — el mock de FeeDetailService siempre devuelve el mismo fee de ejemplo
// (3F4030508, "Penalidad - Conversión Dinámica Moneda (DCC)...") sin importar el feeId/bankId real
// de la URL, igual que cualquier otro módulo de este showcase.
const defaultPath = `fee/detail/${feeDetailFeeId}/${feeDetailBankId}`;

const meta: Meta = {
  title: 'Fee/Fee Detail',
  parameters: {
    docs: {
      description: {
        component: 'Pantalla real de Fee Detail (Fee External), montada dentro del layout real (header + sidebar). Data de ejemplo fija, sin backend. Se llega acá haciendo click en un Fee Code desde Fee Library, Fee Updates, Alerts o TPE.',
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
