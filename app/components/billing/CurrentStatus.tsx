import {
  Card,
  Banner,
  Text,
  BlockStack,
  InlineStack,
  Divider,
  Badge,
  Spinner,
  Box,
} from "@shopify/polaris";

const StatusCard = ({ billingLoading, billingApproved }: StatusCardProps) => {
  return (
    <div style={{ marginBottom: "10px" }}>
      <Card>
        <BlockStack gap="400">
          <InlineStack align="space-between" blockAlign="center">
            <Banner title="Current Status" tone="info" />

            {billingLoading ? (
              <Spinner accessibilityLabel="Checking billing" size="small" />
            ) : (
              <Badge
                tone={billingApproved ? "success" : "critical"}
                size="large"
              >
                {billingApproved ? "Active" : "Inactive"}
              </Badge>
            )}
          </InlineStack>
          <Divider />
          <Text as="p">
            {billingApproved
              ? "Your royalty billing is currently active."
              : "Your royalty billing is not active. Please activate to continue."}
          </Text>
        </BlockStack>
      </Card>
    </div>
  );
};

export default StatusCard;
