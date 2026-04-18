"use client";

import { ChevronDown } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";

interface Props {
  name: string;
  value?: string;
  defaultValue?: string;
  required?: boolean;
  style?: React.CSSProperties;
  children: React.ReactNode;
  onChange?: (value: string) => void;
}

interface OptionElement extends React.ReactElement {
  props: {
    value: string;
    children: React.ReactNode;
  };
}

export default function Dropdown({
  name,
  value: controlledValue,
  defaultValue,
  required,
  style,
  children,
  onChange,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(controlledValue || defaultValue || "");
  const [selectedLabel, setSelectedLabel] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract options from children
  const options = React.Children.toArray(children).filter(
    (child): child is OptionElement =>
      React.isValidElement(child) && child.type === "option"
  );

  // Find label for current value
  useEffect(() => {
    const option = options.find((opt) => opt.props.value === selectedValue);
    setSelectedLabel(option?.props.children?.toString() || "");
  }, [selectedValue, options]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    onChange?.(optionValue);
    // Trigger form's change event if in a form context
    if (inputRef.current) {
      inputRef.current.value = optionValue;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }} ref={containerRef}>
      {/* Hidden input for form submission */}
      <input
        ref={inputRef}
        type="hidden"
        name={name}
        value={selectedValue}
        required={required}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          textAlign: "left",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          ...style,
          paddingRight: "32px",
        }}
        onFocus={() => setIsOpen(true)}>
        <span>{selectedLabel || (defaultValue ? "" : "Seleccionar...")}</span>
      </button>

      {/* Chevron icon */}
      <ChevronDown
        size={14}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: `translateY(-50%) rotate(${isOpen ? 180 : 0}deg)`,
          color: "#7A8FB0",
          pointerEvents: "none",
          flexShrink: 0,
          transition: "transform 0.2s",
        }}
      />

      {/* Dropdown menu */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "#0E1628",
            border: "1px solid #1A2744",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            zIndex: 50,
            maxHeight: "240px",
            overflowY: "auto",
          }}>
          {options.map((option, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelect(option.props.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                textAlign: "left",
                background:
                  selectedValue === option.props.value
                    ? "#1A2744"
                    : "transparent",
                color:
                  selectedValue === option.props.value ? "#00D9FF" : "#E8EDF5",
                border: "none",
                borderBottom:
                  idx < options.length - 1 ? "1px solid #1A274433" : "none",
                fontSize: "13px",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.background =
                  selectedValue === option.props.value ? "#1A2744" : "#1A274466";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.background =
                  selectedValue === option.props.value ? "#1A2744" : "transparent";
              }}>
              {option.props.children}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
