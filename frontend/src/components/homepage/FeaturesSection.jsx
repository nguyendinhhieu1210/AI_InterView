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
    title: 'Phỏng vấn AI thông minh',
    description:
      'Thực hành với AI thích ứng theo trình độ và nhận phản hồi tức thì.',
    bullets: [
      'Phân tích câu trả lời thời gian thực',
      'Điều chỉnh độ khó linh hoạt',
      'Gợi ý cải thiện sau mỗi lượt',
    ],
    accent: 'from-cyan-500 to-blue-500',
    iconClass: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    icon: FileText,
    title: 'Phân tích CV tự động',
    description:
      'Tải lên CV và nhận bộ câu hỏi cá nhân hóa phù hợp với hồ sơ của bạn.',
    bullets: [
      'Trích xuất kỹ năng và dự án',
      'Tạo câu hỏi theo vị trí ứng tuyển',
      'Đề xuất kỹ năng cần bổ sung',
    ],
    accent: 'from-violet-500 to-fuchsia-500',
    iconClass: 'bg-violet-500/15 text-violet-400',
  },
  {
    icon: Code2,
    title: 'Live Coding tương tác',
    description: 'Giải quyết thử thách lập trình và nhận đánh giá sâu từ AI.',
    bullets: [
      'Hỗ trợ nhiều ngôn ngữ',
      'Phân tích code và tối ưu',
      'Gợi ý cải thiện hiệu năng',
    ],
    accent: 'from-emerald-500 to-teal-500',
    iconClass: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Phân tích tiến độ',
    description: 'Theo dõi kỹ năng của bạn qua biểu đồ và báo cáo chi tiết.',
    bullets: [
      'Biểu đồ tiến độ theo thời gian',
      'Nhận diện điểm yếu',
      'So sánh với chuẩn tuyển dụng',
    ],
    accent: 'from-amber-500 to-orange-500',
    iconClass: 'bg-amber-500/15 text-amber-400',
  },
  {
    icon: Target,
    title: 'Lộ trình học thích ứng',
    description: 'Hệ thống tự động tối ưu câu hỏi cho từng mức độ của bạn.',
    bullets: [
      'Độ khó thay đổi theo phản hồi',
      'Giảm nhầm lẫn, tăng hiệu quả',
      'Luyện tập đúng trọng tâm',
    ],
    accent: 'from-pink-500 to-rose-500',
    iconClass: 'bg-pink-500/15 text-pink-400',
  },
  {
    icon: Clock,
    title: 'Luyện tập linh hoạt',
    description: 'Học mọi lúc, mọi nơi với trải nghiệm mượt mà và dễ tiếp cận.',
    bullets: [
      'Luyện tập theo thời gian riêng',
      'Phù hợp cả người mới và senior',
      'Đồng bộ multi-device',
    ],
    accent: 'from-sky-500 to-cyan-500',
    iconClass: 'bg-sky-500/15 text-sky-400',
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
            <span>Tính năng nổi bật</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Mọi thứ bạn cần để{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              chinh phục vị trí mơ ước
            </span>
          </h2>
          <p className="text-lg text-muted">
            Giao diện hiện đại, nội dung chuẩn chỉnh và công cụ học tập thông
            minh giúp bạn chuẩn bị hiệu quả hơn mỗi ngày.
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
                className="group rounded-3xl border border-border/80 bg-card/70 p-6 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur-sm"
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
                  <span>Tìm hiểu thêm</span>
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
