"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/app/redux/store";
import { fetchShopCurrency } from "@/app/redux/shopSlice";

export function useShopCurrencyRedux(shop: string | null) {
  const dispatch = useDispatch<AppDispatch>();
  const { currency, loading, error } = useSelector(
    (state: RootState) => state.shop,
  );

  useEffect(() => {
    if (shop && !currency && !loading) {
      // ✅ Fetch only if currency not yet in Redux
      dispatch(fetchShopCurrency(shop));
    }
  }, [shop, currency, loading, dispatch]);

  return { currency, loading, error };
}
