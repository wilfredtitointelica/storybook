export const GA_TRACKING = {
	tabList: "tabListGA",
	viewDetails: "viewDetailsGA",
	networkToggle: "networkToggleGA",
	sortTable: "sortTableGA",
	ctaBanner: "ctaBannerGA",
	viewAnnouncement: "viewAnnouncementGA",
	openAnnouncementModal: "openAnnouncementModalGA",
} as const;

// --------------------------------------
// SEMANTIC KEYS (lo que usas en templates)
// --------------------------------------
export type GATrackingKey = keyof typeof GA_TRACKING;
