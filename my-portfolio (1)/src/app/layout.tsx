import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Your Name — Creative Developer",
  description: "Personal portfolio — Design, Code, Create.",
  keywords: ["portfolio", "developer", "creative", "design", "personal website"],
  authors: [{ name: "Your Name" }],
  openGraph: {
    title: "Your Name — Creative Developer",
    description: "Personal portfolio — Design, Code, Create.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your Name — Creative Developer",
    description: "Personal portfolio — Design, Code, Create.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
