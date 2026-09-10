export function validateMinLength(password: string): boolean {
	return password.length >= 12;
}

export function validateUppercase(password: string): boolean {
	return /[A-Z]/.test(password);
}

export function validateNumber(password: string): boolean {
	return /[0-9]/.test(password);
}

export function validateSpecialChar(password: string): boolean {
	return /[!#%&@$]/.test(password);
}

export function getNewPasswordError(currentPassword: string, newPassword: string): string {
	if (!newPassword) return '';
	if (currentPassword.length > 0 && newPassword === currentPassword) return 'ErrorInputSameNewPassword';
	if (!validateMinLength(newPassword)) return 'ErrorInputPasswordToShort';
	if (!validateUppercase(newPassword)) return 'ErrorInputPasswordBigLetter';
	if (!validateNumber(newPassword)) return 'ErrorInputPasswordForgetNumber';
	if (!validateSpecialChar(newPassword)) return 'ErrorInputPasswordForgetSpecialChar';
	return '';
}

export function getConfirmPasswordError(newPassword: string, confirmPassword: string): string {
	if (!confirmPassword) return '';
	if (confirmPassword !== newPassword) return 'ErrorInputPasswordDontMatch';
	return '';
}
