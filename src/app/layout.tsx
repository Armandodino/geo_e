import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Geo E - Plateforme Géospatiale",
  description: "Plateforme géospatiale avancée pour la Côte d'Ivoire. Visualisation 3D, analyse spatiale et gestion de données GIS.",
  keywords: ["Geo E", "Géospatial", "Côte d'Ivoire", "GIS", "3D", "Point Cloud", "Cartographie"],
  authors: [{ name: "Geo E Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Geo E - Plateforme Géospatiale",
    description: "Plateforme géospatiale avancée pour la Côte d'Ivoire",
    url: "https://geo-e.ci",
    siteName: "Geo E",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Geo E - Plateforme Géospatiale",
    description: "Plateforme géospatiale avancée pour la Côte d'Ivoire",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
