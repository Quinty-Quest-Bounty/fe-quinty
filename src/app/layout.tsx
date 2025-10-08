import "./globals.css";
import Providers from "./providers";
import Header from "../components/Header";

export const metadata = {
  title: "Quinty  - Decentralized Bounty System",
  description:
    "A transparent bounty platform with  governance, reputation NFTs, and dispute resolution on Somnia Testnet",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
