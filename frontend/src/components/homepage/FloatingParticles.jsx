import React, { useRef } from 'react';
import { motion } from 'framer-motion';

const FloatingParticles = ({ count = 30, color = 'blue' }) => {
  const containerRef = useRef(null);
  const particles = [];

  const colors = {
    blue: 'from-blue-400/20 to-purple-400/20',
    purple: 'from-purple-400/20 to-pink-400/20',
    green: 'from-green-400/20 to-emerald-400/20',
    orange: 'from-orange-400/20 to-red-400/20',
  };

  for (let i = 0; i < count; i++) {
    const size = Math.random() * 6 + 2;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const duration = Math.random() * 10 + 10;
    const delay = Math.random() * 5;

    particles.push(
      <motion.div
        key={i}
        className={`absolute rounded-full bg-gradient-to-r ${colors[color]} blur-sm`}
        style={{
          width: size,
          height: size,
          left: `${x}%`,
          top: `${y}%`,
        }}
        animate={{
          x: [0, Math.random() * 100 - 50, 0],
          y: [0, Math.random() * 100 - 50, 0],
          scale: [1, 1.5, 1],
          opacity: [0.3, 0.8, 0.3],
        }}
        transition={{
          duration: duration,
          repeat: Infinity,
          delay: delay,
          ease: 'easeInOut',
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {particles}
    </div>
  );
};

export default FloatingParticles;
