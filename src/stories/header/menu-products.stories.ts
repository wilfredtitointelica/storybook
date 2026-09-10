import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { ConfigService, GlobalTermService, GlobalMenuService } from 'intelica-library-base';

// "Actual": tal cual está hoy en producción. No se edita a mano — se resincroniza
// desde el repo real (ver mirrors/README.md).
import { MenuProducts as MenuProductsActual } from '../../mirrors/header/menu-products/menu-products';
import { ProductsHttpService as ProductsHttpServiceActual } from '../../mirrors/header/menu-products/products.http.service';

// "Propuesta": copia editable donde el equipo aplica mejoras de CSS/HTML/TS para mostrarle a Producto.
import { MenuProducts as MenuProductsPropuesta } from '../../prototypes/header/menu-products/menu-products';
import { ProductsHttpService as ProductsHttpServicePropuesta } from '../../prototypes/header/menu-products/products.http.service';

import { createMockConfigService, createMockGlobalTermService } from '../../mocks/shared.mocks';
import { createMockProductsHttpService, createMockGlobalMenuServiceBase } from '../../mocks/header/menu-products.mocks';

const meta: Meta = {
  title: 'Header/Menu Products',
  parameters: {
    docs: {
      description: {
        component: 'Selector de productos del header real (IntelicaHeaderWeb). Data de ejemplo fija, sin backend.',
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
      providers: [
        provideRouter([]),
        { provide: ConfigService, useValue: createMockConfigService() },
        { provide: GlobalTermService, useValue: createMockGlobalTermService() },
        { provide: GlobalMenuService, useValue: createMockGlobalMenuServiceBase() },
        { provide: ProductsHttpServiceActual, useValue: createMockProductsHttpService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [MenuProductsActual] },
    template: '<div style="padding: 1rem; background: #1a1a2e;"><menu-products /></div>',
  }),
};

export const Propuesta: Story = {
  name: 'Propuesta (mejora)',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: ConfigService, useValue: createMockConfigService() },
        { provide: GlobalTermService, useValue: createMockGlobalTermService() },
        { provide: GlobalMenuService, useValue: createMockGlobalMenuServiceBase() },
        { provide: ProductsHttpServicePropuesta, useValue: createMockProductsHttpService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [MenuProductsPropuesta] },
    template: '<div style="padding: 1rem; background: #1a1a2e;"><menu-products /></div>',
  }),
};
