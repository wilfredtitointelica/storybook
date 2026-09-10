import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { ConfigService, GlobalTermService, GlobalMenuService, GlobalFavoriteService } from 'intelica-library-base';

// "Actual": tal cual está hoy en producción (rama qa/development — incluye el wrapper lySidebar,
// el badge Beta/Legacy y el ícono de enlace externo real). No se edita a mano — se resincroniza
// desde el repo real (ver mirrors/README.md).
import { App as MenuAppActual } from '../../mirrors/menu/app';
import { MenuHttpService as MenuHttpServiceActual } from '../../mirrors/menu/menu/menu-http.service';
import { StatusLastUpdateHttpService as StatusLastUpdateHttpServiceActual } from '../../mirrors/menu/status-last-update/status-last-update.service';

// "Propuesta": copia editable donde el equipo aplica mejoras de CSS/HTML/TS para mostrarle a Producto.
import { App as MenuAppPropuesta } from '../../prototypes/menu/app';
import { MenuHttpService as MenuHttpServicePropuesta } from '../../prototypes/menu/menu/menu-http.service';
import { StatusLastUpdateHttpService as StatusLastUpdateHttpServicePropuesta } from '../../prototypes/menu/status-last-update/status-last-update.service';

import { createMockConfigService, createMockGlobalTermService } from '../../mocks/shared.mocks';
import { createMockGlobalMenuServiceBase } from '../../mocks/header/menu-products.mocks';
import { createMockMenuHttpService, createMockGlobalFavoriteService, createMockStatusLastUpdateHttpService } from '../../mocks/menu/menu.mocks';

const meta: Meta = {
  title: 'Menu/Sidebar',
  parameters: {
    docs: {
      description: {
        component: 'Sidebar real de IntelicaMenuWeb (App + menu-sidebar + status-last-update). Data de ejemplo fija, sin backend.',
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
        { provide: GlobalFavoriteService, useValue: createMockGlobalFavoriteService() },
        { provide: MenuHttpServiceActual, useValue: createMockMenuHttpService() },
        { provide: StatusLastUpdateHttpServiceActual, useValue: createMockStatusLastUpdateHttpService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [MenuAppActual] },
    template: '<app-menu />',
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
        { provide: GlobalFavoriteService, useValue: createMockGlobalFavoriteService() },
        { provide: MenuHttpServicePropuesta, useValue: createMockMenuHttpService() },
        { provide: StatusLastUpdateHttpServicePropuesta, useValue: createMockStatusLastUpdateHttpService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [MenuAppPropuesta] },
    template: '<app-menu />',
  }),
};
