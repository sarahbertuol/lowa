import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE = "https://www.lowastudio.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "LoWa Studio, AI-built websites for US agencies",
    template: "%s · LoWa Studio",
  },
  description:
    "LoWa Studio builds AI-built websites for US agencies to resell. Fixed price from US$920, live in 24 hours, with a senior designer on every site.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "LoWa Studio, We built. You sell.",
    description: "AI-built websites for US agencies. Fixed price, live in 24 hours.",
    url: SITE,
    siteName: "LoWa Studio",
    locale: "en_US",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#EDB08A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Familjen+Grotesk:wght@300..700&family=Space+Mono:wght@400;700&display=swap"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
