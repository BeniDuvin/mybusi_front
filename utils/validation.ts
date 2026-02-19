/**
 * Validate email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Congo Brazzaville format)
 */
export const isValidPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return /^(242)?[0-9]{9}$/.test(cleaned);
};

/**
 * Normalize phone for API (Congo Brazzaville: +242XXXXXXXXX)
 */
export const normalizePhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9 && !cleaned.startsWith('242')) {
    return `+242${cleaned}`;
  }
  if (cleaned.startsWith('242')) {
    return `+${cleaned}`;
  }
  return phone.startsWith('+') ? phone : `+${cleaned}`;
};

/**
 * Validate password strength (basic, for register etc.)
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Validate password for reset (backend: min 8 chars, 1 maj, 1 min, 1 chiffre)
 */
export const isStrongPassword = (password: string): boolean => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
};

/**
 * Validate required field
 */
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate number is positive
 */
export const isPositiveNumber = (value: number): boolean => {
  return !isNaN(value) && value > 0;
};

/**
 * Validate number is non-negative
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return !isNaN(value) && value >= 0;
};

/**
 * Validate minimum length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate maximum length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Get validation error message
 */
export const getErrorMessage = (field: string, type: string): string => {
  const messages: Record<string, string> = {
    required: `${field} est requis`,
    email: `${field} doit être une adresse email valide`,
    phone: `${field} doit être un numéro de téléphone valide`,
    password: `${field} doit contenir au moins 6 caractères`,
    positive: `${field} doit être un nombre positif`,
    nonNegative: `${field} ne peut pas être négatif`,
    minLength: `${field} est trop court`,
    maxLength: `${field} est trop long`,
  };
  
  return messages[type] || `${field} est invalide`;
};
