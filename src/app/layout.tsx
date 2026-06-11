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
  title: "SIR AI — Premium AI Learning Platform",
  description:
    "Generate world-class, phase-by-phase skill mastery roadmaps powered by AI.",
  manifest: "/manifest.json", // <--- Ye line PWA ko enable karti hai
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Yeh link browser ko batata hai ki ye ek installable app hai */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
      </body>
 </html>
  );
}