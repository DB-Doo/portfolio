import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
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

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dan Brandt | UX Designer",
  description:
    "UX designer in Kansas City. I design mobile and web apps and build them myself. Case studies: Doto, a home screen on Google Play; Wide, a carousel editor; and Bid Tracker, a client tool.",
  openGraph: {
    title: "Dan Brandt | UX Designer",
    description:
      "I design mobile and web apps and build them myself. Case studies from Doto, Wide and client work.",
    url: "https://dbdoo.dev",
    siteName: "Dan Brandt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dan Brandt | UX Designer",
    description:
      "I design mobile and web apps and build them myself. Case studies from Doto, Wide and client work.",
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
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
