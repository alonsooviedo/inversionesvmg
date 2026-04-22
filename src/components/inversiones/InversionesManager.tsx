"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/forms/Modal";
import SubmitButton from "@/components/forms/SubmitButton";
import Dropdown from "@/components/forms/Dropdown";
import { createInvestment, updateInvestment } from "@/app/actions/investments";
import { formatUSD, formatCurrency, formatPercent, formatDate, instrumentLabel } from "@/lib/utils";
import type { Investment, Institution, Account } from "@/lib/types";
import { Plus, Pencil, Search, X } from "lucide-react";

const INPUT = {
  width: "100%", background: "#0E1628", border: "1px solid #1A2744",
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  color: "#E8EDF5", outline: "none",
} as const;

const SELECT = { ...INPUT } as const;
const LABEL = "block text-xs text-text-muted uppercase tracking-wider mb-1.5";

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  fondo_vista:   { bg: "#00D9FF18", text: "#00D9FF" },
  fondo_cerrado: { bg: "#00E5A018", text: "#00E5A0" },
  cdp:           { bg: "#F59E0B18", text: "#F59E0B" },
  bono:          { bg: "#A78BFA18", text: "#A78BFA" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active:     { bg: "#00D9FF18", text: "#00D9FF",  label: "Activa" },
  liquidated: { bg: "#F59E0B18", text: "#F59E0B",  label: "Liquidada" },
  sold:       { bg: "#3D508018", text: "#7A8FB0",  label: "Vendida" },
};

const DEFAULT_TYPE = { bg: "#3D508018", text: "#7A8FB0" };

function MaturityBadge({ date }: { date?: string }) {
  if (!date) return <span className="text-text-muted">—</span>;
  const diff = new Date(date).getTime() - Date.now();
  const days = Math.ceil(diff / 86_400_000);
  let color = "#7A8FB0";
  if (days < 0) color = "#EF4444";
  else if (days <= 30) color = "#F59E0B";
  else if (days <= 90) color = "#00D9FF";
  return <span className="font-mono text-xs" style={{ color }}>{formatDate(date)}</span>;
}

function toUSD(amount: number, currency: string, rate: number) {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

interface InvestmentFormProps {
  institutions: Institution[];
  accounts: Account[];
  investment?: Investment;
  onClose: () => void;
}

function InvestmentForm({ institutions, accounts, investment, onClose }: InvestmentFormProps) {
  const router = useRouter();
  const action = investment ? updateInvestment : createInvestment;
  const [state, formAction] = useActionState(action, null);
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
      {investment && <input type="hidden" name="id" value={investment.id} />}

      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>
          {state.error}
        </div>
      )}

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={LABEL}>Nombre</label>
          <input name="name" required defaultValue={investment?.name} style={INPUT} placeholder="Ej. CDP BAC 12 meses" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Institución</label>
          <Dropdown name="institution_id" required defaultValue={investment?.institution_id} style={SELECT}>
            <option value="">Seleccionar…</option>
            {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </Dropdown>
        </div>
        <div>
          <label className={LABEL}>Titular</label>
          <Dropdown name="account_id" required defaultValue={investment?.account_id} style={SELECT}>
            <option value="">Seleccionar…</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Dropdown>
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Tipo de instrumento</label>
          <Dropdown name="instrument_type" required defaultValue={investment?.instrument_type} style={SELECT}>
            <option value="">Seleccionar…</option>
            <option value="fondo_vista">Fondo Vista</option>
            <option value="fondo_cerrado">Fondo Cerrado</option>
            <option value="cdp">CDP</option>
            <option value="bono">Bono</option>
          </Dropdown>
        </div>
        <div>
          <label className={LABEL}>Moneda</label>
          <Dropdown name="currency" required defaultValue={investment?.currency} style={SELECT}>
            <option value="">Seleccionar…</option>
            <option value="CRC">CRC (Colones)</option>
            <option value="USD">USD (Dólares)</option>
            <option value="EUR">EUR (Euros)</option>
          </Dropdown>
        </div>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Monto inicial</label>
          <input name="initial_amount" type="number" step="0.01" min="0" required defaultValue={investment?.initial_amount} style={INPUT} placeholder="0.00" />
        </div>
        <div>
          <label className={LABEL}>Saldo actual</label>
          <input name="current_balance" type="number" step="0.01" min="0" required defaultValue={investment?.current_balance} style={INPUT} placeholder="0.00" />
        </div>
      </div>

      {/* Row 5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Tasa de interés (%)</label>
          <input
            name="interest_rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            defaultValue={investment?.interest_rate != null ? (investment.interest_rate * 100).toFixed(2) : ""}
            style={INPUT}
            placeholder="Ej. 12.50"
          />
        </div>
        <div>
          <label className={LABEL}>Frecuencia de interés</label>
          <Dropdown name="interest_frequency" defaultValue={investment?.interest_frequency ?? ""} style={SELECT}>
            <option value="">Sin frecuencia</option>
            <option value="diaria">Diaria</option>
            <option value="mensual">Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="semestral">Semestral</option>
            <option value="al_vencimiento">Al vencimiento</option>
          </Dropdown>
        </div>
      </div>

      {/* Row 6 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Fecha de compra</label>
          <input name="purchase_date" type="date" defaultValue={investment?.purchase_date ?? ""} style={{ ...INPUT, minHeight: "44px" }} />
        </div>
        <div>
          <label className={LABEL}>Fecha de vencimiento</label>
          <input name="maturity_date" type="date" defaultValue={investment?.maturity_date ?? ""} style={{ ...INPUT, minHeight: "44px" }} />
        </div>
      </div>

      {/* Row 7 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Estado</label>
          <Dropdown name="status" required defaultValue={investment?.status ?? "active"} style={SELECT}>
            <option value="active">Activa</option>
            <option value="liquidated">Liquidada</option>
            <option value="sold">Vendida</option>
          </Dropdown>
        </div>
        <div>
          <label className={LABEL}>IBAN (opcional)</label>
          <input name="iban" defaultValue={investment?.iban ?? ""} style={INPUT} placeholder="CR00 0000 0000 0000 0000 00" />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={LABEL}>Notas</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={investment?.notes ?? ""}
          style={{ ...INPUT, resize: "none" }}
          placeholder="Observaciones opcionales…"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted transition-colors" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>
          Cancelar
        </button>
        <SubmitButton label={investment ? "Guardar cambios" : "Crear inversión"} />
      </div>
    </form>
  );
}

interface Props {
  investments: Investment[];
  institutions: Institution[];
  accounts: Account[];
  exchangeRate: number;
}

export default function InversionesManager({ investments, institutions, accounts, exchangeRate }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editInvestment, setEditInvestment] = useState<Investment | null>(null);
  const [search, setSearch] = useState("");

  const q = search.toLowerCase().trim();
  const filtered = q
    ? investments.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        (i.institution?.name ?? "").toLowerCase().includes(q) ||
        (i.account?.name ?? "").toLowerCase().includes(q) ||
        i.instrument_type.toLowerCase().includes(q)
      )
    : investments;

  const groups = [
    { status: "active",     label: "Activas",    items: filtered.filter((i) => i.status === "active") },
    { status: "liquidated", label: "Liquidadas", items: filtered.filter((i) => i.status === "liquidated") },
    { status: "sold",       label: "Vendidas",   items: filtered.filter((i) => i.status === "sold") },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      {/* Top bar: search + create */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#7A8FB0", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar inversión, institución, tipo…"
            style={{
              width: "100%", background: "#111C33", border: "1px solid #1A2744",
              borderRadius: "10px", padding: "8px 36px", fontSize: "13px",
              color: "#E8EDF5", outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#00D9FF55")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#1A2744")}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", color: "#7A8FB0", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EDF5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full md:w-auto flex items-center justify-center md:justify-start gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF44", color: "#00D9FF" }}>
          <Plus size={14} /> Nueva inversión
        </button>
      </div>

      {/* Tables */}
      {groups.map(({ status, label, items }) => {
        const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.active;
        return (
          <div key={status} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">{label}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: statusColor.bg, color: statusColor.text }}>{items.length}</span>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                      {["Inversión", "Tipo", "Titular", "Saldo", "Equiv. USD", "Tasa", "Vencimiento", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((inv, i) => {
                      const typeColor = TYPE_COLORS[inv.instrument_type] ?? DEFAULT_TYPE;
                      const usd = toUSD(inv.current_balance, inv.currency, exchangeRate);
                      const bgColor = i % 2 === 0 ? "#111C33" : "#0E1628";
                      return (
                        <tr key={inv.id} style={{ background: bgColor, borderBottom: "1px solid #1A274466", cursor: "pointer", transition: "background-color 200ms ease" }} onClick={() => router.push(`/dashboard/inversiones/${inv.id}`)} onMouseEnter={(e) => (e.currentTarget.style.background = "#1A2744")} onMouseLeave={(e) => (e.currentTarget.style.background = bgColor)}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-text-primary leading-snug">{inv.name}</p>
                            <p className="text-xs text-text-muted mt-0.5">{inv.institution?.name ?? "—"}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: typeColor.bg, color: typeColor.text }}>
                              {instrumentLabel(inv.instrument_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-text-secondary">{inv.account?.name ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-text-primary">{formatCurrency(inv.current_balance, inv.currency)}</span>
                            <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "#1A2744", color: "#7A8FB0" }}>{inv.currency}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-medium text-accent-cyan">{formatUSD(usd)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {inv.interest_rate != null
                              ? <span className="font-mono text-xs text-accent-green">{formatPercent(inv.interest_rate)}</span>
                              : <span className="text-text-muted">—</span>}
                          </td>
                          <td className="px-4 py-3"><MaturityBadge date={inv.maturity_date} /></td>
                          <td className="px-4 py-3">
                            <button onClick={(e) => { e.stopPropagation(); setEditInvestment(inv); }} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8FB0" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#00D9FF")} onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                              <Pencil size={13} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}

      {investments.length === 0 && (
        <div className="rounded-2xl p-8 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          No hay inversiones registradas. Crea la primera usando el botón de arriba.
        </div>
      )}

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nueva inversión">
        <InvestmentForm institutions={institutions} accounts={accounts} onClose={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editInvestment} onClose={() => setEditInvestment(null)} title="Editar inversión">
        {editInvestment && (
          <InvestmentForm
            institutions={institutions}
            accounts={accounts}
            investment={editInvestment}
            onClose={() => setEditInvestment(null)}
          />
        )}
      </Modal>
    </>
  );
}
