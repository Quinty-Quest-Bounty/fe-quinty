import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import type { Metadata } from "next";

export const metadata: Metadata = {
 title: "Quintle - Quest in Mantle",
 description:
 "A transparent quest-and-bounty platform on Mantle where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
 keywords: `
  quintle, quintle io, quintle web3, quintle mantle,
  quest platform, bounty platform, web3 quest, web3 bounty,
  mantle bounty, mantle quest, crypto bounty platform,
  quintle quest, quintle bounty
`,

 icons: {
 icon: "/images/quintle-logo.png",
 shortcut: "/images/quintle-logo.png",
 apple: "/images/quintle-logo.png",
 },
 openGraph: {
 title: "Quintle - Quest in Mantle",
 description:
 "A transparent quest-and-bounty platform on Mantle where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
 images: ["/images/quintle-logo.png"],
 siteName: "Quintle",
 type: "website",
 },
 twitter: {
 card: "summary_large_image",
 title: "Quintle - Quest in Mantle",
 description:
 "A transparent quest-and-bounty platform on Mantle where funds are held in smart-contract escrow, letting creators, solvers, and community interact directly without intermediaries.",
 images: ["/images/quintle-logo.png"],
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
 </head>
 <body className={`${jakartaSans.className} antialiased bg-gradient-to-br from-green-50/50 via-teal-50/30 to-emerald-50/50 relative`}>
  {/* Animated Background Blobs */}
  <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
  <div className="absolute top-0 -left-4 w-96 h-96 bg-green-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
  <div className="absolute top-0 -right-4 w-96 h-96 bg-teal-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
  <div className="absolute -bottom-8 left-20 w-96 h-96 bg-emerald-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
  <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-cyan-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-6000"></div>
  <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lime-200/25 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-8000"></div>
  <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-teal-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-3000"></div>
  </div>

  <Providers>
  <Header />
  {children}
  </Providers>
 </body>
 </html>
 );
}
