import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { UIProvider } from "@/components/ui/provider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Beryll Onboard",
  description: "Onboarding for Beryll Cyber Security.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0b0d" },
  ],
};

// Runs before first paint: stored choice wins, else system preference, else light.
const themeInit = `(function(){try{var t=localStorage.getItem("beryll-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){document.documentElement.setAttribute("data-theme","light")}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className={`${inter.variable} ${sora.variable} font-sans antialiased`}>
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}
