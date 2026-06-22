// src/components/base/BaseDropdown.jsx
import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export const BaseDropdown = ({
  trigger,
  children,
  className = "",
  align = "right", // left, right
  width = "auto", // auto, full
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alignStyles = {
    left: "left-0",
    right: "right-0",
  };

  const widthStyles = {
    auto: "w-auto",
    full: "w-full",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            "absolute mt-2 bg-card rounded-xl shadow-soft border border-border py-1 z-50 animate-fadeIn",
            alignStyles[align],
            widthStyles[width],
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export const DropdownItem = ({ children, onClick, icon, className = "" }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-card transition-colors",
      className,
    )}
  >
    {icon && <span className="text-muted">{icon}</span>}
    {children}
  </button>
);
