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
  latestTransaction?: {
    balanceUsed?: number;
    cappedAmount?: number;
    currency?: string;
  } | null;
  shopCurrency?: string;
  balanceUsedINR?: number;
  balanceRemainingINR?: number;
  cappedAmount?: number;
  cappedCurrency?: string;
  cappedAmountINR?: number;
}

const BalanceCards = ({
  loadingTx,
  latestTransaction,
  shopCurrency,
  cappedAmount,
  cappedCurrency,
}: BalanceCardsProps) => {
  /** === Layout constants === */
  const CARD_WIDTH = "350px";
  const CARD_MIN_HEIGHT = "60px";
  const CARD_PADDING = "100";
  const STACK_GAP_INNER = "1600"; // space between cards
  const CONTENT_GAP = "200";
  const LOADING_SPINNER_SIZE: "small" | "large" = "small";

  /** === Reusable balance renderer === */
  const renderBalanceCard = (
    value: number | null | undefined,
    currency: string | null | undefined,
    tone?: "critical" | "success" | "subdued"
  ) => {
    const displayValue = value ?? 0;
    const displayCurrency = currency ?? shopCurrency ?? "USD"; // fallback currency

    return (
      <Text as="h2" variant="headingMd" tone={tone ?? "subdued"} fontWeight="bold">
        {displayCurrency} {displayValue.toFixed(2)}
      </Text>
    );
  };

  /** === Loading card === */
  const renderLoadingCard = (title: string, description: string) => (
    <Card background="bg-surface-info">
      <Box width={CARD_WIDTH} minHeight={CARD_MIN_HEIGHT} padding={CARD_PADDING}>
        <BlockStack gap={CONTENT_GAP}>
          <Text as="h3" variant="headingMd" tone="subdued">
            {title}
          </Text>
          <Text as="p" tone="subdued">
            {description}
          </Text>
          <InlineStack align="center" gap={CONTENT_GAP}>
            <Spinner accessibilityLabel={`Loading ${title}`} size={LOADING_SPINNER_SIZE} />
            <Text as="p" tone="subdued">
              Loading...
            </Text>
          </InlineStack>
        </BlockStack>
      </Box>
    </Card>
  );

  /** === Render === */
  return (
    <Banner title="Royalty Amount Status" tone="info">
      <InlineStack align="center" gap={STACK_GAP_INNER}>
        {loadingTx ? (
          <>
            {renderLoadingCard(
              "Balance Used",
              "Total amount already utilized from your subscription capped amount"
            )}
            {renderLoadingCard(
              "Capped Amount",
              "Maximum allowed capped amount spending limit for your plan"
            )}
          </>
        ) : (
          <>
            {/* Balance Used */}
            <Card background="bg-surface-info">
              <Box width={CARD_WIDTH} minHeight={CARD_MIN_HEIGHT} padding={CARD_PADDING}>
                <BlockStack gap={CONTENT_GAP}>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    Balance Used
                  </Text>
                  <Text as="p" tone="subdued">
                    Total amount already utilized from your subscription capped amount
                  </Text>
                  {renderBalanceCard(
                    latestTransaction?.balanceUsed ?? 0,
                    latestTransaction?.currency ?? shopCurrency,
                    (latestTransaction?.balanceUsed ?? 0) > 0 ? "subdued" : "success"
                  )}
                </BlockStack>
              </Box>
            </Card>

            {/* Capped Amount */}
            <Card background="bg-surface-info">
              <Box width={CARD_WIDTH} minHeight={CARD_MIN_HEIGHT} padding={CARD_PADDING}>
                <BlockStack gap={CONTENT_GAP}>
                  <Text as="h3" variant="headingLg" fontWeight="bold">
                    Capped Amount
                  </Text>
                  <Text as="p" tone="subdued">
                    Maximum allowed capped amount spending limit for your plan
                  </Text>
                  {renderBalanceCard(
                    latestTransaction?.cappedAmount ?? cappedAmount ?? 0,
                    latestTransaction?.currency ?? cappedCurrency ?? shopCurrency,
                    "subdued"
                  )}
                </BlockStack>
              </Box>
            </Card>
          </>
        )}
      </InlineStack>
    </Banner>
  );
};

export default BalanceCards;
