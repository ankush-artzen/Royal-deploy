"use client";

import { useState, useEffect, useCallback } from "react";

interface Subscription {
  cappedAmount: number | null;
  currency: string | null;
  chargeId: string | null;
  status: string | null;
}

export function useRoyaltySubscription(shop: string | null) {
  const [subscription, setSubscription] = useState<Subscription>({
    cappedAmount: null,
    currency: null,
    chargeId: null,
    status: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!shop) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/charges/status?shop=${encodeURIComponent(shop)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch subscription");
        setSubscription({
          cappedAmount: null,
          currency: null,
          chargeId: null,
          status: null,
        });
      } else {
        setSubscription({
          cappedAmount: data.cappedAmount,
          currency: data.currency,
          chargeId: data.chargeId,
          status: data.status,
        });
      }
    } catch (err) {
      console.error("❌ Error fetching subscription:", err);
      setError("Network error");
      setSubscription({
        cappedAmount: null,
        currency: null,
        chargeId: null,
        status: null,
      });
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
}
