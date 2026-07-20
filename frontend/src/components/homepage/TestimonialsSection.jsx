import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Mina Tran',
    role: 'Frontend Developer',
    content:
      'The feedback was sharp and practical. I quickly learned how to structure my answers better and sound more confident under pressure.',
    rating: 5,
    badge: 'Hired',
    badgeColor: 'bg-success/15 text-success',
    gender: 'female',
  },
  {
    id: 2,
    name: 'David Park',
    role: 'Data Analyst',
    content:
      'After two weeks of consistent practice, I walked into the final round feeling calm, prepared, and much clearer in my communication.',
    rating: 5,
    badge: 'Dream role',
    badgeColor: 'bg-primary/15 text-primary',
    gender: 'male',
  },
  {
    id: 3,
    name: 'Sarah Nguyen',
    role: 'Product Manager',
    content:
      'The questions felt realistic, and the scoring was surprisingly close to how a hiring manager evaluates candidates in real life.',
    rating: 5,
    badge: 'Top performer',
    badgeColor: 'bg-secondary/15 text-secondary',
    gender: 'female',
  },
  {
    id: 4,
    name: 'Alex Kim',
    role: 'Backend Engineer',
    content:
      'I used to ramble during interviews. Practicing here taught me how to answer with clarity, structure, and professional confidence.',
    rating: 5,
    badge: 'Confident now',
    badgeColor: 'bg-error/15 text-error',
    gender: 'male',
  },
  {
    id: 5,
    name: 'Hoang Nam',
    role: 'QA Engineer',
    content:
      'In just one week of focused practice, I felt ready for a senior-level interview that previously seemed intimidating.',
    rating: 5,
    badge: 'Senior role',
    badgeColor: 'bg-warning/15 text-warning',
    gender: 'male',
  },
  {
    id: 6,
    name: 'Phuong Linh',
    role: 'Business Analyst',
    content:
      'The scoring felt as rigorous as a real interviewer’s evaluation, especially when my answers lacked concrete evidence.',
    rating: 5,
    badge: 'Accurate AI',
    badgeColor: 'bg-primary/15 text-primary',
    gender: 'female',
  },
  {
    id: 7,
    name: 'Tien Dat',
    role: 'Mobile Developer',
    content:
      'This platform helped me prepare behavioral answers far better than before, especially with the STAR structure.',
    rating: 5,
    badge: 'Behavioral ready',
    badgeColor: 'bg-secondary/15 text-secondary',
    gender: 'male',
  },
  {
    id: 8,
    name: 'Hai Yen',
    role: 'HR Specialist',
    content:
      'As someone in hiring, I noticed candidates who practiced here answered more clearly, more confidently, and more directly.',
    rating: 5,
    badge: 'Highly rated',
    badgeColor: 'bg-success/15 text-success',
    gender: 'female',
  },
  {
    id: 9,
    name: 'Duc Anh',
    role: 'Full Stack Developer',
    content:
      'The system design questions were very realistic, and the practice sessions helped me perform much better in the real interview.',
    rating: 5,
    badge: 'Big Tech',
    badgeColor: 'bg-warning/15 text-warning',
    gender: 'male',
  },
  {
    id: 10,
    name: 'Mai Chi',
    role: 'Project Manager',
    content:
      'The interface is polished and easy to use. I could start a new practice session in just a few minutes.',
    rating: 5,
    badge: 'Easy to use',
    badgeColor: 'bg-primary/15 text-primary',
    gender: 'female',
  },
  {
    id: 11,
    name: 'Trung Kien',
    role: 'Cloud Architect',
    content:
      'With repeated practice on salary negotiation and self-presentation, I became much more confident in my value proposition.',
    rating: 5,
    badge: 'Negotiation ready',
    badgeColor: 'bg-secondary/15 text-secondary',
    gender: 'male',
  },
  {
    id: 12,
    name: 'Bich Ngoc',
    role: 'Content Creator',
    content:
      'The platform helped me answer the question “Why should we hire you?” with more confidence and better structure.',
    rating: 5,
    badge: 'More confident',
    badgeColor: 'bg-error/15 text-error',
    gender: 'female',
  },
  {
    id: 13,
    name: 'Quang Huy',
    role: 'Data Engineer',
    content:
      'The content is constantly updated, so I always found fresh questions around pipelines, data processing, and query optimization.',
    rating: 5,
    badge: 'Fresh content',
    badgeColor: 'bg-success/15 text-success',
    gender: 'male',
  },
  {
    id: 14,
    name: 'Khanh Vy',
    role: 'Scrum Master',
    content:
      'The mock interview experience felt like having a mentor available 24/7 to refine every answer until I felt ready.',
    rating: 5,
    badge: 'Mentor 24/7',
    badgeColor: 'bg-primary/15 text-primary',
    gender: 'female',
  },
  {
    id: 15,
    name: 'Minh Tuan',
    role: 'iOS Developer',
    content:
      'After a few weeks of consistent practice, I walked into the real interview feeling far less stressed than before.',
    rating: 5,
    badge: 'Less stress',
    badgeColor: 'bg-secondary/15 text-secondary',
    gender: 'male',
  },
  {
    id: 16,
    name: 'Lan Phuong',
    role: 'Finance Analyst',
    content:
      'The platform supports both English and Vietnamese, which is perfect for preparing for international opportunities.',
    rating: 5,
    badge: 'Bilingual',
    badgeColor: 'bg-warning/15 text-warning',
    gender: 'female',
  },
];

const getAvatarUrl = (name, gender) => {
  const colors =
    gender === 'female'
      ? ['ff6b6b', 'f06595', 'cc5de8', '845ef7', '5c7cfa', '339af0']
      : ['4dabf7', '339af0', '228be6', '1c7ed6', '1971c2', '1864ab'];

  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${randomColor}&color=fff&font-size=0.5&bold=true`;
};

const TestimonialsSection = () => {
  return (
    <section className="relative overflow-hidden bg-bg px-4 py-24 md:px-6">
      <div className="absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 h-[800px] w-[800px] rounded-full bg-secondary/10 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute left-0 top-1/2 h-[600px] w-[600px] rounded-full bg-primary/5 blur-3xl animate-blob animation-delay-4000" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.06),_transparent_42%)]" />
      </div>

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mx-auto mb-16 max-w-3xl text-center"
        >
          <motion.div
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
            whileHover={{ scale: 1.05, y: -2 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          >
            <Users className="h-4 w-4 text-warning" />
            <span>Community success</span>
          </motion.div>

          <h2 className="mb-4 text-3xl font-bold text-text md:text-5xl">
            Join thousands of candidates who prepared with confidence
          </h2>
          <p className="text-lg leading-8 text-muted">
            Hear what users say about the quality, relevance, and realism of our
            AI interview practice.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((testimonial, index) => (
            <motion.article
              key={testimonial.id}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.55,
                delay: index * 0.06,
                ease: 'easeOut',
              }}
              viewport={{ once: true }}
              whileHover={{ y: -8, scale: 1.02, rotateX: 2, rotateY: -2 }}
              className="group relative flex flex-col overflow-hidden rounded-[24px] border border-border/70 bg-card/70 p-5 shadow-soft backdrop-blur-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative mb-3 flex items-start justify-between">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${testimonial.badgeColor}`}
                >
                  {testimonial.badge}
                </span>
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.7 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + i * 0.03 }}
                    >
                      <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                    </motion.span>
                  ))}
                </div>
              </div>

              <p className="relative mb-4 flex-grow text-sm leading-relaxed text-muted">
                “{testimonial.content}”
              </p>

              <div className="relative mt-auto flex items-center gap-3 border-t border-border/70 pt-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary p-[2px] shadow-lg shadow-primary/20">
                  <img
                    src={getAvatarUrl(testimonial.name, testimonial.gender)}
                    alt={testimonial.name}
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-semibold text-text">
                    {testimonial.name}
                  </h4>
                  <p className="truncate text-xs text-muted">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <motion.button
            type="button"
            whileHover={{ y: -3, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/25 transition-all duration-300"
          >
            Join 10,000+ candidates
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
