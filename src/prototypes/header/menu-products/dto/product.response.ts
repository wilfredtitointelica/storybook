export interface MenuProductResponse {
  menuOptionId: string;
  termName: string;
  termDescription: string;
  icon: string;
  klass: string;
  isBeta: boolean;
  isLegacy: boolean;
  authenticationClient: string;
}
export interface MenuOptionResponse {
  menuID: string;
  parentID: string;
  nameMenu: string;
  orderMenu: number;
  icon: string;
  url: string;
  isMenuParent: boolean;
  pageRoot: string;
  isAllwaysVisible: boolean;
  isNew: boolean;
  authenticationClientID: string;
  pageURL: string;
  alterUrl: string;
  isSoon: boolean;
  subMenuOptions: MenuOptionResponse[];
}
