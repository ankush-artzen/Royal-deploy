"use client";

import { Card, InlineGrid, Spinner, Icon, Text } from "@shopify/polaris";

type SummaryCardItem = {
  title: string;
  value: string | number;
  icon: any;
  tone?: "success" | "critical" | "subdued" | "base";
  loading?: boolean;
};

type SummaryCardsProps = {
  items: SummaryCardItem[];
};

export default function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <InlineGrid columns={{ xs: "1fr", sm: "1fr 1fr 1fr" }} gap="400">
        {items.map((item, index) => (
          <Card key={index} padding="400">
            <div style={{ textAlign: "center" }}>
              {item.loading ? (
                <Spinner
                  accessibilityLabel={`Loading ${item.title}`}
                  size="large"
                />
              ) : (
                <>
                  <Icon source={item.icon} tone={item.tone || "base"} />
                  <Text
                    as="h3"
                    variant="headingMd"
                    fontWeight="bold"
                    tone={item.tone || "base"}
                  >
                    {item.value}
                  </Text>
                  <Text as="p" tone="subdued" fontWeight="bold">
                    {item.title}
                  </Text>
                </>
              )}
            </div>
          </Card>
        ))}
      </InlineGrid>
    </div>
  );
}
