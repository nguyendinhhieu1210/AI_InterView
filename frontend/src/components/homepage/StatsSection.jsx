import React, { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, FileText, Award, Clock } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: 10000,
    label: 'Active learners',
    suffix: '+',
    gradient: 'from-primary to-secondary',
  },
  {
    icon: FileText,
    value: 50000,
    label: 'Practice sessions',
    suffix: '+',
    gradient: 'from-secondary to-primary',
  },
  {
    icon: Award,
    value: 92,
    label: 'Success rate',
    suffix: '%',
    gradient: 'from-success to-primary',
  },
  {
    icon: Clock,
    value: 100000,
    label: 'Hours of preparation',
    suffix: '+',
    gradient: 'from-warning to-secondary',
  },
];

const Counter = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const duration = 1800;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;

    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setCount(value);
        clearInterval(interval);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const StatsSection = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-bg px-4 py-20 text-text md:px-6"
    >
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Trusted by ambitious candidates
          </p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            A platform built for measurable confidence
          </h2>
          <p className="mt-3 text-lg text-muted">
            From early preparation to final-round readiness, our community keeps
            growing.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="rounded-[24px] border border-border/80 bg-card/70 p-6 text-center shadow-soft backdrop-blur-sm"
              >
                <div
                  className={`mx-auto mb-4 inline-flex rounded-2xl bg-gradient-to-br ${stat.gradient} p-3 text-white shadow-lg`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-3xl font-bold text-text md:text-4xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="mt-2 text-sm text-muted">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
