import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText,
  Brain,
  Code2,
  BookOpen,
  Zap,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    id: 'cv',
    icon: FileText,
    title: 'CV Intelligence',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    image:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Upload your resume and let AI create role-specific interview questions from your background.',
    longDesc:
      'The system extracts skill signals, projects, and experience from your CV so every question becomes more relevant and realistic.',
    highlights: [
      'Extracts skills and projects',
      'Builds role-specific prompts',
      'Suggests gaps to improve',
    ],
  },
  {
    id: 'adaptive',
    icon: Brain,
    title: 'Adaptive Mock Interviews',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Questions automatically adjust to your skill level, keeping sessions productive and engaging.',
    longDesc:
      'AI continuously evaluates your answers and calibrates the next challenge to keep you at the right level of difficulty.',
    highlights: [
      'Real-time difficulty tuning',
      'Optimized learning path',
      'Keeps practice challenging without overwhelming you',
    ],
  },
  {
    id: 'livecoding',
    icon: Code2,
    title: 'Live Coding Practice',
    color: 'text-success',
    bgColor: 'bg-success/10',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Work through coding challenges with AI scoring, explanation, and improvement suggestions.',
    longDesc:
      'Our interactive coding environment lets you write, test, and refine solutions while receiving structured feedback.',
    highlights: [
      'Supports multiple languages',
      'Automated scoring with explanations',
      'Optimization suggestions',
    ],
  },
  {
    id: 'exam',
    icon: BookOpen,
    title: 'MCQ Practice Bank',
    color: 'text-error',
    bgColor: 'bg-error/10',
    image:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Reinforce fundamentals with a curated and constantly refreshed question bank.',
    longDesc:
      'Professional question sets help you cover core concepts thoroughly before stepping into real interviews.',
    highlights: [
      'Large variety of questions',
      'Professionally curated content',
      'Detailed explanations and results',
    ],
  },
  {
    id: 'history',
    icon: FileText,
    title: 'Insights & History',
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Track progress, weaknesses, and improvements across every practice session.',
    longDesc:
      'A clear dashboard makes it easy to spot your strengths, focus on weaker areas, and measure growth over time.',
    highlights: [
      'Skill-based progress charts',
      'Weakness analysis',
      'Clear comparison against hiring benchmarks',
    ],
  },
];

const InterviewTypesSection = () => {
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
            <Zap className="h-4 w-4 text-warning" />
            <span>Core experience</span>
          </div>

          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Practice smarter with{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Interview
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            From CV review and mock interviews to live coding and progress
            analytics, everything is connected inside one polished experience.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-[24px] border border-border/80 bg-card/70 shadow-soft backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
                  <div className="h-40 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div
                      className={`inline-flex rounded-2xl p-3 ${feature.bgColor}`}
                    >
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-text">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-muted">
                      {feature.shortDesc}
                    </p>

                    <div className="mt-5 max-h-0 overflow-hidden transition-all duration-300 group-hover:max-h-80">
                      <p className="text-sm leading-7 text-text/80">
                        {feature.longDesc}
                      </p>
                      <div className="mt-4 grid gap-3">
                        {feature.highlights.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-sm text-text/80"
                          >
                            <CheckCircle className="h-4 w-4 text-success" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                      <Link
                        to="/login"
                        className="mt-6 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary to-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition duration-300 hover:shadow-primary/30"
                      >
                        Start now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default InterviewTypesSection;
