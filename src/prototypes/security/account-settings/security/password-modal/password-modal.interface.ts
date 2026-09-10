export interface PasswordCriterion {
	text: string;
	state: boolean | null; // true = valid | false = invalid | null = default
}
