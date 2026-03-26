import { getPremiumStatus, upsertSubscription } from "@/lib/database";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export const PREMIUM_PRODUCT_ID = "com.marshmallow.premium.monthly";
export const PREMIUM_PRICE = "$6.99/month";

export interface PremiumFeatures {
  unlimited_scheduled_blocks: boolean;
  strong_block: boolean;
  growth_rate: number;
  streak_saver: boolean;
  rare_cosmetics: boolean;
  unlimited_customization: boolean;
}

const FREE_FEATURES: PremiumFeatures = {
  unlimited_scheduled_blocks: false,
  strong_block: false,
  growth_rate: 1.0,
  streak_saver: false,
  rare_cosmetics: false,
  unlimited_customization: false,
};

interface SubscriptionState {
  isPremium: boolean;
  status: string;
  expiresAt: string | null;
  features: PremiumFeatures;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  refresh: () => Promise<void>;
  purchasePremium: (receipt: string, transactionId: string) => Promise<void>;
  restorePurchase: (receipt: string, transactionId: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPremium: false,
  status: "inactive",
  expiresAt: null,
  features: FREE_FEATURES,
  loading: true,
  refresh: async () => {},
  purchasePremium: async () => {},
  restorePurchase: async () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isPremium: false,
    status: "inactive",
    expiresAt: null,
    features: FREE_FEATURES,
    loading: true,
  });

  const refresh = useCallback(async () => {
    if (!session?.user?.id) {
      setState({
        isPremium: false,
        status: "inactive",
        expiresAt: null,
        features: FREE_FEATURES,
        loading: false,
      });
      return;
    }

    try {
      const premiumStatus = await getPremiumStatus(session.user.id);
      setState({
        isPremium: premiumStatus.is_premium,
        status: premiumStatus.status,
        expiresAt: premiumStatus.expires_at,
        features: premiumStatus.features,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const purchasePremium = async (receipt: string, transactionId: string) => {
    if (!session?.user?.id) return;

    // Calculate expiry (30 days from now for monthly)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await upsertSubscription(session.user.id, {
      product_id: PREMIUM_PRODUCT_ID,
      status: "active",
      original_transaction_id: transactionId,
      latest_receipt: receipt,
      purchase_date: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    await refresh();
  };

  const restorePurchase = async (receipt: string, transactionId: string) => {
    await purchasePremium(receipt, transactionId);
  };

  return (
    <SubscriptionContext.Provider
      value={{ ...state, refresh, purchasePremium, restorePurchase }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  return useContext(SubscriptionContext);
}
