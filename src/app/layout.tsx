import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";
import { Space_Grotesk } from "next/font/google";

export const metadata = {
  title: "Quinty  - Decentralized Bounty System",
  description:
    "A transparent bounty platform with  governance, reputation NFTs, and dispute resolution on Somnia Testnet",
};

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
