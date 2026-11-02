import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import { Shell } from "@/components/shell";
import { StoreProvider } from "@/components/store";
import { SafeAnalytics } from "@/components/analytics";
import "./globals.css";

const sans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const serif = IBM_Plex_Serif({ variable: "--font-plex-serif", subsets: ["latin", "latin-ext"], weight: ["400"], style: ["normal", "italic"] });

export const metadata: Metadata = {
  title: { default: "One Record, Both Sides: a Care Access concept", template: "%s · One Record, Both Sides" },
  description:
    "An unofficial concept by Hafsa Usmani for Care Access's Product Designer role: the health screening pre-screen rebuilt around four clear consent choices, and the coordinator's view of the same record.",
  robots: { index: false, follow: false },
};

// Pinch-zoom stays on: no maximum-scale, no user-scalable=no.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f3d42" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} antialiased`}>
      <body className="font-sans text-[16px] leading-6">
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
        <SafeAnalytics />
      </body>
    </html>
  );
}
