import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { setCookie } from 'typescript-cookie';
import { ConfigService, GlobalTermService, GlobalMenuService } from 'intelica-library-base';
import { NotificationOrchestratorService } from 'intelica-library-notification';
import { activeClientID } from '../../mocks/header/user-profile.data';

// Preselecciona el perfil/cliente activo en el switcher del header (igual que en producción,
// donde viene de la cookie real tras el login).
setCookie('defaultClientID', activeClientID);

// "Actual": tal cual está hoy en producción (la barra completa: logo, products, alerts, búsqueda,
// file sharing, idioma, notificaciones, perfil). No se edita a mano — se resincroniza desde el
// repo real (ver mirrors/README.md).
import { App as HeaderAppActual } from '../../mirrors/header/app';
import { ProductsHttpService as ProductsHttpServiceActual } from '../../mirrors/header/menu-products/products.http.service';
import { UserProfileHttpService as UserProfileHttpServiceActual } from '../../mirrors/header/user-profile/user-profile.http.service';
import { SearchService as SearchServiceActual } from '../../mirrors/header/search-main/search.service';

// "Propuesta": copia editable donde el equipo aplica mejoras de CSS/HTML/TS para mostrarle a Producto.
import { App as HeaderAppPropuesta } from '../../prototypes/header/app';
import { ProductsHttpService as ProductsHttpServicePropuesta } from '../../prototypes/header/menu-products/products.http.service';
import { UserProfileHttpService as UserProfileHttpServicePropuesta } from '../../prototypes/header/user-profile/user-profile.http.service';
import { SearchService as SearchServicePropuesta } from '../../prototypes/header/search-main/search.service';

import { createMockConfigService, createMockGlobalTermService, mockActivatedRoute } from '../../mocks/shared.mocks';
import { createMockGlobalMenuServiceBase, createMockProductsHttpService } from '../../mocks/header/menu-products.mocks';
import {
  createMockUserProfileHttpService,
  createMockNotificationOrchestratorService,
  createMockSearchService,
} from '../../mocks/header/header.mocks';

const meta: Meta = {
  title: 'Header/Header Bar',
  parameters: {
    docs: {
      description: {
        component: 'Barra de header completa (IntelicaHeaderWeb). Data de ejemplo fija, sin backend.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// businessuserTypeName: 'Intelica' hace que se muestre el selector de idioma (Eng), igual que en producción.
const configOverrides = { businessuserTypeName: 'Intelica', fullName: 'Wilfredo Tito' };

export const Actual: Story = {
  name: 'Actual (producción)',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConfigService, useValue: createMockConfigService(configOverrides) },
        { provide: GlobalTermService, useValue: createMockGlobalTermService() },
        { provide: GlobalMenuService, useValue: createMockGlobalMenuServiceBase() },
        { provide: ProductsHttpServiceActual, useValue: createMockProductsHttpService() },
        { provide: UserProfileHttpServiceActual, useValue: createMockUserProfileHttpService() },
        { provide: SearchServiceActual, useValue: createMockSearchService() },
        { provide: NotificationOrchestratorService, useValue: createMockNotificationOrchestratorService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [HeaderAppActual] },
    template: '<app-header />',
  }),
};

export const Propuesta: Story = {
  name: 'Propuesta (mejora)',
  decorators: [
    applicationConfig({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ConfigService, useValue: createMockConfigService(configOverrides) },
        { provide: GlobalTermService, useValue: createMockGlobalTermService() },
        { provide: GlobalMenuService, useValue: createMockGlobalMenuServiceBase() },
        { provide: ProductsHttpServicePropuesta, useValue: createMockProductsHttpService() },
        { provide: UserProfileHttpServicePropuesta, useValue: createMockUserProfileHttpService() },
        { provide: SearchServicePropuesta, useValue: createMockSearchService() },
        { provide: NotificationOrchestratorService, useValue: createMockNotificationOrchestratorService() },
      ],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [HeaderAppPropuesta] },
    template: '<app-header />',
  }),
};
