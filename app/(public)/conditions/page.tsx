export default async function TermsAndConditionsPage() {
  const companyName =
    process.env.NEXT_PUBLIC_COMPANY_NAME || "Your Company Name";
  const appName = process.env.NEXT_PUBLIC_APP_NAME || "Your App";
  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  const companyLocation =
    process.env.NEXT_PUBLIC_COMPANY_LOCATION || "Your Country/State";
  const lastUpdated =
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
          Terms & Conditions
        </h1>
        <p className="text-xs text-gray-500 mb-4">
          Last Updated: {lastUpdated}
        </p>

        <section className="space-y-4 text-sm text-gray-700 leading-relaxed">
          <p>
            Please read these Terms & Conditions carefully before using the{" "}
            <strong>{appName}</strong> Shopify app operated by{" "}
            <strong>{companyName}</strong>.
          </p>
          <p>
            Your access to and use of the App is conditioned on your acceptance
            of and compliance with these Terms.
          </p>

          {/* Section 1 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              1. The App Service
            </h2>
            <p>
              <strong>{appName}</strong> is a royalty management app that allows
              merchants to assign designers to products, track product expiry,
              and calculate royalties based on fulfilled orders. The App uses
              Shopify’s Billing API to charge merchants on a usage-based model
              with a capped amount.
            </p>
          </div>

          {/* Section 2 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              2. Account and Shopify Data
            </h2>
            <p>
              By installing the App, you grant us permission to access your
              Shopify store data as described in our Privacy Policy. You are
              responsible for ensuring the accuracy of data you provide (such as
              Designer IDs) and that you have the right to share your store and
              customer data with us.
            </p>
          </div>

          {/* Section 3 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              3. Subscription and Billing
            </h2>
            <ul className="list-disc list-inside space-y-1">
              <li>
                The App uses a subscription model with usage-based charges. You
                will be billed by Shopify according to your selected plan.
              </li>
              <li>
                The “capped amount” represents the maximum you can be charged
                per billing cycle, regardless of usage.
              </li>
              <li>
                You can cancel your subscription at any time from your Shopify
                admin. Cancellation stops future charges but does not entitle
                you to a refund for the current billing period.
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              4. User Obligations
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Use the App for any illegal or unauthorized purpose.</li>
              <li>Enter false or misleading information in the App.</li>
              <li>
                Reverse engineer, copy, or duplicate the App’s functionality in
                any way.
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              5. Intellectual Property
            </h2>
            <p>
              We retain all intellectual property rights in the App. You retain
              ownership of all data you input into the App.
            </p>
          </div>

          {/* Section 6 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              6. Disclaimer of Warranties
            </h2>
            <p>
              The App is provided “AS IS” and “AS AVAILABLE” without any
              warranties, express or implied. We do not guarantee uninterrupted
              or error-free operation or completely accurate royalty
              calculations.
            </p>
          </div>

          {/* Section 7 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              7. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law,{" "}
              <strong>{companyName}</strong> shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              or any loss of profits or data arising from your use of the App.
            </p>
          </div>

          {/* Section 8 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              8. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the App immediately if
              you breach these Terms. Upon termination, your right to use the
              App will cease immediately.
            </p>
          </div>

          {/* Section 9 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              9. Governing Law
            </h2>
            <p>
              These Terms shall be governed by the laws of{" "}
              <strong>{companyLocation}</strong>, without regard to its conflict
              of law provisions.
            </p>
          </div>

          {/* Section 10 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              10. Changes to Terms
            </h2>
            <p>
              We reserve the right to modify these Terms at any time. Any
              updates will be posted within the App or communicated via email.
            </p>
          </div>

          {/* Section 11 */}
          <div className="border-t border-gray-200 pt-3">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              11. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a
                href={`mailto:${supportEmail}`}
                className="text-blue-600 hover:text-blue-800 underline transition-colors"
              >
                {supportEmail}
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
