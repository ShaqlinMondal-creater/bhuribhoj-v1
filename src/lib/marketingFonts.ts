import { Noto_Sans_Bengali, Plus_Jakarta_Sans } from "next/font/google";

export const marketingSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-m-sans",
  display: "swap",
});

export const marketingBengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["500", "600", "700"],
  variable: "--font-m-bn",
  display: "swap",
});
