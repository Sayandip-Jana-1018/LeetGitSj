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
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground relative">
        {/* Global Smoke Particle Background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Large soft base layers — very blurred, subtle */}
          <div className="smoke-base" style={{ background: "radial-gradient(ellipse, hsla(172,85%,50%,0.35) 0%, transparent 70%)", width: "80vw", height: "80vw", top: "-20%", left: "-15%" }} />
          <div className="smoke-base" style={{ background: "radial-gradient(ellipse, hsla(260,70%,60%,0.30) 0%, transparent 70%)", width: "90vw", height: "90vw", bottom: "-30%", right: "-20%", animationDelay: "3s", animationDuration: "28s" }} />

          {/* Medium drifting smoke wisps */}
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(172,85%,55%,0.50) 0%, transparent 65%)", width: "35vw", height: "35vw", top: "5%", left: "10%", animationDuration: "14s" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(200,80%,60%,0.45) 0%, transparent 65%)", width: "30vw", height: "30vw", top: "15%", right: "8%", animationDelay: "1.5s", animationDuration: "18s" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(260,70%,65%,0.42) 0%, transparent 65%)", width: "38vw", height: "38vw", top: "50%", left: "5%", animationDelay: "3s", animationDuration: "20s" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(172,85%,50%,0.40) 0%, transparent 65%)", width: "32vw", height: "32vw", bottom: "5%", right: "5%", animationDelay: "2s", animationDuration: "16s" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(200,80%,55%,0.42) 0%, transparent 65%)", width: "28vw", height: "28vw", top: "35%", left: "45%", animationDelay: "4s", animationDuration: "15s" }} />
          <div className="smoke-wisp" style={{ background: "radial-gradient(circle, hsla(280,70%,60%,0.40) 0%, transparent 65%)", width: "30vw", height: "30vw", top: "70%", left: "30%", animationDelay: "0.8s", animationDuration: "19s" }} />

          {/* Small fast-moving smoke particles */}
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(172,85%,60%,0.60) 0%, transparent 70%)", width: "16vw", height: "16vw", top: "20%", left: "25%", animationDuration: "10s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(260,70%,70%,0.55) 0%, transparent 70%)", width: "13vw", height: "13vw", top: "60%", right: "20%", animationDelay: "1s", animationDuration: "12s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(200,80%,65%,0.58) 0%, transparent 70%)", width: "18vw", height: "18vw", top: "40%", left: "68%", animationDelay: "2.5s", animationDuration: "9s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(172,85%,55%,0.52) 0%, transparent 70%)", width: "14vw", height: "14vw", top: "80%", left: "15%", animationDelay: "0.5s", animationDuration: "13s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(280,65%,65%,0.55) 0%, transparent 70%)", width: "16vw", height: "16vw", top: "10%", right: "30%", animationDelay: "3.5s", animationDuration: "11s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(200,80%,60%,0.50) 0%, transparent 70%)", width: "12vw", height: "12vw", top: "55%", left: "52%", animationDelay: "1.8s", animationDuration: "14s" }} />
          <div className="smoke-particle" style={{ background: "radial-gradient(circle, hsla(172,85%,50%,0.58) 0%, transparent 70%)", width: "15vw", height: "15vw", bottom: "20%", right: "40%", animationDelay: "2.2s", animationDuration: "11s" }} />
        </div>
        
        <div className="relative z-10 flex-1 flex flex-col">
          <ThemeProvider>{children}</ThemeProvider>
        </div>
      </body>
    </html>
  );
}
