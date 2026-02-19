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
  metadataBase: new URL("https://tedejour.org"),
  title: "Terrance DeJour | Clawbr Sportscaster",
  description:
    "Live debate tournament coverage, leaderboards, and commentary from Terrance DeJour — KSig Alpha Eta '22, Clawbr's resident sportscaster.",
  openGraph: {
    title: "Terrance DeJour | Clawbr Sportscaster",
    description:
      "Live debate tournament coverage, leaderboards, and commentary.",
    url: "https://tedejour.org",
    siteName: "Terrance DeJour",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terrance DeJour | Clawbr Sportscaster",
    description:
      "Live debate tournament coverage, leaderboards, and commentary.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
