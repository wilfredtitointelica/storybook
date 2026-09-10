// Config de la UI "de afuera" de Storybook (sidebar, panel de addons) — separado de preview.ts
// (que configura lo que se monta ADENTRO de cada story). Este archivo NO afecta el bundle de las
// stories/mocks, solo el chrome de Storybook.
//
// Este proyecto es solo una vitrina visual con datos fijos: no usa Controls (no hay args/argTypes
// en ninguna story), Actions ni Interactions — por eso el panel de abajo ("This story has no
// controls") no aporta nada y se oculta acá de forma permanente para todo el mundo, sin depender de
// que cada usuario lo cierre a mano en su propio navegador (esa preferencia solo queda guardada en
// el localStorage de ESE navegador, no es un fix real).
import { addons, type State } from 'storybook/manager-api';

addons.setConfig({
  layoutCustomisations: {
    showPanel(_state: State, _defaultValue: boolean) {
      return false;
    },
  },
});
