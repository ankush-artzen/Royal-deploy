import {
  Card,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Spinner,
  Box,
} from "@shopify/polaris";

interface BalanceCardsProps {
  loadingTx: boolean;
  latestTransaction: any;
  shopCurrency: string | null;
  balanceUsedINR: number | null;
  balanceRemainingINR: number | null;
  cappedAmount: number | null;
  cappedCurrency: string | null;
  cappedAmountINR: number | null;
}

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

  return (
    <Card>
      <BlockStack gap="400">
        <Banner title="Royalty Amount Status" tone="info" />

        {loadingTx && (
          <BlockStack gap="200">
            <InlineStack align="start" blockAlign="center" gap="200">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <Box minWidth="360px" minHeight="100px" padding="400">
                    <InlineStack align="center" blockAlign="center">
                      <Spinner
                        accessibilityLabel={`Loading balance ${i}`}
                        size="large"
                      />
                    </InlineStack>
                  </Box>
                </Card>
              ))}
            </InlineStack>
          </BlockStack>
        )}

        {!loadingTx && (
          <BlockStack gap="200">
            <InlineStack align="start" blockAlign="center" gap="800">
              {/* Balance Used */}
              <Card>
                <Box minWidth="400px" minHeight="100px" padding="400">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Balance Used
                  </Text>
                  <Text as="p"tone="subdued">
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
                </Box>
              </Card>

       
              {/* Capped Amount */}
              <Card>
                <Box minWidth="400px" minHeight="100px" padding="400">
                  <Text as="h3" variant="headingXl" tone="subdued">
                    Capped Amount
                  </Text>
                <Text as="p" tone="subdued">
                    Maximum allowed spending limit for your subscription{" "}
                  </Text>
                  {renderBalanceCard(
                    "Capped Amount",
                    cappedAmount,
                    cappedCurrency,
                    cappedAmountINR,
                    "subdued",
                  )}
                </Box>
              </Card>
            </InlineStack>
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
};

export default BalanceCards;

