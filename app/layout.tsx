import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script"; // <-- 1. Make sure this import is here

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Chat",
  description: "AI Chat Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* --- 2. This Script tag is ESSENTIAL for login --- */}
        <Script src="https://accounts.google.com/gsi/client" async defer />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

