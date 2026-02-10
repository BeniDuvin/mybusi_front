import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEYS = {
  appName: 'app_settings_app_name',
  helpText: 'app_settings_help_text',
  aboutText: 'app_settings_about_text',
} as const;

export const DEFAULT_APP_SETTINGS = {
  appName: 'MyDepot',
  helpText:
    'Pour toute assistance, contactez votre administrateur ou le support. Vous pouvez aussi consulter le guide interne de votre dépôt.',
  aboutText:
    "MyDepot est une application de gestion de dépôt de boissons. Elle permet le suivi des ventes, achats, stocks et finances.",
};

export type AppSettings = typeof DEFAULT_APP_SETTINGS;

export const settingsService = {
  async getAll(): Promise<AppSettings> {
    const [appName, helpText, aboutText] = await Promise.all([
      SecureStore.getItemAsync(SETTINGS_KEYS.appName),
      SecureStore.getItemAsync(SETTINGS_KEYS.helpText),
      SecureStore.getItemAsync(SETTINGS_KEYS.aboutText),
    ]);

    return {
      appName: appName || DEFAULT_APP_SETTINGS.appName,
      helpText: helpText || DEFAULT_APP_SETTINGS.helpText,
      aboutText: aboutText || DEFAULT_APP_SETTINGS.aboutText,
    };
  },

  async saveAll(settings: AppSettings): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(SETTINGS_KEYS.appName, settings.appName.trim()),
      SecureStore.setItemAsync(SETTINGS_KEYS.helpText, settings.helpText.trim()),
      SecureStore.setItemAsync(SETTINGS_KEYS.aboutText, settings.aboutText.trim()),
    ]);
  },
};
