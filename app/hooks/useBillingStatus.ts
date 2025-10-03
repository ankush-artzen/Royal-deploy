import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { fetchBillingStatus, selectBillingStatus } from "../redux/billingStatusSlice";
import { useAppBridge } from "@shopify/app-bridge-react";

export const useBillingStatus = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, approved, error } = useSelector(selectBillingStatus);

  const app = useAppBridge();
  const [shop, setShop] = useState<string | null>(null);

  // ✅ Get shop from AppBridge once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const shopFromConfig = app?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
  }, [app]);

  // ✅ Only fetch if approved is null (not yet fetched)
  useEffect(() => {
    if (shop && approved === null && !loading) {
      dispatch(fetchBillingStatus(shop));
    }
  }, [shop, approved, loading, dispatch]);

  return { loading, approved, error };
};
