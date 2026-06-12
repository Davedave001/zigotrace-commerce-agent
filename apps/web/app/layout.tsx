import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EUDR Guardian — Hedera Food Traceability Compliance Agent",
  description:
    "Autonomous supply chain intelligence that verifies EUDR compliance, detects fraud, and generates Due Diligence Statements through HBAR-powered agent commerce.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload hero image so it's ready before first paint */}
        <link
          rel="preload"
          as="image"
          href="/eudr-compliance-hero.png"
          fetchPriority="high"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
