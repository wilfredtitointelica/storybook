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
	alterUrl: string;
	pageURL: string;
	isSoon: boolean;
	subMenuOptions: MenuOptionResponse[];
}
