import React from 'react';
import { Navbar } from '../components/common/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustBadges } from '../components/landing/TrustBadges';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { Footer } from '../components/common/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <TrustBadges />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
};
