import type { Product } from '@/types';
import { create } from 'zustand';

export type PackagingType = 'UNITE' | 'CASIER' | 'CARTON' | 'PAQUET' | 'AUTRE';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  packageType: PackagingType;
  packageLabel?: string;
  packageSize: number;
  packageQuantity: number;
}

interface CartStore {
  items: CartItem[];
  clientId: string | null;
  clientName: string;
  discount: number;
  tax: number;
  notes: string;
  
  // Actions
  addItem: (
    product: Product,
    quantity?: number,
    packageInfo?: {
      packageType: PackagingType;
      packageLabel?: string;
      packageSize: number;
      packageQuantity: number;
    }
  ) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  setClient: (clientId: string | null) => void;
  setClientName: (name: string) => void;
  setGlobalDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemsCount: () => number;
}

const toNumber = (value: unknown) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  clientId: null,
  clientName: '',
  discount: 0,
  tax: 0,
  notes: '',

  addItem: (product, quantity = 1, packageInfo) => {
    const items = get().items;
    const existingIndex = items.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      if (packageInfo) {
        newItems[existingIndex].packageType = packageInfo.packageType;
        newItems[existingIndex].packageLabel = packageInfo.packageLabel;
        newItems[existingIndex].packageSize = packageInfo.packageSize;
        newItems[existingIndex].packageQuantity = packageInfo.packageQuantity;
      }
      set({ items: newItems });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            quantity,
            unitPrice: toNumber(product.sellingPrice),
            discount: 0,
            packageType: packageInfo?.packageType ?? 'UNITE',
            packageLabel: packageInfo?.packageLabel,
            packageSize: packageInfo?.packageSize ?? 1,
            packageQuantity: packageInfo?.packageQuantity ?? quantity,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    const items = get().items;
    const index = items.findIndex((item) => item.product.id === productId);
    
    if (index >= 0) {
      const newItems = [...items];
      newItems[index].quantity = quantity;
      set({ items: newItems });
    }
  },

  updateDiscount: (productId, discount) => {
    const items = get().items;
    const index = items.findIndex((item) => item.product.id === productId);
    
    if (index >= 0) {
      const newItems = [...items];
      newItems[index].discount = discount;
      set({ items: newItems });
    }
  },

  updateItemPrice: (productId, price) => {
    const items = get().items;
    const index = items.findIndex((item) => item.product.id === productId);
    
    if (index >= 0) {
      const newItems = [...items];
      newItems[index].unitPrice = toNumber(price);
      set({ items: newItems });
    }
  },

  setClient: (clientId) => set({ clientId }),
  setClientName: (name) => set({ clientName: name }),
  setGlobalDiscount: (discount) => set({ discount }),
  setTax: (tax) => set({ tax }),
  setNotes: (notes) => set({ notes }),
  
  clear: () =>
    set({ items: [], clientId: null, clientName: '', discount: 0, tax: 0, notes: '' }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal =
        toNumber(item.quantity) * toNumber(item.unitPrice) - toNumber(item.discount);
      return sum + lineTotal;
    }, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    const tax = get().tax;
    return subtotal - discount + tax;
  },

  getItemsCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
