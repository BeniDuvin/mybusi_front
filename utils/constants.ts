export const API_BASE_URL = 'http://localhost:3000/api/v1';

export const ROLES = {
  ADMIN: 'ADMIN',
  GERANT: 'GERANT',
  CAISSIER: 'CAISSIER',
  CLIENT: 'CLIENT',
} as const;

export const ROLE_LABELS = {
  ADMIN: 'Administrateur',
  GERANT: 'Gérant',
  CAISSIER: 'Caissier',
  CLIENT: 'Client',
};

export const PAYMENT_METHODS = {
  CASH: 'CASH',
  MOBILE_MONEY: 'MOBILE_MONEY',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CREDIT: 'CREDIT',
} as const;

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Espèces',
  MOBILE_MONEY: 'Mobile Money',
  BANK_TRANSFER: 'Virement bancaire',
  CREDIT: 'Crédit',
};

export const MOBILE_MONEY_PROVIDERS = {
  ORANGE_MONEY: 'ORANGE_MONEY',
  MTN_MONEY: 'MTN_MONEY',
  MOOV_MONEY: 'MOOV_MONEY',
  WAVE: 'WAVE',
} as const;

export const MOBILE_MONEY_PROVIDER_LABELS = {
  ORANGE_MONEY: 'Orange Money',
  MTN_MONEY: 'MTN Money',
  MOOV_MONEY: 'Moov Money',
  WAVE: 'Wave',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'En attente',
  COMPLETED: 'Complété',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
};

export const SALE_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const SALE_STATUS_LABELS = {
  PENDING: 'En attente',
  COMPLETED: 'Complétée',
  CANCELLED: 'Annulée',
};

export const PURCHASE_STATUS = {
  PENDING: 'PENDING',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;

export const PURCHASE_STATUS_LABELS = {
  PENDING: 'En attente',
  RECEIVED: 'Reçue',
  CANCELLED: 'Annulée',
};

export const STOCK_MOVEMENT_TYPE = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export const STOCK_MOVEMENT_TYPE_LABELS = {
  IN: 'Entrée',
  OUT: 'Sortie',
  ADJUSTMENT: 'Ajustement',
};

export const EXPENSE_CATEGORIES = [
  'Électricité',
  'Eau',
  'Loyer',
  'Salaires',
  'Transport',
  'Entretien',
  'Fournitures',
  'Télécommunications',
  'Marketing',
  'Assurance',
  'Taxes',
  'Autres',
];

export const INVOICE_FORMATS = {
  A4: 'A4',
  THERMAL_58MM: '58mm',
  THERMAL_80MM: '80mm',
} as const;
