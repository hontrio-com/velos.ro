import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NuqsAdapter } from "nuqs/adapters/next/app";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: "%s - Velos.ro",
    default: "Velos.ro",
  },
  description: "CRM profesional pentru gestionarea stațiilor ITP din România",
  applicationName: "Velos.ro",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Velos.ro",
  },
  formatDetection: { telephone: false },
  verification: {
    google: "s4J0XLTSqBb1v2zQazQm8hTgPnzWT1082geEamLleC0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ro"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#1877F2" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}
