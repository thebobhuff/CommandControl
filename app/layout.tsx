import type { Metadata, Viewport } from "next";
import { CookieNotice } from "@/components/cookie-notice";
import { siteConfig } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: "%s | Commander Control"
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  generator: "Next.js",
  keywords: [
    "Commander Control",
    "MTG Commander life tracker",
    "Magic Commander life counter",
    "EDH life tracker",
    "Commander damage tracker",
    "MTG tablet controller",
    "MTG TV display",
    "Magic The Gathering Commander app"
  ],
  authors: [{ name: "Commander Control" }],
  creator: "Commander Control",
  publisher: "Commander Control",
  category: "game",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
    images: [
      {
        url: "/hero-commander-display.png",
        width: 2048,
        height: 1263,
        alt: "Commander Control TV display showing four Commander player boards"
      },
      {
        url: "/icons/commander-control-icon.png",
        width: 1254,
        height: 1254,
        alt: "Commander Control gold crown and shield icon"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/hero-commander-display.png"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" }
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "512x512" }]
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#05070c"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        <CookieNotice />
      </body>
    </html>
  );
}
