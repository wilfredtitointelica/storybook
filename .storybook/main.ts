import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-docs"
  ],
  "framework": {
    "name": "@storybook/angular",
    "options": {}
  }
  // INTENTO REVERTIDO (2026-09-09): se probó forzar `webpackFinal` -> `config.output.publicPath = '/'`
  // para arreglar "Loading chunk X failed" cuando el Router real de Angular (shellRoutes en
  // stories/shell.ts) cambia la URL del iframe (ej. a "/fee/library") y después se cambia de story.
  // Rompió MUCHO más de lo que arregló: Storybook arma los imports estáticos de arranque de
  // iframe.html como `'./' + publicPath + archivo` — con publicPath='/' eso da `.//archivo.js`
  // (doble slash), y el navegador pide una ruta que el dev-server devuelve 404 para LOS DOS chunks
  // de arranque (runtime~main y main), tumbando la app entera en vez de solo el caso puntual que se
  // quería arreglar. Confirmado con curl: `http://localhost:6006//runtime~main.iframe.bundle.js` ->
  // 404. Revertido a la config original (`publicPath` en modo 'auto', el default de webpack 5).
  // El bug original de "Loading chunk X failed" al cambiar de story después de navegar adentro de
  // una (vía sidebar/tabs reales) sigue sin arreglo de código — el workaround verificado es recargar
  // la página completa (F5 / cerrar y reabrir la pestaña) antes de cambiar de story si navegaste
  // adentro de la anterior. Si se retoma esto, hay que probarlo visualmente en el navegador antes de
  // darlo por bueno, no alcanza con confirmar el build por consola.
};
export default config;
