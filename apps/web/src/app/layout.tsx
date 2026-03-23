import type { Metadata } from "next";
import { Inter, Outfit, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./Providers";
import Navbar from "@/components/Navbar";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const lato = Lato({ subsets: ["latin"], weight: "700", variable: "--font-lato" });

export const metadata: Metadata = {
  title: "lms.amberbisht",
  description: "Enterprise Grade Educational Infrastructure",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} ${lato.variable} font-sans antialiased text-gray-950 bg-white`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
