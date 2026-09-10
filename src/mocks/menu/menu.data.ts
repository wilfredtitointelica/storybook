// Data fija de ejemplo para la story del menú lateral, calcada del menú real de Fee Manager
// (rama qa/development de IntelicaMenuWeb — main estaba desactualizada).
// Un item es "externo" (icon-external-link, <a href target="_blank">) cuando su
// authenticationClientID difiere del de su padre — ver menu.ts: toMenuItem().
import { MenuOptionResponse } from '../../mirrors/menu/menu/dto/menu-responses';

const FEE = 'FEE';
const LEGACY = 'LEGACY';
const REPORTS_CLIENT = 'REPORTS';
const SAVINGS_CLIENT = 'SAVINGS';

export const menuOptions: MenuOptionResponse[] = [
  {
    menuID: '1',
    parentID: '',
    nameMenu: 'root',
    orderMenu: 0,
    icon: '',
    url: '',
    isMenuParent: true,
    pageRoot: '',
    isAllwaysVisible: true,
    isNew: false,
    authenticationClientID: FEE,
    pageURL: '',
    alterUrl: '',
    isSoon: false,
    subMenuOptions: [
      {
        menuID: '2',
        parentID: '1',
        nameMenu: 'Incontrol Panel',
        orderMenu: 1,
        icon: 'icon icon-incontrol-panel',
        url: '',
        isMenuParent: false,
        pageRoot: 'LandingExternalNew', // coincide con data.pageRoot de landing.routes.ts
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: FEE, // igual al root -> interno (pageURL/routerPath)
        // Coincide con la ruta real (app.routes.ts -> landing.routes.ts, redirige '' -> 'dashboard').
        // Igual que TPE/Opt-outs: pageURL debe ser el path YA resuelto ('/dashboard' incluido) para
        // que routerLinkActive({exact:true}) en menu.html marque el ítem como activo.
        pageURL: '/fee/landing/dashboard',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [],
      },
      {
        menuID: '3',
        parentID: '1',
        nameMenu: 'Fee Library',
        orderMenu: 2,
        icon: 'icon icon-fee-library',
        url: '',
        isMenuParent: false,
        pageRoot: '',
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: FEE,
        pageURL: '/fee/library',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [],
      },
      {
        menuID: '4',
        parentID: '1',
        nameMenu: 'Fee Updates',
        orderMenu: 3,
        icon: 'icon icon-fee-update',
        url: '',
        isMenuParent: false,
        pageRoot: 'fee-updates', // coincide con data.pageRoot de app.routes.ts (path: 'updates')
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: FEE,
        pageURL: '/fee/updates',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [],
      },
      {
        menuID: '5',
        parentID: '1',
        nameMenu: 'Analytics and reports',
        orderMenu: 4,
        icon: 'icon icon-analytics-reports',
        url: '',
        isMenuParent: true,
        pageRoot: '',
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: FEE,
        pageURL: '',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [
          {
            menuID: '5-1',
            parentID: '5',
            nameMenu: 'Fee Reports',
            orderMenu: 1,
            icon: '',
            url: 'https://reports.example.com/fee-reports', // distinto authenticationClientID -> externo
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            authenticationClientID: REPORTS_CLIENT,
            pageURL: '',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
          {
            menuID: '5-2',
            parentID: '5',
            nameMenu: 'Fee Dashboard',
            orderMenu: 2,
            icon: '',
            url: 'https://reports.example.com/fee-dashboard',
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            authenticationClientID: REPORTS_CLIENT,
            pageURL: '',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
        ],
      },
      {
        menuID: '6',
        parentID: '1',
        nameMenu: 'Savings opportunities',
        orderMenu: 5,
        icon: 'icon icon-saving-opportunities',
        url: '',
        isMenuParent: true,
        pageRoot: '',
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: FEE,
        pageURL: '',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [
          {
            menuID: '6-1',
            parentID: '6',
            nameMenu: 'Data Integrity',
            orderMenu: 1,
            icon: '',
            url: 'https://savings.example.com/data-integrity',
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            authenticationClientID: SAVINGS_CLIENT,
            pageURL: '',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
          {
            menuID: '6-2',
            parentID: '6',
            nameMenu: 'MAR',
            orderMenu: 2,
            icon: '',
            url: 'https://savings.example.com/mar',
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            authenticationClientID: SAVINGS_CLIENT,
            pageURL: '',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
          {
            menuID: '6-3',
            parentID: '6',
            nameMenu: 'TPE',
            orderMenu: 3,
            icon: '',
            url: '',
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            // Antes marcado como externo (SAVINGS_CLIENT) con una URL inventada — corregido:
            // TPE es una ruta real interna de esta misma app (ver app.routes.ts: path 'tpe' bajo
            // 'fee', y tpe.routes.ts redirige '' -> 'dashboard'), igual al padre (Savings) -> interno.
            // pageURL apunta al path YA resuelto ('/dashboard' incluido), no al padre: menu.html usa
            // routerLinkActive con { exact: true } contra item.routerPath (= pageURL) -> si acá solo
            // dijera '/fee/tpe', nunca calzaría con router.url tras la redirección real a
            // '/fee/tpe/dashboard' y el ítem del sidebar jamás se vería "activo".
            authenticationClientID: FEE,
            pageURL: '/fee/tpe/dashboard',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
          {
            menuID: '6-4',
            parentID: '6',
            nameMenu: 'Opt-outs',
            orderMenu: 4,
            icon: '',
            url: '',
            isMenuParent: false,
            pageRoot: '',
            isAllwaysVisible: true,
            isNew: false,
            authenticationClientID: FEE, // igual al padre (Savings) -> interno, sin ícono
            // Coincide con la ruta real (app.routes.ts): path: 'opt-out-service' bajo 'fee',
            // con children que redirigen '' -> 'dashboard'. Igual que TPE arriba: pageURL debe ser
            // el path YA resuelto ('/dashboard' incluido) para que routerLinkActive({exact:true})
            // de menu.html marque el ítem como activo.
            pageURL: '/fee/opt-out-service/dashboard',
            alterUrl: '',
            isSoon: false,
            subMenuOptions: [],
          },
        ],
      },
      {
        menuID: '7',
        parentID: '1',
        nameMenu: 'Fee Validation',
        orderMenu: 6,
        icon: 'icon icon-fee-validation',
        url: 'https://validation.example.com',
        isMenuParent: false,
        pageRoot: '',
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: LEGACY,
        pageURL: '',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [],
      },
      {
        menuID: '8',
        parentID: '1',
        nameMenu: 'Brand Files',
        orderMenu: 7,
        icon: 'icon icon-file',
        url: 'https://brandfiles.example.com',
        isMenuParent: false,
        pageRoot: '',
        isAllwaysVisible: true,
        isNew: false,
        authenticationClientID: LEGACY,
        pageURL: '',
        alterUrl: '',
        isSoon: false,
        subMenuOptions: [],
      },
    ],
  },
];

// authenticationClientID debe ser literalmente 'ExternalNew' (o 'InternalNew') para que
// menu.ts las trate como internas (routerPath) — ver effectSyncFavorites().
// pageRoot debe calzar con `data.pageRoot` de la ruta real (ver app.routes.ts) — es la clave que usa
// AddFavoritesService.isFavoriteByPageRoot()/removeFavoriteByPageRoot() en intelica-library-project.
export const favoritesData = [
  { pageName: 'Fee Library', pageUrl: '/fee/library', pageRoot: 'library-migration', authenticationClientID: 'ExternalNew' },
  { pageName: 'Fee Updates', pageUrl: '/fee/updates', pageRoot: 'fee-updates', authenticationClientID: 'ExternalNew' },
];
