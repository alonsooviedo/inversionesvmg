"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator as CalculatorIcon, X, Delete } from "lucide-react";

const STORAGE_KEY = "calculator_position";
const WINDOW_WIDTH = 260;
const WINDOW_HEIGHT = 360;

type Operator = "+" | "-" | "*" | "/";

type CalcState = {
  display: string;
  previousValue: number | null;
  operator: Operator | null;
  waitingForOperand: boolean;
};

const INITIAL_STATE: CalcState = {
  display: "0",
  previousValue: null,
  operator: null,
  waitingForOperand: false,
};

function calculate(a: number, b: number, op: Operator): number | null {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? null : a / b;
  }
}

function round2(n: number): number {
  const r = Math.round(n * 100) / 100;
  return Object.is(r, -0) ? 0 : r;
}

function formatDisplay(raw: string): string {
  if (raw === "Error") return raw;
  const neg = raw.startsWith("-");
  const s = neg ? raw.slice(1) : raw;
  const dotIndex = s.indexOf(".");
  let intPart = dotIndex === -1 ? s : s.slice(0, dotIndex);
  const decPart = dotIndex === -1 ? null : s.slice(dotIndex + 1);
  intPart = intPart.replace(/^0+(?=\d)/, "") || "0";
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = decPart !== null ? `${grouped}.${decPart}` : grouped;
  return (neg ? "-" : "") + out;
}

const BTN_BASE: React.CSSProperties = {
  border: "1px solid #1A2744",
  background: "#0E1628",
  color: "#E8EDF5",
  borderRadius: "8px",
  fontSize: "15px",
  height: "44px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.15s",
};

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          setPosition(clampPosition(parsed.x, parsed.y));
          return;
        }
      } catch {}
    }
    setPosition(clampPosition(window.innerWidth - WINDOW_WIDTH - 24, window.innerHeight - WINDOW_HEIGHT - 24));
  }, []);

  function clampPosition(x: number, y: number) {
    const maxX = Math.max(8, window.innerWidth - WINDOW_WIDTH - 8);
    const maxY = Math.max(8, window.innerHeight - WINDOW_HEIGHT - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  }

  function savePosition(x: number, y: number) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
  }

  function onHeaderPointerDown(e: React.PointerEvent) {
    if (!position) return;
    dragRef.current = { dragging: true, offsetX: e.clientX - position.x, offsetY: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    const next = clampPosition(e.clientX - dragRef.current.offsetX, e.clientY - dragRef.current.offsetY);
    setPosition(next);
  }

  function onHeaderPointerUp() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    if (position) savePosition(position.x, position.y);
  }

  function inputDigit(d: string) {
    setState((prev) => {
      if (prev.display === "Error") return { ...INITIAL_STATE, display: d, waitingForOperand: false };
      if (prev.waitingForOperand) return { ...prev, display: d, waitingForOperand: false };
      if (prev.display === "0") return { ...prev, display: d };
      const dotIdx = prev.display.indexOf(".");
      if (dotIdx !== -1 && prev.display.length - dotIdx - 1 >= 2) return prev;
      if (prev.display.replace(/[-.]/g, "").length >= 15) return prev;
      return { ...prev, display: prev.display + d };
    });
  }

  function inputDecimal() {
    setState((prev) => {
      if (prev.display === "Error") return { ...INITIAL_STATE, display: "0.", waitingForOperand: false };
      if (prev.waitingForOperand) return { ...prev, display: "0.", waitingForOperand: false };
      if (prev.display.includes(".")) return prev;
      return { ...prev, display: prev.display + "." };
    });
  }

  function performOperation(nextOperator: Operator) {
    setState((prev) => {
      if (prev.display === "Error") return { ...INITIAL_STATE };
      const inputValue = parseFloat(prev.display);
      if (prev.previousValue === null) {
        return { display: prev.display, previousValue: inputValue, operator: nextOperator, waitingForOperand: true };
      }
      if (prev.operator && !prev.waitingForOperand) {
        const result = calculate(prev.previousValue, inputValue, prev.operator);
        if (result === null) return { display: "Error", previousValue: null, operator: null, waitingForOperand: true };
        const rounded = round2(result);
        return { display: rounded.toFixed(2), previousValue: rounded, operator: nextOperator, waitingForOperand: true };
      }
      return { ...prev, operator: nextOperator };
    });
  }

  function handleEquals() {
    setState((prev) => {
      if (prev.display === "Error" || prev.operator === null || prev.previousValue === null) return prev;
      const inputValue = parseFloat(prev.display);
      const result = calculate(prev.previousValue, inputValue, prev.operator);
      if (result === null) return { display: "Error", previousValue: null, operator: null, waitingForOperand: true };
      const rounded = round2(result);
      return { display: rounded.toFixed(2), previousValue: null, operator: null, waitingForOperand: true };
    });
  }

  function handleClear() {
    setState(INITIAL_STATE);
  }

  function handleBackspace() {
    setState((prev) => {
      if (prev.display === "Error" || prev.waitingForOperand) return { ...prev, display: "0", waitingForOperand: false };
      if (prev.display.length <= 1 || (prev.display.length === 2 && prev.display.startsWith("-"))) {
        return { ...prev, display: "0" };
      }
      return { ...prev, display: prev.display.slice(0, -1) };
    });
  }

  function toggleSign() {
    setState((prev) => {
      if (prev.display === "Error" || prev.display === "0") return prev;
      return { ...prev, display: prev.display.startsWith("-") ? prev.display.slice(1) : "-" + prev.display };
    });
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (e.key >= "0" && e.key <= "9") { inputDigit(e.key); e.preventDefault(); return; }
      if (e.key === ".") { inputDecimal(); e.preventDefault(); return; }
      if (e.key === "+") { performOperation("+"); e.preventDefault(); return; }
      if (e.key === "-") { performOperation("-"); e.preventDefault(); return; }
      if (e.key === "*") { performOperation("*"); e.preventDefault(); return; }
      if (e.key === "/") { performOperation("/"); e.preventDefault(); return; }
      if (e.key === "Enter" || e.key === "=") { handleEquals(); e.preventDefault(); return; }
      if (e.key === "Backspace") { handleBackspace(); e.preventDefault(); return; }
      if (e.key === "Escape") { setIsOpen(false); e.preventDefault(); return; }
      if (e.key.toLowerCase() === "c") { handleClear(); e.preventDefault(); return; }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Calculadora"
        className="fixed bottom-6 right-6 z-40 p-3 rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: "#0E1628", border: "1px solid #00D9FF44", color: "#00D9FF" }}>
        <CalculatorIcon size={20} />
      </button>

      {isOpen && position && (
        <div
          className="fixed z-50 flex flex-col rounded-xl shadow-2xl select-none"
          style={{
            left: position.x,
            top: position.y,
            width: WINDOW_WIDTH,
            background: "#0B1220",
            border: "1px solid #1A2744",
          }}>
          <div
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerUp}
            className="flex items-center justify-between px-3 py-2 rounded-t-xl cursor-move"
            style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
            <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <CalculatorIcon size={13} /> Calculadora
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
              className="p-1 rounded transition-colors"
              style={{ color: "#7A8FB0" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
              <X size={14} />
            </button>
          </div>

          <div className="px-3 pt-3 pb-2">
            <div
              className="w-full text-right rounded-lg px-3 py-3 font-mono text-xl overflow-x-auto"
              style={{ background: "#0E1628", border: "1px solid #1A2744", color: state.display === "Error" ? "#EF4444" : "#00E5A0" }}>
              {formatDisplay(state.display)}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 px-3 pb-3">
            <button style={{ ...BTN_BASE, color: "#EF4444" }} onClick={handleClear}>C</button>
            <button style={BTN_BASE} onClick={handleBackspace}><Delete size={16} /></button>
            <button style={BTN_BASE} onClick={toggleSign}>±</button>
            <button style={{ ...BTN_BASE, color: "#00D9FF" }} onClick={() => performOperation("/")}>÷</button>

            <button style={BTN_BASE} onClick={() => inputDigit("7")}>7</button>
            <button style={BTN_BASE} onClick={() => inputDigit("8")}>8</button>
            <button style={BTN_BASE} onClick={() => inputDigit("9")}>9</button>
            <button style={{ ...BTN_BASE, color: "#00D9FF" }} onClick={() => performOperation("*")}>×</button>

            <button style={BTN_BASE} onClick={() => inputDigit("4")}>4</button>
            <button style={BTN_BASE} onClick={() => inputDigit("5")}>5</button>
            <button style={BTN_BASE} onClick={() => inputDigit("6")}>6</button>
            <button style={{ ...BTN_BASE, color: "#00D9FF" }} onClick={() => performOperation("-")}>−</button>

            <button style={BTN_BASE} onClick={() => inputDigit("1")}>1</button>
            <button style={BTN_BASE} onClick={() => inputDigit("2")}>2</button>
            <button style={BTN_BASE} onClick={() => inputDigit("3")}>3</button>
            <button style={{ ...BTN_BASE, color: "#00D9FF" }} onClick={() => performOperation("+")}>+</button>

            <button style={BTN_BASE} className="col-span-2" onClick={() => inputDigit("0")}>0</button>
            <button style={BTN_BASE} onClick={inputDecimal}>.</button>
            <button style={{ ...BTN_BASE, background: "#00E5A022", color: "#00E5A0", border: "1px solid #00E5A044" }} onClick={handleEquals}>=</button>
          </div>
        </div>
      )}
    </>
  );
}
