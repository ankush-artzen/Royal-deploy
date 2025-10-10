
export default async function SupportPage() {
  const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Your Company";
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Your App";
  const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  const LAST_UPDATED =
    process.env.NEXT_PUBLIC_LAST_UPDATED_DATE ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  return (
    <main className="min-h-screen bg-gray-50 py-4 px-3">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Support & Contact
        </h1>
        <p className="text-xs text-gray-500 mb-4">Last Updated: {LAST_UPDATED}</p>

        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            Need help with <strong>{APP_NAME}</strong>? Our support team at{" "}
            <strong>{COMPANY_NAME}</strong> is here to assist you with
            installation, billing, troubleshooting, or setup questions.
          </p>

          {/* Contact Info */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Contact Us
            </h2>
            <p className="mb-1">
              You can reach our support team through the following channels:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-blue-600 hover:text-blue-800 underline transition-colors"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <strong>Support Hours:</strong> Monday – Friday, 9:00 AM – 6:00 PM (IST)
              </li>
              <li>
                <strong>Response Time:</strong> Within 24 hours
              </li>
            </ul>
          </div>

          {/* Common Issues */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Common Issues
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Billing not activating?</strong> Ensure your subscription is approved and
                active in your Shopify Admin under “App Subscriptions.”
              </li>
              <li>
                <strong>Data not syncing?</strong> Check your webhook setup and confirm necessary
                API permissions are granted during app installation.
              </li>
              <li>
                <strong>Integration assistance?</strong> Contact us for help with setup,
                customization, or data troubleshooting.
              </li>
            </ul>
          </div>

          {/* Feedback & Feature Requests */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Feedback & Feature Requests
            </h2>
            <p>
              We’re always improving <strong>{APP_NAME}</strong>. Share your ideas, feature
              requests, or suggestions with us — your feedback directly helps shape future updates.
            </p>
            <p className="mt-2">
              Send us your thoughts anytime at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>.
            </p>
          </div>

          {/* Additional Resources */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Additional Resources
            </h2>
            <p>
              For details about how we handle your data and terms of usage, please review our{" "}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="/terms-and-conditions"
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                Terms & Conditions
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
