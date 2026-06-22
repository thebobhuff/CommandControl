import type { Metadata, Viewport } from "next";
import { CookieNotice } from "@/components/cookie-notice";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commander Control",
  description: "Tablet controller, life tracker, and TV display for Commander games."
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
