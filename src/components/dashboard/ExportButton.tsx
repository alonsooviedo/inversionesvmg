"use client";

import { FileDown } from "lucide-react";

interface Investment {
  name: string;
  institution_name: string;
  account_name: string;
  account_type?: string;
  instrument_type: string;
  currency: string;
  current_balance: number;
  current_balance_usd: number;
  interest_rate?: number;
  maturity_date?: string;
}

interface Props {
  investments: Investment[];
  totalUSD: number;
  totalCRC: number;
  totalInUSD: number;
  monthlyInterestUSD: number;
  ytdInterestUSD: number;
  exchangeRate: number;
}

function instrumentLabel(type: string): string {
  const m: Record<string, string> = {
    fondo_vista: "F. Vista", fondo_cerrado: "F. Cerrado", cdp: "CDP", bono: "Bono",
  };
  return m[type] ?? type;
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

export default function ExportButton({
  investments, totalUSD, totalCRC, totalInUSD,
  monthlyInterestUSD, ytdInterestUSD, exchangeRate,
}: Props) {
  async function handleExport() {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    // ── Only family (empresa) investments ─────────────────────────────────────
    const family = investments.filter((i) => i.account_type !== "persona");
    const familyTotalUSD = family.reduce((s, i) => s + i.current_balance_usd, 0);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const now = new Date();
    const month = now.toLocaleDateString("es-CR", { month: "long", year: "numeric" });
    const dateStr = now.toLocaleDateString("es-CR", { day: "numeric", month: "long", year: "numeric" });

    const PW = 210; // page width mm
    const ML = 16;  // margin left
    const MR = 16;  // margin right
    const CW = PW - ML - MR; // 178mm content width

    // ── HEADER BAND ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, PW, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("Estado de Cartera", ML, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Familia Oviedo Mora  \u00b7  ${month}`, ML, 22);
    doc.text(dateStr, PW - MR, 22, { align: "right" });

    // ── SEPARATOR ────────────────────────────────────────────────────────────
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(ML, 31, PW - MR, 31);

    // ── SUMMARY CARDS (4 in 1 row) ───────────────────────────────────────────
    const cardY  = 35;
    const cardH  = 20;
    const cardGap = 4;
    const cardW  = (CW - cardGap * 3) / 4; // ≈ 41.5mm

    const cards = [
      { label: "CARTERA TOTAL", value: fmtUSD(familyTotalUSD), green: true },
      { label: "EN USD",        value: fmtUSD(totalUSD),        green: false },
      { label: "EN CRC",        value: `CRC ${fmtNum(totalCRC)}`, green: false },
      { label: "TIPO DE CAMBIO", value: `CRC ${fmtNum(exchangeRate)}`, green: false },
    ];

    cards.forEach((card, i) => {
      const cx = ML + i * (cardW + cardGap);

      // Card border + white fill
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.roundedRect(cx, cardY, cardW, cardH, 1.5, 1.5, "FD");

      // Label
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(107, 114, 128);
      doc.text(card.label, cx + 3.5, cardY + 6.5);

      // Value
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      // Green for total cartera, dark gray for others
      doc.setTextColor(card.green ? 22 : 15, card.green ? 101 : 23, card.green ? 52 : 42);
      doc.text(card.value, cx + 3.5, cardY + 15);
    });

    // ── INTEREST BAND ─────────────────────────────────────────────────────────
    const intY = cardY + cardH + 4; // = 59
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.roundedRect(ML, intY, CW, 11, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(55, 65, 81);
    const midX = ML + CW / 2;
    doc.text(`Intereses del mes: ${fmtUSD(monthlyInterestUSD)}`, ML + 4, intY + 7);
    doc.text(`Intereses YTD: ${fmtUSD(ytdInterestUSD)}`, midX + 4, intY + 7);

    // Thin vertical divider in the band
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.2);
    doc.line(midX, intY + 2, midX, intY + 9);

    // ── TABLE SECTION LABEL ───────────────────────────────────────────────────
    const sectionY = intY + 11 + 5; // = 75
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(107, 114, 128);
    doc.text("INVERSIONES ACTIVAS", ML, sectionY);

    // ── INVESTMENTS TABLE ─────────────────────────────────────────────────────
    // Columns total = 178mm
    // Nombre(42) + Inst(28) + Tipo(20) + Saldo(30) + USD(20) + Tasa(14) + Vto(24) = 178
    const tableStartY = sectionY + 3;

    autoTable(doc, {
      startY: tableStartY,
      margin: { left: ML, right: MR },
      head: [["Nombre", "Institucion", "Tipo", "Saldo", "USD", "Tasa", "Vencimiento"]],
      body: family.map((inv) => {
        const saldo = inv.currency === "CRC"
          ? `${fmtNum(inv.current_balance)} CRC`
          : `${fmtUSD(inv.current_balance)}`;
        const vto = inv.maturity_date
          ? new Date(inv.maturity_date).toLocaleDateString("es-CR", { day: "2-digit", month: "2-digit", year: "numeric" })
          : "-";
        return [
          inv.name,
          inv.institution_name,
          instrumentLabel(inv.instrument_type),
          saldo,
          fmtUSD(inv.current_balance_usd),
          inv.interest_rate != null ? `${(inv.interest_rate * 100).toFixed(2)}%` : "-",
          vto,
        ];
      }),
      styles: {
        fontSize: 7.5,
        cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
        textColor: [15, 23, 42],
        lineColor: [229, 231, 235],
        lineWidth: 0.2,
        font: "helvetica",
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: "bold",
        cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 42 },
        1: { cellWidth: 28 },
        2: { cellWidth: 20 },
        3: { cellWidth: 30, halign: "right" },
        4: { cellWidth: 20, halign: "right" },
        5: { cellWidth: 14, halign: "center" },
        6: { cellWidth: 24, halign: "center" },
      },
    });

    // ── FOOTER ────────────────────────────────────────────────────────────────
    const PH = 297;
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.2);
    doc.line(ML, PH - 12, PW - MR, PH - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(156, 163, 175);
    doc.text("Documento privado \u00b7 Solo para uso familiar", ML, PH - 7);
    doc.text(dateStr, PW - MR, PH - 7, { align: "right" });

    doc.save(`estado_cartera_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.pdf`);
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1 md:py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap"
      style={{ background: "linear-gradient(135deg, #00D9FF18, #00E5A012)", border: "1px solid #00D9FF33", color: "#00D9FF" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #00D9FF28, #00E5A020)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, #00D9FF18, #00E5A012)"; }}>
      <FileDown size={12} className="md:block hidden" />
      <FileDown size={14} className="md:hidden" />
      <span className="hidden md:inline">Exportar PDF</span>
      <span className="md:hidden">Exportar</span>
    </button>
  );
}
