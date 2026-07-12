import type { Metadata, Viewport } from "next";
import { Nunito, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "./ClientProviders";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
  style: ["normal", "italic"],
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fishbase.app";
const baseAppId = "6a01ca209ee68cd142d1b1ac";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "FishBase",
    template: "%s | FishBase",
  },
  description:
    "Connect a Base wallet, deploy fishing boats, earn XP, and climb the FishBase leaderboards.",
  applicationName: "FishBase",
  icons: {
    icon: [
      { url: "/favicon.png?v=2", type: "image/png" },
      { url: "/icon.png?v=2", type: "image/png" },
    ],
    apple: [{ url: "/icon.png?v=2", type: "image/png" }],
  },
  openGraph: {
    title: "FishBase",
    description:
      "A Base App fishing game where captains place boats, collect daily XP, and compete onchain.",
    url: appUrl,
    siteName: "FishBase",
    images: [{ url: "/icon.png?v=2", width: 1024, height: 1024, alt: "FishBase" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FishBase",
    description:
      "Place boats, earn XP, and compete with your Base wallet in FishBase.",
    images: ["/icon.png?v=2"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f6fd1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="base:app_id" content={baseAppId} />
        <link rel="icon" href="/favicon.png?v=3" type="image/png" />
        <link rel="shortcut icon" href="/favicon.png?v=3" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png?v=3" />
      </head>
      <body className={`${nunito.variable} ${instrumentSerif.variable} app-shell antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
