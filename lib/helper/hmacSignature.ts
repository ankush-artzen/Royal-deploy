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
  // ⚠️ Shopify uses your App’s API Secret Key (NOT client ID)
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_API_SECRET!;
  if (!secret) {
    throw new Error("SHOPIFY_WEBHOOK_SECRET or SHOPIFY_API_SECRET not defined in env vars");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");
};



// const generatedHmac = crypto
// .createHmac("sha256", secret)
// .update(rawBody, "utf8")
// .digest("base64");