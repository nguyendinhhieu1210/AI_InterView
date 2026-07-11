import React from 'react';
import { Brain, Mail, MapPin, Phone } from 'lucide-react';
import {
  FaXTwitter,
  FaFacebook,
  FaLinkedin,
  FaGithub,
  FaYoutube,
} from 'react-icons/fa6';

const footerLinks = {
  product: [
    { label: 'AI Interview', href: '#' },
    { label: 'Live Coding', href: '#' },
    { label: 'CV Analysis', href: '#' },
    { label: 'MCQ Bank', href: '#' },
  ],
  resources: [
    { label: 'Hướng dẫn', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Tin tức', href: '#' },
    { label: 'Hỗ trợ', href: '#' },
  ],
  company: [
    { label: 'Về chúng tôi', href: '#' },
    { label: 'Tuyển dụng', href: '#' },
    { label: 'Liên hệ', href: '#' },
    { label: 'Đối tác', href: '#' },
  ],
  legal: [
    { label: 'Điều khoản', href: '#' },
    { label: 'Bảo mật', href: '#' },
    { label: 'Cookie', href: '#' },
    { label: 'Quyền riêng tư', href: '#' },
  ],
};

const socialIcons = [
  { icon: FaXTwitter, href: '#' },
  { icon: FaFacebook, href: '#' },
  { icon: FaLinkedin, href: '#' },
  { icon: FaGithub, href: '#' },
  { icon: FaYoutube, href: '#' },
];

const Footer = () => {
  return (
    <footer className="relative border-t border-border bg-card/80 text-text">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute left-1/2 top-0 h-[300px] w-[300px] rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4 py-16 md:px-6">
        <div className="mb-12 grid gap-8 rounded-[28px] border border-border/80 bg-bg/60 p-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <h3 className="text-2xl font-bold text-text">
              Đăng ký nhận tin mới nhất
            </h3>
            <p className="mt-2 text-muted">
              Nhận các mẹo luyện phỏng vấn, cập nhật tính năng và ưu đãi mỗi
              tuần.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="Email của bạn"
              className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 outline-none transition focus:border-primary"
            />
            <button className="rounded-2xl bg-gradient-to-r from-primary to-secondary px-6 py-3 font-semibold text-white shadow-lg shadow-primary/30 transition hover:-translate-y-0.5">
              Đăng ký
            </button>
          </div>
        </div>

        <div className="mb-12 grid gap-8 md:grid-cols-4">
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted transition hover:text-primary"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-semibold text-text">AI Interview</span>
            <span className="ml-2 text-sm text-muted">
              © {new Date().getFullYear()} All rights reserved
            </span>
          </div>
          <div className="flex items-center gap-4">
            {socialIcons.map((social, index) => {
              const Icon = social.icon;
              return (
                <a
                  key={index}
                  href={social.href}
                  className="text-muted transition hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-4 text-sm text-muted sm:grid-cols-2 md:grid-cols-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>support@aiinterview.vn</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>+84 123 456 789</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>Hà Nội, Việt Nam</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
