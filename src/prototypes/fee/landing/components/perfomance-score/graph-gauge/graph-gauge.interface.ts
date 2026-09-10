import { Color } from "intelica-library-base";

export const RATING_COLORS = {
	A: Color.tachometerA, // Según DS: --i-color-green-800 	// old "#126629"
	B: Color.tachometerB, // Según DS: --i-color-yellow-500 	// old "#F7D54D"
	C: Color.tachometerC, // Según DS: --i-color-amber-500 	// old "#FFB52B"
	D: Color.tachometerD, // Según DS: --i-color-red-600 		// old "#C70F0F"
} as const;

export type RatingConfig = {
	rating: keyof typeof RATING_COLORS;
	color: (typeof RATING_COLORS)[keyof typeof RATING_COLORS];
};

export type ValueFormat = "percent" | "custom";
