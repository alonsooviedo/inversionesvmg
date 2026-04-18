import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { ExchangeRate } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import ExchangeRateForm from "@/components/configuracion/ExchangeRateForm";
import { Settings, RefreshCw } from "lucide-react";

export default async function ConfiguracionPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("period", { ascending: false })
    .limit(12);

  const rates = (data ?? []) as ExchangeRate[];
  const latest = rates[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text-primary">Configuración</h1>
        <p className="text-sm text-text-muted mt-0.5">Gestiona tipos de cambio y parámetros del sistema</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Current rate */}
        <div className="rounded-2xl p-6" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00D9FF18", color: "#00D9FF" }}>
              <RefreshCw size={15} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">Tipo de cambio actual</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">USD → CRC</p>
            </div>
          </div>
          {latest ? (
            <div className="space-y-3">
              <div>
                <p className="text-3xl font-mono font-semibold" style={{ color: "#00D9FF" }}>
                  ₡{latest.usd_to_crc.toLocaleString("es-CR")}
                </p>
                <p className="text-xs text-text-muted mt-1">por 1 USD · período {latest.period.slice(0, 7)}</p>
              </div>
              {latest.notes && (
                <p className="text-xs text-text-secondary px-3 py-2 rounded-lg" style={{ background: "#162040" }}>{latest.notes}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No hay tipo de cambio registrado</p>
          )}
        </div>

        {/* New rate form */}
        <div className="rounded-2xl p-6" style={{ background: "#111C33", border: "1px solid #1A2744" }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#00E5A018", color: "#00E5A0" }}>
              <Settings size={15} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">Actualizar tipo de cambio</p>
              <p className="text-sm font-medium text-text-primary mt-0.5">Registrar nuevo período</p>
            </div>
          </div>
          <ExchangeRateForm />
        </div>
      </div>

      {/* History */}
      {rates.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-text-secondary mb-3">Historial</p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1A2744" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "#0E1628", borderBottom: "1px solid #1A2744" }}>
                  {["Período", "USD → CRC", "Notas", "Registrado"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rates.map((rate, i) => (
                  <tr key={rate.id} style={{ background: i % 2 === 0 ? "#111C33" : "#0E1628", borderBottom: "1px solid #1A274466" }}>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{rate.period.slice(0, 7)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold" style={{ color: "#00D9FF" }}>
                        ₡{rate.usd_to_crc.toLocaleString("es-CR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">{rate.notes ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-muted">{formatDate(rate.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
