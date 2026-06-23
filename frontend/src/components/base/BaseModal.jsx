// components/base/BaseModal.jsx
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { BaseButton } from './BaseButton';

export const BaseModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true,
  closeButtonIcon = <X className="w-5 h-5 text-muted" />, // ✅ Cho phép custom icon
  overlayClassName = '', // ✅ Cho phép custom overlay
  preventScroll = true, // ✅ Tùy chọn chặn scroll
}) => {
  const modalRef = useRef(null);

  // ✅ Xử lý Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // ✅ Quản lý scroll
  useEffect(() => {
    if (isOpen && preventScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, preventScroll]);

  // ✅ Chặn click vào modal content để không đóng
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl', // ✅ Thêm size 2xl
    full: 'max-w-[95vw]', // ✅ Thêm size full
  };

  // ✅ Hỗ trợ animation tùy chỉnh
  const animationClass = 'animate-scaleIn';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-md animate-fadeIn',
          overlayClassName
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-card rounded-2xl shadow-soft border border-border w-full',
          sizes[size] || sizes.md,
          animationClass,
          className
        )}
        onClick={handleModalClick} // ✅ Chặn propagation
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-border">
            {title &&
              (typeof title === 'string' ? (
                <h3 className="text-xl font-semibold text-text">{title}</h3>
              ) : (
                title
              ))}
            {showCloseButton && (
              <BaseButton
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-muted/10 transition-colors"
              >
                {closeButtonIcon}
              </BaseButton>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            'p-6',
            // ✅ Nếu không có header, thêm padding top
            !title && !showCloseButton && 'pt-6'
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-border flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes scaleOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.95) translateY(10px); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.25s ease-out; }
        .animate-scaleOut { animation: scaleOut 0.2s ease-in; }
      `}</style>
    </div>
  );
};

// ✅ Export cả ModalHeader, ModalBody, ModalFooter để sử dụng linh hoạt
export const ModalHeader = ({ children, className = '' }) => (
  <div className={cn('px-6 pt-5 pb-3 border-b border-border', className)}>
    {children}
  </div>
);

export const ModalBody = ({ children, className = '' }) => (
  <div className={cn('p-6', className)}>{children}</div>
);

export const ModalFooter = ({ children, className = '' }) => (
  <div
    className={cn(
      'p-6 border-t border-border flex justify-end gap-3',
      className
    )}
  >
    {children}
  </div>
);
