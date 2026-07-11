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
    title: 'Phân tích CV thông minh',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    image:
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Upload CV để AI phân tích kỹ năng và tạo bộ câu hỏi cá nhân hóa.',
    longDesc:
      'Hệ thống AI sẽ trích xuất kỹ năng, dự án và kinh nghiệm từ CV, từ đó tạo ra bộ câu hỏi sát nhu cầu tuyển dụng của từng vị trí.',
    highlights: [
      'Trích xuất kỹ năng và dự án',
      'Tạo câu hỏi phù hợp từng vị trí',
      'Gợi ý kỹ năng còn thiếu',
    ],
  },
  {
    id: 'adaptive',
    icon: Brain,
    title: 'Phỏng vấn Thích ứng',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    image:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Câu hỏi tự động điều chỉnh độ khó theo trình độ để tối ưu quá trình học.',
    longDesc:
      'AI liên tục phân tích phản hồi của bạn và tự điều chỉnh độ khó câu hỏi tiếp theo để luôn ở mức phù hợp nhất.',
    highlights: [
      'Điều chỉnh độ khó theo thời gian thực',
      'Lộ trình học tập tối ưu',
      'Tránh cảm giác nhàm chán hoặc quá tải',
    ],
  },
  {
    id: 'livecoding',
    icon: Code2,
    title: 'Live Coding',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    image:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Thực hành lập trình với AI chấm điểm, giải thích và đề xuất cải thiện.',
    longDesc:
      'Trình soạn thảo code tích hợp giúp bạn viết và chạy thử ngay trên nền tảng, đồng thời nhận phản hồi chi tiết từ AI.',
    highlights: [
      'Hỗ trợ nhiều ngôn ngữ',
      'Chấm điểm tự động với giải thích',
      'Gợi ý tối ưu hiệu năng code',
    ],
  },
  {
    id: 'exam',
    icon: BookOpen,
    title: 'Bộ đề thi MCQ',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    image:
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Ôn tập với ngân hàng câu hỏi trắc nghiệm đa dạng và chất lượng.',
    longDesc:
      'Kho câu hỏi được biên soạn chuyên nghiệp giúp bạn củng cố kiến thức nền tảng một cách toàn diện trước khi bước vào buổi phỏng vấn thật.',
    highlights: [
      'Hàng nghìn câu hỏi đa dạng',
      'Đề thi được biên soạn chuyên nghiệp',
      'Kết quả và giải thích chi tiết',
    ],
  },
  {
    id: 'history',
    icon: FileText,
    title: 'Phân tích & Lịch sử',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    image:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80',
    shortDesc:
      'Theo dõi tiến độ, điểm yếu và biểu đồ cải thiện qua từng lần luyện tập.',
    longDesc:
      'Bảng điều khiển trực quan giúp bạn nhận diện điểm mạnh, điểm yếu và lộ trình cải thiện rõ ràng hơn.',
    highlights: [
      'Biểu đồ tiến độ theo kỹ năng',
      'Phân tích điểm yếu cần tập trung',
      'So sánh với mặt bằng chung',
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
            <Zap className="h-4 w-4 text-yellow-400" />
            <span>Tính năng cốt lõi</span>
          </div>

          <h2 className="mb-4 text-3xl font-bold md:text-5xl">
            Luyện tập thông minh với{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              AI Interview
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted">
            Từ phân tích CV, mock interview đến live coding và theo dõi tiến độ
            — mọi thứ đều được kết nối trong một nền tảng chuyên nghiệp.
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
                <div className="relative overflow-hidden rounded-[24px] border border-border/80 bg-card/70 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_24px_60px_rgba(15,23,42,0.12)]">
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

                    <div className="mt-5 overflow-hidden max-h-0 transition-all duration-300 group-hover:max-h-80">
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
                        Bắt đầu ngay
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
