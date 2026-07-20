import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Sparkles, CheckCircle } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative overflow-hidden bg-bg px-4 py-24 md:px-6">
      <div className="absolute inset-0">
        <div className="absolute left-20 top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </div>

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
            'linear-gradient(225deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-text/90">
            <Rocket className="h-4 w-4 text-warning" />
            <span>Ready to begin?</span>
          </div>

          <h2 className="text-4xl font-bold text-text sm:text-5xl lg:text-6xl">
            Start your journey to{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              interview mastery
            </span>{' '}
            today
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted">
            Join thousands of candidates who use AI Interview to practice
            smarter, improve faster, and walk into real interviews with
            confidence.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              '14-day free trial',
              'No credit card required',
              'Cancel anytime',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-full bg-card/70 px-4 py-2 text-sm text-text/90 ring-1 ring-border/70"
              >
                <CheckCircle className="h-4 w-4 text-success" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/50"
            >
              <span>Start free</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center rounded-2xl border border-border/70 bg-card/70 px-8 py-3.5 font-semibold text-text backdrop-blur-md transition-all duration-300 hover:bg-card"
            >
              Watch demo
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted">
            <Sparkles className="h-4 w-4 text-warning" />
            <span>Trusted by 10,000+ learners</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
