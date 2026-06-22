// src/components/base/BaseCard.jsx
import React from "react";
import { cn } from "../../utils/cn";

export const BaseCard = ({
  children,
  className = "",
  hover = false,
  padding = true,
  border = true,
  shadow = true,
  gradient = false,
  ...props
}) => {
  const baseStyles = "rounded-2xl bg-card transition-all duration-300";

  const paddingStyles = padding ? "p-6" : "";
  const borderStyles = border ? "border border-border" : "";
  const shadowStyles = shadow ? "shadow-soft" : "";
  const hoverStyles = hover ? "hover:shadow-lg hover:scale-[1.02]" : "";
  const gradientStyles = gradient
    ? "bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5"
    : "";

  return (
    <div
      className={cn(
        baseStyles,
        paddingStyles,
        borderStyles,
        shadowStyles,
        hoverStyles,
        gradientStyles,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
