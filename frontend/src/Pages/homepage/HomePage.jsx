import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import {
  HeroSection,
  FeaturesSection,
  InterviewTypesSection,
  StatsSection,
  TestimonialsSection,
  CTASection,
  HowItWorksSection,
  Footer,
} from '../../components/homepage';

const HomePage = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {/* Progress bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50"
        style={{ scaleX }}
      />

      <main className="min-h-screen">
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <InterviewTypesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <CTASection />
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
