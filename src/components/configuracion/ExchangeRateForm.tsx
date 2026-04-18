"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExchangeRate } from "@/app/actions/accounts";
import SubmitButton from "@/components/forms/SubmitButton";

const INPUT = {
  width: "100%", background: "#0E1628", border: "1px solid #1A2744",
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  color: "#E8EDF5", outline: "none",
} as const;

const LABEL = "block text-xs text-text-muted uppercase tracking-wider mb-1.5";

export default function ExchangeRateForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(createExchangeRate, null);
  const [formKey, setFormKey] = useState(0);

  const today = new Date();
  const defaultPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;

  useEffect(() => {
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>
          {state.error}
        </div>
      )}
      {state && "success" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#00E5A015", color: "#00E5A0", border: "1px solid #00E5A030" }}>
          Tipo de cambio actualizado correctamente
        </div>
      )}
      <div>
        <label className={LABEL}>Período</label>
        <input name="period" type="date" required defaultValue={defaultPeriod} style={INPUT} />
      </div>
      <div>
        <label className={LABEL}>Colones por 1 USD (₡)</label>
        <input name="usd_to_crc" type="number" step="0.01" min="1" required style={INPUT} placeholder="Ej. 518.50" />
      </div>
      <div>
        <label className={LABEL}>Notas (opcional)</label>
        <input name="notes" style={INPUT} placeholder="Ej. BCCR promedio del mes" />
      </div>
      <div className="flex justify-end">
        <SubmitButton label="Guardar tipo de cambio" />
      </div>
    </form>
  );
}
