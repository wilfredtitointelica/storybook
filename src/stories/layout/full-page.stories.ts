import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';
import { provideRouter, RouterOutlet } from '@angular/router';
import { shellImports, shellProviders, shellRoutes, shellTemplate } from '../shell';

const meta: Meta = {
  title: 'Layout/Full Page (Header + Sidebar)',
  parameters: {
    docs: {
      description: {
        component: 'Header y Sidebar reales montados juntos, con el mismo layout (lyDashboard) que usa IntelicaContainerExternal en producción. Data de ejemplo fija, sin backend. Los botones del header/sidebar (File Sharing, Fee Library, etc.) navegan con ruteo real de Angular.',
      },
    },
  },
};
export default meta;

type Story = StoryObj;

// businessuserTypeName: 'Intelica' muestra el selector de idioma en el header, igual que en producción.
const configOverrides = { businessuserTypeName: 'Intelica', fullName: 'Wilfredo Tito' };

export const Actual: Story = {
  name: 'Actual (producción)',
  decorators: [
    applicationConfig({
      providers: [provideRouter(shellRoutes('actual')), ...shellProviders('actual', configOverrides)],
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
      providers: [provideRouter(shellRoutes('propuesta')), ...shellProviders('propuesta', configOverrides)],
    }),
  ],
  render: () => ({
    moduleMetadata: { imports: [...shellImports('propuesta'), RouterOutlet] },
    template: shellTemplate('<router-outlet />'),
  }),
};
