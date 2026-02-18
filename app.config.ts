import type { ConfigContext, ExpoConfig } from '@expo/config';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  if (!config.name || !config.slug) {
    throw new Error("Le config.name et config.slug doivent être définis dans app.json");
  }

  return {
    ...config,
    android: {
      ...config.android,
      package: "com.bensoftcg.mydepot", // Obligatoire Android
      versionCode: 1,
    },
    ios: {
      ...config.ios,
      bundleIdentifier: "com.bensoftcg.mydepot", // Obligatoire iOS
      buildNumber: "1.0.0",
    },
    extra: {
      ...config.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || config.extra?.apiBaseUrl,
    },
  } as ExpoConfig;
};
