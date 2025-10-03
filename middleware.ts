import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    "/((?!api/auth|api/auth/callback|api/webhooks|api/proxy_route|api/gdpr|_next|_proxy|_auth|_static|_vercel|[\\w-]+\\.\\w+).*)",
  ],
};

// Public routes (no billing required)
const PUBLIC_ROUTES = [
  "/royalty/billing",
  "/api/charges/status",
  "/api/billing",
  "/api/charges/billing",
  "/api/royality/callback",
];

// Protected routes (require billing)
const PROTECTED_ROUTES = [
  "/royalty",
  "/royalty/create",
  "/royalty/orders",
  "/royalty/orders/analytics",
  "/royalty/orders/transactions",
  "/api/royality",
  "/api/royality/product",
  "/api/royality/orders/sold",
  "/api/royality/product/create",
  "/royalty/create",

];

// Helper: Extract shop domain safely
function extractShop(request: NextRequest): string | null {
  console.log("🔹 Extracting shop from request...");
  let shop: string | null = request.nextUrl.searchParams.get("shop") || null;
  console.log("🔹 Initial shop from searchParams:", shop);

  if (!shop && request.nextUrl.searchParams.get("host")) {
    try {
      const host = request.nextUrl.searchParams.get("host") || "";
      const decodedHost = Buffer.from(host, "base64").toString();
      const shopMatch = decodedHost.match(/\/store\/([^\/]+)/);
      if (shopMatch) shop = `${shopMatch[1]}.myshopify.com`;
      console.log("🔹 Shop extracted from host:", shop);
    } catch (e) {
      console.error("❌ Could not decode host parameter", e);
    }
  }

  if (!shop) {
    const referer = request.headers.get("referer");
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        shop = refererUrl.searchParams.get("shop") || null;
        console.log("🔹 Shop extracted from referer:", shop);
      } catch (e) {
        console.error("❌ Could not parse referer for shop", e);
      }
    }
  }

  console.log("🔹 Final shop value:", shop ?? "*.myshopify.com");
  return shop;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const shop = extractShop(request);

  console.log("🔍 Middleware triggered");
  console.log("➡️ Pathname:", pathname);
  console.log("➡️ Shop:", shop);

  // Step 1: Apply CSP headers
  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    `frame-ancestors https://${shop ?? "*.myshopify.com"} https://admin.shopify.com;`,
  );
  console.log("🔹 CSP headers applied for shop:", shop);

  // Step 2: Allow public routes
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  console.log("🔹 Is public route:", isPublicRoute);
  if (isPublicRoute) {
    console.log("🟢 Public route allowed:", pathname);
    return response;
  }

  // Step 3: Check protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  console.log("🔹 Is protected route:", isProtectedRoute);
  if (isProtectedRoute) {
    console.log(
      "🟡 Protected route, client-side billing check via Redux will apply:",
      pathname,
    );
    return response;
  }

  // Step 4: Non-protected routes
  console.log("⚪ Non-protected route allowed:", pathname);
  return response;
}
