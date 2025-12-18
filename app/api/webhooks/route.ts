import shopify from "@/lib/shopify/initialize-context";
import { addHandlers } from "@/lib/shopify/register-webhooks";
import { headers } from "next/headers";
import crypto from "node:crypto";

const verifyHmac = async (request: Request) => {
  console.log(process.env.SHOPIFY_API_SECRET, "process.env.SHOPIFY_API_SECRET");
  const hmacHeader = request.headers.get("X-Shopify-Hmac-Sha256");
  const rawBody = await request.text(); // Read the request body as text
  const generatedHmac = crypto
    .createHmac("sha256", String(process.env.SHOPIFY_API_SECRET))
    .update(rawBody, "utf8")
    .digest("base64");

  return generatedHmac === hmacHeader;
};

export async function POST(req: Request) {
  const topic = headers().get("x-shopify-topic") as string;

  // Validate HMAC before processing the webhook
  const isValid = await verifyHmac(req);
  if (!isValid) {
    console.log("Invalid HMAC signature");
    return new Response("Unauthorized", { status: 401 });
  }

  // Seems like there is some weird behaviour where the shopify api doesn't have the handlers registered - possibly due to some serverless behaviour
  const handlers = shopify.webhooks.getHandlers(topic);
  if (handlers.length === 0) {
    console.log(`No handlers found for topic: ${topic}`);
    addHandlers();
  }

  const rawBody = await req.text();

  await shopify.webhooks.process({
    rawBody,
    rawRequest: req,
  });

  console.log(`Webhook processed, returned status code 200`);
  return new Response(null, { status: 200 });
}
