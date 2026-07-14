import {
  AuroraBackground,
  Navbar,
  Hero,
  FeatureGrid,
  HowItWorks,
  DashboardPreview,
  FAQ,
  CTASection,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      {/* Animated background layer — behind everything */}
      <AuroraBackground />

      {/* Fixed glass navbar */}
      <Navbar />

      {/* Page sections */}
      <Hero />
      <FeatureGrid />
      <DashboardPreview />
      <HowItWorks />
      <FAQ />
      <CTASection />
      <Footer />
    </main>
  );
}
