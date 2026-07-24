import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlyRank Opportunity Intelligence Studio",
  description: "Privacy-first content opportunity analysis using GSC and GA4",
  openGraph: {
    title: "FlyRank Opportunity Intelligence Studio",
    description: "Privacy-first content opportunity analysis using GSC and GA4",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
