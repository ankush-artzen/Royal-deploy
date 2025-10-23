"use client";

import { useEffect, useState } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  Banner,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { useAppBridge } from "@shopify/app-bridge-react";
import ActionCard from "@/app/components/ActionCard";
import { useSelector } from "react-redux";
import { RootState } from "@/app/redux/store";
import { useBillingStatus } from "@/app/hooks/useBillingStatus";

export default function HomeClient() {
  const router = useRouter();
  const app = useAppBridge();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [productCount, setProductCount] = useState<number>(0);
  const [totalRoyaltyAmount, setTotalRoyaltyAmount] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [shopCurrency, setShopCurrency] = useState<string>("USD");
  const [displayedRoyalties, setDisplayedRoyalties] = useState<string>("");

  const currencyState = useSelector((state: RootState) => state.currency);
  const { approved: billingApproved, loading: billingLoading } =
    useBillingStatus();

  // Redirect to billing if not approved
  useEffect(() => {
    if (!billingLoading && billingApproved === false) {
      router.replace("/royalty/billing");
    }
  }, [billingLoading, billingApproved, router]);

  // Get shop from App Bridge
  useEffect(() => {
    const shopFromConfig = (app as any)?.config?.shop;
    if (shopFromConfig) {
      setShop(shopFromConfig);
    } else {
      setError("Unable to retrieve shop info from App Bridge config");
    }
  }, [app]);

  // Fetch all stats
  useEffect(() => {
    if (!shop) return;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const resCounts = await fetch(`/api/royality/counts?shop=${shop}`);
        const dataCounts = await resCounts.json();
        if (!resCounts.ok) throw new Error(dataCounts?.error || "Failed fetching counts");

        setShopCurrency(dataCounts.shopCurrency || "USD");
        setProductCount(dataCounts.totalProducts || 0);

        try {
          const resTotals = await fetch(`/api/royality/orders/counts?shop=${shop}`);
          const dataTotals = await resTotals.json();

          if (!resTotals.ok) throw new Error(dataTotals?.error || "Failed fetching royalty totals");

          setTotalRoyaltyAmount(dataTotals.totalConvertedRoyalty || 0);
          setTotalOrders(dataTotals.totalOrders || 0);
        } catch {
          setTotalRoyaltyAmount(0);
          setTotalOrders(0);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch data");
        setProductCount(0);
        setShopCurrency("USD");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [shop]);

  // Update displayed royalties
  useEffect(() => {
    if (loading) {
      setDisplayedRoyalties("Loading...");
      return;
    }
    setDisplayedRoyalties(`USD ${totalRoyaltyAmount.toFixed(2)}`);
  }, [totalRoyaltyAmount, loading]);

  return (
    <Page title="Royalty App Dashboard" subtitle="Enhance your sale" fullWidth>
      <Layout>
        {/* Hero Section */}
        <Layout.Section>
          <Banner title="Welcome to Royalty App" tone="info">
            Effortlessly manage products, assign royalties, and track performance
          </Banner>
        </Layout.Section>

        {/* Error Banner */}
        {error && (
          <Layout.Section>
            <Banner title="Error" tone="critical">
              <p>{error}</p>
            </Banner>
          </Layout.Section>
        )}

        {/* Quick Actions */}
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h3" variant="headingLg" tone="subdued" fontWeight="semibold">
                Quick Actions
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                }}
              >
                <ActionCard
                  title="Add Products"
                  description="Create new products with royalty settings"
                  action={() => router.push("/royalty/create")}
                  buttonText="Add Product"
                />
                <ActionCard
                  title="View Analytics"
                  description="See detailed royalty reports and analytics"
                  action={() => router.push("/royalty/orders/analytics")}
                  buttonText="View Reports"
                />
                <ActionCard
                  title="Royalties Transactions"
                  description="View all royalty products transactions"
                  action={() => router.push("/royalty/orders/transaction")}
                  buttonText="Manage Transactions"
                />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* Quick Insights */}
        <Layout.Section>
          <Card padding="400">
            <BlockStack gap="400">
              <Text as="h2" fontWeight="bold" tone="subdued" variant="headingLg">
                Quick Insights
              </Text>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "20px",
                }}
              >
                <ActionCard title="Royalty Products" value={productCount} loading={loading} />
                <ActionCard
                  title="Total Royalties"
                  value={displayedRoyalties}
                  loading={loading || currencyState.loading}
                />
                <ActionCard title="Total Orders" value={totalOrders} loading={loading} />
              </div>
            </BlockStack>
          </Card>
        </Layout.Section>

        {/* About Us */}
        <Layout.Section>
          <div style={{ marginBottom: "10px" }}>
            <Banner title="About us" tone="info">
              <BlockStack gap="200" align="center">
                <Text as="h2" variant="bodyLg" tone="subdued">
                  A royalty management system that tracks and calculates payments owed to creators.
                  Collect sales data, aggregate earnings, and ensure timely distribution with ease.
                </Text>
                <InlineStack>
                  <Button onClick={() => router.push("/royalty/create")} variant="primary">
                    Get Started
                  </Button>
                </InlineStack>
              </BlockStack>
            </Banner>
          </div>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
