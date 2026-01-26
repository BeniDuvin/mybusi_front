import { create } from 'zustand';
import type { Product } from '@/types';

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

interface CartStore {
  items: CartItem[];
  clientId: string | null;
  discount: number;
  tax: number;
  notes: string;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  updateItemPrice: (productId: string, price: number) => void;
  setClient: (clientId: string | null) => void;
  setGlobalDiscount: (discount: number) => void;
  setTax: (tax: number) => void;
  setNotes: (notes: string) => void;
  clear: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTotal: () => number;
  getItemsCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  clientId: null,
  discount: 0,
  tax: 0,
  notes: '',

  addItem: (product, quantity = 1) => {
    const items = get().items;
    const existingIndex = items.findIndex((item) => item.product.id === product.id);

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      set({ items: newItems });
    } else {
      set({
        items: [
          ...items,
          {
            product,
            quantity,
            unitPrice: product.sellingPrice,
            discount: 0,
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
      newItems[index].unitPrice = price;
      set({ items: newItems });
    }
  },

  setClient: (clientId) => set({ clientId }),
  setGlobalDiscount: (discount) => set({ discount }),
  setTax: (tax) => set({ tax }),
  setNotes: (notes) => set({ notes }),
  
  clear: () => set({ items: [], clientId: null, discount: 0, tax: 0, notes: '' }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const lineTotal = item.quantity * item.unitPrice - item.discount;
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
