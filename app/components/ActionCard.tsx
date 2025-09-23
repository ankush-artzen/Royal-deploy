"use client";

import { Card, BlockStack, InlineStack, Text, Spinner, Button, Icon, Box } from "@shopify/polaris";

interface ActionCardProps {
  title: string;
  description?: string;
  icon?: any;
  action?: () => void;
  buttonText?: string;
  value?: string | number;
  loading?: boolean;
}

export default function ActionCard({
  title,
  description,
  icon,
  action,
  buttonText,
  value,
  loading,
}: ActionCardProps) {
  return (
    <Card padding="400" background="bg-surface">
      <BlockStack gap="400" align="center">
        {icon && (
          <Box
            padding="300"
            background="bg-fill-secondary"
            borderRadius="200"
            width="min-content"
          >
            <Icon source={icon} tone="base" />
          </Box>
        )}

        <BlockStack gap="200" align="center">
          <Text
            as="h3"
            variant="headingLg"
            fontWeight="semibold"
            alignment="center"
            tone="magic"
          >
            {title}
          </Text>

          {description ? (
            <Text
              as="p"
              tone="magic-subdued"
              variant="bodyMd"
              alignment="center"
            >
              {description}
            </Text>
          ) : loading ? (
            <InlineStack align="center">
              <Spinner />
            </InlineStack>
          ) : (
            <Text
              variant="heading2xl"
              as="h3"
              fontWeight="bold"
              alignment="center"
            >
              {value}
            </Text>
          )}
        </BlockStack>

        {buttonText && action && (
          <InlineStack align="center">
            <Button onClick={action} variant="secondary" size="slim">
              {buttonText}
            </Button>
          </InlineStack>
        )}
      </BlockStack>
    </Card>
  );
}
