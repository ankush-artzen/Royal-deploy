// import crypto from "node:crypto";

// export const generatedSignature = (payload: any) => {
//   const secret = process.env.SHOPIFY_API_SECRET!;
//   return crypto
//     .createHmac("sha256", secret)
//     .update(JSON.stringify(payload))
//     .digest("base64");
// };

// /lib/helper/hmacSignature.ts
import crypto from "node:crypto";

export const generatedSignature = (rawBody: Buffer): string => {
  console.log("\n🔐 [generatedSignature] Called at:", new Date().toISOString());

  if (!rawBody || rawBody.length === 0) {
    console.warn("⚠️ [generatedSignature] Empty rawBody buffer received");
  } else {
    console.log("📦 [generatedSignature] rawBody length:", rawBody.length);
    console.log(
      "📦 [generatedSignature] rawBody preview (first 200 chars):",
      rawBody.toString("utf8").slice(0, 200)
    );
  }

  // ✅ Retrieve secret key
  const secret =
    process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET;

  if (!secret) {
    console.error(
      "❌ [generatedSignature] Missing SHOPIFY_WEBHOOK_SECRET or SHOPIFY_API_SECRET in environment variables"
    );
    throw new Error(
      "SHOPIFY_WEBHOOK_SECRET or SHOPIFY_API_SECRET not defined in env vars"
    );
  }

  console.log("🧩 [generatedSignature] Using secret key source:", 
    process.env.SHOPIFY_WEBHOOK_SECRET ? "SHOPIFY_WEBHOOK_SECRET" : "SHOPIFY_API_SECRET"
  );

  // ⚠️ Never log full secret for security
  console.log("🔑 [generatedSignature] Secret key preview:", secret.slice(0, 5) + "••••••••");

  try {
    // ✅ Generate HMAC digest
    const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");

    console.log("✅ [generatedSignature] HMAC digest generated successfully");
    console.log("🧮 [generatedSignature] Digest (Base64):", hmac);
    console.log("🧮 [generatedSignature] Digest length:", hmac.length);

    return hmac;
  } catch (err) {
    console.error("💥 [generatedSignature] HMAC generation failed:", err);
    throw err;
  }
};



// const generatedHmac = crypto
// .createHmac("sha256", secret)
// .update(rawBody, "utf8")
// .digest("base64");