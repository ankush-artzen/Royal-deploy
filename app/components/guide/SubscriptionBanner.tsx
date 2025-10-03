import {
    Banner,
    Text,
    Box,
    InlineStack,
    BlockStack,
    List,
  } from "@shopify/polaris";
  
  interface SubscriptionBannerProps {
    hasSubscription: boolean | null;
    onEnable: () => void;
  }
  
  export default function SubscriptionBanner({ 
    hasSubscription, 
    onEnable 
  }: SubscriptionBannerProps) {
    if (hasSubscription === null) return null;
  
    return (
      <Banner
        title={
          !hasSubscription
            ? " Activate Royalty Program"
            : "Royalty Program Active!"
        }
        tone={!hasSubscription ? "info" : "info"}
      >
        {!hasSubscription ? (
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              To assign royalties to products and manage designer payouts, you need to activate your Royalty plan subscription.
            </Text>
  
            <Box borderRadius="200" padding="400">
              <BlockStack gap="200">
                <Text as="h4" variant="bodyMd" fontWeight="semibold">
                  Everything included in your Royalty Program:
                </Text>
                <List type="bullet">
                  <List.Item>Unlimited product royalty assignments</List.Item>
                  <List.Item>Automated designer payout calculations</List.Item>
                  <List.Item>Real-time transaction tracking</List.Item>
                  <List.Item>Advanced analytics & reporting dashboard</List.Item>
                  <List.Item>Secure payment processing</List.Item>
                </List>
              </BlockStack>
            </Box>
            
            <Box background="bg-surface-secondary" padding="300" borderRadius="200">
              <InlineStack align="start" gap="200">
                <Text as="span" variant="bodySm" tone="subdued">
                  ⚠️
                </Text>
                <BlockStack gap="100">
                  <Text as="p" variant="bodySm" tone="subdued">
                    <Text variant="bodySm" fontWeight="semibold" as="span">
                      Important:
                    </Text>{" "}
                    If you uninstall the app, you&apos;ll need to re-subscribe to enable royalties again.
                  </Text>
                  <Text as="p" variant="bodySm" tone="subdued">
                    Your subscription includes priority support and regular feature updates.
                  </Text>
                </BlockStack>
              </InlineStack>
            </Box>
          </BlockStack>
        ) : (
          <BlockStack gap="300">
            <Text as="p" variant="bodyMd">
              Your Royalty subscription is active and ready to use. Start assigning royalties to products and watch your designer collaborations thrive!
            </Text>
          </BlockStack>
        )}
      </Banner>
    );
  }