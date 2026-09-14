import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TimezoneSync } from "@/components/TimezoneSync";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Semester Planner",
  description: "Plan your semester with AI-powered PDF import",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full antialiased">
        <TimezoneSync />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
