"use client";

import React from "react";

interface ActionButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  type?: "button" | "submit" | "reset";
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function ActionButton({
  children,
  href,
  onClick,
  type = "button",
  isLoading = false,
  disabled = false,
  className = "",
}: ActionButtonProps) {
  const content = (
    <>
      <span className="circle-icon" aria-hidden="true">
        {isLoading ? (
          <svg
            className="w-3.5 h-3.5 animate-spin text-primary"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        ) : (
          <svg
            className="arrow-svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        )}
      </span>
      <span>{children}</span>
    </>
  );

  const baseClasses = `btn-action ${isLoading ? "opacity-80 pointer-events-none" : ""} ${className}`.trim();

  if (href && !disabled && !isLoading) {
    return (
      <a href={href} onClick={onClick} className={baseClasses}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={baseClasses}
    >
      {content}
    </button>
  );
}
