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
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it starts with country code or local format
  // +242 XX XXX XX XX or 06/05/04 XXX XX XX (9 digits)
  return /^(242)?[0-9]{9}$/.test(cleaned);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
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
