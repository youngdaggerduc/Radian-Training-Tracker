import { useState } from 'react';
import { Icon } from './icons';
import * as RD from '../data';

// Lazy-load heavy export libraries only when the user actually clicks export
async function toExcel(filename, sheetName, rows) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  // Auto-width columns
  const cols = Object.keys(rows[0] || {}).map(k => ({ wch: Math.max(k.length, 14) }));
  ws['!cols'] = cols;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

async function toPDF(title, headers, bodyRows, filename) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header bar
  doc.setFillColor(18, 30, 60);
  doc.rect(0, 0, 297, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Radian H.A. Limited — Training Operations', 14, 11);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated ${new Date().toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`, 230, 11);

  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 14, 30);

  autoTable(doc, {
    head: [headers],
    body: bodyRows,
    startY: 36,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [18, 30, 60], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename);
}

// ── Data builders ─────────────────────────────────────────────────────────────

function buildOutstanding(state) {
  const rows = [];
  for (const t of state.trainees) {
    const course = RD.getCourse(t.courseId).name;
    for (const p of t.plan) {
      if (p.paid) continue;
      const overdueDays = RD.daysUntil(p.due) < 0 ? Math.abs(RD.daysUntil(p.due)) : 0;
      rows.push({
        "Trainee":        t.name,
        "Company":        t.company || "—",
        "Course":         course,
        "Instalment":     p.label || "Pending",
        "Amount (TTD)":   p.amount,
        "Due Date":       p.due,
        "Status":         overdueDays > 0 ? `Overdue ${overdueDays}d` : "Upcoming",
        "Phone":          t.phone,
        "Email":          t.email,
      });
    }
  }
  return rows.sort((a, b) => a["Due Date"] > b["Due Date"] ? 1 : -1);
}

function buildSummary(state) {
  return state.trainees.map(t => ({
    "Trainee":          t.name,
    "Company":          t.company || "—",
    "Course":           RD.getCourse(t.courseId).name,
    "Total (TTD)":      t.totalCost,
    "Paid (TTD)":       t.paid,
    "Balance (TTD)":    +(t.totalCost - t.paid).toFixed(2),
    "Method":           t.paymentMethod || "—",
    "Registered":       t.registrationDate,
    "Stage":            t.stage,
    "Phone":            t.phone,
    "Email":            t.email,
  }));
}

function buildSchedule(state) {
  const rows = [];
  for (const t of state.trainees) {
    const course = RD.getCourse(t.courseId).name;
    t.plan.forEach((p, i) => {
      rows.push({
        "Trainee":      t.name,
        "Company":      t.company || "—",
        "Course":       course,
        "Instalment":   p.label || `#${i + 1}`,
        "Amount (TTD)": p.amount,
        "Due Date":     p.due,
        "Paid":         p.paid ? "Yes" : "No",
        "Paid On":      p.paidOn || "—",
        "Method":       p.method || "—",
        "Reference":    p.ref || "—",
      });
    });
  }
  return rows;
}

function buildLeads(state) {
  return state.leads.map(l => ({
    "Name":         l.name,
    "Company":      l.company || "—",
    "Phone":        l.phone,
    "Email":        l.email,
    "Course":       RD.getCourse(l.courseId).name,
    "Status":       l.status,
    "Priority":     l.priority,
    "Source":       l.source,
    "Inquiry Date": l.inquiryDate,
    "Assigned To":  RD.getStaff(l.assignedTo).name,
    "Follow-ups":   l.followUps.length,
    "Notes":        l.notes.length,
  }));
}

// ── Report card ───────────────────────────────────────────────────────────────

function ReportCard({ title, description, columns, onExcel, onPDF, count, busy }) {
  return (
    <div className="panel" style={{ padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "var(--navy-900)", marginBottom: 4 }}>
            {title}
            {count != null && (
              <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--navy-400)" }}>
                {count} {count === 1 ? "row" : "rows"}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-500)", lineHeight: 1.5 }}>{description}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 5 }} onClick={onExcel} disabled={busy || count === 0}>
            <Icon name="file" size={13}/> Excel
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 5 }} onClick={onPDF} disabled={busy || count === 0}>
            <Icon name="file" size={13}/> PDF
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {columns.map(col => (
          <span key={col} className="chip" style={{ fontSize: 11, padding: "2px 8px", background: "var(--warm-100)", color: "var(--navy-600)" }}>
            {col}
          </span>
        ))}
      </div>

      {count === 0 && (
        <div style={{ fontSize: 12, color: "var(--navy-400)", fontStyle: "italic" }}>No data to export.</div>
      )}
    </div>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function ExportsView({ state }) {
  const [busy, setBusy] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); setLastExport(new Date()); }
    catch (e) { alert("Export failed: " + e.message); }
    finally { setBusy(false); }
  };

  const today = RD.todayISO();

  // ── Outstanding payments ──────────────────────────────────────────────────
  const outstanding = buildOutstanding(state);
  const outHeaders  = ["Trainee", "Company", "Course", "Instalment", "Amount (TTD)", "Due Date", "Status", "Phone", "Email"];

  // ── Summary ───────────────────────────────────────────────────────────────
  const summary    = buildSummary(state);
  const sumHeaders = ["Trainee", "Company", "Course", "Total (TTD)", "Paid (TTD)", "Balance (TTD)", "Method", "Registered", "Stage", "Phone", "Email"];

  // ── Full schedule ─────────────────────────────────────────────────────────
  const schedule   = buildSchedule(state);
  const schHeaders = ["Trainee", "Company", "Course", "Instalment", "Amount (TTD)", "Due Date", "Paid", "Paid On", "Method", "Reference"];

  // ── Leads ─────────────────────────────────────────────────────────────────
  const leads      = buildLeads(state);
  const leadHeaders = ["Name", "Company", "Phone", "Email", "Course", "Status", "Priority", "Source", "Inquiry Date", "Assigned To", "Follow-ups", "Notes"];

  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Exports & Reports</h1>
          <p className="view-sub">Download payment and lead data as Excel or PDF.</p>
        </div>
        {lastExport && (
          <div style={{ fontSize: 12, color: "var(--navy-400)", alignSelf: "flex-end" }}>
            Last export: {lastExport.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        <ReportCard
          title="Outstanding Payments"
          description="All unpaid instalments across active payment plans. Sorted by due date — overdue items appear first."
          columns={outHeaders}
          count={outstanding.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Outstanding_Payments_${today}.xlsx`, "Outstanding", outstanding))}
          onPDF={() => run(() => toPDF(
            "Outstanding Payments",
            outHeaders,
            outstanding.map(r => outHeaders.map(h => r[h] ?? "—")),
            `Outstanding_Payments_${today}.pdf`
          ))}
        />

        <ReportCard
          title="Payment Plans Summary"
          description="One row per trainee showing total course cost, amount paid so far, and remaining balance."
          columns={sumHeaders}
          count={summary.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Payment_Summary_${today}.xlsx`, "Summary", summary))}
          onPDF={() => run(() => toPDF(
            "Payment Plans Summary",
            sumHeaders,
            summary.map(r => sumHeaders.map(h => r[h] ?? "—")),
            `Payment_Summary_${today}.pdf`
          ))}
        />

        <ReportCard
          title="Full Instalment Schedule"
          description="Every instalment from every trainee — both paid and pending — with payment method and reference number."
          columns={schHeaders}
          count={schedule.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Instalment_Schedule_${today}.xlsx`, "Schedule", schedule))}
          onPDF={() => run(() => toPDF(
            "Full Instalment Schedule",
            schHeaders,
            schedule.map(r => schHeaders.map(h => r[h] ?? "—")),
            `Instalment_Schedule_${today}.pdf`
          ))}
        />

        <ReportCard
          title="Training Leads"
          description="All current leads with contact details, course interest, status, priority, and assigned coordinator."
          columns={leadHeaders}
          count={leads.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Leads_${today}.xlsx`, "Leads", leads))}
          onPDF={() => run(() => toPDF(
            "Training Leads",
            leadHeaders,
            leads.map(r => leadHeaders.map(h => r[h] ?? "—")),
            `Leads_${today}.pdf`
          ))}
        />

      </div>
    </div>
  );
}
