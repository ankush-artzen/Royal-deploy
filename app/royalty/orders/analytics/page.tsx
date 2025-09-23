"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/components/redux/store";
import { fetchExchangeRate } from "@/app/components/redux/currencySlice";
import {
  Page,
  Card,
  Filters,
  InlineStack,
  Text,
  Button,
  Tooltip,
  Icon,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useRouter } from "next/navigation";
import Pagination from "@/app/components/Pagination";

import { RefreshIcon, ExportIcon, SearchIcon } from "@shopify/polaris-icons";
import { exportRoyaltyCSV } from "@/app/components/analytics/CSVExporter";
import CustomDataTable from "@/app/components/CustomDataTable";

import type {
  ApiResponse,
  LineItemStat,
} from "@/app/components/analytics/RoyaltyTable";
import { ProductCell } from "@/app/components/analytics/RoyaltyTable";

const PAGE_SIZE = 10;
const FALLBACK_IMAGE =
  "https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png";

export default function ProductRoyaltyFromOrdersPage() {
  const app = useAppBridge();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const { rates } = useSelector((state: RootState) => state.currency);

  const [shop, setShop] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);

  const [queryValue, setQueryValue] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<any[]>([]);
  const [sortKey, setSortKey] =
    useState<keyof ApiResponse["products"][0]>("totalRoyalty");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [storeCurrency, setStoreCurrency] = useState<string>("USD"); // fallback

  const formatCurrency = useCallback(
    (value: number, currency?: string | null) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency ?? "USD",
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

      const data: ApiResponse = await res.json();
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

  //     return (
  //       <>
  //         <Text as="span">{formatCurrency(amount, currency)}</Text>
  //         <Text as="span" tone="subdued">
  //           {` (${formatCurrency(convertedUSD, "USD")})`}
  //         </Text>
  //       </>
  //     );
  //   },
  //   [rates, formatCurrency],
  // );

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
  const rows = useMemo(
    () =>
      apiData?.products.map((product: LineItemStat) => {
        const currency = product.currency ?? "USD";

        return [
          <ProductCell product={product} key={`${product.productId}-cell`} />,
          <div
            key={`${product.productId}-units`}
            style={{ textAlign: "center", minWidth: "60px" }}
          >
            {product.unitSold.toLocaleString()}
          </div>,
          <CurrencyDisplay
            key={`${product.productId}-sale`}
            amount={product.totalSale}
            currency={currency}
          />,
          <CurrencyDisplay
            key={`${product.productId}-royalty`}
            amount={product.totalRoyalty}
            currency={currency}
          />,
          <span key={`${product.productId}-percentage`}>
            {(product.royaltyPercentage ?? 0).toFixed(2)}%
          </span>,
          <CurrencyDisplay
            key={`${product.productId}-last30`}
            amount={product.last30DaysRoyalty}
            currency={currency}
          />,
        ];
      }) || [],
    [apiData, CurrencyDisplay],
  );

  return (
    <Page
      title="Product Royalty Report"
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
      <Card>
        <Filters
          queryValue={queryValue}
          filters={[]}
          onQueryChange={setQueryValue}
          onQueryClear={() => setQueryValue("")}
          onClearAll={handleClearAll}
          queryPlaceholder="Search by title, product ID, variant…"
          appliedFilters={appliedFilters}
        >
          <InlineStack gap="100" align="center">
            <Icon source={SearchIcon} tone="subdued" />
            <Text as="span" variant="bodySm">
              {apiData?.totalProducts || 0} result
              {apiData?.totalProducts === 1 ? "" : "s"}
            </Text>
          </InlineStack>
        </Filters>
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
