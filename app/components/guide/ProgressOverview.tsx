import {
    Card,
    Text,
    Box,
    InlineStack,
    BlockStack,
    ProgressBar,
  } from "@shopify/polaris";
  
  interface ProgressOverviewProps {
    completedSteps: number;
    totalSteps: number;
    hasSubscription: boolean | null;
  }
  
  export default function ProgressOverview({ 
    completedSteps, 
    totalSteps, 
    hasSubscription 
  }: ProgressOverviewProps) {
    const progress = Math.round((completedSteps / totalSteps) * 100);
  
    if (hasSubscription === false) {
      return (
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <BlockStack gap="100">
                <Text as="h2" variant="headingLg">
                  Setup Progress
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Complete all steps to fully activate your royalty program
                </Text>
              </BlockStack>
            </InlineStack>
  
            <BlockStack gap="100">
              <ProgressBar
                progress={progress}
                size="medium"
                tone={
                  progress === 100
                    ? "success"
                    : progress >= 50
                      ? "highlight"
                      : "critical"
                }
              />
              <InlineStack align="space-between">
                <Text as="span" variant="bodySm" tone="subdued">
                  {completedSteps} of {totalSteps} steps completed
                </Text>
                <Text as="span" variant="bodySm" tone="subdued">
                  {progress === 100 ? " All done!" : "Keep going!"}
                </Text>
              </InlineStack>
            </BlockStack>
          </BlockStack>
        </Card>
      );
    }
  
    return null;
  }