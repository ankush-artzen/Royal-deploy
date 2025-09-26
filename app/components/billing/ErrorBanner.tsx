import { Banner } from "@shopify/polaris";

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error }) => {
  return (
    <Banner title="Error" tone="critical">
      <p>{error}</p>
    </Banner>
  );
};

export default ErrorBanner;
