import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dan Brandt — Your app, built in days",
  description:
    "Web apps, mobile apps, automation systems. You get a working product, not a mockup. Available for contract work in Kansas City.",
  openGraph: {
    title: "Dan Brandt — Your app, built in days",
    description:
      "I ship working apps in days, not months. Web, mobile, automation. Kansas City contractor available now.",
    url: "https://dbdoo.dev",
    siteName: "Dan Brandt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dan Brandt — Your app, built in days",
    description:
      "I ship working apps in days, not months. Web, mobile, automation.",
  },
  metadataBase: new URL("https://dbdoo.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
