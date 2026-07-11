import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket, Sparkles, CheckCircle } from 'lucide-react';

const CTASection = () => {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] px-4 py-24 md:px-6">
      <div className="absolute inset-0">
        <div className="absolute left-20 top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
      </div>

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

      <div className="container relative z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mx-auto max-w-4xl"
        >
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
            <Rocket className="h-4 w-4 text-yellow-400" />
            <span>Sẵn sàng để bắt đầu?</span>
          </div>

          <h2 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
            Bắt đầu hành trình{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
              chinh phục phỏng vấn
            </span>{' '}
            ngay hôm nay
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Tham gia cùng hàng ngàn ứng viên đã dùng AI Interview để luyện tập,
            cải thiện và tự tin bước vào buổi phỏng vấn thật.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              'Miễn phí 14 ngày',
              'Không cần thẻ tín dụng',
              'Hủy bất kỳ lúc nào',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-100/90 ring-1 ring-white/6"
              >
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-secondary px-8 py-3.5 font-semibold text-white shadow-lg shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-primary/50"
            >
              <span>Bắt đầu miễn phí</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-8 py-3.5 font-semibold text-slate-100 backdrop-blur-md transition-all duration-300 hover:bg-white/20"
            >
              Xem demo
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span>Được tin dùng bởi 10,000+ người dùng</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
