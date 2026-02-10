import { api } from './api';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as SecureStore from 'expo-secure-store';
import * as Sharing from 'expo-sharing';

const getAuthHeaders = async () => {
  const token = await SecureStore.getItemAsync('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const downloadToCache = async (url: string, filename: string) => {
  const headers = await getAuthHeaders();
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;
  const result = await FileSystem.downloadAsync(url, fileUri, { headers });
  return result.uri;
};

export const invoiceService = {
  async generate(saleId: string, format: 'A4' | '58mm' | '80mm' = 'A4'): Promise<string> {
    const baseUrl = api.defaults.baseURL || '';
    const url = `${baseUrl}/invoices/generate/${saleId}?format=${format}`;
    return downloadToCache(url, `invoice-${saleId}-${format}.pdf`);
  },

  async download(invoiceNumber: string): Promise<string> {
    const baseUrl = api.defaults.baseURL || '';
    const url = `${baseUrl}/invoices/${invoiceNumber}`;
    return downloadToCache(url, `invoice-${invoiceNumber}.pdf`);
  },

  async printHtml(html: string): Promise<void> {
    const { uri } = await Print.printToFileAsync({ html });
    await Print.printAsync({ uri });
  },

  async printFile(uri: string): Promise<void> {
    await Print.printAsync({ uri });
  },

  async share(uri: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  },
};
