import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  Sparkles,
  FileText,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import FloatingParticles from './FloatingParticles';
import AnimatedBackground from './AnimatedBackground';

const HeroSection = () => {
  return (
    <section className="relative min-h-[100vh] flex items-center overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)]">
      <AnimatedBackground variant={2} />
      <FloatingParticles count={36} color="blue" />

      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-pink-500/10"
        animate={{
          background: [
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(129,140,248,0.12), rgba(236,72,153,0.12))',
            'linear-gradient(225deg, rgba(59,130,246,0.12), rgba(129,140,248,0.12), rgba(236,72,153,0.12))',
            'linear-gradient(45deg, rgba(59,130,246,0.12), rgba(129,140,248,0.12), rgba(236,72,153,0.12))',
          ],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-4 md:px-6 relative z-10 py-20 lg:py-24">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur-md"
              whileHover={{ scale: 1.03 }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span>Nền tảng luyện phỏng vấn AI chuẩn doanh nghiệp</span>
            </motion.div>

            <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-7xl">
              <span className="block">Chinh phục</span>
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                phỏng vấn
              </span>
              <span className="mt-2 block">cùng AI</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              Luyện tập với AI phản hồi sát thực tế, phân tích CV, thực hành
              live coding và theo dõi tiến bộ của bạn trong một trải nghiệm mượt
              mà, chuyên nghiệp.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-secondary px-7 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/50"
              >
                <span>Bắt đầu miễn phí</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-7 py-3.5 font-semibold text-slate-100 backdrop-blur-md transition-all duration-300 hover:bg-white/20"
              >
                <Play className="h-5 w-5" />
                Xem demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`https://i.pravatar.cc/40?img=${i}`}
                      alt="User"
                      className="h-9 w-9 rounded-full border-2 border-slate-900"
                    />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    10K+ người dùng
                  </p>
                  <p className="text-sm text-slate-400">
                    Đang luyện tập mỗi ngày
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-yellow-400">
                {'★'.repeat(5)}
                <span className="ml-1 text-sm text-slate-400">4.9/5</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: 10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative"
          >
            <div className="relative rounded-[28px] border border-white/15 bg-slate-900/70 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-slate-800/90 to-slate-900/90 p-5">
                <div className="flex items-start justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      AI Phỏng vấn viên
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Đang hỏi câu mở theo ngữ cảnh
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Online
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">
                          Phản hồi ngay
                        </p>
                        <p className="text-sm text-slate-400">
                          Cụ thể, thực tế
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
                        <p className="font-semibold text-white">
                          CV được phân tích
                        </p>
                        <p className="text-sm text-slate-400">
                          Tự động gợi câu hỏi
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>Điểm số & phân tích</span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      { value: '92%', label: 'Độ chính xác' },
                      { value: '500+', label: 'Câu hỏi' },
                      { value: '4.9', label: 'Đánh giá' },
                    ].map((stat, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-white/5 p-3 text-center"
                      >
                        <p className="text-lg font-semibold text-white">
                          {stat.value}
                        </p>
                        <p className="text-xs text-slate-400">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
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
        <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/20">
          <motion.div
            className="mt-2 h-3 w-1 rounded-full bg-white/40"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
