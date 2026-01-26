/**
 * Test credentials for development
 * These accounts should be available in your backend for testing
 */

export const TEST_CREDENTIALS = {
  admin: {
    email: 'admin@mydepot.com',
    password: 'admin123',
    label: 'Admin',
    role: 'ADMIN',
  },
  gerant: {
    email: 'gerant@mydepot.com',
    password: 'gerant123',
    label: 'Gérant',
    role: 'GERANT',
  },
  caissier: {
    email: 'caissier@mydepot.com',
    password: 'caissier123',
    label: 'Caissier',
    role: 'CAISSIER',
  },
  client: {
    email: 'client@mydepot.com',
    password: 'client123',
    label: 'Client',
    role: 'CLIENT',
  },
};

export type TestCredentialKey = keyof typeof TEST_CREDENTIALS;
