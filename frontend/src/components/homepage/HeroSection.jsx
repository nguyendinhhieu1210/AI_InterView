import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Sparkles,
  Brain,
  ShieldCheck,
  MessageSquare,
  FileText,
} from 'lucide-react';
import FloatingParticles from './FloatingParticles';
import AnimatedBackground from './AnimatedBackground';

const HeroSection = () => {
  return (
    <section
      className="relative flex min-h-[100vh] items-center overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-color)',
        backgroundImage:
          'radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 33%), radial-gradient(circle at bottom right, rgba(99, 102, 241, 0.18), transparent 35%)',
      }}
    >
      <AnimatedBackground variant={2} />
      <FloatingParticles count={36} color="blue" />

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
            'linear-gradient(225deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(99,102,241,0.12), rgba(59,130,246,0.12))',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container relative z-10 mx-auto px-4 py-20 md:px-6 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-sm font-medium text-text/90 backdrop-blur-md"
              whileHover={{ scale: 1.03 }}
            >
              <Sparkles className="h-4 w-4 text-warning" />
              <span>
                AI-powered interview practice for ambitious professionals
              </span>
            </motion.div>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-text sm:text-5xl lg:text-7xl">
              <span className="block">Master the interview</span>
              <span className="mt-2 block bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                with confidence
              </span>
              <span className="mt-2 block">and precision</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              Practice with an adaptive AI coach, receive real-time feedback,
              analyze your CV, and sharpen your skills for every stage of the
              hiring process.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-7 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/50"
              >
                <span>Start free</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/70 px-7 py-3.5 font-semibold text-text backdrop-blur-md transition-all duration-300 hover:bg-card"
              >
                <Play className="h-5 w-5" />
                Watch demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-border/70 bg-card/70 px-4 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i}`}
                      alt="User"
                      className="h-9 w-9 rounded-full border-2 border-bg"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">
                    10K+ active learners
                  </p>
                  <p className="text-sm text-muted">Training every day</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-warning">
                {'★'.repeat(5)}
                <span className="ml-1 text-sm text-muted">4.9/5</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: 10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-soft backdrop-blur-xl">
              <div className="rounded-[24px] border border-primary/20 bg-gradient-to-br from-card/90 to-bg/90 p-5">
                <div className="flex items-start justify-between rounded-2xl border border-border/70 bg-card/70 p-4">
                  <div>
                    <p className="text-sm font-medium text-text">
                      AI Interview Coach
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Asking contextual questions in real time
                    </p>
                  </div>
                  <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    Live
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">
                          Instant feedback
                        </p>
                        <p className="text-sm text-muted">
                          Specific and actionable
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-secondary/20 bg-secondary/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-secondary/20 p-2.5 text-secondary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-text">
                          CV intelligence
                        </p>
                        <p className="text-sm text-muted">Tailored prompts</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-border/70 bg-bg/80 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-text">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span>Performance insights</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { value: '92%', label: 'Accuracy' },
                      { value: '500+', label: 'Questions' },
                      { value: '4.9', label: 'Rating' },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-card/70 p-3 text-center"
                      >
                        <p className="text-lg font-semibold text-text">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-7 -right-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
              <Brain className="h-7 w-7" />
            </div>

            <motion.div
              className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-primary/20 blur-2xl"
              animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-secondary/20 blur-2xl"
              animate={{ scale: [1.3, 1, 1.3], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </div>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-border/70">
          <motion.div
            className="mt-2 h-3 w-1 rounded-full bg-primary/40"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
