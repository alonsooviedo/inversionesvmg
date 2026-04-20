"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateInvestment, deleteInvestment } from "@/app/actions/investments";
import { updateTransaction, deleteTransaction } from "@/app/actions/transactions";
import SubmitButton from "@/components/forms/SubmitButton";
import Dropdown from "@/components/forms/Dropdown";
import Modal from "@/components/forms/Modal";
import { formatUSD, formatCurrency, formatPercent, formatDate, transactionLabel, instrumentLabel } from "@/lib/utils";
import type { Investment, Institution, Account, Transaction } from "@/lib/types";
import { ArrowLeft, Pencil, Trash2, X, TrendingUp, Wallet, Percent, CalendarCheck, Plus } from "lucide-react";
import { createTransaction } from "@/app/actions/transactions";

const INPUT = {
  width: "100%", background: "#0E1628", border: "1px solid #1A2744",
  borderRadius: "8px", padding: "8px 12px", fontSize: "13px",
  color: "#E8EDF5", outline: "none",
} as const;

const LABEL = "block text-xs text-text-muted uppercase tracking-wider mb-1.5";

const TX_COLORS: Record<string, { bg: string; text: string }> = {
  interest:    { bg: "#00E5A018", text: "#00E5A0" },
  deposit:     { bg: "#00D9FF18", text: "#00D9FF" },
  purchase:    { bg: "#A78BFA18", text: "#A78BFA" },
  liquidation: { bg: "#F59E0B18", text: "#F59E0B" },
  sale:        { bg: "#EF444418", text: "#EF4444" },
};

function toUSD(amount: number, currency: string, rate: number) {
  if (currency === "USD") return amount;
  if (currency === "CRC") return amount / rate;
  return amount;
}

interface Props {
  investment: Investment;
  institutions: Institution[];
  accounts: Account[];
  transactions: Transaction[];
  exchangeRate: number;
}

export default function InvestmentDetail({ investment, institutions, accounts, transactions, exchangeRate }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [createTxOpen, setCreateTxOpen] = useState(false);
  const [state, formAction] = useActionState(updateInvestment, null);
  const [formKey, setFormKey] = useState(0);
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<string | null>(null);
  const [confirmDeleteInv, setConfirmDeleteInv] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDeleteTx(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
      setConfirmDeleteTxId(null);
      router.refresh();
    });
  }

  function handleDeleteInv() {
    startTransition(async () => {
      await deleteInvestment(investment.id);
      router.push("/dashboard/inversiones");
    });
  }

  useEffect(() => {
    if (state && "success" in state) {
      setFormKey((k) => k + 1);
      setEditing(false);
      router.refresh();
    }
  }, [state, router]);

  const usd = toUSD(investment.current_balance, investment.currency, exchangeRate);
  const gain = investment.current_balance - investment.initial_amount;
  const gainPct = investment.initial_amount > 0 ? gain / investment.initial_amount : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: "#111C33", border: "1px solid #1A2744", color: "#7A8FB0" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#E8EDF5")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-text-primary">{investment.name}</h1>
            <p className="text-sm text-text-muted mt-0.5">
              {investment.institution?.name ?? "—"} · {investment.account?.name ?? "—"} · {instrumentLabel(investment.instrument_type)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Delete investment */}
          {confirmDeleteInv ? (
            <span className="flex items-center gap-2 text-sm">
              <span className="text-text-muted text-xs">¿Eliminar inversión?</span>
              <button onClick={handleDeleteInv} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background: "#EF444418", color: "#EF4444", border: "1px solid #EF444430" }}>Sí, eliminar</button>
              <button onClick={() => setConfirmDeleteInv(false)} className="px-3 py-1.5 rounded-xl text-xs" style={{ background: "#1A2744", color: "#7A8FB0" }}>Cancelar</button>
            </span>
          ) : (
            <button onClick={() => setConfirmDeleteInv(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "#EF444410", border: "1px solid #EF444425", color: "#7A8FB0" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; e.currentTarget.style.borderColor = "#EF444440"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#7A8FB0"; e.currentTarget.style.borderColor = "#EF444425"; }}>
              <Trash2 size={14} />
            </button>
          )}
          <button
            onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: editing ? "#EF444415" : "linear-gradient(135deg, #00D9FF22, #00E5A022)",
              border: editing ? "1px solid #EF444430" : "1px solid #00D9FF44",
              color: editing ? "#EF4444" : "#00D9FF",
            }}>
            {editing ? <><X size={14} /> Cancelar</> : <><Pencil size={14} /> Editar</>}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Saldo Actual", value: formatCurrency(investment.current_balance, investment.currency), sub: `${investment.currency}`, icon: <Wallet size={14} />, accent: "#00D9FF" },
          { label: "Equiv. USD", value: formatUSD(usd), sub: "Al tipo de cambio actual", icon: <TrendingUp size={14} />, accent: "#00E5A0" },
          { label: "Tasa de interés", value: investment.interest_rate != null ? formatPercent(investment.interest_rate) : "—", sub: investment.interest_frequency ?? "Sin frecuencia", icon: <Percent size={14} />, accent: "#F59E0B" },
          { label: "Vencimiento", value: investment.maturity_date ? formatDate(investment.maturity_date) : "Sin vencimiento", sub: investment.purchase_date ? `Compra: ${formatDate(investment.purchase_date)}` : "—", icon: <CalendarCheck size={14} />, accent: "#A78BFA" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
            <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-xl opacity-10 pointer-events-none" style={{ background: kpi.accent, transform: "translate(30%,-30%)" }} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">{kpi.label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.accent}18`, color: kpi.accent }}>{kpi.icon}</div>
            </div>
            <p className="text-lg font-mono font-semibold" style={{ color: "#E8EDF5" }}>{kpi.value}</p>
            <p className="text-xs text-text-muted mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      {editing && (
        <div className="rounded-2xl p-6" style={{ background: "#111C33", border: "1px solid #00D9FF22" }}>
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-5">Editar inversión</p>
          <form key={formKey} action={formAction} className="space-y-4">
            <input type="hidden" name="id" value={investment.id} />
            {state && "error" in state && (
              <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>{state.error}</div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={LABEL}>Nombre</label>
                <input name="name" required defaultValue={investment.name} style={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Institución</label>
                <Dropdown name="institution_id" required defaultValue={investment.institution_id} style={INPUT}>
                  {institutions.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                </Dropdown>
              </div>
              <div>
                <label className={LABEL}>Titular</label>
                <Dropdown name="account_id" required defaultValue={investment.account_id} style={INPUT}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </Dropdown>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Tipo de instrumento</label>
                <Dropdown name="instrument_type" required defaultValue={investment.instrument_type} style={INPUT}>
                  <option value="fondo_vista">Fondo Vista</option>
                  <option value="fondo_cerrado">Fondo Cerrado</option>
                  <option value="cdp">CDP</option>
                  <option value="bono">Bono</option>
                </Dropdown>
              </div>
              <div>
                <label className={LABEL}>Moneda</label>
                <Dropdown name="currency" required defaultValue={investment.currency} style={INPUT}>
                  <option value="CRC">CRC (Colones)</option>
                  <option value="USD">USD (Dólares)</option>
                  <option value="EUR">EUR (Euros)</option>
                </Dropdown>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Monto inicial</label>
                <input name="initial_amount" type="number" step="0.01" min="0" required defaultValue={investment.initial_amount} style={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Saldo actual</label>
                <input name="current_balance" type="number" step="0.01" min="0" required defaultValue={investment.current_balance} style={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Tasa de interés (%)</label>
                <input name="interest_rate" type="number" step="0.01" min="0" max="100" defaultValue={investment.interest_rate != null ? (investment.interest_rate * 100).toFixed(2) : ""} style={INPUT} placeholder="Ej. 6.75" />
              </div>
              <div>
                <label className={LABEL}>Frecuencia</label>
                <Dropdown name="interest_frequency" defaultValue={investment.interest_frequency ?? ""} style={INPUT}>
                  <option value="">Sin frecuencia</option>
                  <option value="diaria">Diaria</option>
                  <option value="mensual">Mensual</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="semestral">Semestral</option>
                  <option value="al_vencimiento">Al vencimiento</option>
                </Dropdown>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Fecha de compra</label>
                <input name="purchase_date" type="date" defaultValue={investment.purchase_date ?? ""} style={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Fecha de vencimiento</label>
                <input name="maturity_date" type="date" defaultValue={investment.maturity_date ?? ""} style={INPUT} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>Estado</label>
                <Dropdown name="status" required defaultValue={investment.status} style={INPUT}>
                  <option value="active">Activa</option>
                  <option value="liquidated">Liquidada</option>
                  <option value="sold">Vendida</option>
                </Dropdown>
              </div>
              <div>
                <label className={LABEL}>IBAN (opcional)</label>
                <input name="iban" defaultValue={investment.iban ?? ""} style={INPUT} />
              </div>
            </div>
            <div>
              <label className={LABEL}>Notas</label>
              <textarea name="notes" rows={2} defaultValue={investment.notes ?? ""} style={{ ...INPUT, resize: "none" }} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setEditing(false)} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>Cancelar</button>
              <SubmitButton label="Guardar cambios" />
            </div>
          </form>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">Historial de movimientos</p>
          <button
            onClick={() => setCreateTxOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF44", color: "#00D9FF" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#00D9FF66"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#00D9FF44"; }}>
            <Plus size={13} /> Agregar movimiento
          </button>
        </div>
        {transactions.length === 0 ? (
          <div className="rounded-2xl p-6 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
            Sin movimientos registrados
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                  {["Fecha", "Tipo", "Monto", "Saldo tras mov.", "Descripción", "", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const txColor = TX_COLORS[tx.type] ?? { bg: "#3D508018", text: "#7A8FB0" };
                  return (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderBottom: "1px solid #1A274466" }}>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{formatDate(tx.transaction_date)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: txColor.bg, color: txColor.text }}>{transactionLabel(tx.type)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-primary">{formatCurrency(tx.amount, investment.currency)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.balance_after != null
                          ? <span className="font-mono text-xs text-text-secondary">{formatCurrency(tx.balance_after, investment.currency)}</span>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{tx.description ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditTx(tx)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8FB0" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#00D9FF")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                          <Pencil size={13} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {confirmDeleteTxId === tx.id ? (
                          <span className="flex items-center gap-1">
                            <button onClick={() => handleDeleteTx(tx.id)} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#EF444418", color: "#EF4444", border: "1px solid #EF444430" }}>Sí</button>
                            <button onClick={() => setConfirmDeleteTxId(null)} className="px-2 py-0.5 rounded text-xs" style={{ background: "#1A2744", color: "#7A8FB0" }}>No</button>
                          </span>
                        ) : (
                          <button onClick={() => setConfirmDeleteTxId(tx.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8FB0" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit transaction modal */}
      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar movimiento" maxWidth="max-w-lg">
        {editTx && <EditTransactionForm tx={editTx} currency={investment.currency} onClose={() => setEditTx(null)} />}
      </Modal>

      {/* Create transaction modal */}
      <Modal isOpen={createTxOpen} onClose={() => setCreateTxOpen(false)} title="Agregar movimiento" maxWidth="max-w-lg">
        <CreateTransactionForm investment={investment} onClose={() => setCreateTxOpen(false)} />
      </Modal>
    </div>
  );
}

// ── Edit transaction form (inline for InvestmentDetail) ───────────────────────

function EditTransactionForm({ tx, currency, onClose }: {
  tx: Transaction; currency: string; onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(updateTransaction, null);

  useEffect(() => {
    if (state && "success" in state) { onClose(); router.refresh(); }
  }, [state, onClose, router]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={tx.id} />
      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>{state.error}</div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
          <Dropdown name="type" required defaultValue={tx.type} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }}>
            <option value="interest">Interés</option>
            <option value="deposit">Depósito</option>
            <option value="purchase">Compra</option>
            <option value="liquidation">Liquidación</option>
            <option value="sale">Venta</option>
          </Dropdown>
        </div>
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Fecha</label>
          <input name="transaction_date" type="date" required defaultValue={tx.transaction_date} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Monto ({currency})</label>
          <input name="amount" type="number" step="0.01" min="0" required defaultValue={tx.amount} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} />
        </div>
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Saldo tras mov.</label>
          <input name="balance_after" type="number" step="0.01" min="0" defaultValue={tx.balance_after ?? ""} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} placeholder="(opcional)" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
        <input name="description" defaultValue={tx.description ?? ""} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>Cancelar</button>
        <SubmitButton label="Guardar cambios" />
      </div>
    </form>
  );
}

// ── Create transaction form (inline for InvestmentDetail) ──────────────────────

function CreateTransactionForm({ investment, onClose }: {
  investment: Investment; onClose: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(createTransaction, null);
  const [formKey, setFormKey] = useState(0);
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [manualBalance, setManualBalance] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const ADD_TYPES = ["interest", "deposit", "purchase"];
  const SUB_TYPES = ["sale", "liquidation"];

  // Calculate expected balance
  let expectedBalance: string | null = null;
  if (type && amount) {
    const amt = parseFloat(amount);
    if (!isNaN(amt)) {
      if (ADD_TYPES.includes(type)) {
        expectedBalance = (investment.current_balance + amt).toFixed(2);
      } else if (SUB_TYPES.includes(type)) {
        expectedBalance = (investment.current_balance - amt).toFixed(2);
      }
    }
  }

  useEffect(() => {
    if (state && "success" in state) { setFormKey((k) => k + 1); onClose(); router.refresh(); }
  }, [state, onClose, router]);

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      <input type="hidden" name="investment_id" value={investment.id} />
      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>{state.error}</div>
      )}
      <div>
        <p className="text-xs text-text-secondary mb-2">Inversión: <span style={{ color: "#00D9FF" }}>{investment.name}</span></p>
        <p className="text-xs text-text-secondary">Saldo actual: <span style={{ color: "#00E5A0" }}>{investment.current_balance.toFixed(2)} {investment.currency}</span></p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Tipo</label>
          <Dropdown
            name="type"
            required
            style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }}
            onChange={(value) => setType(value)}>
            <option value="">Seleccionar…</option>
            <option value="interest">Interés (+suma)</option>
            <option value="deposit">Depósito (+suma)</option>
            <option value="purchase">Compra (+suma)</option>
            <option value="liquidation">Liquidación (-resta)</option>
            <option value="sale">Venta (-resta)</option>
          </Dropdown>
        </div>
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Fecha</label>
          <input name="transaction_date" type="date" required defaultValue={today} style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Monto ({investment.currency})</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.value)} />
        </div>
        <div>
          <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Saldo tras mov.</label>
          <input
            name="balance_after"
            type="number"
            step="0.01"
            min="0"
            style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }}
            placeholder={expectedBalance ? `${expectedBalance} (automático)` : "Dejar vacío"}
            value={manualBalance}
            onChange={(e) => setManualBalance(e.currentTarget.value)} />
          {expectedBalance && !manualBalance && (
            <p className="text-xs text-text-secondary mt-1">Se usará: <span style={{ color: "#00E5A0" }}>{expectedBalance}</span></p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-xs text-text-muted uppercase tracking-wider mb-1.5">Descripción</label>
        <input name="description" style={{ width: "100%", background: "#0E1628", border: "1px solid #1A2744", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#E8EDF5", outline: "none" }} placeholder="(opcional)" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>Cancelar</button>
        <SubmitButton label="Registrar movimiento" />
      </div>
    </form>
  );
}
// Updated: Mon Apr 20 08:36:08 CST 2026
