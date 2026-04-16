import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Geo E - Application Géographique",
  description: "Application géographique moderne avec Next.js, TypeScript et Tailwind CSS",
  keywords: ["Geo E", "Géographie", "Next.js", "TypeScript", "Tailwind CSS", "React"],
  authors: [{ name: "Geo E Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Geo E",
    description: "Application géographique moderne",
    url: "https://geo-e.app",
    siteName: "Geo E",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geo E",
    description: "Application géographique moderne",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
