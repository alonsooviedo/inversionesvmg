export function formatCRC(amount: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrency(amount: number, currency: string): string {
  if (currency === "CRC") return formatCRC(amount);
  if (currency === "USD") return formatUSD(amount);
  return `${currency} ${amount.toLocaleString("es-CR")}`;
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonth(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("es-CR", {
    year: "numeric",
    month: "long",
  });
}

export function instrumentLabel(type: string): string {
  const labels: Record<string, string> = {
    fondo_vista: "Fondo Vista",
    fondo_cerrado: "Fondo Cerrado",
    cdp: "CDP",
    bono: "Bono",
  };
  return labels[type] ?? type;
}

export function transactionLabel(type: string): string {
  const labels: Record<string, string> = {
    interest: "Interés",
    deposit: "Depósito",
    liquidation: "Liquidación",
    sale: "Venta",
    purchase: "Compra",
  };
  return labels[type] ?? type;
}

export function currentPeriod(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function monthsBack(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
