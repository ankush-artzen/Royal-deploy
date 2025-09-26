"use client";

import { FC } from "react";
import { Card, DataTable, Spinner, EmptyState, Text } from "@shopify/polaris";
import { EMPTY_STATE_IMAGE } from "@/lib/config/royaltyConfig";

interface CustomDataTableProps {
  columns: string[];
  rows: any[][];
  loading?: boolean;
  error?: string | null;
  emptyStateMessage?: string;
  emptyStateImage?: string;
}

const CustomDataTable: FC<CustomDataTableProps> = ({
  columns,
  rows,
  loading = false,
  error = null,
  emptyStateMessage = "No records found",
  emptyStateImage = EMPTY_STATE_IMAGE, // ✅ use config default
}) => {
  return (
    <Card>
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px" }}>
          <Spinner accessibilityLabel="Loading data" size="large" />
        </div>
      ) : error ? (
        <div style={{ padding: "32px", color: "red" }}>{error}</div>
      ) : rows.length === 0 ? (
        <EmptyState heading={emptyStateMessage} image={emptyStateImage}>
          <p>{emptyStateMessage}</p>
        </EmptyState>
      ) : (
        <div className="custom-table-wrapper" style={{ overflowX: "auto" }}>
          <style jsx global>{`
            .custom-table-wrapper .Polaris-DataTable__Navigation {
              display: none !important;
            }
            .Polaris-DataTable__Cell {
              vertical-align: middle !important;
            }
          `}</style>

          <DataTable
            columnContentTypes={columns.map(() => "text")}
            headings={columns.map((column, index) => (
              <Text key={index} as="h1" variant="headingMd">
                {column}
              </Text>
            ))}
            rows={rows}
            hasZebraStripingOnData
          />
        </div>
      )}
    </Card>
  );
};

export default CustomDataTable;
