// src/components/base/BaseButton.jsx
import React from "react";
import { cn } from "../../utils/cn";

export const BaseButton = ({
  children,
  variant = "primary", // primary, secondary, outline, ghost, danger, success
  size = "md", // sm, md, lg
  className = "",
  disabled = false,
  loading = false,
  leftIcon = null,
  rightIcon = null,
  fullWidth = false,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary/90 shadow-md hover:shadow-lg",
    secondary:
      "bg-secondary text-white hover:bg-secondary/90 shadow-md hover:shadow-lg",
    outline:
      "border-2 border-border bg-transparent text-text hover:bg-card hover:border-primary",
    ghost: "bg-transparent text-text hover:bg-card hover:text-primary",
    danger: "bg-error text-white hover:bg-error/90 shadow-md hover:shadow-lg",
    success:
      "bg-success text-white hover:bg-success/90 shadow-md hover:shadow-lg",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
