"use client";

import { useState, useEffect } from "react";

interface StoreCurrencyResponse {
  storeCurrency: string;
  error?: string;
}

/**
 * Custom hook to fetch a shop's currency.
 * @param shop - Shopify shop domain (e.g., "myshop.myshopify.com")
 * @returns { currency: string, loading: boolean, error: string | null }
 */
export function useShopCurrency(shop: string | null) {
  const [currency, setCurrency] = useState<string>("USD"); // default USD
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const fetchCurrency = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/royality/orders/shopCurrency?shop=${shop}`);
        const data: StoreCurrencyResponse = await res.json();

        if (res.ok && data.storeCurrency) {
          setCurrency(data.storeCurrency);
          setError(null);
        } else {
          setCurrency("USD"); // fallback
          setError(data.error || "Failed to fetch currency");
        }
      } catch (err: any) {
        setCurrency("USD"); // fallback
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [shop]);

  return { currency, loading, error };
}
