import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/components/redux/store";
import { fetchExchangeRate } from "@/app/components/redux/currencySlice";
import {
  setChargeId,
  setCappedAmount,
  setCurrency,
  setBillingApproved,
} from "@/app/components/redux/billingSlice";
import { ROYALTY_PLAN } from "@/lib/config/royaltyConfig";

export const useBillingData = (app: any, dispatch: AppDispatch) => {
  const [shop, setShop] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [latestTransaction, setLatestTransaction] = useState<any | null>(null);
  const [loadingTx, setLoadingTx] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [updatingCappedAmount, setUpdatingCappedAmount] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [shopCurrency, setShopCurrency] = useState<string | null>(null);
  const [billingApproved, setBillingApprovedState] = useState(false);
  const [chargeId, setChargeIdState] = useState<string | null>(null);
  const [cappedAmount, setCappedAmountState] = useState<number | null>(null);
  const [cappedCurrency, setCappedCurrencyState] = useState<string | null>(
    null,
  );

  // Get shop from App Bridge
  useEffect(() => {
    const shopFromConfig = app?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
    else setError("Unable to retrieve shop info from App Bridge config");
  }, [app]);

  // Fetch shop currency
  useEffect(() => {
    if (!shop) return;

    async function fetchShopCurrency() {
      try {
        const res = await fetch(`/api/royality/counts?shop=${shop}`);
        const data = await res.json();
        if (res.ok) setShopCurrency(data.shopCurrency || "USD");
      } catch (err) {
        console.error("Error fetching shop currency:", err);
        setShopCurrency(" ");
      }
    }
    fetchShopCurrency();
  }, [shop]);

  // Check billing and get charge details
  useEffect(() => {
    if (!shop) return;

    async function checkBilling() {
      setBillingLoading(true);
      try {
        const res = await fetch(`/api/charges/status?shop=${shop}`);
        const data = await res.json();

        if (res.ok) {
          if (data.active) {
            setBillingApprovedState(true);
            dispatch(setBillingApproved(true));
          }
          if (data.active) {
            const normalizedChargeId = normalizeChargeId(data);
            setChargeIdState(normalizedChargeId);
            dispatch(setChargeId(normalizedChargeId));
          }

          if (data.cappedAmount !== undefined) {
            setCappedAmountState(data.cappedAmount);
            dispatch(setCappedAmount(data.cappedAmount));
          }

          if (data.currency) {
            setCappedCurrencyState(data.currency);
            dispatch(setCurrency(data.currency));
          }
        }
      } catch (err) {
        console.error("Error checking billing:", err);
      } finally {
        setBillingLoading(false);
      }
    }

    checkBilling();
  }, [shop, dispatch]);

  // Fetch transactions
  useEffect(() => {
    if (!shop || !billingApproved) return;

    async function fetchLatestTransaction() {
      setLoadingTx(true);
      try {
        const res = await fetch(
          `/api/royality/orders/transaction/balanceused?shop=${shop}`,
        );
        const data = await res.json();
        if (res.ok && data.success)
          setLatestTransaction(data.latestTransaction);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoadingTx(false);
      }
    }

    fetchLatestTransaction();
  }, [shop, billingApproved]);

  // Fetch capped amount if missing
  useEffect(() => {
    if (!shop || !billingApproved || cappedAmount !== null) return;

    async function fetchCappedAmount() {
      try {
        const res = await fetch(`/api/charges?shop=${shop}`);
        const data = await res.json();
        if (res.ok) {
          setCappedAmountState(data.cappedAmount);
          setCappedCurrencyState(data.currency);
          const normalizedChargeId =
            data.chargeId || data.subscriptionId || null;
          setChargeIdState(normalizedChargeId);

          dispatch(setCappedAmount(data.cappedAmount));
          dispatch(setCurrency(data.currency));
          dispatch(setChargeId(normalizedChargeId));
        }
      } catch (err) {
        console.error("Error fetching capped amount:", err);
      }
    }

    fetchCappedAmount();
  }, [shop, billingApproved, dispatch, cappedAmount]);

  // Update manual amount when cappedAmount changes
  useEffect(() => {
    if (cappedAmount !== null) {
      setManualAmount(cappedAmount.toString());
    }
  }, [cappedAmount]);

  const normalizeChargeId = (data: any): string | null => {
    return data.chargeId || data.id || data.subscriptionId || null;
  };

  const startRoyaltyPlan = async () => {
    if (!shop) {
      setPlanError("Shop info missing");
      return;
    }

    setCreatingPlan(true);
    setPlanError(null);

    try {
      const res = await fetch(`/api/charges/billing?shop=${shop}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...ROYALTY_PLAN, shop }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create plan");

      const url = data.confirmationUrl || data.confirmation_url;
      if (!url) throw new Error("No confirmation URL returned");

      window.open(url, "_blank");
      setConfirmationUrl(url);
    } catch (err: any) {
      console.error("Error creating royalty plan:", err);
      setPlanError(err.message || "Unexpected error");
    } finally {
      setCreatingPlan(false);
    }
  };

  const handleManualUpdate = async (amount?: number) => {
    if (!shop) return setUpdateError("Shop info not loaded yet");

    setUpdatingCappedAmount(true);
    setUpdateError(null);
    setUpdateSuccess(false);

    try {
      const res = await fetch(`/api/charges?shop=${shop}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch charge info");

      const effectiveChargeId = data.chargeId || data.id || data.subscriptionId;
      if (!effectiveChargeId) throw new Error("Charge ID not found");

      const newAmount = amount ?? data.cappedAmount;
      if (!newAmount || newAmount <= 0) throw new Error("Invalid amount");

      const updateRes = await fetch(`/api/royality/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chargeId: effectiveChargeId,
          cappedAmount: newAmount,
          shop,
        }),
      });

      const updateData = await updateRes.json();
      if (!updateRes.ok) throw new Error(updateData.error || "Update failed");

      const approvalUrl = updateData.updateUrl;
      if (!approvalUrl) throw new Error("No approval URL returned");

      // Update local and Redux state
      setCappedAmountState(newAmount);
      dispatch(setCappedAmount(newAmount));
      dispatch(setChargeId(effectiveChargeId));

      window.open(approvalUrl, "_blank");
      setUpdateSuccess(true);

      setTimeout(() => {
        checkBilling();
        setUpdateSuccess(false);
      }, 5000);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update capped amount");
    } finally {
      setUpdatingCappedAmount(false);
    }
  };

  const checkBilling = useCallback(async () => {
    if (!shop) return;

    try {
      const res = await fetch(`/api/charges/status?shop=${shop}`);
      const data = await res.json();

      if (res.ok && data.active) {
        setBillingApprovedState(true);
        const normalizedChargeId = data.chargeId || data.id;
        setChargeIdState(normalizedChargeId);

        if (data.cappedAmount !== undefined) {
          setCappedAmountState(data.cappedAmount);
        }
      }
    } catch (err) {
      console.error("Error refreshing billing:", err);
    }
  }, [shop]);

  return {
    shop,
    billingLoading,
    creatingPlan,
    confirmationUrl,
    error,
    planError,
    latestTransaction,
    loadingTx,
    manualAmount,
    updatingCappedAmount,
    updateError,
    updateSuccess,
    shopCurrency,
    billingApproved,
    chargeId,
    cappedAmount,
    cappedCurrency,
    setManualAmount,
    setError,
    setPlanError,
    setUpdateError,
    setUpdateSuccess,
    startRoyaltyPlan,
    handleManualUpdate,
    checkBilling,
  };
};
