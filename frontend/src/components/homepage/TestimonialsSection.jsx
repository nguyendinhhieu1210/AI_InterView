import React from 'react';
import { motion } from 'framer-motion';
import { Star, Users, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Minh Thảo',
    role: 'Frontend Developer',
    content: `"AI-Interview đã giúp mình tự tin hơn rất nhiều. Sau vài buổi luyện tập với AI, mình nhận ra và sửa được những lỗi trả lời lan man mà trước giờ không để ý. AI feedback chi tiết và chính xác đến bất ngờ!"`,
    rating: 5,
    badge: 'Đã được tuyển',
    badgeColor: 'bg-green-500/20 text-green-400',
    gender: 'female',
  },
  {
    id: 2,
    name: 'Hữu Đức',
    role: 'Data Analyst',
    content: `"Sau đúng 2 tuần luyện tập mỗi tối 20-30 phút với các câu hỏi technical về SQL và phân tích dữ liệu, mình đã tự tin bước vào vòng phỏng vấn cuối và nhận được offer từ công ty mơ ước!"`,
    rating: 5,
    badge: 'Việc mơ ước',
    badgeColor: 'bg-blue-500/20 text-blue-400',
    gender: 'male',
  },
  {
    id: 3,
    name: 'Thanh Hà',
    role: 'Product Manager',
    content: `"Bộ câu hỏi ở đây phong phú hơn mình nghĩ rất nhiều, từ case study, ưu tiên tính năng cho tới xử lý conflict trong team. AI scoring chấm rất thực tế, giống hệt cách một hiring manager thật sẽ đánh giá."`,
    rating: 5,
    badge: 'Điểm cao',
    badgeColor: 'bg-purple-500/20 text-purple-400',
    gender: 'female',
  },
  {
    id: 4,
    name: 'Quốc Bảo',
    role: 'Backend Engineer',
    content: `"Trước đây mình rất sợ phỏng vấn vì hay bị khớp khi trình bày. Sau một thời gian luyện tập trả lời thành tiếng trên platform, giờ mình hào hứng hẳn mỗi khi có buổi interview mới."`,
    rating: 5,
    badge: 'Tự tin+',
    badgeColor: 'bg-pink-500/20 text-pink-400',
    gender: 'male',
  },
  {
    id: 5,
    name: 'Hoàng Nam',
    role: 'QA Engineer',
    content: `"Chỉ với 30 phút luyện tập mỗi ngày trong đúng 1 tuần, tập trung vào các câu hỏi về test case và automation, mình đã pass thẳng vòng phỏng vấn cho vị trí senior mà trước đó còn hơi lo mình chưa đủ kinh nghiệm."`,
    rating: 5,
    badge: 'Vị trí Senior',
    badgeColor: 'bg-orange-500/20 text-orange-400',
    gender: 'male',
  },
  {
    id: 6,
    name: 'Phương Linh',
    role: 'Business Analyst',
    content: `"Điều làm mình bất ngờ nhất là AI scoring chấm điểm chuẩn không kém gì một interviewer dày dạn kinh nghiệm, nhận ra ngay khi câu trả lời của mình thiếu số liệu cụ thể."`,
    rating: 5,
    badge: 'AI chính xác',
    badgeColor: 'bg-cyan-500/20 text-cyan-400',
    gender: 'female',
  },
  {
    id: 7,
    name: 'Tiến Đạt',
    role: 'Mobile Developer',
    content: `"AI-Interview giúp mình chuẩn bị behavioral questions tốt hơn bao giờ hết, đặc biệt là cách xây dựng câu trả lời theo framework STAR mạch lạc thay vì kể chuyện lan man như trước."`,
    rating: 5,
    badge: 'Behavioral',
    badgeColor: 'bg-indigo-500/20 text-indigo-400',
    gender: 'male',
  },
  {
    id: 8,
    name: 'Hải Yến',
    role: 'HR Specialist',
    content: `"Là người trực tiếp làm HR và tuyển dụng, mình thấy rõ những ứng viên từng luyện tập trên platform này trả lời có cấu trúc, tự tin và đi thẳng vào trọng tâm hơn hẳn so với mặt bằng chung."`,
    rating: 5,
    badge: 'HR đánh giá cao',
    badgeColor: 'bg-rose-500/20 text-rose-400',
    gender: 'female',
  },
  {
    id: 9,
    name: 'Đức Anh',
    role: 'Full Stack Dev',
    content: `"Bộ câu hỏi system design ở đây rất sát với thực tế phỏng vấn, từ thiết kế hệ thống chịu tải cao đến trade-off giữa consistency và availability. Nhờ luyện tập kỹ, mình đã pass vòng system design ở một công ty Big Tech."`,
    rating: 5,
    badge: 'Big Tech',
    badgeColor: 'bg-yellow-500/20 text-yellow-400',
    gender: 'male',
  },
  {
    id: 10,
    name: 'Mai Chi',
    role: 'Project Manager',
    content: `"Giao diện đẹp, thao tác mượt, không hề rối như một số app luyện phỏng vấn mình từng dùng trước đây. Chỉ mất vài phút là mình đã có thể bắt đầu một buổi luyện tập mới."`,
    rating: 5,
    badge: 'Dễ sử dụng',
    badgeColor: 'bg-lime-500/20 text-lime-400',
    gender: 'female',
  },
  {
    id: 11,
    name: 'Trung Kiên',
    role: 'Cloud Architect',
    content: `"Nhờ luyện tập kỹ các câu hỏi về đàm phán lương và trình bày giá trị bản thân trên AI-Interview, mình đã tự tin thương lượng và mức lương tăng tới 40% sau khi chuyển sang công ty mới. Thực sự đáng từng phút bỏ ra!"`,
    rating: 5,
    badge: 'Lương +40%',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
    gender: 'male',
  },
  {
    id: 12,
    name: 'Bích Ngọc',
    role: 'Content Creator',
    content: `"Trước đây câu 'Why should we hire you?' luôn làm mình bối rối vì không biết nên trả lời sao cho vừa khiêm tốn vừa thuyết phục. Sau khi luyện tập nhiều lần trên platform và xem lại feedback, mình đã tự tin trả lời trôi chảy ở buổi phỏng vấn thật."`,
    rating: 5,
    badge: 'Tự tin+',
    badgeColor: 'bg-pink-500/20 text-pink-400',
    gender: 'female',
  },
  {
    id: 13,
    name: 'Quang Huy',
    role: 'Data Engineer',
    content: `"Bộ câu hỏi cập nhật liên tục, mỗi lần vào luyện tập mình đều gặp câu hỏi mới về pipeline, xử lý dữ liệu lớn hay tối ưu hoá query, nên gần như không bao giờ hết nội dung để luyện tập."`,
    rating: 5,
    badge: 'Nội dung mới',
    badgeColor: 'bg-teal-500/20 text-teal-400',
    gender: 'male',
  },
  {
    id: 14,
    name: 'Khánh Vy',
    role: 'Scrum Master',
    content: `"Tính năng mock interview thực sự là game changer với mình. Cảm giác như có một mentor riêng sẵn sàng luyện tập cùng bất kể giờ giấc, chỉnh sửa từng câu trả lời cho tới khi mình thật sự tự tin."`,
    rating: 5,
    badge: 'Mentor 24/7',
    badgeColor: 'bg-sky-500/20 text-sky-400',
    gender: 'female',
  },
  {
    id: 15,
    name: 'Minh Tuấn',
    role: 'iOS Developer',
    content: `"Sau khi luyện tập đều đặn trên platform trong vài tuần, đến khi bước vào buổi phỏng vấn thật, mình cảm thấy nhẹ nhàng hơn rất nhiều so với những lần phỏng vấn trước, không còn bị căng thẳng quá mức nữa."`,
    rating: 5,
    badge: 'Không stress',
    badgeColor: 'bg-violet-500/20 text-violet-400',
    gender: 'male',
  },
  {
    id: 16,
    name: 'Lan Phương',
    role: 'Finance Analyst',
    content: `"Platform hỗ trợ cả tiếng Việt lẫn tiếng Anh nên mình có thể luyện tập song song cả hai, rất phù hợp cho các bạn đang chuẩn bị apply vào công ty nước ngoài hoặc môi trường làm việc đa quốc gia."`,
    rating: 5,
    badge: 'Song ngữ',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400',
    gender: 'female',
  },
];

// Hàm tạo avatar với UI Avatars API (hỗ trợ tên và giới tính)
const getAvatarUrl = (name, gender) => {
  // Sử dụng UI Avatars API - hỗ trợ tên và màu sắc
  const colors =
    gender === 'female'
      ? ['ff6b6b', 'f06595', 'cc5de8', '845ef7', '5c7cfa', '339af0']
      : ['4dabf7', '339af0', '228be6', '1c7ed6', '1971c2', '1864ab'];

  const randomColor = colors[Math.floor(Math.random() * colors.length)];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=128&background=${randomColor}&color=fff&font-size=0.5&bold=true`;
};

const TestimonialsSection = () => {
  return (
    <section className="relative py-24 px-4 md:px-6 bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-hidden">
      {/* Hiệu ứng blob chuyển động */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-purple-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-pink-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full text-sm font-medium text-white/90 mb-4"
            whileHover={{ scale: 1.05 }}
          >
            <Users className="w-4 h-4 text-yellow-400" />
            <span>CỘNG ĐỒNG</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Gia nhập cùng hàng nghìn ứng viên
          </h2>
          <p className="text-lg text-white/70">
            Nghe từ những người đã nâng cấp kỹ năng phỏng vấn với AI-Interview
          </p>
        </motion.div>

        {/* Grid 4 cột */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              viewport={{ once: true }}
              className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${testimonial.badgeColor}`}
                >
                  {testimonial.badge}
                </span>
                <div className="flex gap-0.5 flex-shrink-0">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>

              <p className="text-white/80 text-sm leading-relaxed mb-4 flex-grow">
                {testimonial.content}
              </p>

              <div className="flex items-center gap-3 mt-auto pt-3 border-t border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary p-0.5 flex-shrink-0">
                  <img
                    src={getAvatarUrl(testimonial.name, testimonial.gender)}
                    alt={testimonial.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-white text-sm truncate">
                    {testimonial.name}
                  </h4>
                  <p className="text-xs text-white/50 truncate">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Gia nhập 10,000+ ứng viên
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
