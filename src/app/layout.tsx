import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your Name — Creative Developer",
  description: "Personal portfolio — Design, Code, Create.",
  keywords: ["portfolio", "developer", "creative", "design", "personal website"],
  authors: [{ name: "Your Name" }],
  icons: {
    icon: "favicon.png",
    shortcut: "favicon.png",
    apple: "favicon.png",
  },
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
        className="antialiased bg-background text-foreground"
      >
        <div className="grain-overlay" />
        {children}
      </body>
    </html>
  );
}
