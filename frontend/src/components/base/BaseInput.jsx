// src/components/base/BaseInput.jsx
import React, { forwardRef } from "react";
import { cn } from "../../utils/cn";

export const BaseInput = forwardRef(
  (
    {
      label,
      error,
      success,
      helperText,
      leftIcon = null,
      rightIcon = null,
      className = "",
      inputClassName = "",
      required = false,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "w-full bg-card text-text rounded-xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted/60";

    const stateStyles = error
      ? "border-error focus:border-error focus:ring-error/30"
      : success
        ? "border-success focus:border-success focus:ring-success/30"
        : "border-border focus:border-primary";

    const paddingStyles = leftIcon ? "pl-10" : "pl-4";
    const paddingRightStyles = rightIcon ? "pr-10" : "pr-4";

    const sizes = {
      sm: "py-1.5 text-sm",
      md: "py-2.5 text-sm",
      lg: "py-3 text-base",
    };

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label className="block text-sm font-medium text-text mb-1.5">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              baseStyles,
              stateStyles,
              paddingStyles,
              paddingRightStyles,
              sizes[props.size || "md"],
              inputClassName,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || error || success) && (
          <p
            className={cn(
              "text-xs mt-1.5",
              error ? "text-error" : success ? "text-success" : "text-muted",
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  },
);

BaseInput.displayName = "BaseInput";
