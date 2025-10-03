interface LineItem {
  productId: string;
  title: string;
  variantId: string;
  variantTitle?: string;
  designerId: string;
  royality: number;
  amount: number;
  quantity: number;
  unitPrice: number;
  royaltyPercentage: number;
  royaltyCharges: number;
}

interface Transaction {
  id: string;
  shop: string;
  shopifyTransactionChargeId: string;
  orderId: string;
  productId?: string;
  description: string;
  price: {
    storeprice: number;
    storeCurrency: string;
    usd: number;
  };
  currency: string; // USD
  balanceUsed: number;
  balanceRemaining: number;
  royaltyPercentage: number;
  designerId: string;
  createdAt: string;
  updatedAt: string;
  status: "pending" | "success" | "failed";

}

interface RoyaltyOrder {
  id: string;
  orderName: string;
  orderId: string;
  currency: string;
  createdAt?: string;
  calculatedRoyaltyAmount: number;
  convertedCurrencyAmountRoyality: number;
  lineItem: LineItem[];
  transactions?: Transaction[];
}

interface OrderModalProps {
  order: RoyaltyOrder;
  storeName: string;
  active: boolean;
  onClose: () => void;
  loading?: boolean;
}
interface RoyaltyTransaction {
  id: string;
  shop: string;
  shopifyTransactionChargeId: string;
  orderId: string;
  orderName: string;
  productId?: string;
  description: string;
  price: {
    storeprice: number;
    storeCurrency: string;
    usd: number;
  };
  currency: string;
  royaltyPercentage: number;
  designerId: string;
  createdAt: string;
  updatedAt: string;
}
interface ApiResponse {
  transactions: RoyaltyTransaction[];
  totalCount: number;
  page: number;
  totalPages: number;
}

interface SummaryResponse {
  totalTransactions: number;
  totalRevenue: number;
  avgRoyalty: number;
}
interface Royalty {
  id: string;
  productId: string;
  shopifyId: string;
  title: string;
  image?: string | null;
  status?: string | null;
  designerId: string;
  Royality: number;
  shop?: string | null;
  expiry?: string | null;
  price?: {
    amount: number;
    currency: string;
    storeCurrency: string;
    storeAmount: number;
  } | null;
  inArchive?: boolean;
}

interface ApiResponse {
  royalties: Royalty[];
  count: number;
  page: number;
  totalPages: number;
}

interface BalanceCardsProps {
  loadingTx: boolean;
  latestTransaction: any;
  shopCurrency: string | null;
  balanceUsedINR: number | null;
  balanceRemainingINR: number | null;
  cappedAmount: number | null;
  cappedCurrency: string | null;
  cappedAmountINR: number | null;
}
interface CurrencyState {
  rates: Record<string, number>;
  lastUpdated: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: CurrencyState = {
  rates: {},
  lastUpdated: null,
  loading: false,
  error: null,
};
interface BillingBannerProps {
  billingLoading: boolean;
  billingApproved: boolean;
  creatingPlan: boolean;
  startRoyaltyPlan: () => void;
  balanceUsed: number;
  cappedAmount: number | null;
  cappedCurrency?: string;
  updatingCappedAmount: boolean;
  updateError: string | null;
  handleManualUpdate: (amount?: number) => void;
  manualAmount: string;
  setManualAmount: (amount: string) => void;
  chargeId?: string | null;
  status?: string | null;
}
interface StatusCardProps {
  billingLoading: boolean;
  billingApproved: boolean;
}
interface ErrorBannerProps {
  error: string | null;
}

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: any;
  action?: () => void;
  buttonText?: string;
  value?: string | number;
  loading?: boolean;
}
interface CustomDataTableProps {
  columns: string[];
  rows: ReactNode[][];
  loading?: boolean;
  error?: string | null;
  emptyStateMessage?: string;
  emptyStateImage?: string;
}
interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  actionType?: "switchOn" | "switchOff";
}
interface EditRoyaltyModalProps {
  open: boolean;
  royalty: Royalty | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    updates: { Royality?: number; expiry?: string },
  ) => void;
}
interface PaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

interface LineItemStat {
  productId: string;
  title: string;
  variantId?: string | null;
  variantTitle?: string | null;
  unitSold: number;
  totalSale: number;
  totalRoyalty: number;
  royaltyPercentage: number;
  last30DaysRoyalty: number;
  currency?: string | null;
  image?: string | null;
  price?: number | null;
  convertedCurrencyAmountRoyalty?: number;
}

type ApiResponsesold = {
  shop: string;
  products: LineItemStat[];
  totalProducts: number;
  totalUnitSold: number;
  totalSales: number;
  totalRoyalties: number;
  totalConvertedRoyalty: number;
  last30DaysTotalRoyalty: number;
  last30DaysConvertedRoyalty: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
interface ShopifyLineItem {
  product_id?: number | string;
  variant_id?: number | string;
  title: string;
  variant_title?: string;
  quantity: number;
  price: string | number;
}
interface CreateRoyaltyTxParams {
  shop: string;
  orderId: string;
  orderName: string;
  productId: string;
  description: string;
  price: number;
  currency: string;
  royaltyPercentage: number;
  designerId: string;
  shopifyTransactionChargeId: string;
}

type SessionType = {
  accessToken: string;
  shop: string;
  id: string;
  scope?: string;
  state?: string;
  isOnline?: boolean;
  expires?: string | undefined;
};