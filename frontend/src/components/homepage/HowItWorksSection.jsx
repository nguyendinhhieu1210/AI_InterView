import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Code2,
  Brain,
  BarChart,
  Mail,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Choose your focus',
    description:
      'Pick the role, language, and difficulty level that best match your preparation goals.',
    icon: Code2,
    buttonText: 'Select now',
    accent: 'from-primary to-secondary',
  },
  {
    number: '02',
    title: 'Practice with AI',
    description:
      'Answer questions, solve coding tasks, and receive guidance that feels like a real interviewer.',
    icon: Brain,
    buttonText: 'Try it',
    accent: 'from-secondary to-primary',
  },
  {
    number: '03',
    title: 'Receive detailed feedback',
    description:
      'Review scores and personalized comments to understand where you stand and what to improve.',
    icon: BarChart,
    buttonText: 'See report',
    accent: 'from-success to-primary',
  },
  {
    number: '04',
    title: 'Get a summary by email',
    description:
      'Receive a polished recap of your progress so you can keep improving between sessions.',
    icon: Mail,
    buttonText: 'Subscribe',
    accent: 'from-warning to-secondary',
  },
];

const HowItWorksSection = () => {
  return (
    <section className="relative overflow-hidden bg-bg px-4 py-24 text-text md:px-6">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[900px] w-[900px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[700px] w-[700px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>How it works</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            A simple workflow for stronger interview readiness
          </h2>
          <p className="text-lg text-muted">
            Each step is designed to make your preparation clear, focused, and
            practical.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group rounded-[24px] border border-border/80 bg-card/70 p-6 shadow-soft backdrop-blur-sm"
              >
                <div
                  className={`inline-flex rounded-full bg-gradient-to-r ${step.accent} bg-clip-text text-4xl font-bold text-transparent`}
                >
                  {step.number}
                </div>
                <div
                  className={`mt-5 inline-flex rounded-2xl bg-gradient-to-r ${step.accent} p-3 text-white`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {step.description}
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
                  <span>{step.buttonText}</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/50"
          >
            Start practicing now
            <ChevronRight className="h-5 w-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
