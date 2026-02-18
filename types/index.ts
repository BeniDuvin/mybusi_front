// User & Auth Types
export type Role = 'ADMIN' | 'GERANT' | 'CAISSIER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: Role;
}

export interface OTPRequest {
  phone: string;
}

export interface OTPVerifyRequest {
  phone: string;
  otpCode: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Depot Types
export interface Depot {
  id: string;
  name: string;
  address: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepotRequest {
  name: string;
  address: string;
  phone: string;
  email?: string;
}

// Product Types
export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode?: string;
  sku: string;
  imageUrl?: string;
  categoryId: string;
  category?: Category;
  brandId: string;
  brand?: Brand;
  depotId: string;
  depot?: Depot;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
  quantity?: number;
  currentStock?: number;
  stockQuantity?: number;
  stock?: {
    quantity?: number;
  };
  stocks?: {
    id: string;
    productId: string;
    depotId: string;
    quantity: number;
  }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  barcode?: string;
  sku: string;
  imageUrl?: string;
  categoryId: string;
  brandId: string;
  depotId: string;
  purchasePrice: number;
  sellingPrice: number;
  minStock: number;
}

// Stock Types
export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Stock {
  id: string;
  productId: string;
  product?: Product;
  depotId: string;
  depot?: Depot;
  quantity: number;
  lastRestockDate?: string;
}

export interface StockMovement {
  id: string;
  stockId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface AddStockRequest {
  productId: string;
  depotId: string;
  quantity: number;
  reason?: string;
  reference?: string;
}

// Client Types
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
}

// Sale Types
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface SaleLine {
  id: string;
  saleId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  depotId: string;
  depot?: Depot;
  clientId?: string;
  client?: Client;
  userId: string;
  user?: User;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  notes?: string;
  lines: SaleLine[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleRequest {
  depotId: string;
  clientId?: string;
  lines: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  discount: number;
  tax: number;
  notes?: string;
}

// Payment Types
export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CREDIT';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type MobileMoneyProvider = 'ORANGE_MONEY' | 'MTN_MONEY' | 'MOOV_MONEY' | 'WAVE';

export interface Payment {
  id: string;
  saleId?: string;
  purchaseId?: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  saleId?: string;
  purchaseId?: string;
  amount: number;
  method: PaymentMethod;
  mobileMoneyProvider?: MobileMoneyProvider;
  mobileMoneyNumber?: string;
  reference?: string;
  notes?: string;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
}

// Purchase Types
export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseLine {
  id: string;
  purchaseId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  depotId: string;
  depot?: Depot;
  supplierId: string;
  supplier?: Supplier;
  userId: string;
  user?: User;
  total: number;
  paidAmount: number;
  status: PurchaseStatus;
  notes?: string;
  deliveryDate?: string;
  lines: PurchaseLine[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseRequest {
  depotId: string;
  supplierId: string;
  lines: {
    productId: string;
    quantity: number;
    unitPrice: number;
  }[];
  notes?: string;
  deliveryDate?: string;
}

// Expense Types
export interface Expense {
  id: string;
  depotId: string;
  depot?: Depot;
  category: string;
  amount: number;
  description?: string;
  reference?: string;
  userId: string;
  user?: User;
  createdAt: string;
}

export interface CreateExpenseRequest {
  depotId: string;
  category: string;
  amount: number;
  description?: string;
  reference?: string;
}

// Other income types
export interface OtherIncome {
  id: string;
  depotId: string;
  depot?: Depot;
  category: string;
  amount: number;
  description: string;
  reference?: string;
  userId: string;
  user?: User;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateOtherIncomeRequest {
  depotId: string;
  category: string;
  amount: number;
  description: string;
  reference?: string;
}

// Salary Types
export interface SalaryPayment {
  id: string;
  userId: string;
  user?: User;
  amount: number;
  period: string;
  paymentDate: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface CreateSalaryRequest {
  userId: string;
  amount: number;
  period: string;
  paymentDate: string;
  notes?: string;
}

// Finance Types
export interface FinanceSummary {
  totalSales: number;
  totalOtherIncomes: number;
  totalIncome: number;
  totalPurchases: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  cashBalance: number;
}

export interface CashFlowItem {
  date: string;
  income: number;
  expense: number;
  balance: number;
  type?: 'INCOME' | 'EXPENSE';
  source?: string;
  category?: string;
  amount?: number;
  reference?: string;
  description?: string;
  createdAt?: string;
}

// Log Types
export interface Log {
  id: string;
  userId: string;
  user?: User;
  depotId?: string;
  depot?: Depot;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Pagination Types
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// API Response Types
export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
