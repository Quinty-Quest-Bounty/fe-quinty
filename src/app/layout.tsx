import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quinty - Web3 Quest and Bounty Platform",
  description:
    "A transparent quest-and-bounty platform where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
  keywords: `
  quinty, quinty io, quinty web3, quinty crypto, quinty labs,
  quest platform, bounty platform, web3 quest, web3 bounty,
  crypto bounty platform, crypto quest platform,
  quinty quest, quinty bounty
`,

  icons: {
    icon: "/images/quinty-green.png",
    shortcut: "/images/quinty-green.png",
    apple: "/images/quinty-green.png",
  },
  openGraph: {
    title: "Quinty - Web3 Quest and Bounty Platform",
    description:
      "A transparent quest-and-bounty platform where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
    images: ["/images/quinty-green.png"],
    siteName: "Quinty",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quinty - Web3 Quest and Bounty Platform",
    description:
      "A transparent quest-and-bounty platform where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
    images: ["/images/quinty-green.png"],
  },
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jakartaSans.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/@coinbase/onchainkit@1.1.1/dist/assets/style.css"
        />
      </head>
      <body className={`${jakartaSans.className} antialiased bg-white relative`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
