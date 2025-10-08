"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Page,
  Card,
  Button,
  Text,
  Box,
  Spinner,
  InlineStack,
  BlockStack,
  Badge,
  Layout,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  PlayCircleIcon,
  ChartVerticalFilledIcon,
  TransactionIcon,
} from "@shopify/polaris-icons";

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  status: "completed" | "current" | "available" | "upcoming";
  icon?: string;
  action?: JSX.Element | null;
  features?: string[];
}
import SubscriptionBanner from "@/app/components/guide/SubscriptionBanner";
import ProgressOverview from "@/app/components/guide/ProgressOverview";
import OnboardingSteps from "@/app/components/guide/OnboardingSteps";

export default function RoyaltyOnboarding() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) setShop(shopFromConfig);
  }, [app]);

  const checkSubscription = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch(
        `/api/charges/status?shop=${encodeURIComponent(shop!)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch subscription status");
      const data = await res.json();
      setHasSubscription(Boolean(data.active));
    } catch (err) {
      console.error("checkSubscription error:", err);
      setHasSubscription(false);
    } finally {
      setCheckingStatus(false);
    }
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    checkSubscription();
  }, [shop, checkSubscription]);

  const onboardingSteps: OnboardingStep[] = [
    {
      step: 1,
      title: "First you to assign royalty,Enable Royalty billing ",
      description:
        "Firstly , Activate your subscription to unlock the full royalty management system",
      status: hasSubscription ? "completed" : "current",
      action: !hasSubscription ? (
        <InlineStack>
          <Button variant="primary" url="/royalty/billing" external={false}>
            Enable Royalty billing
          </Button>
        </InlineStack>
      ) : (
        <InlineStack gap="200" align="start">
          <Badge tone="success" progress="complete">
            Active Subscription
          </Badge>
        </InlineStack>
      ),
    },
    {
      step: 2,
      title: "After that you can assign Products & Royalties",
      description:
        "Connect products with designers and set royalty percentages for each collaboration",
      status: hasSubscription ? "available" : "upcoming",
      features: [
        "Bulk product assignment",
        "Flexible percentage rates",
        "Designer collaboration management",
        "Automatic payout scheduling",
      ],
      action: hasSubscription ? (
        <Button
          variant="secondary"
          onClick={() => router.push("/royalty/create")}
          icon={PlayCircleIcon}
        >
          Start Assigning Royalties
        </Button>
      ) : null,
    },
    {
      step: 3,
      title: "Place and Track Orders & Transactions",
      description:
        "Monitor all royalty transactions and designer payouts in real-time dashboard",
      status: hasSubscription ? "upcoming" : "upcoming",
      features: [
        "Real-time sales tracking",
        "Transaction history",
        "Payout status monitoring",
        "Dispute resolution tools",
      ],
      action: hasSubscription ? (
        <Button
          variant="secondary"
          onClick={() => router.push("/royalty/orders/transaction")}
          icon={TransactionIcon}
        >
          View Transaction Dashboard
        </Button>
      ) : null,
    },
    {
      step: 4,
      title: "Insights & Analytics",
      description:
        "Analyze royalty performance and designer collaboration metrics with detailed reports",
      status: "upcoming",
      features: [
        "Performance analytics",
        "Revenue reports",
        "Designer performance insights",
        "Exportable data reports",
      ],
      action: hasSubscription ? (
        <Button
          variant="secondary"
          icon={ChartVerticalFilledIcon}
          onClick={() => router.push("/royalty/orders/analytics")}
        >
          Explore Analytics
        </Button>
      ) : null,
    },
  ];

  const completedSteps: number = hasSubscription ? 1 : 0;
  const totalSteps: number = onboardingSteps.length;

  if (checkingStatus) {
    return (
      <Page
        backAction={{ content: "Home", onAction: () => router.push("/") }}
        title="Royalty Program Setup"
        subtitle="Complete these steps to start managing designer royalties and grow your collaborative business"
      >
        <Layout>
          <Layout.Section>
            <Card>
              <Box padding="400">
                <InlineStack align="center" blockAlign="center" gap="200">
                  <Spinner
                    accessibilityLabel="Checking Royalty subscription"
                    size="large"
                  />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd" fontWeight="medium">
                      Checking your subscription status...
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">
                      Setting up your royalty program
                    </Text>
                  </BlockStack>
                </InlineStack>
              </Box>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page
      backAction={{ content: "Home", onAction: () => router.push("/") }}
      fullWidth
      title="Royalty Program Setup"
      subtitle="Complete these steps to start managing designer royalties and grow your collaborative business"
    >
      <Layout>
        
        <Layout.Section>
          <BlockStack gap="400">
            <SubscriptionBanner
              hasSubscription={hasSubscription}
              onEnable={checkSubscription}
            />

            <ProgressOverview
              completedSteps={completedSteps}
              totalSteps={totalSteps}
              hasSubscription={hasSubscription}
            />

            <OnboardingSteps steps={onboardingSteps} />

            {/* Help Section */}
            <div style={{ marginBottom: "10px" }}>

            <Card>

              <BlockStack gap="200">
                <Text as="h3" variant="headingMd" fontWeight="semibold">
                  Need Help Getting Started?
                </Text>
                <Text as="p" variant="bodyMd" tone="subdued">
                  Our support team is here to help you set up your royalty
                  program and answer any questions.
                </Text>
                <InlineStack gap="200">
                  <Button variant="plain" onClick={() => router.push("#")}>
                    View Documentation
                  </Button>
                  <Button variant="plain" onClick={() => router.push("#")}>
                    Contact Support
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
            </div>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
