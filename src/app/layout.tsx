import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "LeetGitSj — Auto-sync LeetCode to GitHub",
  description:
    "Solve a LeetCode problem on any device and it's automatically committed to your GitHub repo. Real green squares, every time.",
  keywords: [
    "LeetCode",
    "GitHub",
    "sync",
    "LeetCode to GitHub",
    "contribution graph",
    "coding practice",
  ],
  authors: [{ name: "LeetGitSj" }],
  openGraph: {
    title: "LeetGitSj — Auto-sync LeetCode to GitHub",
    description:
      "Solve on any device. Commit to GitHub. Automatically.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${playfair.className} h-full antialiased`}
    >
      {/* Inline script to set theme before paint — prevents flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('leetpush-theme');
                  if (theme === 'dark' || theme === 'light') {
                    document.documentElement.setAttribute('data-theme', theme);
                  } else {
                    var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
                  }
                  
                  var savedHue = localStorage.getItem('leetgit-theme-hue');
                  if (savedHue) {
                    document.documentElement.style.setProperty('--hue', savedHue);
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        {/* Global Background — Lightweight (4 elements instead of 15 for mobile perf) */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
          {/* Two large soft base layers */}
          <div className="smoke-base" style={{ background: "radial-gradient(ellipse, hsla(var(--hue, 172),85%,50%,0.3) 0%, transparent 70%)", width: "70vw", height: "70vw", top: "-15%", left: "-10%", willChange: "transform" }} />
          <div className="smoke-base" style={{ background: "radial-gradient(ellipse, hsla(calc(var(--hue, 172) + 88),70%,60%,0.25) 0%, transparent 70%)", width: "75vw", height: "75vw", bottom: "-25%", right: "-15%", animationDelay: "3s", animationDuration: "28s", willChange: "transform" }} />

          {/* Two medium drifting wisps */}
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(var(--hue, 172),85%,55%,0.4) 0%, transparent 65%)", width: "35vw", height: "35vw", top: "10%", left: "15%", animationDuration: "18s", willChange: "transform" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(calc(var(--hue, 172) + 28),80%,60%,0.35) 0%, transparent 65%)", width: "30vw", height: "30vw", bottom: "10%", right: "10%", animationDelay: "2s", animationDuration: "20s", willChange: "transform" }} />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
