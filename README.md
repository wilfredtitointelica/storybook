# IntelicaShowcase

Vitrina visual e interactiva de las pantallas reales de la plataforma InControl (Fee External,
Menu, Header, Auth), pensada para mostrarle a Producto mejoras y correcciones **antes** de pasar
a producción — sin Figma, sin necesidad de levantar los 5 repos ni el backend.

Usa [Storybook](https://storybook.js.org/) + Angular con los componentes **reales** (copiados,
no reescritos) de cada módulo, con datos de ejemplo fijos en vez de llamadas HTTP.

## Cómo correrlo

```bash
npm install
npm run storybook          # http://localhost:6006
npm run build-storybook    # genera storybook-static/ para publicar en un hosting interno
```

## Estructura

- `src/mirrors/` — copia fiel de componentes tal cual están en producción. **No se edita a mano**,
  se resincroniza con `npm run sync:mirrors` (ver `scripts/sync-mirrors.mjs`).
- `src/prototypes/` — copia editable de esos mismos componentes, donde el equipo aplica mejoras
  de CSS/HTML/TS para mostrarle a Producto. Se crea copiando desde `mirrors/`, nunca se
  autosincroniza.
- `src/styleguide/` — tema real (CSS/fonts/images) copiado desde IntelicaStyleGuide. Se carga
  globalmente vía `angular.json` (`projects.IntelicaShowcase.architect.build.options.styles`).
- `src/mocks/` — fixtures JSON (`*.data.ts`) y servicios mock que reemplazan los HTTP reales
  (`ConfigService`, `GlobalTermService`, y el servicio propio de cada módulo).
- `src/stories/` — un archivo `*.stories.ts` por pantalla, normalmente con dos historias:
  `Actual` (mirrors) y `Propuesta` (prototypes), para comparar antes/después.

## Módulos incluidos

| Módulo | Componente | Story | Nota |
|---|---|---|---|
| Fee External | `file-sharing` (pantalla completa, montada dentro del shell) | `Fee/File Sharing` | usa `intelica-library-base` + `intelica-library-project` (copiado desde la rama `qa`, no la rama local `file-sharing-rediseño` — ver nota abajo) |
| Fee External | `library` (Fee Library: header, Total Portfolio, tabs Original/Allocated, modal "Filtros Avanzados" con categorías/tipo de entidad/facturas/tipo de tarifa reales, modales "Refunds Management" y "Cargos Excluidos" con 6 filas reales cada uno) | `Fee/Library` | copiado desde `qa` (rama local stale); ruta real `/fee/library` |
| Fee External | `opt-out-service` (dashboard, `top-subscriptions`, `upcoming` y `savings` verificados pixel a pixel; ver nota abajo sobre el modal "Cómo excluirse" — solo su step 1 está verificado) | `Fee/Opt-Out Services` | copiado desde `qa` (rama local stale); ruta real `/fee/opt-out-service` (redirige a `dashboard`); usa `ngx-echarts` (agregado a `package.json`) |
| Fee External | `tpe` (TPE Analytics: dashboard, `penalties-paid` (tabs Fee/MCC) y `merchant-report` verificados pixel a pixel; `recomendations` no) | `Fee/TPE Analytics` | **re-sincronizado completo el 2026-09-09** (el módulo había vuelto a quedar stale, mismo patrón que Opt-Out Services/Security — ver nota abajo); ruta real `/fee/tpe` (redirige a `dashboard`); usa `intelica-echart`/`EchartService` de `intelica-library-project`; `Propuesta (mejora)` corrige la alineación del checkbox "All" en los multiselect de Brand/ICA de la barra de filtros (`panelStyleClass="prMultiselect"` faltante — ver nota abajo) |
| Fee External | `landing` (Incontrol Panel: Total Fee Expenses, Main Opportunities y Upcoming Announcements verificados pixel a pixel contra las capturas; Net Fees by Scheme, Performance Score (monto) y Unit Cost by Product con cifras razonables no capturadas en pantalla — ver nota abajo) | `Fee/Incontrol Panel (Landing)` | copiado directo del working tree (rama local `main`, ya sincronizada con `origin/qa` — ver nota de branch abajo); ruta real `/fee/landing` (redirige a `dashboard`); usa `ngx-echarts` (línea) e `intelica-echart`/`EchartService` (gauge del Performance Score) |
| Fee External | `fee-updates` (Fee Updates: summary cards + tabs New Fees/Tariff Changes/Ceased Fees, los 3 verificados pixel a pixel) | `Fee/Fee Updates` | copiado directo del working tree (rama `main`, sin diff contra `origin/qa`); ruta real `/fee/updates` (plana, sin hijos); usa `intelica-table-fetch`/`FormatAmountPipe`/`TruncatePipe` de `intelica-library-project` |
| Fee External | `alerts` (Alerts: tabs Inbox/Read, filtros New Fees/Penalties/Custom, detalle New Fees y Penalties verificados pixel a pixel; tab Read y resto del inbox no) | `Fee/Alerts` | copiado directo del working tree (rama `main`, sin diff); ruta real `/fee/alerts` (plana); **sin sidebar** — ver nota abajo |
| Fee External | `fee-detail` (Fee Detail: tabs Resumen — summary/structure-analysis/simulate/additional-details — e Historia — KPI/expense evolution/billing history (con el ícono de alerta "Unallocated" en una fila real) —, el modal "Configurar Alerta" (con la alerta activa configurada, sección "manage") y el botón/modal "References" (con un PDF real embebido), verificados pixel a pixel) | `Fee/Fee Detail` | copiado directo del working tree (rama `main`, sin diff); ruta real `/fee/detail/:feeId/:bankId` — **sin link propio en sidebar/header**, solo se llega haciendo click en un Fee Code desde Fee Library/Fee Updates/Alerts/TPE (antes esos clicks caían al redirect `**` del shell, ahora navegan de verdad); el mock siempre muestra el mismo fee de ejemplo (3J4299575, "Autorización - Interregional Compra") sin importar el feeId/bankId real de la URL |
| Menu | `App` real (wrapper `lySidebar` + `menu-sidebar` + `status-last-update`) | `Menu/Sidebar` | usa `intelica-library-base` (copiado desde la rama `qa`, no `main` — ver nota abajo) |
| Header | `App` real (barra completa: logo, products, alerts, búsqueda, file sharing, idioma, notificaciones, perfil) | `Header/Header Bar` | usa `intelica-library-base` + `intelica-library-notification` |
| Header | `menu-products` (solo el selector de producto, aislado) | `Header/Menu Products` | subset de lo anterior, útil para iterar rápido |
| Layout | Header + Sidebar juntos, con el mismo layout que usa el contenedor real, con ruteo real (`/fee/filesharing`) | `Layout/Full Page (Header + Sidebar)` | usa las clases reales `lyDashboard` / `lyDashboard__header` / `lyDashboard__sidebar` / `lyDashboard__main` (copiadas de `layouts/dashboard.scss`) |
| Security | `account-settings` (tabs Profile/Teams/Security/Notifications, cada uno con su skeleton real) | `Security/Account Settings` | copiado desde `origin/qa` de `IntelicaSecurityExternalWeb` (rama local `ga4-profile` stale para esta ruta); ruta real `security/settings/*`; **sin sidebar de productos de Fee** — la pantalla trae su propio `app-sidebar` interno (verificado contra `IntelicaContainerExternal/src/microfrontend-layout.html`: `/security/*` solo monta Header + Security, nunca la Menu microfrontend); se llega desde el botón "Configuración" del popover de user-profile del Header (`onSettings()` → `navigateToUrl('/security/settings/profile')`); el tab Teams requiere `isAdmin: true` en la cookie de sesión demo — ya está así por defecto; sin capturas de referencia, ver nota abajo |

**Importante:** siempre usar el componente raíz real (`App`, selector `app-menu`/`app-header`) y no
un subcomponente suelto — el wrapper (título del producto, botón de colapsar, layout de la barra)
vive en `App`, no en los componentes hijos. Usar solo el hijo se ve completamente distinto al
diseño real.

**Todo módulo se muestra dentro del shell (header + sidebar):** en producción ninguna pantalla se ve
nunca sola, siempre está dentro del layout `lyDashboard` con el header arriba y el sidebar al lado.
Por eso `src/stories/fee/file-sharing.stories.ts` (y cualquier story de un módulo nuevo) no monta el
componente de la pantalla solo — lo envuelve con el helper `src/stories/shell.ts`
(`shellImports`/`shellProviders`/`shellRoutes`/`shellTemplate`), que ya trae los mocks de Header y
Menu. Ver `file-sharing.stories.ts` como plantilla para módulos nuevos. Los "filtros globales" de una
pantalla (cliente, fechas, categoría, etc.) no son un componente aparte del shell — son la barra de
filtros propia de ESE módulo (ej. `fee-header` en File Sharing), que ya viene incluida dentro del
componente de la pantalla.

**Toda story del shell necesita `provideRouter(shellRoutes(...))`, no solo `Layout/Full Page`:**
el Header y el Menu reales usan `[routerLink]`/`routerLinkActive` en su propio template (para
navegar a File Sharing, Fee Library, etc.), y esa directiva de Angular necesita un `Router`
inyectable exista o no una ruta real detrás del botón que se está mirando. Si una story monta el
shell con solo `{ provide: ActivatedRoute, useValue: ... }` (sin `provideRouter`), Angular lanza
`NullInjectorError: No provider for Router!` en cuanto se renderiza el Header o el Menu — pasó con
`Fee/File Sharing` y `Fee/Library` al agregarles el shell. La forma correcta (ver esos dos archivos
como ejemplo): `provideRouter(shellRoutes(variant, 'fee/<módulo>'))` + `moduleMetadata: { imports:
[...shellImports(variant), RouterOutlet] }` + `template: shellTemplate('<router-outlet />')` — así
la pantalla se sirve por ruteo real (con el sidebar apuntando a ella como default) y cualquier otro
link del header/sidebar también navega de verdad, sin importar desde qué story se abrió.

**Idioma por defecto: español, selector de idioma visible.** La cuenta real usada para las capturas
de este showcase (Wilfredo Tito, @intelica.com) es una cuenta interna de Intelica, por lo que
`mirrors/header/app.ts`'s `isIntelicaUser` (`SessionInformation.businessuserTypeName?.toLowerCase()
=== 'intelica'`) da `true` y el selector "Esp ⌄" del header se ve, igual que en producción para ese
tipo de cuenta — `shellProviders()` (en `stories/shell.ts`) fuerza ese `businessuserTypeName:
'Intelica'` por defecto para TODOS los módulos, no solo para la demo puntual de `header-bar.stories.ts`.
El selector es funcional visualmente (abre, cambia de opción) pero `SetLanguage()` es un no-op en el
mock — no vuelve a traducir la pantalla a inglés. `createMockGlobalTermService()` (en
`mocks/shared.mocks.ts`) sigue devolviendo español por defecto, leyendo de `mocks/terms.es.ts`
(hermano de `terms.en.ts`, mismos códigos de término, valores en español). Al agregar términos
nuevos para una pantalla, agrégalos en AMBOS diccionarios.

**Búsqueda del header con resultados reales + click a Fee Detail.** `mocks/header/header.mocks.ts`'s
`createMockSearchService()` reimplementa el `rankByRelevance`/`getRelevanceScore` real (match
exacto/empieza-con/palabra-empieza-con/contiene) contra un pool fijo de ejemplos (`search.data.ts`),
con un debounce de 250ms real (`isSearching()` se pone en `true` durante ese tramo, mostrando el
skeleton real del popover). Al hacer click en un resultado de tipo Fee, navega a Fee Detail — el
mecanismo real (`search-result.ts`'s `onSelectSearchResult()`) arma la ruta como
`[action.route, action.params.feeId, "-1"]`, por eso los items Fee de `search.data.ts` usan
`action.route: '/fee/detail'` (antes apuntaban a `/fee/library`, nunca se había ejercitado ese click
porque los resultados siempre estaban vacíos).

**Skeletons forzados ~1s en todos los módulos.** Cada componente real ya trae su propia lógica de
`isLoadingX`/`@if(isLoadingX()) { <p-skeleton/> }` copiada verbatim — el único motivo por el que
nunca se veían es que los mocks devolvían `of(fixture)` de forma síncrona. `mocks/shared.mocks.ts`
agrega `delayedOf(value, ms=1000)` (`of(value).pipe(delay(ms))`), usado en casi todos los métodos de
carga de cada `*.mocks.ts` (no en downloads/mutaciones ni en servicios síncronos como
`ConfigService`/`GlobalMenuService`/`GlobalFavoriteService`).

## ⚠️ Verificar la rama correcta antes de copiar un componente

**IntelicaMenuWeb tenía checkeada localmente la rama `ga4_-_sidebar` (basada en `main`), y `main`
está desactualizada respecto a lo que ya está en producción.** El primer intento de copiar
`menu.ts`/`app.ts` desde el working directory trajo una versión sin el badge Beta/Legacy y sin el
ícono de enlace externo — ambos SÍ existen, pero en las ramas `qa`/`development`. Antes de copiar
un componente a `mirrors/`, si algo del diseño real no aparece en el código que estás mirando:

```bash
git -C <repo> branch -a                                   # ver qué ramas hay
git -C <repo> diff main origin/qa -- <archivo>             # comparar contra main
git -C <repo> show origin/qa:./ruta/al/archivo.ts          # leer el contenido de otra rama sin hacer checkout
```

Todo `mirrors/menu/**` de este repo viene de `origin/qa` (vía `git show`, sin tocar el working
directory del repo real), no del filesystem local — por eso `npm run sync:mirrors` (que hace un
`cpSync` plano) **no sirve para Menu por ahora**; hay que repetir el proceso manual con `git show`
si se vuelve a resincronizar. El resto de los módulos (Fee External, Header) sí están al día en la
rama que tienen checkeada localmente (`main`), confirmado por diff.

## Cómo agregar un módulo nuevo (ej. resto de Header, Auth)

1. Agregar la carpeta origen al manifiesto de `scripts/sync-mirrors.mjs` y correr
   `npm run sync:mirrors` — **salvo que el repo esté en una rama desactualizada** (ver sección de
   arriba), en cuyo caso hay que traer los archivos con `git show origin/<rama-correcta>:...`.
2. Revisar los imports del componente copiado: todo lo que venga de `intelica-library-components`
   y toque HTTP (services con `inject(HttpClient)` o `ConfigService.environment`) necesita un mock
   en `src/mocks/` (ver `src/mocks/fee/file-sharing.mocks.ts` como ejemplo).
3. Si el componente usa `TermPipe` (`| term`), agregar los códigos de término que use a
   `src/mocks/terms.en.ts` — si falta un código, el texto se ve como `-`.
4. Copiar la carpeta a `src/prototypes/<módulo>/...` para tener la versión editable.
5. Crear `src/stories/<módulo>/<pantalla>.stories.ts` siguiendo el patrón de
   `src/stories/fee/file-sharing.stories.ts`: envolver el componente de la pantalla con el shell
   real (`shellImports`/`shellProviders`/`shellTemplate` de `src/stories/shell.ts`) en vez de
   montarlo solo, para que se vea con el header arriba y el sidebar al lado como en producción.

## Notas técnicas / decisiones tomadas

- **Framework de Storybook**: se usa `@storybook/angular` (clásico, webpack5), no
  `@storybook/angular-vite`. La variante Vite (v10.6) exige Angular 21/22 vía peer deps; la
  plataforma está en Angular 20, así que la variante Vite no instala.
- **`.npmrc` con `legacy-peer-deps=true`**: necesario porque los peer ranges de Storybook para
  Angular no siempre calzan exacto con la versión de Angular que usamos. No afecta qué versiones
  reales se instalan, solo relaja la resolución estricta de npm.
- **`intelica-library-components` fijado a `1.1.87` exacto** (no `^1.1.87`): versiones más nuevas
  de la librería cambiaron su API pública (ej. `SweetAlertService` ya no existe en 1.1.185). Hay
  que fijar la misma versión que usa el repo real del que se copió el componente.
- **Dependencias "invisibles"**: `intelica-library-components` se distribuye como un bundle único
  (`fesm2022/*.mjs`) que importa varias librerías de forma estática (echarts, xlsx, exceljs,
  file-saver, jsencrypt, sweetalert2, guid-typescript, typescript-cookie, @microsoft/signalr,
  amazon-quicksight-embedding-sdk, @primeng/themes). Aunque el componente que uses no las use
  todas, webpack necesita poder resolverlas — deben estar instaladas como dependencias directas.
- **Truco de "términos identidad"**: cuando la data viene de la API con un campo que se muestra vía
  `| term` (ej. el `label`/`nameMenu` de un item de menú, o `termName`/`termDescription` de un
  producto), el fixture puede poner directamente el texto final ahí (ej. `nameMenu: 'Dashboard'`) y
  agregar en `terms.en.ts` una entrada `{ termName: 'Dashboard', termValue: 'Dashboard' }`. Así no
  hace falta inventar una taxonomía de códigos de término para datos de ejemplo.
- **Ícono de enlace externo y badge Beta/Legacy del sidebar**: es código real, no algo agregado a
  mano — vive en `menu.ts`/`menu.html`/`app.html` de la rama `qa` (ver sección de ramas arriba). El
  criterio real: un item es "externo" cuando su `authenticationClientID` difiere del de su padre
  (no si la URL empieza con `http`, como yo había asumido en un primer intento) — usa
  `<a href target="_blank">` + `<span class="p-panelmenu-header-legacy"><i class="icon
  icon-external-link"></i></span>`. Esa clase `p-panelmenu-header-legacy` ya tiene su propio CSS
  real (`display:none` en sidebar colapsado, tamaño de ícono en hover) — no hay que inventar
  posicionamiento a mano.
- **Fuente real (Lato) no se cargaba**: `--i-text-body-family` resuelve a `"Lato"`
  (`tokens.figma.scss`), pero copiar el CSS del style guide no trae fuentes de Google Fonts — en
  producción la carga `IntelicaContainerExternal/src/index.ejs` con un `<link>` aparte. Sin esa
  fuente, el navegador usa un fallback con métricas distintas (line-height más alto), lo que hace
  que CUALQUIER lista/texto en todo el showcase se vea con más espaciado del real (así se detectó:
  el listado de bancos del selector de perfil se veía con más separación entre filas de la
  cuenta). Se agregó `.storybook/preview-head.html` con el mismo `<link>` de Google Fonts — el
  real en `index.ejs` tiene un `%22` (comilla codificada) pegado al final del href por un bug de
  copy-paste de ellos mismos; acá se usa la URL corregida.
- **IntelicaFeeExternalWeb cambió de rama a mitad de sesión**: dejó de tener checkeada
  `file-sharing-rediseño` y pasó a `main`, la cual quedó al día con `origin/qa` (diff vacío para
  `src/app/landing/` y casi vacío para el resto del repo). Por eso `mirrors/fee/landing/` se copió
  directo del working tree (`cp -r`), no con `git show origin/qa:...` como Opt-Out Services/TPE —
  si se vuelve a copiar algo de Fee External, primero repetir el chequeo de rama (ver sección de
  arriba) porque puede volver a cambiar.
- **`common.helper.ts` y `common.constants.ts` faltaban en `mirrors/fee/common/` y
  `prototypes/fee/common/`**: varios componentes de `landing` (`fee-expense`, `opportunities`,
  `announcements`, `net-fees/graph-line`) importan `BrandHelper` desde
  `../../../common/helpers/common.helper` (carpeta `src/app/common/` del repo real, no
  `src/app/fee/common/`) — hasta ahora ningún módulo copiado los había necesitado. Se copiaron
  ambos archivos (`helpers/common.helper.ts` y `constants/common.constants.ts`) a las DOS copias
  (`mirrors/` y `prototypes/`), verbatim desde el repo real.
- **Datos de Landing no 100% capturados en pantalla**: de las 7 capturas, Total Fee Expenses y
  Main Opportunities (Penalties/Opt-Out Services) traen cifras exactas y se verificaron a que las
  sumas por marca/negocio cuadren con los totales mostrados (ej. Mastercard 20.71M + Visa 10.75M =
  31.46M en Last 12 Months). Net Fees by Scheme (serie mensual de 12 meses), el monto de Performance
  Score ("Potential savings identified") y los valores de Unit Cost by Product (5 trimestres x 16
  filas de producto/scope) no tenían todos sus números legibles en la captura — se completaron con
  cifras razonables e internamente consistentes (`mocks/fee/landing.data.ts`), no son pixel-exactos.
  Si se consigue una captura más clara de esas 3 secciones, reemplazar esas cifras puntuales.
- **El "activo" del sidebar es `exact: true`**: `menu.html` usa `routerLinkActive="is-active"` con
  `[routerLinkActiveOptions]="{ exact: true }"` contra `item.pageURL`. Para un módulo cuya ruta
  redirige el path vacío a un hijo `dashboard` (TPE, Opt-Out Services, Landing — ver `shellRoutes()`
  en `shell.ts`), el `pageURL` en `mocks/menu/menu.data.ts` tiene que ser el path YA resuelto
  (`/fee/tpe/dashboard`, no `/fee/tpe`) o el ítem del sidebar NUNCA se ve activo, sin importar en qué
  pantalla del módulo estés parado.
- **Los paginadores de `intelica-table`/`intelica-table-fetch` (de `intelica-library-project`)
  necesitan los códigos de término `Page` y `Of`**: su template real arma "Page [N] Of [total]" con
  `| term`, y esos dos códigos NO estaban en `terms.en.ts`/`terms.es.ts` (solo estaban los otros dos
  que usa el mismo template, `Nodata` y `ROWS_PER_PAGE`) — un código faltante se ve como `-`, por eso
  el paginador mostraba "- [4] -4" en vez de "Page 4 of 4". Como este componente viene de la
  librería (no de un repo mirror), sus códigos de término hay que sacarlos leyendo el `.html` fuente
  DENTRO del sourcemap del paquete instalado (`node_modules/intelica-library-project/fesm2022/
  intelica-library-project.mjs.map`, campo `sourcesContent`), no del componente de la app que lo usa.
- **Alerts (y File Sharing) ocultan el sidebar en producción real**: `mirrors/header/app.ts`
  (`App`, el Header) hace `globalMenuService.setMenuVisibility(false)` cuando la ruta es
  `/fee/alerts` o `/fee/filesharing` (y también al hacer click en el botón "Alerts" del header,
  `mirrors/header/menu-alerts/menu-alerts.ts`) — y `mirrors/menu/app.html` (`MenuApp`) YA envuelve
  todo su contenido en `@if (... && isMenuVisible())`, así que el sidebar de verdad desaparece en
  esas 2 pantallas. El CSS real (`_dashboard.scss`, ya copiado a `styleguide/`) incluso tiene
  `&:has(app-menu:empty) &__sidebar { display: none; }` para colapsar la columna del grid
  automáticamente. `mocks/header/menu-products.mocks.ts`'s `createMockGlobalMenuServiceBase()`
  pasó de un `isMenuVisible: () => true` fijo a un signal real, REACTIVO a la ruta activa: se
  suscribe a `router.events` y recalcula la visibilidad en cada `NavigationEnd` contra una lista
  `FORCE_MENU_HIDDEN_PREFIXES` (`/fee/alerts`, `/security/settings`) — no un valor fijo decidido una
  sola vez al arrancar la story. Esto reemplaza un primer intento (un 3er parámetro `menuVisible` en
  `shellProviders()` que solo fijaba el valor INICIAL, o incluso lo "bloqueaba" para toda la story)
  que resultó en un bug real: como Header/Menu se montan UNA vez por story y el usuario puede
  navegar libremente entre rutas dentro de la MISMA story (ej. Security -> "Productos" del header ->
  de vuelta a un módulo de Fee), un valor fijo por story se quedaba pegado — el sidebar desaparecía
  para siempre incluso al volver a Fee. La versión reactiva por-ruta arregla esto sin que ninguna
  story tenga que pasarle nada especial: `shellProviders(variant)` alcanza siempre, el propio Router
  decide. **File Sharing quedó con el sidebar visible a propósito** (así lo pidió el usuario
  explícitamente al inicio del proyecto, antes de que se supiera que la producción real lo oculta) —
  por eso `/fee/filesharing` a propósito NO está en `FORCE_MENU_HIDDEN_PREFIXES` aunque el Header
  real sí lo oculte ahí; si en algún momento se quiere que calce 100% con producción, alcanza con
  agregarlo a esa lista (ya no hace falta tocar nada más).
- **`src/styleguide/css/patterns/search/_index.scss`**: el archivo original en IntelicaStyleGuide
  usa `@forward "./search-form/";` (con slash final), que Dart Sass moderno interpreta como
  "buscar un `_index.scss` dentro de una carpeta `search-form/`" en vez de la partial
  `_search-form.scss`. Se corrigió quitando el slash final en la copia local. Si se resincroniza
  ese archivo con `sync-mirrors`, hay que reaplicar el fix.
- **Security/Account Settings — sin sidebar de Fee, verificado contra el container real**: se
  confirmó leyendo `IntelicaContainerExternal/src/microfrontend-layout.html` (`<route
  path="security">`) que en producción la ruta `/security/*` monta ÚNICAMENTE Header + Security (+
  Footer) — la Menu microfrontend (el sidebar de productos que usan todas las demás pantallas de
  este showcase) nunca se monta ahí. Esto calzaba además con que `AccountSettingsComponent`
  (`account-settings.component.html`) ya trae su PROPIO sidebar interno (`<app-sidebar/>`, clase
  `lySecurity__sidebar`, con Profile/Teams/Security/Notifications) dentro de un grid `.lySecurity`
  — esa clase ya existía en `src/styleguide/css/layouts/_security.scss` y ya estaba `@use`ada en
  `main.scss` (en sync con `origin/qa` del style guide), así que no hizo falta tocar ningún CSS del
  style guide para que se vea bien. El sidebar de Fee se oculta acá automáticamente porque
  `/security/settings` está en `FORCE_MENU_HIDDEN_PREFIXES` (ver nota de Alerts más arriba) — la
  story no necesita pasarle nada especial a `shellProviders(variant)`.
- **Shim de `window.history.pushState` para navegar entre microfrontends sin single-spa real**:
  el Header real navega a Security con `navigateToUrl('/security/settings/profile')` (de la
  librería `single-spa`, código real sin editar en `mirrors/header/user-profile/user-profile.ts`'s
  `onSettings()` y en `mirrors/header/notification-bell/notification-bell-admin/
  notification-bell-admin.ts`). En producción, `single-spa.start()` intercepta ese cambio de URL y
  monta la otra microfrontend; este showcase nunca llama a `start()`. Leyendo el código fuente de
  `node_modules/single-spa` se confirmó que, cuando el host no cambia pero sí el pathname,
  `navigateToUrl` termina llamando literalmente a `window.history.pushState(null, null, url)` y
  nada más — por eso `ModuleBoundary` (en `stories/shell.ts`) parchea ESE único punto (una sola vez,
  vía el flag `historyPatchedForShowcase`, no `addEventListener`/`popstate` que es lo que
  `single-spa.start()` sí parchea globalmente) e intercepta cualquier URL que empiece con
  `/security/settings` para reenviarla al `Router` de Angular de la story activa en vez de tocar el
  historial del navegador de verdad. No toca `mirrors/`/`prototypes/`.
- **Cookie de sesión `data` real, leída por `SessionService`**: a diferencia del resto del
  showcase (que lee sesión vía el mock de `ConfigService.SessionInformation`), Security's
  `SessionService` (`mirrors/security/common/session/session.service.ts`, real, sin editar) lee la
  sesión DIRECTO de una cookie `data` (`getCookie('data')` + `JSON.parse(decodeURIComponent(...))`)
  — así que `stories/shell.ts` además setea esa cookie con la misma identidad demo de siempre
  (Wilfredo Tito, wilfredo.tito@intelica.com, `businessuserTypeName: 'Intelica'`) más
  `isAdmin: true` (para que el tab Teams, gateado por `common/guards/admin.guard.ts`'s
  `adminGuard` vía `session.isAdmin()`, se vea en la demo).
- **`environment.json` de Security va en `mirrors/environment/` (no `mirrors/security/environment/`)**:
  `teams.component.ts` (real, sin editar) importa `../../../environment/environment.json` — en el
  repo real (`IntelicaSecurityExternalWeb`) ese archivo vive en `src/environment/environment.json`,
  HERMANO de `src/app/` (no dentro de él), y `teams.component.ts` está en
  `src/app/account-settings/teams/`. Como `mirrors/security/` es el equivalente local de `src/app/`,
  el archivo tiene que copiarse a `mirrors/environment/environment.json` (hermano de
  `mirrors/security/`), NO a `mirrors/security/environment/`, o el import relativo de 3 niveles
  (`../../../`) no resuelve — esto rompía el build de Storybook (`Module not found`) hasta que se
  corrigió la ubicación. Mismo criterio aplicado a `prototypes/environment/environment.json`.
- **Sin capturas de referencia para Security/Account Settings**: a diferencia de la mayoría de
  módulos de este showcase (verificados pixel a pixel contra capturas reales), este módulo no tuvo
  ninguna captura — toda la data fija (`mocks/security/account-settings.data.ts`) y los ~163
  códigos de término agregados a `terms.en.ts`/`terms.es.ts` son razonables pero no verificados
  contra producción, misma convención ya usada para Opt-Out Savings y el bloque sin captura de
  Landing (Unit Cost by Product). Si aparece una captura real de esta pantalla, hay que reemplazar
  esos textos/cifras.
- **Fee Library — modal "Filtros Avanzados" (`modal-advanced-filter`) alimentado con datos reales,
  y root-cause del reporte de "espaciado inconsistente" del selector de negocios**: el modal (tabs
  "Entidades y facturas" / "Categorización" / "Rangos de tarifas y montos") tenía TODOS sus campos
  relevantes en placeholder inglés o arrays vacíos en `mocks/fee/library.data.ts`. A partir de 6
  capturas reales (cuenta de Wilfredo Tito) se alimentó: `libraryMasters.categories`/`subCategories`
  (8 categorías top-level verificadas por captura — "Asociación", "Incentivos", "Penalidades",
  "Servicios Autorización", "Servicios Liquidación", "Servicios Liquidación y Compensación" [sí, son
  DOS categorías distintas en la captura, no un duplicado], "Servicios Mandatorios", "Servicios
  Opcionales"; cada subcategoría es un placeholder "General" razonable, NO verificado — el árbol
  nunca se vio expandido en la captura), `.typeOfRates` (5 items verificados: "Escalonada Estandar",
  "Escalonada Plana", "Escalonada Progresiva", "Fija", "Plana"), `.entityTypes` (ICA/Mastercard,
  BID+NUMID+SRENUMID/Visa, verificados; ids elegidos != 10 a propósito, ver
  `ModalAdvancedFilter.requiresEntityLevelTwo()` en el componente real) y `.customCategories` (2-3
  entradas razonables, no verificadas). Se agregaron dos fixtures nuevos, `libraryInvoices` (las 5
  facturas reales de la captura, todas Mastercard, `feeDate: '2026-09-05'` — el label relativo
  "hace 3 días" que calcula `ModalAdvancedFilterService.buildInvoiceOptionGroups()` contra
  `new Date()` real solo es pixel-exacto el día en que esto se capturó, 2026-09-08) y
  `libraryEntityProducts`/`libraryGroupNames` (relleno razonable no verificado, para que las
  cascadas "Valores de entidad" y el autocomplete "Nombre de grupo" no queden vacíos si alguien
  interactúa con la demo). Los ~30 códigos de término (`LIBRARY_TERM.*`) que usa el modal (tabs,
  labels, "Restablecer"/"Aplicar"/"Cancelar", etc.) YA estaban completos en `terms.es.ts`/
  `terms.en.ts` desde antes — no hizo falta agregar ninguno.
  **Root-cause del reporte de "espaciado distinto" en el selector "Todos los Negocios" entre los
  tabs Original y Allocated**: NO era un bug de CSS. `mirrors/fee/library/header/header.html` usa
  UN SOLO `<p-multiselect>` compartido para ese selector, cuyo `[options]` (getter
  `currentBusinesses` en `header.ts`) apunta a `masters().business` en el tab Original y a
  `masters().businessTransaction` en el tab Allocated. `business` ya calzaba con la captura ("All /
  Acquirer / Issuer", inglés, 2 items). `businessTransaction` estaba MAL en el mock (inglés,
  "Acquirer"/"Issuer", 2 items) — la captura real del tab Allocated muestra español, 3 items
  ("Adquirente"/"Emisor"/"Miembro"). Al corregir solo ese campo de datos (sin tocar CSS ni el
  componente), ambos tabs vuelven a mostrar el mismo componente con longitudes de contenido reales
  — la "inconsistencia de espaciado" reportada era simplemente el multiselect renderizando datos
  incorrectos de longitud distinta a la real.
- **Opt-Out Services — "Ahorro generado" (Savings) alimentado con datos reales, y activado el ícono
  de tuerca de Upcoming Opt-Outs**: a partir de 2 capturas reales de producción (cuenta de Wilfredo
  Tito) se corrigieron dos gaps conocidos de este módulo. (1) La tabla de `savings`
  (`opt-out-savings.ts`'s `dataResponse()?.summary`) tenía CERO filas seedeadas —
  `getSavingsTable()` en `mocks/fee/opt-out-service.mocks.ts` devolvía siempre `items: []` y totales
  en 0 — se alimentó con las 3 cards de resumen (`optOutSavingsSummary`) y las 2 filas reales de la
  tabla (`optOutSavingsListSummary`, en `mocks/fee/opt-out-service.data.ts`), y `getSavingsTable()`
  ahora sí simula el buscador real (`command.searchText`) y recalcula
  `totalBilled`/`monthlySavings`/`annualSavings` sobre el subconjunto filtrado, igual que
  `getSubscriptionsTable`/`getUpcomingTable`. (2) El ícono de tuerca de `upcoming-opt-outs.html`
  (`[disabled]="!rowData.stepsToOptOut"`) estaba deshabilitado en TODAS las filas porque ninguna
  traía `stepsToOptOut: true` — igual que `opcId`/`opcName`/`annualForecast`, este campo tampoco está
  declarado en la interfaz `UpcomingListResponse` del DTO mirror aunque el template real sí lo lee
  (mismo "DTO incompleto respecto al backend" ya documentado para esos otros campos) — se agregó
  `stepsToOptOut?: boolean` al tipo local `UpcomingRow` en vez de tocar el DTO, y se activó
  únicamente en la fila existente "Visa Risk Essentials Program" (`opcId: 301`, ya modelada de antes
  como hijo de `AI16306` en `optOutUpcomingList`), que es exactamente el programa que muestra la 2da
  captura. El modal "Cómo excluirse" (`fee-unsubscribe`, `getUnsubscribe()`) ahora devuelve un
  fixture real (`optOutFlowVisaRiskEssentials`) cuyo step 1 (timeline de 5 hitos + warningMessage)
  calca esa captura exactamente; los steps 2-4 (contactType Email vs. Form, textos de
  confirmación/cierre) usan contenido razonable NO verificado porque la captura nunca avanzó más
  allá del step 1 — se eligió `ContactTypeEnum.ExternalForm` (portal) sobre `Email` por ser lo más
  plausible para un programa de riesgo de Visa dirigido a Issuers, documentado en el comentario junto
  al fixture. `optOutSavingsCard` (la card de Savings del Dashboard, `currentSavings: 10140`) se dejó
  intacta a propósito, sin reconciliar con el nuevo `totalOptOutSavings: 10135.64` de la pantalla de
  detalle: en el componente real, la card del Dashboard siempre pide el rango fijo "1 Ene - hoy"
  (`overrideSavings` en `opt-out-services-dashboard.ts`) mientras que la pantalla de detalle usa el
  rango del filtro global activo — son dos consultas con ventanas de fecha distintas por diseño, así
  que en producción real también pueden diferir. Se agregaron 8 códigos de término nuevos a
  `terms.es.ts`/`terms.en.ts` (`LAST_DAY_OPT_OUT`, `NEXT_OPT_OUT_WINDOW`,
  `OPT_OUT_WHAT_TO_EXPECT_INFO_1/2/3`, `OPT_OUT_WHAT_HAPPENS_NEXT_STEP_1/2/3`) — el resto de los
  ~50 códigos que usa esta pantalla/modal ya existían de antes.
- **Fee Detail — tooltip "Unallocated" en Billing History, alerta activa en "Configure Custom Alert"
  y botón/modal "References" con PDF real**, los 3 sobre la MISMA tarifa flagship (3J4299575), a
  partir de 3 capturas reales de producción. (1) `history-billing.html` linea ~78 ya trae, sin
  editar, el ícono `icon-alert` con tooltip (`[pTooltip]="...UNALLOCATED"`) que se muestra por fila
  cuando `row.isUnallocated` es `true` — todas las filas sintéticas mensuales de
  `buildBillingRows()` en `mocks/fee/fee-detail.data.ts` traían `isUnallocated: false` a propósito
  (nunca se había mostrado el ícono). Se agregó una fila real adicional
  (`feeDetailUnallocatedRow`, `2026-06-14`, entidad `19843`, "Transaction Processing
  Excellence-Excessive Authorization Attempts", `0.55 × 253 = EUR 139.15`, `isUnallocated: true`) al
  arreglo `feeDetailBillingRows`, sin reemplazar ni renumerar las 22 filas existentes —
  `totalCount`/`hasMultipleCurrencies` de `feeDetailBillingHistory` se derivan del arreglo, así que
  se ajustan solos. (2) El estado "manage" (alerta ya configurada) vs. "choose" (sin alertas) del
  modal `fee-modal-set-alert` NO depende de ningún campo de `FeeDetailInfoResponse` — se comprobó
  leyendo `modal-set-alert.ts.loadConfig()`: usa directamente si
  `CustomConfigurationService.getByFee()` devuelve `configuration !== null`. Se agregó el fixture
  `feeDetailActiveAlert` (Expected Amount, EUR 2, activo, disparado en facturación mensual — valores
  exactos de la captura) y `createMockCustomConfigurationService().getByFee` ahora lo devuelve en
  vez de `feeDetailNoAlert` (que se deja documentado, ya sin uso, como referencia del estado vacío
  anterior); también se puso `feeDetailInfo.hasAlert: true` (antes `false`) porque controla el label
  del botón del título (`EDIT_ALERT` vs `SET_ALERT`, `title.html` línea ~73) — un campo relacionado
  pero distinto de la fuente de verdad real del modal. Los ~20 códigos de término que usa la sección
  "manage" del modal (`LBL_MANAGE_ALERT`, `LBL_ACTIVE_ALERT_CONFIGURED`, `LBL_ALERT_SET_FOR`,
  `LBL_FIXED_TARGET`, `LBL_MODIFY_ALERT`, etc.) YA estaban completos en `terms.es.ts`/`terms.en.ts`
  desde antes — no hizo falta agregar ninguno. (3) `feeDetailInfo.referencesCount` pasó de `0` a `1`
  para que se muestre el botón "References (1)" en `title.html` línea ~59, y se agregó el fixture
  `feeDetailReference` (un único documento "AI13992 - Cross Border AFT..." de Visa, 25 abr 2024) que
  ahora sirve `createMockFeeDetailService().getReferences()`. Como `modal-reference.ts` mete el blob
  de `downloadReferencePdf()` directo en un `<iframe>` vía `URL.createObjectURL`, un blob vacío/falso
  se vería como un visor roto — se generó un PDF real con el contenido del artículo ("Visa Business
  News", 25 abril 2024, texto completo del overview y "At a Glance") usando la librería `pdfkit`
  (instalada una sola vez fuera del repo con `npm install pdfkit --no-save`, NO agregada a
  `package.json`, mismo precedente que el QR de 2FA de `mocks/security/account-settings.data.ts`),
  se verificó que los primeros 4 bytes decodificados fueran la firma ASCII `%PDF`, y se embebió el
  base64 resultante como `feeDetailReferencePdfBase64` en `fee-detail.data.ts` —
  `createMockFeeDetailService().downloadReferencePdf()` lo decodifica (`atob` + `Uint8Array`) a un
  `Blob` real `application/pdf` en vez de un `new Blob()` vacío.
- **Bug real: borrar la alerta personalizada no volvía a mostrar "Set Alert"**. La primera versión de
  `createMockCustomConfigurationService()` tenía `getByFee`/`create`/`update`/`delete` como 4 stubs
  independientes sin estado compartido — `getByFee` SIEMPRE devolvía el mismo `feeDetailActiveAlert`
  fijo, sin importar cuántas veces se llamara a `delete()` antes. Como `fee-detail.ts.onSetAlertClosed()`
  vuelve a llamar `getByFee()` cada vez que el modal se cierra con `saved:true` (incluido después de
  un delete, ver `modal-set-alert.ts.executeDelete()`), el botón del título se quedaba pegado en
  "Edit Alert" y el modal seguía abriendo en "manage" para siempre, sin poder volver a "Set Alert".
  Fix: `getByFee`/`create`/`update`/`delete` ahora comparten una variable `let currentAlertConfig`
  en memoria (mismo patrón ya usado en Security/Teams `addMember`/`deleteMember` y en Notifications
  `updateSettings`) — `create`/`update` la escriben, `delete` la pone en `null`, y `getByFee` siempre
  devuelve su valor ACTUAL, no uno fijo. Así el ciclo completo (ver alerta activa -> Delete -> vuelve
  "Set Alert" -> configurar de nuevo -> vuelve a verse como alerta activa) funciona de verdad en la
  demo, igual que en producción.
- **Fee Library — modales "Refunds Management" y "Cargos Excluidos" alimentados con datos reales,
  con discrepancia de total documentada a propósito**: ambos modales (`fee-modal-allocated-refund`/
  `fee-modal-allocated-excluded`, tab Allocated) tenían `getFeeRefund`/`getFeeExcluded` devolviendo
  `[]` en `mocks/fee/library.mocks.ts`. Se leyeron ambos componentes completos primero para confirmar
  cómo arman la columna `date` de la tabla: `mapRow()` en ambos lee `r.lastBillingDate` (no un campo
  `date` propio del DTO `FeeRefund`/`FeeExcluded`), y el total mostrado (`totalFeeAmount` getter) es
  `SUM(feeAmount)` client-side sobre las filas visibles, SIN negar signo. Se agregaron 6 filas reales
  por modal (`libraryRefundRows`/`libraryExcludedRows` en `mocks/fee/library.data.ts`, `clientId: 501`
  / `clientName: 'MBH Bank'`, `brandId: 1` / `brandCode: 'MC'` — mismos valores ya establecidos para
  Mastercard en `libraryAllocatedRows`), calcadas de 2 capturas reales (Refunds en inglés/EUR, Excluded
  en español/USD — de ahí que `category`/`feeName` de Excluded queden en español, campo texto libre
  del DTO, no ligado al catálogo `FeeLibraryMaster.categories`). En AMBOS casos el total real de la
  captura (Refunds: EUR (179,183.00) en negativo/paréntesis; Excluded: USD 128,582.33) NO coincide con
  la suma de las 6 filas visibles (Refunds: EUR 4,412.10; Excluded: USD 121,699.47) — la captura solo
  mostraba la primera página de una tabla con scroll/paginación con más filas de las que se alcanzan a
  leer. Se decidió a propósito NO inventar filas adicionales ni un campo de total aparte para forzar
  que cuadre con el total de la captura: el total que se ve en esta demo es la suma real de las 6
  filas verificadas, documentado en un comentario junto a cada fixture en `library.data.ts`. La fila 1
  de Refunds (feeName truncado en la captura, "...| A...") se completó de forma plausible como
  "...Adjustment" siguiendo el patrón de las otras 4 filas del mismo grupo, marcado explícitamente
  como no verificado carácter por carácter. Los ~15 códigos de término que usan ambos modales
  (`LIBRARY_TERM.DATE`/`EXCLUDED_DATE`/`BRAND`/`INSTITUTION`/`FEE_CODE`/`FEE_NAME`/`CATEGORY`/
  `AMOUNT`/`AMOUNT_IN`/`TOTAL`/`VIEW_AND_MANAGE_REFUNDS`/`VIEW_ALL_EXCLUDED_FEES`/etc.) YA estaban
  completos en `terms.es.ts`/`terms.en.ts` desde antes — no hizo falta agregar ninguno para esta parte.
- **Opt-Out Services — tooltip "Forecast" agregado SOLO en `prototypes/`, no confirmado en el mirror
  real**: la captura del usuario muestra un ícono (ⓘ) junto al valor "Forecast" del card 3 de "Opt-Outs
  Billing Evolution Graph" (`opt-out-services-dashboard.html`, ~línea 514), con el texto "Forecast of
  fees already being paid for the remainder of the current year." Se revisó el mirror real completo
  (`mirrors/fee/opt-out-service/...`) y ese ícono/tooltip específico del card Forecast NO existe ahí —
  solo existe uno DISTINTO en el título del panel completo (`tooltipContent4`,
  `OPT_OUTS_BILLING_EVOLUTION_GRAPH_TOOLTIP`, ya real). Por la regla de este proyecto de nunca inventar
  UI no verificada dentro de `mirrors/`, el nuevo tooltip se agregó ÚNICAMENTE en
  `prototypes/fee/opt-out-service/components/opt-out-services-dashboard/opt-out-services-dashboard.html`
  (copiando el mismo patrón exacto ya usado 5 veces en ese archivo: `tooltipStyleClass="prTooltip"` +
  `tooltipPosition="top"` + `[pTooltip]="tooltipContentN"` + `<i class="icon icon--sm icon-info"></i>`
  + `<ng-template #tooltipContentN>`, numerado `tooltipContent6` por ser el siguiente libre), con el
  nuevo código de término `OPT_OUTS_FORECAST_TOOLTIP` agregado a AMBOS `terms.en.ts` (texto exacto de
  la captura) y `terms.es.ts` (traducción propia, no verificada). **Esto significa que el tooltip
  SOLO se ve en la story `Fee/Opt-Out Services` → `Propuesta (mejora)`, nunca en `Actual
  (producción)`** — es una mejora propuesta, no una confirmación de que la funcionalidad ya existe en
  producción; si en el futuro se confirma que sí existe en el código real, recién ahí debería
  moverse/copiarse también a `mirrors/`.
- **TPE Analytics — re-sincronizado completo por segunda vez (2026-09-09), mismo patrón que Opt-Out
  Services/Security**: se detectó que `mirrors/fee/tpe/` (y su copia en `prototypes/`) había vuelto a
  quedar significativamente desactualizado respecto al working tree real actual (rama `main`,
  confirmado sin diff contra `origin/qa` para `src/app/tpe/`) — `tpe-penalties-paid.component.ts`
  tenía sus 613 líneas completamente distintas (el real ganó imports/lógica de `EchartService`,
  `AddFavoritesComponent`, dialogs/toast/popover desde la última copia). Se rehicieron las 18 archivos
  de `mirrors/fee/tpe/` y `prototypes/fee/tpe/` con una copia 1:1 fresca del working tree (mismo
  conteo de archivos antes/después, sin agregados/eliminados). Reconciliación de mocks tras el resync
  (`mocks/fee/tpe.data.ts`/`tpe.mocks.ts`):
  - La mayoría de los DTOs/fixtures YA estaban al día de un ajuste previo (`merchants`/
    `merchantToFees` con `id`/keys `string` en vez de `number`, `documentDateFormat` en
    `MerchantReportResponse`, `merchantId: string` en `PenaltyMccDetailResponse` y en
    `getPenaltiesByMerchantDetails`) — comprobado campo por campo contra
    `dto/tpe-responses.dto.ts`/`tpe-commands.dto.ts` reales, no se asumió que estaban rotos solo por
    haberse resincronizado el resto del módulo.
  - Único hallazgo real: `getMerchantReport()` del mock devolvía `{ items, totalCount, pageNumber,
    pageSize }` sin el campo `summaries` que `PaginationResponse<T>` (dto real) declara como
    REQUERIDO (no opcional) — mismo tipo de gap ya documentado antes para Opt-Out Services
    (`summary`/`summaries`). No rompe en runtime hoy (`TpeMerchantReport` usa el `forkJoin` con
    `getMerchantReportSummary` para los totales, nunca lee `report.summaries`), pero se corrigió
    igual (`summaries: []`) para que la forma coincida con la real, no solo compile — la lección ya
    documentada de este proyecto es que un mock que compila no es prueba de que su forma coincide con
    lo que el componente realmente lee.
  - `ModuleFilterStateService` (`common/services/module-filter-state.service.ts`, ya copiado a
    `fee/common/` de una tarea anterior) es una dependencia NUEVA de `TpeFilterService` desde este
    resync (recuerda el último filtro aplicado por módulo, en memoria + `sessionStorage`,
    namespaceado por usuario/cliente) — es real, `providedIn:'root'`, sin HTTP propio (solo usa
    `ConfigService`, ya mockeado), así que no necesitó mock nuevo.
  - `EchartService`/`AddFavoritesComponent` (nuevos imports de `intelica-library-project` en
    `tpe-penalties-paid`/`tpe-dashboard`/`tpe-merchant-report`/`tpe-recomendations`) tampoco
    necesitaron mock: `EchartService` solo depende de `FormatAmountPipe` (sin HTTP), y
    `AddFavoritesComponent` depende de `AddFavoritesService` → `GlobalFavoriteService`, que YA está
    mockeado globalmente en `shell.ts` (`createMockGlobalFavoriteService`) desde el trabajo de Fee
    Library.
  - **Gráfico de barras "Penalties by MCC" (espaciado corto reportado por el usuario)**: se confirmó
    que la config real (`tpe-penalties-paid.component.ts`, `getMCCChartOptions()`) YA tiene
    `barWidth: 32`, `barGap: '0%'`, `barCategoryGap: '35%'` — exactamente el espaciado compacto de la
    captura de referencia — junto con `mccChartContainerStyle` de alto FIJO (1200px) y
    `MAX_MCCS = 25`. El fixture de MCC en `tpe.data.ts` ya tenía 20 categorías (con los nombres/montos
    EXACTOS de la captura: LODGING-HOTELS 34.59K, BUS LINES 18.66K, UTILITIES-ELECT... 1.80K,
    TRANSPORTATION-... 1.14K, GROCERY STORES 469.34, PROFESSIONAL SE... 286.00, INSURANCE SALES...
    227.69, SERVICE STATION... 204.91, TRAVEL AGENCIES... 183.07, CAMPGROUNDS AND... 130.13, más 10
    categorías adicionales para llenar el contenedor de 1200px de forma pareja) — es decir, el
    espaciado corto **ya estaba resuelto antes de esta tarea**, era puramente un síntoma del mirror
    stale (versión vieja del componente/datos), no algo que haya requerido ningún cambio nuevo acá.
  - No se encontraron discrepancias adicionales en `tpe-dashboard`/`tpe-merchant-report`/
    `tpe-recomendations` tras revisar sus imports/DI completos contra los mocks actuales.
  - **Nota aparte (no es un bug de este resync, comportamiento real preexistente)**: `ElementService`
    (`intelica-library-project`, usado por `tpe-merchant-report`/`tpe-recomendations` vía
    `HasElement()`) nunca se inicializa (`.Initialize(pageRoot)`) en ningún punto de
    `mirrors/fee/tpe/` ni de `shell.ts` — su array `Elements` queda `[]` siempre, así que
    `HasElement()` devuelve `false` siempre. Efecto visible: el tab `Fee/TPE Analytics` →
    `recomendations` siempre muestra el estado "Sección bloqueada / Solicitar acceso"
    (`allowTabRecommendations` nunca es `true`), y `includeTerminalId`/`includeSubprogramId`/
    `includeResponseCode` del diálogo RAW de `merchant-report` quedan siempre en `false`. No se
    intentó mockear esto — `Initialize()` probablemente se llama desde algún guard/resolver a nivel
    de `app.routes.ts` fuera del árbol de `tpe/` que este showcase no replica, y no hay evidencia de
    qué `pageRoot`/mecanismo real dispara esa llamada; inventar uno sería exactamente el tipo de
    "adivinar comportamiento" que este proyecto evita.
- **Multiselect "All" desalineado en la barra de filtros de TPE — root-caused, NO es un bug de CSS**:
  el usuario reportó que el checkbox "All" de los multiselect ICA/Brand de `tpe-filter.component.html`
  no se ve alineado igual que las filas de opciones normales. Investigación: `showToggleAll` en
  PrimeNG v20 renderiza ese checkbox dentro de `p-multiselect-header`, en el overlay/panel del
  multiselect — un nodo que PrimeNG monta aparte del host y que SOLO hereda clases vía
  `panelStyleClass` (nunca el `class` del host; confirmado en
  `node_modules/primeng/fesm2022/primeng-multiselect.mjs`:
  `[class]="cn(cx('overlay'), panelStyleClass)"`). El CSS copiado
  (`styleguide/css/components/multiselect/_multiselect.scss`, `.prMultiselect .p-multiselect-header
  .p-checkbox{...}`) SÍ tiene reglas correctas de padding/alineación/el pseudo-elemento `::after{content:
  "All"}` para esa fila — comparado específicamente contra
  `_multiselect.scss` en
  `c:\Users\Acer\Documents\RESPOSITORIO\new-style-guide\Intelica.Style.Guide.New\IntelicaStyleGuide`
  (rama local `main`; esa rama SÍ tiene diff contra `origin/qa` en otros 13 archivos CSS del style
  guide — `_card.mini.scss`, `_amount.scss`, `_filter-bar.scss`, `_helpers.scss`, etc. — pero
  `git diff HEAD origin/qa -- src/assets/css/components/multiselect/_multiselect.scss` da VACÍO, y la
  copia en `styleguide/css/components/multiselect/_multiselect.scss` de este showcase es byte-a-byte
  idéntica al working tree real actual), el archivo copiado YA está al día — el CSS no es el bug. La
  causa real está en el TEMPLATE: los 2
  `<p-multiselect>` de `tpe-filter.component.html` (Brand e ICA) pasan `class="prMultiselect"` pero
  NUNCA `panelStyleClass="prMultiselect"` — confirmado que esto es así en el repo real actual
  (`IntelicaFeeExternalWeb`, rama `main`, sin diff vs `origin/qa`: `grep -n panelStyleClass
  src/app/tpe/tpe-filter/tpe-filter.component.html` no encuentra ninguna línea para esos 2
  multiselects), a diferencia de los otros 3 usos reales confirmados de `.prMultiselect` con
  `showToggleAll` en el mismo módulo (`tpe-dashboard.component.html:389` y
  `tpe-merchant-report.component.html:273,307`), que SÍ pasan `panelStyleClass="prMultiselect"`. Sin
  ese atributo, ninguna regla `.prMultiselect .p-multiselect-header .p-checkbox` llega a aplicarse al
  overlay de esos 2 filtros — el checkbox "All" cae al estilo default (sin estilizar) de PrimeNG en vez
  de alinearse con `.prMultiselect .p-multiselect-option .p-checkbox{width:auto}` de las filas
  normales. **Es un bug real y actual de producción**, no un artefacto de mirror stale. Como
  `mirrors/` debe reproducir fielmente el código real (bug incluido), el fix se aplicó ÚNICAMENTE en
  `prototypes/fee/tpe/tpe-filter/tpe-filter.component.html` (agregando `panelStyleClass="prMultiselect"`
  a ambos `<p-multiselect>`, con un comentario en el archivo documentando el hallazgo) — visible solo
  en la story `Fee/TPE Analytics` → `Propuesta (mejora)`, nunca en `Actual (producción)`, mismo patrón
  que el tooltip "Forecast" de Opt-Out Services documentado arriba. Cero CSS nuevo: las reglas ya
  existen y ya funcionan correctamente donde el atributo SÍ se pasa.
