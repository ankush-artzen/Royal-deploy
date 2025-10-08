"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/redux/store";
import { fetchExchangeRate } from "@/app/redux/currencySlice";
import {
  Page,
  Card,
  Filters,
  InlineStack,
  Text,
  Button,
  Tooltip,
  Icon,
  Box,
  Badge,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";
import Pagination from "@/app/components/Pagination";
import { useBillingStatus } from "@/app/hooks/useBillingStatus";

import { RefreshIcon, ExportIcon, SearchIcon } from "@shopify/polaris-icons";
import { exportRoyaltyCSV } from "@/app/components/analytics/CSVExporter";
import CustomDataTable from "@/app/components/CustomDataTable";
import { FALLBACK_IMAGE } from "@/lib/config/royaltyConfig";

import { ProductCell } from "@/app/components/analytics/RoyaltyTable";

import { PAGE_SIZE } from "@/lib/constants/constants";

export default function ProductRoyaltyFromOrdersPage() {
  const app = useAppBridge();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { rates } = useSelector((state: RootState) => state.currency);

  const [shop, setShop] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponsesold | null>(null);

  const [queryValue, setQueryValue] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<any[]>([]);
  const [sortKey, setSortKey] =
    useState<keyof ApiResponsesold["products"][0]>("totalRoyalty");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { approved: billingApproved, loading: billingLoading } =
    useBillingStatus();
  useEffect(() => {
    if (!billingLoading && billingApproved === false) {
      router.replace("/royalty/billing"); //send to billing
    }
  }, [billingLoading, billingApproved, router]);

  const formatCurrency = useCallback(
    (value: number, currency?: string | null) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency ?? "USD",
        currencyDisplay: "code",
        maximumFractionDigits: 2,
      }).format(value),
    [],
  );

  const fetchData = useCallback(async () => {
    if (!shop) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        shop,
        query: queryValue,
        sortKey,
        sortDir,
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      const res = await fetch(`/api/royality/orders/sold?${params}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Request failed with ${res.status}`);
      }

      const data: ApiResponsesold = await res.json();
      setApiData(data);

      data.products.forEach((p) => {
        if (p.currency && p.currency !== "USD") {
          dispatch(fetchExchangeRate({ from: p.currency, to: "USD" }));
        }
        if (p.currency && p.currency !== "INR") {
          dispatch(fetchExchangeRate({ from: p.currency, to: "INR" }));
        }
      });
    } catch (e: any) {
      setError(e?.message || "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [shop, queryValue, sortKey, sortDir, page, dispatch]);

  useEffect(() => {
    if (!app) return;
    setShop(app?.config?.shop || null);
  }, [app]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleClearAll = useCallback(() => {
    setQueryValue("");
    setAppliedFilters([]);
    setSortKey("totalRoyalty");
    setSortDir("desc");
    setPage(1);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const totalPages = apiData?.totalPages || 1;
  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1));
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1));

  // Currency display component
  // Currency display component (always USD)
  const CurrencyDisplay = useCallback(
    ({ amount, currency }: { amount: number; currency: string }) => {
      // Get conversion rate to USD
      const rateToUSD = rates[`${currency}-USD`] || 1;
      const convertedUSD = amount * rateToUSD;

      return <Text as="span">{formatCurrency(convertedUSD, "USD")}</Text>;
    },
    [rates, formatCurrency],
  );

  // Columns
  const columns = [
    "Product / Variant",
    "Units Sold",
    "Total Sale",
    "Total Royalty",
    "Royalty %",
    "Royalty Last 30 Days",
  ];

  // Rows
  // Rows
  const rows = useMemo(
    () =>
      apiData?.products.map((product: LineItemStat) => {
        const currency = product.currency ?? "USD";

        return [
          <ProductCell product={product} key={`${product.productId}-cell`} />,
          <Text
            as="span"
            key={`${product.productId}-units`}
            tone="success"
            fontWeight="semibold"
          >
            {"    "}
            <Text alignment="center" as="span">
              {product.unitSold.toLocaleString()}
            </Text>
          </Text>,

          <Text
            as="span"
            key={`${product.productId}-sale`}
            fontWeight="bold"
            // tone="success"
          >
            <CurrencyDisplay amount={product.totalSale} currency={currency} />
          </Text>,
          <Text
            as="span"
            key={`${product.productId}-royalty`}
            fontWeight="bold"
          >
            <CurrencyDisplay
              amount={product.totalRoyalty}
              currency={currency}
            />
          </Text>,
          <Text
            as="span"
            key={`${product.productId}-percentage`}
            fontWeight="bold"
          >
            {(product.royaltyPercentage ?? 0).toFixed(2)}%
          </Text>,
          <Text
            as="span"
            key={`${product.productId}-last30`}
            fontWeight="bold"
            // tone="success"
          >
            <CurrencyDisplay
              amount={product.last30DaysRoyalty}
              currency={currency}
            />
          </Text>,
        ];
      }) || [],
    [apiData, CurrencyDisplay],
  );

  return (
    <Page
      title="Product Royalty Report"
      fullWidth
      primaryAction={
        <InlineStack gap="200">
          <Tooltip content="Export filtered rows to CSV">
            <Button
              icon={ExportIcon}
              onClick={() => apiData && exportRoyaltyCSV(apiData.products)}
              disabled={!apiData || loading}
            >
              Export
            </Button>
          </Tooltip>
          <Tooltip content="Reload data">
            <Button
              icon={RefreshIcon}
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              loading={isRefreshing}
            />
          </Tooltip>
        </InlineStack>
      }
      backAction={{ content: "Back", onAction: () => router.back() }}
    >
      <Card background="bg-fill">
        <style jsx global>{`
          .Polaris-Filters__Container {
            border-bottom: none !important;
          }
        `}</style>

        <Filters
          queryValue={queryValue}
          filters={[]}
          onQueryChange={setQueryValue}
          onQueryClear={() => setQueryValue("")}
          onClearAll={handleClearAll}
          queryPlaceholder="Search by title, product ID, variant…"
          appliedFilters={appliedFilters}
        />
        {/* <InlineStack gap="100" align="center">
            <Icon source={SearchIcon} tone="subdued" /> */}
        {/* <Text as="span" variant="bodySm">
              {apiData?.totalProducts || 0} result
              {apiData?.totalProducts === 1 ? "" : "s"}
            </Text> */}
        {/* </InlineStack> */}
      </Card>

      <CustomDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        error={error}
        emptyStateMessage="No matching products"
        emptyStateImage={FALLBACK_IMAGE}
      />

      {!loading && !error && apiData?.products.length ? (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      ) : null}
    </Page>
  );
}
