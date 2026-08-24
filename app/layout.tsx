import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KINETIC — Studio-Grade Generative Video Engine & Auto-Publisher",
  description: "Precision-machined generative video platform. Direct 4K cinematic motion, 6-DoF camera trajectories, and multi-social auto-publishing to TikTok, Reels, Shorts, and X.",
  keywords: ["AI Video Generator", "Social Media Video Auto-Publisher", "Generative Video SaaS", "Text to Video AI", "Temporal Consistency", "4K Video AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#08090a] text-[#d0d6e0] font-sans antialiased selection:bg-[#e4f222] selection:text-[#08090a]">
        <ClerkProvider
          appearance={{
            baseTheme: dark,
            variables: {
              colorPrimary: "#e4f222",
              colorBackground: "#0f1011",
              borderRadius: "0.375rem",
            },
            elements: {
              card: "border border-[#23252a] bg-[#0f1011] shadow-2xl",
              formButtonPrimary: "bg-[#e4f222] text-[#08090a] hover:bg-[#ecf83e] font-medium font-sans",
              footerActionLink: "text-[#e4f222] hover:text-[#ecf83e]",
            }
          } as any}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
