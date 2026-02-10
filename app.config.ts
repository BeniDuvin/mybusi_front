import 'dotenv/config';
import appConfig from './app.json';

export default ({ config }: { config: typeof appConfig.expo }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || config.extra?.apiBaseUrl,
    },
  };
};
