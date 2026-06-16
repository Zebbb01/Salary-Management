'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { HeroSection } from '@/components/landing/hero-section';
import { SectionDivider } from '@/components/landing/section-divider';
import { FeaturesSection } from '@/components/landing/features-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { CTASection } from '@/components/landing/cta-section';
import { Footer } from '@/components/landing/footer';

export default function HomePage() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      {/* Animated Background */}
      <AnimatedBackground variant="landing" />

      {/* Navbar */}
      <LandingNavbar />

      {/* Page Content */}
      <main>
        <HeroSection />
        <SectionDivider variant="wave" />
        <FeaturesSection />
        <SectionDivider variant="curve" flip />
        <HowItWorksSection />
        <SectionDivider variant="angle" />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
