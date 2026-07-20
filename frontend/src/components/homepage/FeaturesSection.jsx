import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  FileText,
  BarChart3,
  Code2,
  Target,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Adaptive AI Interviewing',
    description:
      'Practice with an interview coach that adapts to your level and gives instant feedback.',
    bullets: [
      'Real-time answer analysis',
      'Dynamic difficulty adjustment',
      'Actionable improvement hints',
    ],
    accent: 'from-primary to-secondary',
    iconClass: 'bg-primary/10 text-primary',
  },
  {
    icon: FileText,
    title: 'Smart CV Analysis',
    description:
      'Upload your resume and receive personalized questions aligned to your background.',
    bullets: [
      'Extract core strengths and projects',
      'Create role-specific prompts',
      'Recommend missing skills',
    ],
    accent: 'from-secondary to-primary',
    iconClass: 'bg-secondary/10 text-secondary',
  },
  {
    icon: Code2,
    title: 'Interactive Live Coding',
    description:
      'Solve technical challenges and get deep, structured feedback from AI.',
    bullets: [
      'Support for multiple languages',
      'Code review and optimization tips',
      'Performance-focused guidance',
    ],
    accent: 'from-success to-primary',
    iconClass: 'bg-success/10 text-success',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description:
      'Monitor your growth through detailed reports and visual performance summaries.',
    bullets: [
      'Timeline-based progress charts',
      'Clear weakness detection',
      'Benchmarking against hiring standards',
    ],
    accent: 'from-warning to-primary',
    iconClass: 'bg-warning/10 text-warning',
  },
  {
    icon: Target,
    title: 'Adaptive Learning Path',
    description:
      'Let the system focus your practice on the areas that truly need improvement.',
    bullets: [
      'Difficulty shifts with feedback',
      'Less confusion and more efficiency',
      'Targeted preparation',
    ],
    accent: 'from-error to-secondary',
    iconClass: 'bg-error/10 text-error',
  },
  {
    icon: Clock,
    title: 'Flexible Practice',
    description:
      'Train anytime, anywhere with a smooth and accessible experience designed for modern schedules.',
    bullets: [
      'Practice at your own pace',
      'Suitable for entry and senior roles',
      'Cross-device performance',
    ],
    accent: 'from-primary to-success',
    iconClass: 'bg-primary/10 text-primary',
  },
];

const FeaturesSection = () => {
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
          className="mx-auto mb-14 max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Why professionals choose us</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              land your next role
            </span>
          </h2>
          <p className="text-lg text-muted">
            A modern experience, thoughtful content, and intelligent study tools
            designed to raise your interview readiness every day.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: index * 0.06 }}
                viewport={{ once: true }}
                whileHover={{ y: -6, scale: 1.01 }}
                className="group rounded-3xl border border-border/80 bg-card/70 p-6 shadow-soft backdrop-blur-sm"
              >
                <div
                  className={`inline-flex rounded-2xl p-3 ${feature.iconClass}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-text">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {feature.description}
                </p>
                <div className="mt-5 space-y-2">
                  {feature.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex items-start gap-2 text-sm text-text/80"
                    >
                      <div
                        className={`mt-1 h-2 w-2 rounded-full bg-gradient-to-r ${feature.accent}`}
                      />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all group-hover:gap-3">
                  <span>Explore feature</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
