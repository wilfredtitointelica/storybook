#!/usr/bin/env node
// Refresca src/mirrors/ copiando componentes seleccionados desde los repos reales.
// Uso: npm run sync:mirrors
// Nunca toca src/prototypes/ — esa carpeta es de edición manual.
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPOSITORIO = resolve(__dirname, '../../..'); // .../RESPOSITORIO
const SHOWCASE_SRC = resolve(__dirname, '../src');

// Agrega una entrada por cada componente/carpeta que quieras reflejar en mirrors/.
const MANIFEST = [
  {
    from: join(REPOSITORIO, 'external.new/Intelica.Fee.External.Web.New/IntelicaFeeExternalWeb/src/app/file-sharing'),
    to: join(SHOWCASE_SRC, 'mirrors/fee/file-sharing'),
  },
  {
    from: join(REPOSITORIO, 'external.new/Intelica.Fee.External.Web.New/IntelicaFeeExternalWeb/src/app/common'),
    to: join(SHOWCASE_SRC, 'mirrors/fee/common'),
  },
  {
    from: join(REPOSITORIO, 'external.new/Intelica.Fee.External.Web.New/IntelicaFeeExternalWeb/src/app/service/popover-freeze.service.ts'),
    to: join(SHOWCASE_SRC, 'mirrors/fee/service/popover-freeze.service.ts'),
  },
  {
    from: join(REPOSITORIO, 'styleguide-new/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/css'),
    to: join(SHOWCASE_SRC, 'styleguide/css'),
  },
  {
    from: join(REPOSITORIO, 'styleguide-new/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/fonts'),
    to: join(SHOWCASE_SRC, 'styleguide/fonts'),
  },
  {
    from: join(REPOSITORIO, 'styleguide-new/Intelica.Style.Guide.New/IntelicaStyleGuide/src/assets/images'),
    to: join(SHOWCASE_SRC, 'styleguide/images'),
  },
  {
    from: join(REPOSITORIO, 'menu.new/Intelica.Menu.Web.New/IntelicaMenuWeb/src/app/components/menu'),
    to: join(SHOWCASE_SRC, 'mirrors/menu/menu'),
  },
  {
    from: join(REPOSITORIO, 'header.new/Intelica.Header.Web.New/IntelicaHeaderWeb/src/app/menu-products'),
    to: join(SHOWCASE_SRC, 'mirrors/header/menu-products'),
  },
  {
    from: join(REPOSITORIO, 'security.new/Intelica.Security.External.Web/IntelicaSecurityExternalWeb/src/app/account-settings'),
    to: join(SHOWCASE_SRC, 'mirrors/security/account-settings'),
  },
  {
    from: join(REPOSITORIO, 'security.new/Intelica.Security.External.Web/IntelicaSecurityExternalWeb/src/app/common'),
    to: join(SHOWCASE_SRC, 'mirrors/security/common'),
  },
];

for (const { from, to } of MANIFEST) {
  if (!existsSync(from)) {
    console.warn(`[sync-mirrors] omitido, no existe: ${from}`);
    continue;
  }
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, {
    recursive: true,
    filter: src => !src.endsWith('.spec.ts'),
  });
  console.log(`[sync-mirrors] ${from} -> ${to}`);
}
