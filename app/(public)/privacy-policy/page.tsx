// ✅ This file is server-rendered (no "use client")

export default async function PrivacyPolicyPage() {
  const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || "Your Company";
  const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Your App";
  const SUPPORT_EMAIL =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  const COMPANY_ADDRESS =
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS || "Your Company Address";
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
          Privacy Policy
        </h1>
        <p className="text-xs text-gray-500 mb-4">Last Updated: {LAST_UPDATED}</p>

        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            This Privacy Policy describes how <strong>{COMPANY_NAME}</strong>{" "}
            collects, uses, and shares your personal information when you use
            our Shopify app, <strong>{APP_NAME}</strong>.
          </p>

          {/* --- 1. Information We Collect --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. Information We Collect
            </h2>
            <p>
              We collect the following information to provide and improve our
              services:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Personal Information You Provide:</strong> Your Shopify
                store URL, contact details, and information provided during
                installation.
              </li>
              <li>
                <strong>Information We Collect Automatically:</strong> When you
                install the App, we are granted access to certain Shopify data
                including:
                <ul className="list-disc list-inside ml-4 space-y-1 p-4">
                  <li>Shop Information: Store name, domain, contact email.</li>
                  <li>
                    Product Information: Product IDs, titles, variants, and
                    custom data (Designer ID, Product Expiry status).
                  </li>
                  <li>
                    Order Information: Order details, items purchased,
                    transaction data, and shipping/billing info for royalty
                    calculation.
                  </li>
                  <li>
                    Customer Information: Customer data necessary to process
                    orders for royalty purposes.
                  </li>
                </ul>
              </li>
              <li>
                Usage Data: Charge IDs, app usage metrics, and subscription
                billing details.
              </li>
            </ul>
          </div>

          {/* --- 2. How We Use Your Information --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Provide, operate, and maintain the App.</li>
              <li>Calculate and manage royalties based on fulfilled orders.</li>
              <li>
                Bill you through Shopify’s usage-based and capped billing
                systems.
              </li>
              <li>Communicate with you for support and updates.</li>
              <li>Improve the App’s functionality and performance.</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>
          </div>

          {/* --- 3. Data Sharing and Disclosure --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              3. Data Sharing and Disclosure
            </h2>
            <p>
              We do <strong>not sell</strong> your personal information. We may
              share your data with:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Service Providers:</strong> Trusted third parties
                (hosting, analytics) that help operate our app, bound by
                confidentiality.
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or
                valid legal requests.
              </li>
            </ul>
            <p className="mt-2">
              As our app uses webhooks to track order fulfillment, related data
              is processed automatically to trigger royalty calculations.
            </p>
          </div>

          {/* --- 4. Your Rights --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              4. Your Rights (GDPR & CCPA)
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Access & Portability:</strong> Request a copy of your
                data.
              </li>
              <li>
                <strong>Correction:</strong> Ask us to fix inaccurate data.
              </li>
              <li>
                <strong>Erasure (“Right to be Forgotten”):</strong> Request
                deletion of your data.
              </li>
              <li>
                <strong>Objection:</strong> Object to processing of your data.
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent anytime
                (where applicable).
              </li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </div>

          {/* --- 5. Data Retention --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              5. Data Retention
            </h2>
            <p>
              We retain personal information only as long as necessary to
              fulfill the purposes outlined above or as required by law. Upon
              uninstalling the App, data deletion is initiated within{" "}
              <strong>30–60 days</strong>.
            </p>
          </div>

          {/* --- 6. International Transfers --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              6. International Transfers
            </h2>
            <p>
              Your data may be processed in countries other than your own. We
              ensure appropriate safeguards and compliance with data protection
              laws.
            </p>
          </div>

          {/* --- 7. Contact --- */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              7. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                {SUPPORT_EMAIL}
              </a>
              <br />
              <strong>Address:</strong> {COMPANY_ADDRESS}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
