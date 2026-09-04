import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";

import "./globals.css";

// Stand-in for Avenir Next, which is Apple-licensed and will not resolve on
// Vercel. See the --im-font / --im-font-resolved note in globals.css.
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Island Media Co",
  description:
    "Out-of-home advertising booking and fulfilment — request, contract, install, prove.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={nunitoSans.variable}>
      <body>{children}</body>
    </html>
  );
}
