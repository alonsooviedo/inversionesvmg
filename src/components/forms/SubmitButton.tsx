"use client";

import { useFormStatus } from "react-dom";

interface Props {
  label: string;
  pendingLabel?: string;
}

export default function SubmitButton({ label, pendingLabel = "Guardando..." }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: pending ? "#1A2744" : "linear-gradient(135deg, #00D9FF22, #00E5A022)",
        border: "1px solid #00D9FF44",
        color: pending ? "#7A8FB0" : "#00D9FF",
        cursor: pending ? "not-allowed" : "pointer",
      }}>
      {pending ? pendingLabel : label}
    </button>
  );
}
