import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientProviders } from "@/components/ClientProviders";
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
  title: "Dan Brandt | Your app, built in days",
  description:
    "Product-obsessed developer shipping polished prototypes fast. Not just code that runs, but products people love to use. Kansas City contractor.",
  openGraph: {
    title: "Dan Brandt | Your app, built in days",
    description:
      "Product-obsessed developer. I ship polished prototypes in days. Not just code, but products people love. Kansas City.",
    url: "https://dbdoo.dev",
    siteName: "Dan Brandt",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dan Brandt | Your app, built in days",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dan Brandt | Your app, built in days",
    description:
      "I ship working apps in days, not months. Web, mobile, automation.",
    images: ["/og-image.png"],
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
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
