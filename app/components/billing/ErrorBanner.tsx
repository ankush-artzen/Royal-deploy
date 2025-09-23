import { Banner } from "@shopify/polaris";

interface ErrorBannerProps {
    error: string | null;
  }

const ErrorBanner: React.FC<ErrorBannerProps> = ({ error }) => {
  return (
    <Banner title="Error" tone="critical">
      <p>{error}</p>
    </Banner>
  );
};

export default ErrorBanner;
