"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/forms/Modal";
import SubmitButton from "@/components/forms/SubmitButton";
import { createInstitution } from "@/app/actions/institutions";
import { formatUSD, formatCurrency, instrumentLabel } from "@/lib/utils";
import type { Institution, Investment, ExchangeRate } from "@/lib/types";
import { Plus, Building2 } from "lucide-react";

const INPUT = {
  width: "100%", background: "#0E1628", border: "1px solid #1A2744",
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  color: "#E8EDF5", outline: "none",
} as const;

const LABEL = "block text-xs text-text-muted uppercase tracking-wider mb-1.5";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  fondo_vista:   { bg: "#00D9FF18", text: "#00D9FF" },
  fondo_cerrado: { bg: "#00E5A018", text: "#00E5A0" },
  cdp:           { bg: "#F59E0B18", text: "#F59E0B" },
  bono:          { bg: "#A78BFA18", text: "#A78BFA" },
};

const DEFAULT_TYPE = { bg: "#3D508018", text: "#7A8FB0" };

function toUSD(amount: number, currency: string, rate: number) {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

function InstitutionForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createInstitution, null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>
          {state.error}
        </div>
      )}
      <div>
        <label className={LABEL}>Nombre</label>
        <input name="name" required style={INPUT} placeholder="Ej. Banco BAC San José" />
      </div>
      <div>
        <label className={LABEL}>País</label>
        <input name="country" required style={INPUT} placeholder="Ej. Costa Rica" />
      </div>
      <div className="flex items-center gap-3">
        <input type="checkbox" name="active" id="active" defaultChecked style={{ accentColor: "#00D9FF" }} />
        <label htmlFor="active" className="text-sm text-text-secondary">Activa</label>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>
          Cancelar
        </button>
        <SubmitButton label="Crear institución" />
      </div>
    </form>
  );
}

interface Props {
  institutions: Institution[];
  investments: Investment[];
  exchangeRate: number;
  grandTotalUSD: number;
}

export default function InstitucionesManager({ institutions, investments, exchangeRate, grandTotalUSD }: Props) {
  const [open, setOpen] = useState(false);

  const rows = institutions
    .map((inst) => {
      const invs = investments.filter((i) => i.institution_id === inst.id);
      const totalUSD = invs.reduce((s, i) => s + toUSD(i.current_balance, i.currency, exchangeRate), 0);
      return { institution: inst, investments: invs, totalUSD, percentage: grandTotalUSD > 0 ? totalUSD / grandTotalUSD : 0 };
    })
    .sort((a, b) => b.totalUSD - a.totalUSD);

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF44", color: "#00D9FF" }}>
          <Plus size={14} /> Nueva institución
        </button>
      </div>

      <div className="space-y-4">
        {rows.map(({ institution, investments: invs, totalUSD, percentage }) => (
          <div key={institution.id} className="rounded-2xl" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: invs.length > 0 ? "1px solid #1A2744" : "none" }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#162040", border: "1px solid #1A2744" }}>
                  <Building2 size={16} style={{ color: "#00D9FF" }} />
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{institution.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">{institution.country}</span>
                    {!institution.active && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "#EF444418", color: "#EF4444" }}>Inactiva</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 text-right">
                {invs.length > 0 ? (
                  <>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">% Cartera</p>
                      <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: "#00D9FF" }}>{(percentage * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">Total USD</p>
                      <p className="font-mono text-sm font-semibold mt-0.5" style={{ color: "#E8EDF5" }}>{formatUSD(totalUSD)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider">Inversiones</p>
                      <p className="font-mono text-sm font-semibold mt-0.5 text-text-primary">{invs.length}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-text-muted">Sin inversiones activas</span>
                )}
              </div>
            </div>
            {invs.length > 0 && (
              <>
                <div className="px-6 py-3" style={{ borderBottom: "1px solid #1A2744" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1A2744" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${Math.min(percentage * 100, 100)}%`, background: "linear-gradient(90deg, #00D9FF, #00E5A0)" }} />
                    </div>
                    <span className="text-xs font-mono text-text-muted w-10 text-right">{(percentage * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "#0E1628" }}>
                        {["Inversión", "Tipo", "Saldo", "Equiv. USD"].map((h) => (
                          <th key={h} className="px-6 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {invs.map((inv, i) => {
                        const typeColor = TYPE_COLORS[inv.instrument_type] ?? DEFAULT_TYPE;
                        const usd = toUSD(inv.current_balance, inv.currency, exchangeRate);
                        return (
                          <tr key={inv.id} style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderTop: "1px solid #1A274433" }}>
                            <td className="px-6 py-3"><p className="font-medium text-text-primary">{inv.name}</p></td>
                            <td className="px-6 py-3">
                              <span className="text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: typeColor.bg, color: typeColor.text }}>{instrumentLabel(inv.instrument_type)}</span>
                            </td>
                            <td className="px-6 py-3">
                              <span className="font-mono text-xs text-text-primary">{formatCurrency(inv.current_balance, inv.currency)}</span>
                              <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "#1A2744", color: "#7A8FB0" }}>{inv.currency}</span>
                            </td>
                            <td className="px-6 py-3"><span className="font-mono text-xs font-medium text-accent-cyan">{formatUSD(usd)}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        ))}
        {institutions.length === 0 && (
          <div className="rounded-2xl p-8 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
            No hay instituciones registradas.
          </div>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Nueva institución" maxWidth="max-w-md">
        <InstitutionForm onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
