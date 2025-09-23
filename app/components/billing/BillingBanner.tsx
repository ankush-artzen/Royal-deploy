import {
  Banner,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Spinner,
  List,
} from "@shopify/polaris";

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
}

const BillingBanner = ({
  billingLoading,
  billingApproved,
  creatingPlan,
  startRoyaltyPlan,
  balanceUsed,
  cappedAmount,
  cappedCurrency,
  updatingCappedAmount,
  updateError,
  handleManualUpdate,
}: BillingBannerProps) => {
  const isNinetyPercentUsed = () => {
    if (
      !billingApproved ||
      balanceUsed === null || 
      balanceUsed === undefined ||
      cappedAmount === null || 
      cappedAmount === undefined ||
      cappedAmount <= 0 ||
      balanceUsed < 0
    ) {
      return false;
    }
    
    const percentageUsed = (balanceUsed / cappedAmount) * 100;
    return percentageUsed >= 80;
  };

  const canEnableBilling = !billingApproved || isNinetyPercentUsed();

  if (billingLoading) {
    return (
      <Banner title="Royalty Payments" tone="info">
        <BlockStack gap="300" align="center">
          <Spinner accessibilityLabel="Checking billing status" size="small" />
          <Text as="p">Checking billing status...</Text>
        </BlockStack>
      </Banner>
    );
  }

  return (
    <Banner
      title="Royalty Payments"
      tone={billingApproved && !isNinetyPercentUsed() ? "info" : "critical"}
    >
      <BlockStack gap="300">
        <Text as="p">
          Royalty billing allows you to automatically calculate and charge
          usage-based royalties.
        </Text>

        {isNinetyPercentUsed() && (
          <>
            <Text as="p" tone="critical" variant="bodyMd" fontWeight="bold">
              Warning: {cappedAmount ? ((balanceUsed / cappedAmount) * 100).toFixed(2) : '0'}% of your capped amount has been used. You can update additional billing.
            </Text>

            {updateError && (
              <Banner tone="critical">
                <p>{updateError}</p>
              </Banner>
            )}
          </>
        )}    

        <List>
          <List.Item>
            Keep royalty payments up to date without manual tracking
          </List.Item>
          <List.Item>View transaction data after orders are placed</List.Item>
          <List.Item>Automatically distribute payments to designers</List.Item>
        </List>

        <InlineStack align="start">
          {/* Show Update Capped Amount button instead of Start Royalty Plan when billing is enabled and at 90% */}
          {billingApproved && isNinetyPercentUsed() ? (
            <Button
              variant="primary"
              loading={updatingCappedAmount}
              onClick={() => {
                console.log("🔹 Update button clicked");
                handleManualUpdate();
              }}
              disabled={updatingCappedAmount}
            >
              Update Capped Amount
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={startRoyaltyPlan}
              loading={creatingPlan}
              disabled={creatingPlan || billingApproved}
            >
              {billingApproved ? "Billing Enabled" : "Start Royalty Plan"}
            </Button>
          )}
        </InlineStack>
      </BlockStack>
    </Banner>
  );
};

export default BillingBanner;