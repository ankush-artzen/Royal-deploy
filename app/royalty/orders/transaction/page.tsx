"use client";

import { useState, useEffect, useCallback } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Page, Text, Tooltip, Box } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import CustomDataTable from "@/app/components/CustomDataTable";
import Pagination from "@/app/components/Pagination";

interface RoyaltyTransaction {
  id: string;
  shop: string;
  shopifyTransactionChargeId: string;
  orderId: string;
  orderName: string;
  productId?: string;
  description: string;
  price: {
    storeprice: number;
    storeCurrency: string;
    usd: number;
  };
  currency: string; // USD
  royaltyPercentage: number;
  designerId: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  transactions: RoyaltyTransaction[];
  totalCount: number;
  page: number;
  totalPages: number;
}

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

  // Get shop info once
  useEffect(() => {
    try {
      const shopFromConfig = (app as any)?.config?.shop;
      if (shopFromConfig) setShop(shopFromConfig);
      else setError("Unable to retrieve shop info. Please reload the app.");
    } catch {
      setError("Unable to retrieve shop info. Please reload the app.");
    }
  }, [app]);

  // Fetch transactions with stable reference
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

  // Fetch transactions when shop or page changes
  useEffect(() => {
    if (shop) fetchTransactions(page);
  }, [shop, page, fetchTransactions]);

  // Prepare rows with proper keys
  const rows = transactions.map((tx) => [
    <Text as="span" fontWeight="bold" key={`${tx.id}-order`}>
      {tx.orderName || tx.orderId}
    </Text>,
    <Text as="span" key={`${tx.id}-charge`}>
      {tx.shopifyTransactionChargeId}
    </Text>,
    <Text as="h2" variant="headingMd" tone="subdued" key={`${tx.id}-price`}>
      {tx.price.usd.toFixed(2)} {tx.currency}{" "}
      {/* {tx.price.storeCurrency === "INR" && (
        <>
          ({tx.price.storeprice.toFixed(2)} {tx.price.storeCurrency})
        </>
      )} */}
    </Text>,

    //    <Text as="h2" variant="headingMd" tone="subdued" key={`${tx.id}-priceusd`}>
    //    {tx.price.usd.toFixed(2)} {tx.currency}
    //  </Text>,
    <Text as="h2" variant="headingMd" tone="success" key={`${tx.id}-royalty`}>
      {tx.royaltyPercentage?.toFixed(2) ?? "-"}%
    </Text>,
    <Text as="span" key={`${tx.id}-designer`}>
      {tx.designerId || "-"}
    </Text>,
    <Tooltip content={tx.description || "No description"} key={`${tx.id}-desc`}>
      <Box maxWidth="120px">
        <Text as="span" truncate>
          {tx.description ? tx.description.slice(0, 12) : "-"}
        </Text>
      </Box>
    </Tooltip>,
    <Text as="span" key={`${tx.id}-created`}>
      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : "-"}
    </Text>,
  ]);

  return (
    <Page
      title="Royalty Transactions"
      backAction={{ content: "Back", onAction: () => router.back() }}
    >
      <CustomDataTable
        columns={[
          "Order Name",
          "Transaction Charge ID",
          "Royalty Price",
          // "Royalty Price(USD)",
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
