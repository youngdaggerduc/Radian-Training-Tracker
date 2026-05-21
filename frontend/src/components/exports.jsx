import { useState, useRef, useEffect } from 'react';
import { Icon } from './icons';
import * as RD from '../data';

// ── Export helpers (lazy-loaded) ──────────────────────────────────────────────

async function toExcel(filename, sheetName, rows) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
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

// Portrait payment statement for a single trainee
async function toStatementPDF(trainee) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const course = RD.getCourse(trainee.courseId);
  const balance = +(trainee.totalCost - trainee.paid).toFixed(2);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const slug = trainee.name.replace(/\s+/g, '_');

  // Navy header bar
  doc.setFillColor(18, 30, 60);
  doc.rect(0, 0, 210, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Radian H.A. Limited', 14, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Training Operations', 14, 17);
  doc.setFontSize(9);
  doc.text(`Statement date: ${today}`, 135, 14);

  // Title
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Payment Statement', 14, 36);
  doc.setDrawColor(200, 190, 175);
  doc.setLineWidth(0.4);
  doc.line(14, 39, 196, 39);

  // Trainee details block (two columns)
  const details = [
    ['Trainee Name',     trainee.name],
    ['Company',          trainee.company || 'Individual'],
    ['Phone',            trainee.phone || '—'],
    ['Email',            trainee.email || '—'],
    ['Course',           course.name],
    ['Registration Date', RD.fmtDate(trainee.registrationDate)],
    ['Payment Method',   trainee.paymentMethod || '—'],
  ];

  let y = 47;
  doc.setFontSize(9);
  details.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 90, 80);
    doc.text(label, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.text(String(value), 65, y);
    y += 6.5;
  });

  // Payment summary box
  y += 4;
  doc.setFillColor(248, 246, 242);
  doc.roundedRect(14, y, 182, 28, 2, 2, 'F');
  doc.setFontSize(9);
  const cols3 = [
    { label: 'Total Course Fee', value: RD.fmtMoney(trainee.totalCost), x: 24 },
    { label: 'Amount Paid',      value: RD.fmtMoney(trainee.paid),      x: 84 },
    { label: 'Outstanding',      value: RD.fmtMoney(balance),           x: 144 },
  ];
  cols3.forEach(c => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 90, 80);
    doc.setFontSize(8);
    doc.text(c.label, c.x, y + 9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(balance > 0 && c.label === 'Outstanding' ? 180 : 18, balance > 0 && c.label === 'Outstanding' ? 40 : 30, balance > 0 && c.label === 'Outstanding' ? 40 : 60);
    doc.text(c.value, c.x, y + 20);
  });

  // Instalment table
  y += 36;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('Instalment Schedule', 14, y);
  y += 4;

  const schHeaders = ['#', 'Description', 'Amount (TTD)', 'Due Date', 'Status', 'Paid On', 'Method', 'Reference'];
  const schRows = trainee.plan.map((p, i) => [
    String(i + 1),
    p.label || `Instalment ${i + 1}`,
    RD.fmtMoney(p.amount),
    RD.fmtDate(p.due),
    p.paid ? 'Paid' : (RD.daysUntil(p.due) < 0 ? `Overdue ${Math.abs(RD.daysUntil(p.due))}d` : 'Pending'),
    p.paidOn ? RD.fmtDate(p.paidOn) : '—',
    p.method || '—',
    p.ref || '—',
  ]);

  autoTable(doc, {
    head: [schHeaders],
    body: schRows,
    startY: y,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [18, 30, 60], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 246, 242] },
    columnStyles: { 0: { cellWidth: 8 }, 2: { halign: 'right' } },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const v = data.cell.raw;
        if (v === 'Paid') data.cell.styles.textColor = [22, 110, 60];
        else if (String(v).startsWith('Overdue')) data.cell.styles.textColor = [180, 40, 40];
      }
    },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 140, 130);
  doc.text('This is an internal payment record generated by Radian H.A. Training Operations.', 14, pageH - 8);

  doc.save(`Statement_${slug}_${RD.todayISO()}.pdf`);
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
        "Trainee":       t.name,
        "Company":       t.company || "—",
        "Course":        course,
        "Instalment":    p.label || "Pending",
        "Amount (TTD)":  p.amount,
        "Due Date":      p.due,
        "Status":        overdueDays > 0 ? `Overdue ${overdueDays}d` : "Upcoming",
        "Phone":         t.phone,
        "Email":         t.email,
      });
    }
  }
  return rows.sort((a, b) => a["Due Date"] > b["Due Date"] ? 1 : -1);
}

function buildSummary(state) {
  return state.trainees.map(t => ({
    "Trainee":       t.name,
    "Company":       t.company || "—",
    "Course":        RD.getCourse(t.courseId).name,
    "Total (TTD)":   t.totalCost,
    "Paid (TTD)":    t.paid,
    "Balance (TTD)": +(t.totalCost - t.paid).toFixed(2),
    "Method":        t.paymentMethod || "—",
    "Registered":    t.registrationDate,
    "Stage":         t.stage,
    "Phone":         t.phone,
    "Email":         t.email,
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

// ── Trainee search + statement ────────────────────────────────────────────────

function TraineeStatementCard({ state }) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  const matches = query.trim().length > 0
    ? state.trainees.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        (t.company || "").toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pick = (t) => {
    setSelected(t);
    setQuery(t.name);
    setOpen(false);
  };

  const clear = () => { setSelected(null); setQuery(""); inputRef.current?.focus(); };

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); }
    catch (e) { alert("Export failed: " + e.message); }
    finally { setBusy(false); }
  };

  const traineeExcelRows = selected ? selected.plan.map((p, i) => ({
    "Trainee":      selected.name,
    "Company":      selected.company || "—",
    "Course":       RD.getCourse(selected.courseId).name,
    "Instalment":   p.label || `#${i + 1}`,
    "Amount (TTD)": p.amount,
    "Due Date":     p.due,
    "Paid":         p.paid ? "Yes" : "No",
    "Paid On":      p.paidOn || "—",
    "Method":       p.method || "—",
    "Reference":    p.ref || "—",
  })) : [];

  return (
    <div className="panel" style={{ padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Header */}
      <div>
        <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "var(--navy-900)", marginBottom: 4 }}>
          Trainee Payment Statement
        </div>
        <div style={{ fontSize: 13, color: "var(--navy-500)" }}>
          Search for a trainee and export their individual payment schedule as Excel or a branded PDF statement.
        </div>
      </div>

      {/* Search input */}
      <div style={{ position: "relative" }} ref={dropRef}>
        <div className="search-bar" style={{ margin: 0 }}>
          <Icon name="search" size={15} style={{ color: "var(--navy-400)", flexShrink: 0 }}/>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by name or company…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true); }}
            onFocus={() => query && setOpen(true)}
            style={{ flex: 1 }}
          />
          {query && (
            <button onClick={clear} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--navy-400)", display: "flex" }}>
              <Icon name="close" size={14}/>
            </button>
          )}
        </div>

        {/* Dropdown results */}
        {open && matches.length > 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "white", border: "1px solid var(--warm-100)", borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)", zIndex: 50, overflow: "hidden",
          }}>
            {matches.map(t => {
              const course = RD.getCourse(t.courseId);
              const balance = t.totalCost - t.paid;
              return (
                <div
                  key={t.id}
                  className="panel-row"
                  style={{ borderRadius: 0, cursor: "pointer", padding: "10px 14px" }}
                  onClick={() => pick(t)}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="nm" style={{ fontSize: 13 }}>{t.name}</div>
                    <div className="sub" style={{ fontSize: 11 }}>{t.company || "Individual"} · {course.name}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: balance > 0 ? "var(--red)" : "var(--green)" }}>
                      {balance > 0 ? `${RD.fmtMoney(balance)} outstanding` : "Fully paid"}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--navy-400)" }}>{t.plan.length} instalment{t.plan.length !== 1 ? "s" : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {open && query.trim().length > 0 && matches.length === 0 && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            background: "white", border: "1px solid var(--warm-100)", borderRadius: 6,
            padding: "14px", fontSize: 13, color: "var(--navy-400)", zIndex: 50,
          }}>
            No trainees match "{query}"
          </div>
        )}
      </div>

      {/* Selected trainee preview */}
      {selected && (
        <div style={{ borderTop: "1px solid var(--warm-100)", paddingTop: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Summary strip */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Course",    value: RD.getCourse(selected.courseId).name, full: true },
              { label: "Total",     value: RD.fmtMoney(selected.totalCost) },
              { label: "Paid",      value: RD.fmtMoney(selected.paid) },
              { label: "Balance",   value: RD.fmtMoney(selected.totalCost - selected.paid),
                color: (selected.totalCost - selected.paid) > 0 ? "var(--red)" : "var(--green)" },
            ].map(item => (
              <div key={item.label} style={{ background: "var(--warm-100)", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "var(--navy-400)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: item.color || "var(--navy-900)" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* Instalment mini-table */}
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th>#</th><th>Description</th><th>Amount</th><th>Due</th><th>Status</th><th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {selected.plan.map((p, i) => {
                const overdue = !p.paid && RD.daysUntil(p.due) < 0;
                return (
                  <tr key={p.id || i}>
                    <td style={{ color: "var(--navy-400)" }}>{i + 1}</td>
                    <td>{p.label || `Instalment ${i + 1}`}</td>
                    <td style={{ fontWeight: 500 }}>{RD.fmtMoney(p.amount)}</td>
                    <td>{RD.fmtDate(p.due)}</td>
                    <td>
                      {p.paid
                        ? <span className="pill" style={{ background: "var(--green-lt)", color: "var(--green)", fontSize: 11 }}>Paid</span>
                        : overdue
                          ? <span className="pill" style={{ background: "var(--red-lt)", color: "var(--red)", fontSize: 11 }}>Overdue</span>
                          : <span className="pill" style={{ background: "var(--amber-lt)", color: "var(--amber)", fontSize: 11 }}>Pending</span>
                      }
                    </td>
                    <td style={{ color: "var(--navy-400)", fontSize: 11 }}>{p.ref || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Export buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, gap: 6 }}
              disabled={busy}
              onClick={() => run(() => toExcel(
                `Statement_${selected.name.replace(/\s+/g,'_')}_${RD.todayISO()}.xlsx`,
                "Payment Schedule",
                traineeExcelRows
              ))}
            >
              <Icon name="file" size={13}/> Export Excel
            </button>
            <button
              className="btn btn-orange"
              style={{ fontSize: 12, gap: 6 }}
              disabled={busy}
              onClick={() => run(() => toStatementPDF(selected))}
            >
              <Icon name="download" size={13}/> Export PDF Statement
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
  const [busy, setBusy]           = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); setLastExport(new Date()); }
    catch (e) { alert("Export failed: " + e.message); }
    finally { setBusy(false); }
  };

  const today = RD.todayISO();

  const outstanding = buildOutstanding(state);
  const outHeaders  = ["Trainee", "Company", "Course", "Instalment", "Amount (TTD)", "Due Date", "Status", "Phone", "Email"];

  const summary    = buildSummary(state);
  const sumHeaders = ["Trainee", "Company", "Course", "Total (TTD)", "Paid (TTD)", "Balance (TTD)", "Method", "Registered", "Stage", "Phone", "Email"];

  const schedule   = buildSchedule(state);
  const schHeaders = ["Trainee", "Company", "Course", "Instalment", "Amount (TTD)", "Due Date", "Paid", "Paid On", "Method", "Reference"];

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

        {/* Trainee statement search — first so it's prominent */}
        <TraineeStatementCard state={state} />

        <ReportCard
          title="Outstanding Payments"
          description="All unpaid instalments across active payment plans. Sorted by due date — overdue items appear first."
          columns={outHeaders}
          count={outstanding.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Outstanding_Payments_${today}.xlsx`, "Outstanding", outstanding))}
          onPDF={() => run(() => toPDF("Outstanding Payments", outHeaders, outstanding.map(r => outHeaders.map(h => r[h] ?? "—")), `Outstanding_Payments_${today}.pdf`))}
        />

        <ReportCard
          title="Payment Plans Summary"
          description="One row per trainee showing total course cost, amount paid so far, and remaining balance."
          columns={sumHeaders}
          count={summary.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Payment_Summary_${today}.xlsx`, "Summary", summary))}
          onPDF={() => run(() => toPDF("Payment Plans Summary", sumHeaders, summary.map(r => sumHeaders.map(h => r[h] ?? "—")), `Payment_Summary_${today}.pdf`))}
        />

        <ReportCard
          title="Full Instalment Schedule"
          description="Every instalment from every trainee — both paid and pending — with payment method and reference number."
          columns={schHeaders}
          count={schedule.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Instalment_Schedule_${today}.xlsx`, "Schedule", schedule))}
          onPDF={() => run(() => toPDF("Full Instalment Schedule", schHeaders, schedule.map(r => schHeaders.map(h => r[h] ?? "—")), `Instalment_Schedule_${today}.pdf`))}
        />

        <ReportCard
          title="Training Leads"
          description="All current leads with contact details, course interest, status, priority, and assigned coordinator."
          columns={leadHeaders}
          count={leads.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Leads_${today}.xlsx`, "Leads", leads))}
          onPDF={() => run(() => toPDF("Training Leads", leadHeaders, leads.map(r => leadHeaders.map(h => r[h] ?? "—")), `Leads_${today}.pdf`))}
        />

      </div>
    </div>
  );
}
