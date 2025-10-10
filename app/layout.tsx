import { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next.js Shopify App",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
