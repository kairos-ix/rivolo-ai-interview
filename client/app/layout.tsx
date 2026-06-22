import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/Authcontext";
import { Navbar } from "@/components/Navbar";
import LenisProvider from "@/components/LenisProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rivolo | AI Mock Interview Assistant",
  description: "Land your dream job with Rivolo. Experience realistic AI mock interviews, get instant domain-specific feedback, and analyze your resume.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};


import Footer from "@/components/Footer";
import ServerWakeupManager from "@/components/ServerWakeupManager";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`font-sans antialiased`} suppressHydrationWarning>
      <body className="min-h-[100dvh] flex flex-col" suppressHydrationWarning>
        <ServerWakeupManager />
        <AuthProvider>
          <LenisProvider>
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </LenisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
