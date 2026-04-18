"use client";

import { ChevronDown } from "lucide-react";
import React from "react";

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperStyle?: React.CSSProperties;
}

export default function CustomSelect({ children, style, wrapperStyle, ...props }: Props) {
  return (
    <div style={{ position: "relative", width: "100%", ...wrapperStyle }}>
      <select
        {...props}
        style={{
          width: "100%",
          ...style,
          paddingRight: "32px",
          appearance: "none",
          WebkitAppearance: "none",
        }}>
        {children}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          color: "#7A8FB0",
          pointerEvents: "none",
          flexShrink: 0,
        }}
      />
    </div>
  );
}
