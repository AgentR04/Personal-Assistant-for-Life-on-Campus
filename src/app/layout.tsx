import { AppSidebar } from "@/components/app-sidebar";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TokenCleaner } from "@/components/token-cleaner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { VisualEditsMessenger } from "orchids-visual-edits";
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
  title: "P.A.L. — Personal Assistant for Life on Campus",
  description:
    "AI-powered onboarding agent for engineering college students. Smart document verification, RAG-powered chat, and social matching.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <ThemeProvider>
          <TokenCleaner />
          <div className="flex min-h-screen bg-background">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <Navbar />
              <main className="flex-1 w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
        <VisualEditsMessenger />
      </body>
    </html>
  );
}
