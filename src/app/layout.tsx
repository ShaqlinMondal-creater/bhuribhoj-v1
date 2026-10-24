import type { Metadata, Viewport } from "next";
import { Manrope, Outfit } from "next/font/google";
import "./globals.css";
import { PublicFrame } from "@/components/layout/PublicFrame";
import { appConfig } from "@/lib/config";
import { marketingBengali, marketingSans } from "@/lib/marketingFonts";

const sans = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const display = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090909",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  title: {
    default: appConfig.name,
    template: `%s · ${appConfig.name}`,
  },
  description: "Mess management SaaS for shared kitchens.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-dvh flex-col overflow-x-clip">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("bhuribhoj-theme");var ok={"black-yellow":1,"sea-green":1,"orange":1,"red":1};document.documentElement.dataset.theme=ok[t]?t:"black-yellow";}catch(e){document.documentElement.dataset.theme="black-yellow";}})();`,
          }}
        />
        <PublicFrame fontClassName={`${marketingSans.variable} ${marketingBengali.variable}`}>
          {children}
        </PublicFrame>
      </body>
    </html>
  );
}
