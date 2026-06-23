// components/base/BaseBadge.jsx
import React from 'react';
import { cn } from '../../utils/cn';

export const BaseBadge = ({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  rounded = false,
}) => {
  const variants = {
    default: 'bg-card text-text border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-secondary/10 text-secondary border border-secondary/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        variants[variant],
        sizes[size],
        rounded ? 'rounded-full' : 'rounded-lg',
        className
      )}
    >
      {children}
    </span>
  );
};
