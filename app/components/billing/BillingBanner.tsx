import {
  Banner,
  Text,
  Button,
  BlockStack,
  InlineStack,
  Spinner,
  List,
  Box,
  ProgressBar,
  InlineGrid,
} from "@shopify/polaris";

const BillingBanner = ({
  billingLoading,
  billingApproved,
  creatingPlan,
  startRoyaltyPlan,
  balanceUsed,
  cappedAmount,
  cappedCurrency = "USD",
  updatingCappedAmount,
  updateError,
  handleManualUpdate,
  chargeId,
  status,
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
    return percentageUsed >= 90;
  };

  const canEnableBilling = !billingApproved || isNinetyPercentUsed();
  const percentageUsed =
    cappedAmount && cappedAmount > 0 ? (balanceUsed / cappedAmount) * 100 : 0;
  const isActive = status === "active";

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
              Warning:{" "}
              {cappedAmount
                ? ((balanceUsed / cappedAmount) * 100).toFixed(2)
                : "0"}
              % of your capped amount has been used. You can update additional
              billing.
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

        {/* Usage Progress Section */}

        {billingApproved && cappedAmount && isActive && (
          <Box padding="100" borderRadius="100">
            <BlockStack gap="300">
              <InlineStack align="space-between" blockAlign="center">
                <Text as="h3" variant="bodyLg" fontWeight="bold">
                  Usage Summary
                </Text>
                {percentageUsed.toFixed(1)}% Used
              </InlineStack>

              <ProgressBar
                progress={percentageUsed}
                size="medium"
                tone={
                  percentageUsed < 50
                    ? "highlight"
                    : percentageUsed < 75
                      ? "success"
                      : percentageUsed < 90
                        ? "critical"
                        : "critical"
                }
              />

              <InlineGrid columns="1fr auto" gap="200">
                <Text as="h2" variant="bodySm" tone="subdued" fontWeight="bold">
                  Current usage: {balanceUsed.toLocaleString()} {cappedCurrency}
                </Text>
                <Text as="h2" variant="bodySm" tone="subdued" fontWeight="bold">
                  Capped Amount: {(cappedAmount || 0).toLocaleString()}{" "}
                  {cappedCurrency}
                </Text>
              </InlineGrid>
            </BlockStack>
          </Box>
        )}

        <InlineStack align="start">
          {/* Show Update Capped Amount button if approved & nearing limit */}
          {billingApproved &&
            status == "active" &&
            chargeId &&
            isNinetyPercentUsed() && (
              <Button
                variant="primary"
                tone="critical"
                loading={updatingCappedAmount}
                onClick={() => handleManualUpdate()}
                disabled={updatingCappedAmount}
              >
                Update Capped Amount
              </Button>
            )}

          {!billingApproved && status !== "active" && (
            <Button
              variant="primary"
              onClick={startRoyaltyPlan}
              loading={creatingPlan}
              disabled={creatingPlan}
            >
              Start Royalty Plan
            </Button>
          )}
        </InlineStack>
      </BlockStack>
    </Banner>
  );
};

export default BillingBanner;
