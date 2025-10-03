"use client";
import { Page, Layout, Frame } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";

// Redux
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/redux/store";

// Components
import BillingBanner from "@/app/components/billing/BillingBanner";
import BalanceCards from "@/app/components/billing/Balancecards";
import StatusCard from "@/app/components/billing/CurrentStatus";
import ErrorBanner from "@/app/components/billing/ErrorBanner";
import { useBillingData } from "@/app/hooks/useBillingData";
import { useCurrencyConversion } from "@/app/hooks/useCurrencyConversion";



export default function HomePage() {
  const router = useRouter();
  const app = useAppBridge();
  const dispatch = useDispatch<AppDispatch>();

  // Use custom hooks for data management
  const {
    billingLoading,
    creatingPlan,
    error,
    planError,
    latestTransaction,
    loadingTx,
    manualAmount,
    updatingCappedAmount,
    updateError,
    statusState,
    shopCurrency,
    billingApproved,
    chargeId,
    cappedAmount,
    cappedCurrency,
    setManualAmount,

    startRoyaltyPlan,
    handleManualUpdate,
  } = useBillingData(app, dispatch);

  const { convertToINR } = useCurrencyConversion();

  // Currency conversions
  const cappedAmountINR = convertToINR(cappedAmount, cappedCurrency);
  const balanceUsedINR = convertToINR(
    latestTransaction?.balanceUsed,
    latestTransaction?.currency,
  );
  const balanceRemainingINR = convertToINR(
    latestTransaction?.balanceRemaining,
    latestTransaction?.currency,
  );

  return (
    <Frame>
      <Page
        fullWidth
        title="Royalty Billing"
        subtitle="Track and distribute royalties to your designers"
        backAction={{ content: "Back", onAction: () => router.back() }}
      >
        <Layout>
          {/* Billing Banner */}
          <Layout.Section>
            <BillingBanner
              billingLoading={billingLoading}
              billingApproved={billingApproved}
              creatingPlan={creatingPlan}
              startRoyaltyPlan={startRoyaltyPlan}
              balanceUsed={latestTransaction?.balanceUsed || 0}
              cappedAmount={cappedAmount}
              cappedCurrency={cappedCurrency ?? undefined}
              updatingCappedAmount={updatingCappedAmount}
              updateError={updateError}
              handleManualUpdate={handleManualUpdate}
              manualAmount={manualAmount}
              setManualAmount={setManualAmount}
              chargeId={chargeId}
              status={statusState}
            />
          </Layout.Section>

          {/* Transactions Section */}
          <Layout.Section>
            <BalanceCards
              loadingTx={loadingTx}
              latestTransaction={latestTransaction}
              shopCurrency={shopCurrency}
              balanceUsedINR={balanceUsedINR}
              balanceRemainingINR={balanceRemainingINR}
              cappedAmount={cappedAmount}
              cappedCurrency={cappedCurrency}
              cappedAmountINR={cappedAmountINR}
            />
          </Layout.Section>

          {/* Current Status */}
          <Layout.Section>
            <StatusCard
              billingLoading={billingLoading}
              billingApproved={billingApproved}
            />
          </Layout.Section>

          {/* Errors */}
          {(error || planError) && (
            <Layout.Section>
              <ErrorBanner error={error || planError} />
            </Layout.Section>
          )}
        </Layout>
      </Page>
    </Frame>
  );
}
