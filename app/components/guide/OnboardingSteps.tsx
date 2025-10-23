import {
  Card,
  Text,
  Box,
  Divider,
  InlineStack,
  BlockStack,
  Badge,
  List,
} from "@shopify/polaris";

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  status: "completed" | "current" | "available" | "upcoming";
  icon?: string;
  action?: JSX.Element | null;
  features?: string[];
}

interface OnboardingStepsProps {
  steps: OnboardingStep[];
}

export default function OnboardingSteps({ steps }: OnboardingStepsProps) {
  const getStepIcon = (step: OnboardingStep) => {
    if (step.status === "completed") {
      return;
    }
    return (
      <Text as="span" variant="headingXl">
        {step.icon}
      </Text>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { tone: "success", label: "Completed" },
      current: { tone: "attention", label: "Action Required" },
      available: { tone: "info", label: "Ready to Start" },
      upcoming: { tone: "subdued", label: "Upcoming" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge>{config.label}</Badge>;
  };

  return (
    <Card>
      <BlockStack>
        {steps.map((step, index) => (
          <Box key={step.step}>
            <BlockStack gap="300">
              <InlineStack align="start" gap="300">
                <Box minWidth="40px">{getStepIcon(step)}</Box>

                <Box width="100%">
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="start">
                      <BlockStack gap="100">
                        <Text as="h3" variant="headingMd" fontWeight="semibold">
                          {step.title}
                        </Text>
                        <Text as="p" variant="bodyMd" tone="subdued">
                          {step.description}
                        </Text>
                      </BlockStack>
                      {getStatusBadge(step.status)}
                    </InlineStack>

                    {step.features && step.status === "current" && (
                      <Box
                        padding="300"
                        background="bg-surface-secondary"
                        borderRadius="200"
                      >
                        <List type="bullet">
                          {step.features.map((feature, featureIndex) => (
                            <List.Item key={featureIndex}>{feature}</List.Item>
                          ))}
                        </List>
                      </Box>
                    )}

                    {step.action && (
                      <Box paddingBlockStart="200">{step.action}</Box>
                    )}
                  </BlockStack>
                </Box>
              </InlineStack>
            </BlockStack>

            {index < steps.length - 1 && (
              <Box paddingBlockStart="400">
                <Divider />
              </Box>
            )}
          </Box>
        ))}
      </BlockStack>
    </Card>
  );
}
