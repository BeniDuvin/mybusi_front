import { api } from './api';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const invoiceService = {
  async generate(saleId: string, format: 'A4' | '58mm' | '80mm' = 'A4'): Promise<string> {
    const response = await api.get(`/invoices/generate/${saleId}`, {
      params: { format },
      responseType: 'blob',
    });
    
    return URL.createObjectURL(response.data);
  },

  async download(invoiceNumber: string): Promise<string> {
    const response = await api.get(`/invoices/${invoiceNumber}`, {
      responseType: 'blob',
    });
    
    return URL.createObjectURL(response.data);
  },

  async print(html: string): Promise<void> {
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  },

  async share(uri: string): Promise<void> {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    }
  },
};
