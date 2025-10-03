"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Text,
  Tooltip,
  Box,
  Card,
  InlineGrid,
  Icon,
  Banner,
  Badge,
  BlockStack,
  Spinner,
} from "@shopify/polaris";
import moment from "moment";

import { useRouter } from "next/navigation";
import CustomDataTable from "@/app/components/CustomDataTable";
import Pagination from "@/app/components/Pagination";
import {
  CashDollarIcon,
  TransactionIcon,
  InfoIcon,
} from "@shopify/polaris-icons";

import { useShopCurrency } from "@/app/hooks/shopCurrency";
import SummaryCards from "@/app/components/SummaryCards";

import { useBillingStatus } from "@/app/hooks/useBillingStatus";

export default function RoyaltyTransactionsPage() {
  const app = useAppBridge();
  const router = useRouter();

  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState<RoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);

  const { currency: shopCurrency, loading: currencyLoading } =
    useShopCurrency(shop);

  const [summary, setSummary] = useState<SummaryResponse>({
    totalTransactions: 0,
    totalRevenue: 0,
    avgRoyalty: 0,
  });
  const { approved: billingApproved, loading: billingLoading } =
    useBillingStatus();
  useEffect(() => {
    if (!billingLoading && billingApproved === false) {
      router.replace("/royalty/billing"); //send to billing
    }
  }, [billingLoading, billingApproved, router]);
  useEffect(() => {
    try {
      const shopFromConfig = (app as any)?.config?.shop;
      if (shopFromConfig) setShop(shopFromConfig);
      else setError("Unable to retrieve shop info. Please reload the app.");
    } catch {
      setError("Unable to retrieve shop info. Please reload the app.");
    }
  }, [app]);

  // Fetch transactions
  const fetchTransactions = useCallback(
    async (pageNumber: number = 1) => {
      if (!shop) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(
          `/api/royality/orders/transaction?shop=${shop}&page=${pageNumber}&limit=${limit}`,
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: ApiResponse = await res.json();
        setTransactions(data.transactions || []);
        setPage(data.page || 1);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError(err.message || "Failed to fetch transactions");
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [shop, limit],
  );

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    if (!shop) return;
    try {
      const res = await fetch(
        `/api/royality/orders/transaction/total?shop=${shop}`,
      );
      if (!res.ok) throw new Error(`Summary API error: ${res.status}`);
      const data: SummaryResponse = await res.json();
      setSummary(data);
    } catch (err: any) {
      console.error(err);
    }
  }, [shop]);

  // Fetch on shop or page change
  useEffect(() => {
    if (shop) {
      fetchTransactions(page);
      fetchSummary();
    }
  }, [shop, page, fetchTransactions, fetchSummary]);

  // Prepare rows
  const rows = transactions.map((tx) => [
    <BlockStack key={`${tx.id}-order`} gap="050">
      <Text as="span" fontWeight="bold">
        {tx.orderName}
      </Text>
      <Text as="span" tone="subdued" variant="bodySm">
        {tx.orderId}
      </Text>
    </BlockStack>,
    <Badge tone="info" size="small" key={`${tx.id}-charge`}>
      {tx.shopifyTransactionChargeId}
    </Badge>,
    <Box key={`${tx.id}-price`}>
      <Text as="span" fontWeight="bold">
        {currencyLoading
          ? "Loading..."
          : `${shopCurrency} ${tx.price.usd.toFixed(2)}`}
      </Text>
    </Box>,
    <Text as="span" key={`${tx.id}-royalty`} fontWeight="bold" tone="subdued">
      {tx.royaltyPercentage?.toFixed(1) ?? "-"}%
    </Text>,
    <Badge tone="success" size="small" key={`${tx.id}-designer`}>
      {tx.designerId || "-"}
    </Badge>,
    <Tooltip content={tx.description || "No description"} key={`${tx.id}-desc`}>
      <Box maxWidth="150px">
        <Text as="span" truncate>
          {tx.description || "-"}
        </Text>
      </Box>
    </Tooltip>,
    <Box key={`${tx.id}-created`}>
      <Text as="span" variant="bodySm" fontWeight="regular">
        {tx.createdAt ? moment(tx.createdAt).format("lll") : "-"}
      </Text>
    </Box>,
  ]);

  return (
    <Page
      title="Royalty Transactions"
      backAction={{ content: "Back", onAction: () => router.back() }}
      fullWidth
    >
      {/* Error Banner */}
      {error && (
        <div style={{ marginBottom: "16px" }}>
          <Banner tone="critical">
            <p>{error}</p>
          </Banner>
        </div>
      )}

      {/* Summary Cards */}
      <SummaryCards
        items={[
          {
            title: "Total Transactions",
            value: summary.totalTransactions.toLocaleString(),
            icon: TransactionIcon,
            loading,
          },
          {
            title: "Total Revenue",
            value: `${currencyLoading ? "…" : shopCurrency} ${summary.totalRevenue.toFixed(2)}`,
            icon: CashDollarIcon,
            tone: "success",
            loading,
          },
          {
            title: "Avg Royalty",
            value: `${summary.avgRoyalty.toFixed(1)}%`,
            icon: InfoIcon,
            tone: "success",
            loading,
          },
        ]}
      />
      {/* Data Table */}
      <CustomDataTable
        columns={[
          "Order Name",
          "Transaction Charge ID",
          "Royalty Price",
          "Royalty %",
          "Designer ID",
          "Description",
          "Created At",
        ]}
        rows={rows}
        loading={loading}
        error={error}
        emptyStateMessage="No transactions found"
      />

      {/* Pagination */}
      {!loading && !error && transactions.length > 0 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={() => page > 1 && setPage((prev) => prev - 1)}
          onNext={() => page < totalPages && setPage((prev) => prev + 1)}
        />
      )}
    </Page>
  );
}
