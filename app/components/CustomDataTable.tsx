"use client";

import { FC } from "react";
import { Card, DataTable, Spinner, EmptyState, Text, Box} from "@shopify/polaris";
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
  emptyStateImage = EMPTY_STATE_IMAGE,
}) => {
  return (
    <Card>
      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", padding: "32px" }}
        >
          <Spinner accessibilityLabel="Loading data" size="large" />
        </div>
      ) : error ? (
        <div style={{ padding: "32px", color: "red" }}>{error}</div>
      ) : rows.length === 0 ? (
        <Box paddingBlockEnd="400">

        <EmptyState heading={emptyStateMessage} image={emptyStateImage}>
          <p>{emptyStateMessage}</p>
        </EmptyState>
        </Box>
      ) : (
        <div className="custom-table-wrapper" style={{ overflowX: "auto" }}>
          <style jsx global>{`
            .Polaris-Filters__Container {
              border-bottom: none !important;
            }

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
              <div
                key={index}
                style={{
                  width: "100%",
                  textAlign: index === 0 ? "left" : "center",
                }}
              >
                <Text as="h1" variant="headingMd">
                  {column}
                </Text>
              </div>
            ))}
            rows={rows.map((row) =>
              row.map((cell, index) => (
                <div
                  key={index}
                  style={{
                    width: "100%",
                    textAlign: index === 0 ? "left" : "center",
                  }}
                >
                  {cell}
                </div>
              )),
            )}
            hasZebraStripingOnData
          />
        </div>
      )}
    </Card>
  );
};

export default CustomDataTable;
