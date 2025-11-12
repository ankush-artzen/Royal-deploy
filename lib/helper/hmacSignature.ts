// import crypto from "node:crypto";

// export const generatedSignature = (payload: any) => {
//   const secret = process.env.SHOPIFY_API_SECRET!;
//   return crypto
//     .createHmac("sha256", secret)
//     .update(JSON.stringify(payload))
//     .digest("base64");
// };

import crypto from "node:crypto";

/**
 * Generate HMAC signature from raw request body (string)
 * Shopify signs the *exact raw body*, not parsed JSON.
 */
export const generatedSignature = (rawBody: string): string => {
  const secret = process.env.SHOPIFY_API_SECRET!;
  return crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");
};


// const generatedHmac = crypto
// .createHmac("sha256", secret)
// .update(rawBody, "utf8")
// .digest("base64");