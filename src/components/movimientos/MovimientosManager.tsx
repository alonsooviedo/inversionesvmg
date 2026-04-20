"use client";

import { useActionState, useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/forms/Modal";
import SubmitButton from "@/components/forms/SubmitButton";
import Dropdown from "@/components/forms/Dropdown";
import { createTransaction, updateTransaction, deleteTransaction } from "@/app/actions/transactions";
import { formatCurrency, formatDate, transactionLabel } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

const DEFAULT_TX = { bg: "#3D508018", text: "#7A8FB0" };

type TxWithInvestment = Transaction & {
  investment: { id: string; name: string; currency: string; institution: { name: string } | null } | null;
};

interface ActiveInvestment {
  id: string;
  name: string;
  institution_name: string;
  currency: string;
  currentBalance: number;
}

interface Props {
  transactions: TxWithInvestment[];
  activeInvestments: ActiveInvestment[];
}

// ── Create form ──────────────────────────────────────────────────────────────

function TransactionForm({ activeInvestments, onClose }: { activeInvestments: ActiveInvestment[]; onClose: () => void }) {
  const router = useRouter();
  const [state, formAction] = useActionState(createTransaction, null);
  const [formKey, setFormKey] = useState(0);
  const [selectedInvId, setSelectedInvId] = useState("");
  const [type, setType] = useState("");
  const [amount, setAmount] = useState("");
  const [manualBalance, setManualBalance] = useState("");
  const today = new Date().toISOString().split("T")[0];

  const selectedInv = activeInvestments.find((i) => i.id === selectedInvId);
  const ADD_TYPES = ["interest", "deposit", "purchase"];
  const SUB_TYPES = ["sale", "liquidation"];

  // Calculate expected balance based on type and amount
  let expectedBalance: string | null = null;
  if (selectedInv && type && amount) {
    const currentBal = selectedInv.currentBalance;
    const amt = parseFloat(amount);
    if (!isNaN(amt)) {
      if (ADD_TYPES.includes(type)) {
        expectedBalance = (currentBal + amt).toFixed(2);
      } else if (SUB_TYPES.includes(type)) {
        expectedBalance = (currentBal - amt).toFixed(2);
      }
    }
  }

  useEffect(() => {
    if (state && "success" in state) { setFormKey((k) => k + 1); onClose(); router.refresh(); }
  }, [state, onClose, router]);

  return (
    <form key={formKey} action={formAction} className="space-y-4">
      {state && "error" in state && (
        <div className="text-xs px-3 py-2 rounded-lg" style={{ background: "#EF444415", color: "#EF4444", border: "1px solid #EF444430" }}>{state.error}</div>
      )}
      <div>
        <label className={LABEL}>Inversión</label>
        <Dropdown
          name="investment_id"
          required
          style={INPUT}
          onChange={(value) => setSelectedInvId(value)}>
          <option value="">Seleccionar…</option>
          {activeInvestments.map((inv) => (
            <option key={inv.id} value={inv.id}>{inv.name} — {inv.institution_name} ({inv.currency})</option>
          ))}
        </Dropdown>
        {selectedInv && (
          <p className="text-xs text-text-secondary mt-1">Saldo actual: <span style={{ color: "#00D9FF" }}>{selectedInv.currentBalance.toFixed(2)}</span> {selectedInv.currency}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Tipo de movimiento</label>
          <Dropdown
            name="type"
            required
            style={INPUT}
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
          <label className={LABEL}>Fecha</label>
          <input name="transaction_date" type="date" required defaultValue={today} style={INPUT} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Monto</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            style={INPUT}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.currentTarget.value)} />
        </div>
        <div>
          <label className={LABEL}>Saldo tras movimiento</label>
          <input
            name="balance_after"
            type="number"
            step="0.01"
            min="0"
            style={INPUT}
            placeholder={expectedBalance ? `${expectedBalance} (automático)` : "Dejar vacío para calcular"}
            value={manualBalance}
            onChange={(e) => setManualBalance(e.currentTarget.value)} />
          {expectedBalance && !manualBalance && (
            <p className="text-xs text-text-secondary mt-1">Se usará automáticamente: <span style={{ color: "#00E5A0" }}>{expectedBalance}</span></p>
          )}
          {manualBalance && expectedBalance && manualBalance !== expectedBalance && (
            <p className="text-xs text-accent-amber mt-1">⚠️ Valor manual: {manualBalance} (diferente al calculado: {expectedBalance})</p>
          )}
        </div>
      </div>
      <div>
        <label className={LABEL}>Descripción (opcional)</label>
        <input name="description" style={INPUT} placeholder="Ej. Pago de intereses mensual" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>Cancelar</button>
        <SubmitButton label="Registrar movimiento" />
      </div>
    </form>
  );
}

// ── Edit form ────────────────────────────────────────────────────────────────

function EditTransactionForm({ tx, onClose }: { tx: TxWithInvestment; onClose: () => void }) {
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
          <label className={LABEL}>Tipo de movimiento</label>
          <Dropdown name="type" required defaultValue={tx.type} style={INPUT}>
            <option value="interest">Interés</option>
            <option value="deposit">Depósito</option>
            <option value="purchase">Compra</option>
            <option value="liquidation">Liquidación</option>
            <option value="sale">Venta</option>
          </Dropdown>
        </div>
        <div>
          <label className={LABEL}>Fecha</label>
          <input name="transaction_date" type="date" required defaultValue={tx.transaction_date} style={INPUT} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Monto</label>
          <input name="amount" type="number" step="0.01" min="0" required defaultValue={tx.amount} style={INPUT} />
        </div>
        <div>
          <label className={LABEL}>Saldo tras movimiento</label>
          <input name="balance_after" type="number" step="0.01" min="0" defaultValue={tx.balance_after ?? ""} style={INPUT} placeholder="0.00 (opcional)" />
        </div>
      </div>
      <div>
        <label className={LABEL}>Descripción (opcional)</label>
        <input name="description" defaultValue={tx.description ?? ""} style={INPUT} placeholder="Ej. Pago de intereses mensual" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl text-sm text-text-muted" style={{ background: "#0E1628", border: "1px solid #1A2744" }}>Cancelar</button>
        <SubmitButton label="Guardar cambios" />
      </div>
    </form>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function MovimientosManager({ transactions, activeInvestments }: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTx, setEditTx] = useState<TxWithInvestment | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteTransaction(id);
      setConfirmDeleteId(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
          style={{ background: "linear-gradient(135deg, #00D9FF22, #00E5A022)", border: "1px solid #00D9FF44", color: "#00D9FF" }}>
          <Plus size={14} /> Registrar movimiento
        </button>
      </div>

      {transactions.length === 0 ? (
        <div className="rounded-2xl p-8 text-center text-text-muted text-sm" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          No hay movimientos registrados.
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                  {["Fecha", "Tipo", "Inversión", "Institución", "Monto", "Saldo Tras Mov.", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, i) => {
                  const txColor = TX_COLORS[tx.type] ?? DEFAULT_TX;
                  const currency = tx.investment?.currency ?? "USD";
                  const invId = tx.investment?.id;
                  return (
                    <tr key={tx.id} style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderBottom: "1px solid #1A274466" }}>
                      <td className="px-4 py-3"><span className="font-mono text-xs text-text-secondary">{formatDate(tx.transaction_date)}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap" style={{ background: txColor.bg, color: txColor.text }}>
                          {transactionLabel(tx.type)}
                        </span>
                      </td>
                      {/* Clickable investment name */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => invId && router.push(`/dashboard/inversiones/${invId}`)}
                          className="text-left"
                          style={{ cursor: invId ? "pointer" : "default" }}>
                          <p className="font-medium leading-snug transition-colors"
                            style={{ color: invId ? "#00D9FF" : "#E8EDF5" }}
                            onMouseEnter={(e) => { if (invId) (e.currentTarget as HTMLElement).style.textDecoration = "underline"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.textDecoration = "none"; }}>
                            {tx.investment?.name ?? "—"}
                          </p>
                          {tx.description && <p className="text-xs text-text-muted mt-0.5">{tx.description}</p>}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-secondary">{tx.investment?.institution?.name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-text-primary">{formatCurrency(tx.amount, currency)}</span>
                        <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded" style={{ background: "#1A2744", color: "#7A8FB0" }}>{currency}</span>
                      </td>
                      <td className="px-4 py-3">
                        {tx.balance_after != null
                          ? <span className="font-mono text-xs text-text-secondary">{formatCurrency(tx.balance_after, currency)}</span>
                          : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditTx(tx)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8FB0" }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#00D9FF")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                            <Pencil size={13} />
                          </button>
                          {confirmDeleteId === tx.id ? (
                            <span className="flex items-center gap-1 text-xs">
                              <button onClick={() => handleDelete(tx.id)} className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#EF444418", color: "#EF4444", border: "1px solid #EF444430" }}>Sí</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-0.5 rounded text-xs" style={{ background: "#1A2744", color: "#7A8FB0" }}>No</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(tx.id)} className="p-1.5 rounded-lg transition-colors" style={{ color: "#7A8FB0" }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                              onMouseLeave={(e) => (e.currentTarget.style.color = "#7A8FB0")}>
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Registrar movimiento" maxWidth="max-w-lg">
        <TransactionForm activeInvestments={activeInvestments} onClose={() => setCreateOpen(false)} />
      </Modal>

      <Modal isOpen={!!editTx} onClose={() => setEditTx(null)} title="Editar movimiento" maxWidth="max-w-lg">
        {editTx && <EditTransactionForm tx={editTx} onClose={() => setEditTx(null)} />}
      </Modal>
    </>
  );
}
