"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator as CalculatorIcon, X, Delete } from "lucide-react";

const STORAGE_KEY = "calculator_position";
const BASE_WIDTH = 260;
const BASE_HEIGHT = 384;
const MIN_WIDTH = 220;
const MAX_WIDTH = 480;

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

function operatorSymbol(op: Operator): string {
  switch (op) {
    case "+": return "+";
    case "-": return "−";
    case "*": return "×";
    case "/": return "÷";
  }
}

const BTN_BASE: React.CSSProperties = {
  border: "1px solid #1A2744",
  background: "#0E1628",
  color: "#E8EDF5",
  borderRadius: "8px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "background 0.1s, transform 0.1s",
};

const BTN_PRESSED: React.CSSProperties = {
  transform: "scale(0.92)",
  filter: "brightness(1.4)",
};

export default function FloatingCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [width, setWidth] = useState(BASE_WIDTH);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  });
  const resizeRef = useRef<{ resizing: boolean; startX: number; startWidth: number }>({
    resizing: false,
    startX: 0,
    startWidth: BASE_WIDTH,
  });
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const liveRef = useRef<{ x: number; y: number; width: number }>({ x: 0, y: 0, width: BASE_WIDTH });
  const scale = width / BASE_WIDTH;

  function px(base: number): number {
    return Math.round(base * scale);
  }

  function flashKey(id: string) {
    setPressedKey(id);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setPressedKey((k) => (k === id ? null : k)), 120);
  }

  function btnStyle(id: string, extra?: React.CSSProperties): React.CSSProperties {
    return {
      ...BTN_BASE,
      ...extra,
      height: px(44),
      fontSize: px(15),
      ...(pressedKey === id ? BTN_PRESSED : null),
    };
  }

  function pressHandlers(id: string) {
    return {
      onPointerDown: () => setPressedKey(id),
      onPointerUp: () => setPressedKey((k) => (k === id ? null : k)),
      onPointerLeave: () => setPressedKey((k) => (k === id ? null : k)),
    };
  }

  function clampWidth(w: number) {
    const viewportMax = typeof window !== "undefined" ? window.innerWidth - 16 : MAX_WIDTH;
    return Math.min(Math.max(MIN_WIDTH, w), Math.min(MAX_WIDTH, viewportMax));
  }

  function clampPosition(x: number, y: number, w?: number) {
    const effectiveWidth = w ?? panelRef.current?.offsetWidth ?? width;
    const effectiveHeight = panelRef.current?.offsetHeight ?? BASE_HEIGHT * (effectiveWidth / BASE_WIDTH);
    const maxX = Math.max(8, window.innerWidth - effectiveWidth - 8);
    const maxY = Math.max(8, window.innerHeight - effectiveHeight - 8);
    return { x: Math.min(Math.max(8, x), maxX), y: Math.min(Math.max(8, y), maxY) };
  }

  function saveLive() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liveRef.current));
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    let initialWidth = BASE_WIDTH;
    let initialPos: { x: number; y: number };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed.width === "number") initialWidth = clampWidth(parsed.width);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          initialPos = clampPosition(parsed.x, parsed.y, initialWidth);
          setWidth(initialWidth);
          setPosition(initialPos);
          liveRef.current = { x: initialPos.x, y: initialPos.y, width: initialWidth };
          return;
        }
      } catch {}
    }
    setWidth(initialWidth);
    const estHeight = BASE_HEIGHT * (initialWidth / BASE_WIDTH);
    initialPos = clampPosition(window.innerWidth - initialWidth - 24, window.innerHeight - estHeight - 24, initialWidth);
    setPosition(initialPos);
    liveRef.current = { x: initialPos.x, y: initialPos.y, width: initialWidth };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onHeaderPointerDown(e: React.PointerEvent) {
    if (!position) return;
    dragRef.current = { dragging: true, offsetX: e.clientX - position.x, offsetY: e.clientY - position.y };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }

  function onHeaderPointerMove(e: React.PointerEvent) {
    if (!dragRef.current.dragging) return;
    const next = clampPosition(e.clientX - dragRef.current.offsetX, e.clientY - dragRef.current.offsetY);
    setPosition(next);
    liveRef.current = { ...liveRef.current, x: next.x, y: next.y };
  }

  function onHeaderPointerUp() {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    saveLive();
  }

  function onResizePointerDown(e: React.PointerEvent) {
    resizeRef.current = { resizing: true, startX: e.clientX, startWidth: width };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  }

  function onResizePointerMove(e: React.PointerEvent) {
    if (!resizeRef.current.resizing) return;
    const delta = e.clientX - resizeRef.current.startX;
    const nextWidth = clampWidth(resizeRef.current.startWidth + delta);
    setWidth(nextWidth);
    const next = clampPosition(liveRef.current.x, liveRef.current.y, nextWidth);
    setPosition(next);
    liveRef.current = { x: next.x, y: next.y, width: nextWidth };
  }

  function onResizePointerUp() {
    if (!resizeRef.current.resizing) return;
    resizeRef.current.resizing = false;
    saveLive();
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

      if (e.key >= "0" && e.key <= "9") { inputDigit(e.key); flashKey(e.key); e.preventDefault(); return; }
      if (e.key === ".") { inputDecimal(); flashKey("."); e.preventDefault(); return; }
      if (e.key === "+") { performOperation("+"); flashKey("+"); e.preventDefault(); return; }
      if (e.key === "-") { performOperation("-"); flashKey("-"); e.preventDefault(); return; }
      if (e.key === "*") { performOperation("*"); flashKey("*"); e.preventDefault(); return; }
      if (e.key === "/") { performOperation("/"); flashKey("/"); e.preventDefault(); return; }
      if (e.key === "Enter" || e.key === "=") { handleEquals(); flashKey("="); e.preventDefault(); return; }
      if (e.key === "Backspace") { handleBackspace(); flashKey("back"); e.preventDefault(); return; }
      if (e.key === "Escape") { setIsOpen(false); e.preventDefault(); return; }
      if (e.key.toLowerCase() === "c") { handleClear(); flashKey("clear"); e.preventDefault(); return; }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Calculadora"
        className="fixed bottom-6 right-6 z-[60] p-3 rounded-full shadow-lg transition-transform hover:scale-105"
        style={{ background: "#0E1628", border: "1px solid #00D9FF44", color: "#00D9FF" }}>
        <CalculatorIcon size={20} />
      </button>

      {isOpen && position && (
        <div
          ref={panelRef}
          className="fixed z-[60] flex flex-col rounded-xl shadow-2xl select-none"
          style={{
            left: position.x,
            top: position.y,
            width,
            background: "#0B1220",
            border: "1px solid #1A2744",
          }}>
          <div
            onPointerDown={onHeaderPointerDown}
            onPointerMove={onHeaderPointerMove}
            onPointerUp={onHeaderPointerUp}
            className="flex items-center justify-between rounded-t-xl cursor-move"
            style={{ background: "#0E1628", borderBottom: "1px solid #1A2744", padding: `${px(8)}px ${px(12)}px` }}>
            <span className="font-medium text-text-secondary flex items-center gap-1.5" style={{ fontSize: px(12) }}>
              <CalculatorIcon size={px(13)} /> Calculadora
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
              className="rounded transition-colors"
              style={{ color: "#7A8FB0", padding: px(4) }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
              <X size={px(14)} />
            </button>
          </div>

          <div style={{ padding: `${px(12)}px ${px(12)}px ${px(8)}px` }}>
            <div
              className="w-full text-right rounded-lg overflow-x-auto"
              style={{ background: "#0E1628", border: "1px solid #1A2744", padding: px(12) }}>
              <div className="font-mono" style={{ color: "#7A8FB0", fontSize: px(12), height: px(16) }}>
                {state.operator && state.previousValue !== null
                  ? `${formatDisplay(state.previousValue.toFixed(2))} ${operatorSymbol(state.operator)}`
                  : " "}
              </div>
              <div className="font-mono" style={{ fontSize: px(20), color: state.display === "Error" ? "#EF4444" : "#00E5A0" }}>
                {formatDisplay(state.display)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4" style={{ gap: px(6), padding: `0 ${px(12)}px ${px(12)}px` }}>
            <button style={btnStyle("clear", { color: "#EF4444" })} {...pressHandlers("clear")} onClick={handleClear}>C</button>
            <button style={btnStyle("back")} {...pressHandlers("back")} onClick={handleBackspace}><Delete size={px(16)} /></button>
            <button style={btnStyle("sign")} {...pressHandlers("sign")} onClick={toggleSign}>±</button>
            <button style={btnStyle("/", { color: "#00D9FF" })} {...pressHandlers("/")} onClick={() => performOperation("/")}>÷</button>

            <button style={btnStyle("7")} {...pressHandlers("7")} onClick={() => inputDigit("7")}>7</button>
            <button style={btnStyle("8")} {...pressHandlers("8")} onClick={() => inputDigit("8")}>8</button>
            <button style={btnStyle("9")} {...pressHandlers("9")} onClick={() => inputDigit("9")}>9</button>
            <button style={btnStyle("*", { color: "#00D9FF" })} {...pressHandlers("*")} onClick={() => performOperation("*")}>×</button>

            <button style={btnStyle("4")} {...pressHandlers("4")} onClick={() => inputDigit("4")}>4</button>
            <button style={btnStyle("5")} {...pressHandlers("5")} onClick={() => inputDigit("5")}>5</button>
            <button style={btnStyle("6")} {...pressHandlers("6")} onClick={() => inputDigit("6")}>6</button>
            <button style={btnStyle("-", { color: "#00D9FF" })} {...pressHandlers("-")} onClick={() => performOperation("-")}>−</button>

            <button style={btnStyle("1")} {...pressHandlers("1")} onClick={() => inputDigit("1")}>1</button>
            <button style={btnStyle("2")} {...pressHandlers("2")} onClick={() => inputDigit("2")}>2</button>
            <button style={btnStyle("3")} {...pressHandlers("3")} onClick={() => inputDigit("3")}>3</button>
            <button style={btnStyle("+", { color: "#00D9FF" })} {...pressHandlers("+")} onClick={() => performOperation("+")}>+</button>

            <button style={btnStyle("0")} className="col-span-2" {...pressHandlers("0")} onClick={() => inputDigit("0")}>0</button>
            <button style={btnStyle(".")} {...pressHandlers(".")} onClick={inputDecimal}>.</button>
            <button style={btnStyle("=", { background: "#00E5A022", color: "#00E5A0", border: "1px solid #00E5A044" })} {...pressHandlers("=")} onClick={handleEquals}>=</button>
          </div>

          <div
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            aria-label="Redimensionar"
            className="absolute bottom-0 right-0"
            style={{ width: px(18), height: px(18), cursor: "nwse-resize", touchAction: "none" }}>
            <svg width="100%" height="100%" viewBox="0 0 16 16" style={{ opacity: 0.5 }}>
              <path d="M14 2 L2 14 M14 7 L7 14 M14 12 L12 14" stroke="#7A8FB0" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
