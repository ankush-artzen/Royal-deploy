import { useState, useEffect, useCallback } from "react";
import { AppDispatch } from "@/app/redux/store";
import {
  setChargeId,
  setCappedAmount,
  setCurrency,
  setBillingApproved,
} from "@/app/redux/billingSlice";
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
  const [statusState, setStatusState] = useState<string | null>(null);

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
  
        console.log("Fetched latest transaction data:", data);
  
        if (res.ok && data.success && data.latestTransaction) {
          setLatestTransaction(data.latestTransaction);
        } else {
          // Fallback when no transaction exists
          setLatestTransaction({
            balanceUsed: 0,
            cappedAmount: cappedAmount ?? 0,
            currency: shopCurrency ?? "USD",
          });
        }
      } catch (err) {
        console.error("Error fetching transactions:", err);
        // Fallback on error too
        setLatestTransaction({
          balanceUsed: 0,
          cappedAmount: cappedAmount ?? 0,
          currency: shopCurrency ?? "USD",
        });
      } finally {
        setLoadingTx(false);
      }
    }
  
    fetchLatestTransaction();
  }, [shop, billingApproved, cappedAmount, shopCurrency]);
  
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

          setStatusState(data.status);

          // ✅ Log all fetched values
          console.log("Fetched capped amount data:", {
            cappedAmount: data.cappedAmount,
            currency: data.currency,
            chargeId: normalizedChargeId,
            status: data.status,
          });
        } else {
          console.error(
            "Error fetching capped amount:",
            data.error || "Unknown error",
          );
        }
      } catch (err) {
        console.error("Error fetching capped amount:", err);
      }
    }

    fetchCappedAmount();
  }, [shop, billingApproved, cappedAmount]);

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
      console.log("setChargeId", setChargeId);

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
    statusState,
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
