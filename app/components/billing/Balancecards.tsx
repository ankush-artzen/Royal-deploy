import {
  Card,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Spinner,
  Box,
} from "@shopify/polaris";

const BalanceCards = ({
  loadingTx,
  latestTransaction,
  shopCurrency,
  balanceUsedINR,
  balanceRemainingINR,
  cappedAmount,
  cappedCurrency,
  cappedAmountINR,
}: BalanceCardsProps) => {
  const renderBalanceCard = (
    title: string,
    value: number | null | undefined,
    currency: string | null | undefined,
    convertedValue: number | null,
    tone: "critical" | "success" | "subdued",
  ) => {
    if (!latestTransaction) {
      return (
        <Text as="p" tone="subdued">
          No Transaction available
        </Text>
      );
    }

    if (shopCurrency === "USD") {
      return (
        <Text as="h2" variant="headingMd" tone={tone} fontWeight="bold">
          {value?.toFixed(2)} {currency}
        </Text>
      );
    } else if (shopCurrency === "INR") {
      return (
        <>
          <Text as="h2" variant="headingMd" tone={tone} fontWeight="bold">
            {convertedValue?.toFixed(2)}
          </Text>
          {currency !== "INR" && (
            <Text as="h2" variant="headingSm" tone="subdued">
              ({value?.toFixed(2)} {currency})
            </Text>
          )}
        </>
      );
    } else {
      return (
        <Text as="p" tone="subdued">
          Currency not available
        </Text>
      );
    }
  };

  // Consistent card width for both loading and content states
  const cardWidth = "400px";

  return (
    <Card>
      <BlockStack gap="400">
        <Banner title="Royalty Amount Status" tone="info" />

        {loadingTx && (
          <InlineStack align="center" gap="400">
            {[1, 2].map((i) => (
              <Card key={i}>
                <Box width={cardWidth} minHeight="100px" padding="400">
                  <InlineStack align="center" blockAlign="center" gap="200">
                    <Spinner
                      accessibilityLabel={`Loading balance ${i}`}
                      size="large"
                    />
                    <Text as="p" tone="subdued">
                      Loading...
                    </Text>
                  </InlineStack>
                </Box>
              </Card>
            ))}
          </InlineStack>
        )}

        {!loadingTx && (
          <InlineStack align="center" gap="400">
            {/* Balance Used */}
            <Card background="bg-surface-info">
              <Box width={cardWidth} minHeight="100px" padding="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Balance Used
                  </Text>
                  <Text as="p" tone="subdued">
                    Total amount already utilized from your subscription capped
                    amount
                  </Text>
                  {renderBalanceCard(
                    "Balance Used",
                    latestTransaction?.balanceUsed,
                    latestTransaction?.currency,
                    balanceUsedINR,
                    latestTransaction?.balanceUsed &&
                      latestTransaction.balanceUsed > 0
                      ? "critical"
                      : "success",
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* Capped Amount */}
            <Card background="bg-surface-info">
              <Box width={cardWidth} minHeight="100px" padding="400">
                <BlockStack gap="200">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Capped Amount
                  </Text>
                  <Text as="p" tone="subdued">
                    Maximum allowed Capped amount spending limit for your plan
                  </Text>
                  {renderBalanceCard(
                    "Capped Amount",
                    cappedAmount,
                    cappedCurrency,
                    cappedAmountINR,
                    "subdued",
                  )}
                </BlockStack>
              </Box>
            </Card>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default BalanceCards;
