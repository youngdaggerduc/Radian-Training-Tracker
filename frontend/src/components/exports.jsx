import { useState, useRef, useEffect, useMemo } from 'react';
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

// Portrait payment statement for a single trainee — branded Radian design
async function toStatementPDF(trainee) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W      = 210;
  const M      = 14;
  const course  = RD.getCourse(trainee.courseId);
  const balance = +(trainee.totalCost - trainee.paid).toFixed(2);
  const today   = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const slug    = trainee.name.replace(/\s+/g, '_');

  // Colour palette matching the app theme
  const navy   = [6, 20, 41];
  const muted  = [90, 120, 165];
  const orange = [232, 116, 44];
  const ivory  = [250, 248, 243];
  const warm   = [242, 238, 230];
  const green  = [46, 125, 91];
  const red    = [184, 61, 61];
  const amber  = [184, 132, 27];
  const white  = [255, 255, 255];
  const ink    = [6, 20, 41];

  // ── Header bar ───────────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 30, 'F');

  // Company name — times bold mimics the app's Cormorant Garamond serif
  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...white);
  doc.text('Radian H.A. Limited', M, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 190, 225);
  doc.text('T R A I N I N G   O P E R A T I O N S', M, 23);

  // Right: document label + date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...orange);
  doc.text('PAYMENT STATEMENT', W - M, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 190, 225);
  doc.text(today, W - M, 22, { align: 'right' });

  // Orange accent rule under header
  doc.setFillColor(...orange);
  doc.rect(0, 30, W, 2.5, 'F');

  // ── Trainee identity ──────────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(27);
  doc.setTextColor(...ink);
  doc.text(trainee.name, M, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text([trainee.company || 'Individual', course.name].join('   ·   '), M, 61);

  doc.setDrawColor(...warm);
  doc.setLineWidth(0.5);
  doc.line(M, 66, W - M, 66);

  // ── Payment summary boxes ─────────────────────────────────────────────────────
  const boxY = 72;
  const boxH = 30;
  const boxW = (W - M * 2 - 8) / 3;
  const summaries = [
    { label: 'TOTAL COURSE FEE', value: RD.fmtMoney(trainee.totalCost), color: navy },
    { label: 'AMOUNT PAID',      value: RD.fmtMoney(trainee.paid),      color: green },
    { label: 'OUTSTANDING',      value: RD.fmtMoney(balance),           color: balance > 0 ? red : green },
  ];

  summaries.forEach((box, i) => {
    const bx = M + i * (boxW + 4);
    doc.setFillColor(...ivory);
    doc.setDrawColor(...warm);
    doc.setLineWidth(0.4);
    doc.roundedRect(bx, boxY, boxW, boxH, 1.5, 1.5, 'FD');
    // orange left accent strip
    doc.setFillColor(...orange);
    doc.rect(bx, boxY, 3, boxH, 'F');
    // label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(box.label, bx + 7, boxY + 10);
    // value
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...box.color);
    doc.text(box.value, bx + 7, boxY + 24);
  });

  // ── Trainee details (2 columns) ───────────────────────────────────────────────
  const detY = boxY + boxH + 9;

  doc.setFillColor(...warm);
  doc.rect(M, detY, W - M * 2, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  doc.text('TRAINEE DETAILS', M + 3.5, detY + 5.2);

  const leftCol  = [['PHONE', trainee.phone || '—'], ['EMAIL', trainee.email || '—']];
  const rightCol = [['REGISTRATION DATE', RD.fmtDate(trainee.registrationDate)], ['PAYMENT METHOD', trainee.paymentMethod || '—']];

  let dY = detY + 15;
  const rH = 13;
  const c1 = M + 3;
  const c2 = W / 2 + 4;

  leftCol.forEach(([lbl, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(lbl, c1, dY + i * rH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text(val, c1, dY + i * rH + 5.5);
  });
  rightCol.forEach(([lbl, val], i) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...muted);
    doc.text(lbl, c2, dY + i * rH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text(val, c2, dY + i * rH + 5.5);
  });

  // ── Instalment schedule ───────────────────────────────────────────────────────
  const tableY = dY + leftCol.length * rH + 6;

  doc.setFillColor(...warm);
  doc.rect(M, tableY, W - M * 2, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  doc.text('INSTALMENT SCHEDULE', M + 3.5, tableY + 5.2);

  const schHeaders = ['#', 'Description', 'Amount (TTD)', 'Due Date', 'Status', 'Paid On', 'Reference'];
  const schRows = trainee.plan.map((p, i) => [
    String(i + 1),
    p.label || `Instalment ${i + 1}`,
    RD.fmtMoney(p.amount),
    RD.fmtDate(p.due),
    p.paid ? 'Paid' : (RD.daysUntil(p.due) < 0 ? `Overdue ${Math.abs(RD.daysUntil(p.due))}d` : 'Pending'),
    p.paidOn ? RD.fmtDate(p.paidOn) : '—',
    p.ref || '—',
  ]);

  autoTable(doc, {
    head: [schHeaders],
    body: schRows,
    startY: tableY + 7.5,
    styles: { fontSize: 8, cellPadding: 3.5, textColor: ink },
    headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: ivory },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: M, right: M },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const v = String(data.cell.raw);
        if (v === 'Paid')                data.cell.styles.textColor = green;
        else if (v.startsWith('Overdue')) data.cell.styles.textColor = red;
        else                             data.cell.styles.textColor = amber;
      }
    },
  });

  // ── Footer bar ────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...navy);
  doc.rect(0, pageH - 13, W, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 190, 225);
  doc.text('Radian H.A. Limited  ·  Training Operations  ·  Internal Record', M, pageH - 4.5);
  doc.text(`Generated ${today}`, W - M, pageH - 4.5, { align: 'right' });

  doc.save(`Statement_${slug}_${RD.todayISO()}.pdf`);
}

// Portrait company account statement — branded Radian design
async function toCompanyStatementPDF(companyName, trainees) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W     = 210;
  const M     = 14;
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const slug  = companyName.replace(/\s+/g, '_');

  const navy   = [6, 20, 41];
  const muted  = [90, 120, 165];
  const orange = [232, 116, 44];
  const ivory  = [250, 248, 243];
  const warm   = [242, 238, 230];
  const green  = [46, 125, 91];
  const red    = [184, 61, 61];
  const amber  = [184, 132, 27];
  const white  = [255, 255, 255];
  const ink    = [6, 20, 41];

  const totalCost   = trainees.reduce((s, t) => s + t.totalCost, 0);
  const totalPaid   = trainees.reduce((s, t) => s + t.paid, 0);
  const outstanding = totalCost - totalPaid;

  // ── Header bar ───────────────────────────────────────────────────────────────
  doc.setFillColor(...navy);
  doc.rect(0, 0, W, 30, 'F');

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...white);
  doc.text('Radian H.A. Limited', M, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 190, 225);
  doc.text('T R A I N I N G   O P E R A T I O N S', M, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...orange);
  doc.text('COMPANY ACCOUNT STATEMENT', W - M, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(160, 190, 225);
  doc.text(today, W - M, 22, { align: 'right' });

  doc.setFillColor(...orange);
  doc.rect(0, 30, W, 2.5, 'F');

  // ── Company identity ──────────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(27);
  doc.setTextColor(...ink);
  doc.text(companyName, M, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  doc.text(`${trainees.length} trainee${trainees.length === 1 ? '' : 's'} enrolled`, M, 61);

  doc.setDrawColor(...warm);
  doc.setLineWidth(0.5);
  doc.line(M, 66, W - M, 66);

  // ── Summary boxes ─────────────────────────────────────────────────────────────
  const boxY = 72;
  const boxH = 30;
  const boxW = (W - M * 2 - 12) / 4;
  const summaries = [
    { label: 'TRAINEES',         value: String(trainees.length),     color: navy },
    { label: 'TOTAL COURSE FEE', value: RD.fmtMoney(totalCost),      color: navy },
    { label: 'AMOUNT PAID',      value: RD.fmtMoney(totalPaid),       color: green },
    { label: 'OUTSTANDING',      value: RD.fmtMoney(outstanding),     color: outstanding > 0 ? red : green },
  ];
  summaries.forEach((box, i) => {
    const bx = M + i * (boxW + 4);
    doc.setFillColor(...ivory);
    doc.setDrawColor(...warm);
    doc.setLineWidth(0.4);
    doc.roundedRect(bx, boxY, boxW, boxH, 1.5, 1.5, 'FD');
    doc.setFillColor(...orange);
    doc.rect(bx, boxY, 3, boxH, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...muted);
    doc.text(box.label, bx + 7, boxY + 10);
    doc.setFont('times', 'bold');
    doc.setFontSize(i === 0 ? 18 : 13);
    doc.setTextColor(...box.color);
    doc.text(box.value, bx + 7, boxY + 24);
  });

  // ── Trainee table ─────────────────────────────────────────────────────────────
  const tableY = boxY + boxH + 9;

  doc.setFillColor(...warm);
  doc.rect(M, tableY, W - M * 2, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...muted);
  doc.text('TRAINEE ACCOUNTS', M + 3.5, tableY + 5.2);

  const tHeaders = ['Trainee', 'Course', 'Total (TTD)', 'Paid (TTD)', 'Balance (TTD)', 'Stage', 'Next Due'];
  const tRows = trainees.map(t => {
    const bal = t.totalCost - t.paid;
    const next = t.plan?.find(p => !p.paid);
    const stageLabel = t.stage.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return [
      t.name,
      RD.getCourse(t.courseId).name,
      RD.fmtMoney(t.totalCost),
      RD.fmtMoney(t.paid),
      RD.fmtMoney(bal),
      stageLabel,
      next ? `${RD.fmtMoney(next.amount)} · ${RD.fmtDate(next.due)}` : '—',
    ];
  });

  autoTable(doc, {
    head: [tHeaders],
    body: tRows,
    startY: tableY + 7.5,
    styles: { fontSize: 8, cellPadding: 3.5, textColor: ink },
    headStyles: { fillColor: navy, textColor: white, fontStyle: 'bold', fontSize: 7.5 },
    alternateRowStyles: { fillColor: ivory },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right', textColor: green },
      4: { halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: M, right: M },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const val = tRows[data.row.index]?.[4];
        if (val && val !== RD.fmtMoney(0)) data.cell.styles.textColor = red;
        else data.cell.styles.textColor = green;
      }
    },
  });

  // ── Footer ────────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...navy);
  doc.rect(0, pageH - 13, W, 13, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 190, 225);
  doc.text('Radian H.A. Limited  ·  Training Operations  ·  Internal Record', M, pageH - 4.5);
  doc.text(`Generated ${today}`, W - M, pageH - 4.5, { align: 'right' });

  doc.save(`Company_Statement_${slug}_${RD.todayISO()}.pdf`);
}

// ── Data builders ─────────────────────────────────────────────────────────────

function buildCompanySummary(state) {
  const map = {};
  const ensure = (key) => {
    if (!map[key]) map[key] = { company: key, activeLeads: 0, trainees: 0, totalCost: 0, collected: 0, outstanding: 0, courses: new Set() };
    return map[key];
  };

  state.leads.forEach(l => { ensure(l.company || "Individual").activeLeads++; });
  state.trainees.forEach(t => {
    const c = ensure(t.company || "Individual");
    c.trainees++;
    c.totalCost  += t.totalCost;
    c.collected  += t.paid;
    c.outstanding += Math.max(0, t.totalCost - t.paid);
    c.courses.add(RD.getCourse(t.courseId).name);
  });

  return Object.values(map)
    .sort((a, b) => b.totalCost - a.totalCost || a.company.localeCompare(b.company))
    .map(c => ({
      "Company":                  c.company,
      "Active Leads":             c.activeLeads,
      "Trainees":                 c.trainees,
      "Courses Enrolled":         [...c.courses].join(", ") || "—",
      "Total Course Value (TTD)": +c.totalCost.toFixed(2),
      "Collected (TTD)":          +c.collected.toFixed(2),
      "Outstanding (TTD)":        +c.outstanding.toFixed(2),
    }));
}

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
    "Gender":        t.gender || "—",
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

function buildLeads(state, statuses = []) {
  const leads = statuses.length
    ? state.leads.filter(l => statuses.includes(l.status))
    : state.leads;
  return leads.map(l => ({
    "Name":         l.name,
    "Gender":       l.gender || "—",
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

function buildSummaryFiltered(state, stages = []) {
  const trainees = stages.length
    ? state.trainees.filter(t => stages.includes(t.stage))
    : state.trainees;
  return trainees.map(t => ({
    "Trainee":       t.name,
    "Gender":        t.gender || "—",
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

// ── Company search + statement ────────────────────────────────────────────────

function CompanyStatementCard({ state }) {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(null);
  const [open, setOpen]         = useState(false);
  const [busy, setBusy]         = useState(false);
  const inputRef = useRef(null);
  const dropRef  = useRef(null);

  const companies = useMemo(() => {
    const map = {};
    state.trainees.forEach(t => {
      const key = t.company || "Individual";
      if (!map[key]) map[key] = { name: key, trainees: [] };
      map[key].trainees.push(t);
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [state.trainees]);

  const matches = query.trim().length > 0
    ? companies.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick  = (c) => { setSelected(c); setQuery(c.name); setOpen(false); };
  const clear = () => { setSelected(null); setQuery(""); inputRef.current?.focus(); };
  const run   = async (fn) => { setBusy(true); try { await fn(); } catch(e) { alert("Export failed: " + e.message); } finally { setBusy(false); } };

  const excelRows = selected ? selected.trainees.map(t => {
    const bal  = t.totalCost - t.paid;
    const next = t.plan?.find(p => !p.paid);
    return {
      "Trainee":          t.name,
      "Phone":            t.phone || "—",
      "Email":            t.email || "—",
      "Course":           RD.getCourse(t.courseId).name,
      "Total Cost (TTD)": t.totalCost,
      "Paid (TTD)":       t.paid,
      "Balance (TTD)":    +bal.toFixed(2),
      "Stage":            t.stage,
      "Next Due":         next ? next.due : "—",
      "Next Amount":      next ? next.amount : "—",
    };
  }) : [];

  return (
    <div style={{
      background: "var(--paper)", border: "1px solid var(--navy-100)",
      borderRadius: "var(--radius-lg)", overflow: "visible",
    }}>
      <div style={{
        background: "var(--navy-800)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        borderBottom: "2px solid var(--orange)",
        padding: "18px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 5, fontWeight: 600 }}>
            Company Export
          </div>
          <h3 style={{ color: "var(--ivory)", fontSize: 20, margin: 0, fontFamily: "var(--serif)", fontWeight: 500 }}>
            Company Account Statement
          </h3>
        </div>
        <Icon name="company" size={20} style={{ color: "rgba(255,255,255,0.25)" }}/>
      </div>

      <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 13, color: "var(--navy-500)", margin: 0, lineHeight: 1.55 }}>
          Search for a company, preview all trainees and their payment status, then export as Excel or a branded PDF account statement.
        </p>

        <div style={{ position: "relative" }} ref={dropRef}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 13px", border: "1px solid var(--navy-100)",
            borderRadius: "var(--radius)", background: "var(--paper)",
          }}>
            <Icon name="company" size={14} style={{ color: "var(--navy-300)", flexShrink: 0 }}/>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by company name…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true); }}
              onFocus={() => query && setOpen(true)}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--navy-800)" }}
            />
            {query && (
              <button onClick={clear} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--navy-300)", display: "flex", lineHeight: 1 }}>
                <Icon name="close" size={13}/>
              </button>
            )}
          </div>

          {open && matches.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              background: "var(--paper)", border: "1px solid var(--navy-100)",
              borderRadius: "var(--radius)", boxShadow: "var(--shadow)", zIndex: 50, overflow: "hidden",
            }}>
              {matches.map(c => {
                const paid        = c.trainees.reduce((s, t) => s + t.paid, 0);
                const outstanding = c.trainees.reduce((s, t) => s + Math.max(0, t.totalCost - t.paid), 0);
                return (
                  <div key={c.name} className="panel-row" style={{ borderRadius: 0, cursor: "pointer", padding: "10px 14px" }} onClick={() => pick(c)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nm" style={{ fontSize: 13 }}>{c.name}</div>
                      <div className="sub" style={{ fontSize: 11 }}>{c.trainees.length} trainee{c.trainees.length !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: outstanding > 0 ? "var(--red)" : "var(--green)" }}>
                        {outstanding > 0 ? `${RD.fmtMoney(outstanding)} owing` : "Fully paid"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--navy-300)" }}>{RD.fmtMoney(paid)} collected</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {open && query.trim().length > 0 && matches.length === 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              background: "var(--paper)", border: "1px solid var(--navy-100)",
              borderRadius: "var(--radius)", padding: "14px",
              fontSize: 13, color: "var(--navy-300)", zIndex: 50,
            }}>
              No companies match "{query}"
            </div>
          )}
        </div>

        {selected && (() => {
          const totalCost   = selected.trainees.reduce((s, t) => s + t.totalCost, 0);
          const totalPaid   = selected.trainees.reduce((s, t) => s + t.paid, 0);
          const outstanding = totalCost - totalPaid;
          return (
            <div style={{ borderTop: "1px solid var(--navy-100)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Summary strip */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "var(--navy-800)", borderRadius: "var(--radius)", padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 5 }}>Company</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ivory)", lineHeight: 1.3 }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{selected.trainees.length} trainee{selected.trainees.length !== 1 ? "s" : ""}</div>
                </div>
                {[
                  { label: "Total Fees",   value: RD.fmtMoney(totalCost),   color: "var(--navy-800)" },
                  { label: "Collected",    value: RD.fmtMoney(totalPaid),   color: "var(--green)" },
                  { label: "Outstanding",  value: RD.fmtMoney(outstanding), color: outstanding > 0 ? "var(--red)" : "var(--green)" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "var(--warm-100)", borderRadius: "var(--radius)",
                    padding: "12px 14px", borderLeft: "3px solid var(--orange)",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--navy-500)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: item.color, fontFamily: "var(--serif)" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Trainee table */}
              <div className="panel" style={{ overflow: "hidden" }}>
                <table className="tbl" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Trainee</th>
                      <th>Course</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Balance</th>
                      <th>Stage</th>
                      <th>Next Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.trainees.map(t => {
                      const bal  = t.totalCost - t.paid;
                      const next = t.plan?.find(p => !p.paid);
                      const course = RD.getCourse(t.courseId);
                      return (
                        <tr key={t.id} style={{ cursor: "default" }}>
                          <td><div className="nm">{t.name}</div><div className="sub">{t.phone || "—"}</div></td>
                          <td>{course.name}</td>
                          <td className="tnum">{RD.fmtMoney(t.totalCost)}</td>
                          <td className="tnum" style={{ color: "var(--green)" }}>{RD.fmtMoney(t.paid)}</td>
                          <td className="tnum" style={{ color: bal > 0 ? "var(--red)" : "var(--green)", fontWeight: 500 }}>{RD.fmtMoney(bal)}</td>
                          <td><span style={{ fontSize: 11, color: "var(--navy-500)" }}>{t.stage.replace(/-/g, ' ')}</span></td>
                          <td style={{ fontSize: 11 }}>
                            {next
                              ? <><span className="tnum">{RD.fmtMoney(next.amount)}</span><div className="sub">{RD.fmtDateShort(next.due)}</div></>
                              : <span style={{ color: "var(--green)" }}>Complete</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Export buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" style={{ fontSize: 12, gap: 6 }} disabled={busy}
                  onClick={() => run(() => toExcel(`Company_${selected.name.replace(/\s+/g,'_')}_${RD.todayISO()}.xlsx`, "Trainees", excelRows))}>
                  <Icon name="file" size={13}/> Export Excel
                </button>
                <button className="btn btn-orange" style={{ fontSize: 12, gap: 6 }} disabled={busy}
                  onClick={() => run(() => toCompanyStatementPDF(selected.name, selected.trainees))}>
                  <Icon name="download" size={13}/> Export PDF Statement
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
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
    <div style={{
      background: "var(--paper)", border: "1px solid var(--navy-100)",
      borderRadius: "var(--radius-lg)", overflow: "visible",
    }}>
      {/* Navy panel header — matches sidebar/accent language */}
      <div style={{
        background: "var(--navy-800)",
        borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
        borderBottom: "2px solid var(--orange)",
        padding: "18px 22px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--orange)", marginBottom: 5, fontWeight: 600 }}>
            Individual Export
          </div>
          <h3 style={{ color: "var(--ivory)", fontSize: 20, margin: 0, fontFamily: "var(--serif)", fontWeight: 500 }}>
            Trainee Payment Statement
          </h3>
        </div>
        <Icon name="download" size={20} style={{ color: "rgba(255,255,255,0.25)" }}/>
      </div>

      <div style={{ padding: "20px 22px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 13, color: "var(--navy-500)", margin: 0, lineHeight: 1.55 }}>
          Search for a trainee by name or company, preview their payment schedule, then export as Excel or a branded PDF.
        </p>

        {/* Search input */}
        <div style={{ position: "relative" }} ref={dropRef}>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "9px 13px", border: "1px solid var(--navy-100)",
            borderRadius: "var(--radius)", background: "var(--paper)",
          }}>
            <Icon name="search" size={14} style={{ color: "var(--navy-400)", flexShrink: 0 }}/>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search by name or company…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null); setOpen(true); }}
              onFocus={() => query && setOpen(true)}
              style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 13, color: "var(--navy-800)" }}
            />
            {query && (
              <button onClick={clear} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--navy-400)", display: "flex", lineHeight: 1 }}>
                <Icon name="close" size={13}/>
              </button>
            )}
          </div>

          {/* Dropdown */}
          {open && matches.length > 0 && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
              background: "var(--paper)", border: "1px solid var(--navy-100)",
              borderRadius: "var(--radius)", boxShadow: "var(--shadow)", zIndex: 50, overflow: "hidden",
            }}>
              {matches.map(t => {
                const bal = t.totalCost - t.paid;
                return (
                  <div
                    key={t.id}
                    className="panel-row"
                    style={{ borderRadius: 0, cursor: "pointer", padding: "10px 14px" }}
                    onClick={() => pick(t)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="nm" style={{ fontSize: 13 }}>{t.name}</div>
                      <div className="sub" style={{ fontSize: 11 }}>{t.company || "Individual"} · {RD.getCourse(t.courseId).name}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: bal > 0 ? "var(--red)" : "var(--green)" }}>
                        {bal > 0 ? `${RD.fmtMoney(bal)} owing` : "Fully paid"}
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
              background: "var(--paper)", border: "1px solid var(--navy-100)",
              borderRadius: "var(--radius)", padding: "14px",
              fontSize: 13, color: "var(--navy-400)", zIndex: 50,
            }}>
              No trainees match "{query}"
            </div>
          )}
        </div>

        {/* Selected trainee preview */}
        {selected && (() => {
          const bal = selected.totalCost - selected.paid;
          return (
            <div style={{ borderTop: "1px solid var(--navy-100)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>

              {/* Summary strip — navy card + stat mini-cards */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10 }}>
                <div style={{ background: "var(--navy-800)", borderRadius: "var(--radius)", padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 5 }}>Course</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ivory)", lineHeight: 1.3 }}>{RD.getCourse(selected.courseId).name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{selected.company || "Individual"}</div>
                </div>
                {[
                  { label: "Total Fee", value: RD.fmtMoney(selected.totalCost), color: "var(--navy-800)" },
                  { label: "Paid",      value: RD.fmtMoney(selected.paid),      color: "var(--green)" },
                  { label: "Balance",   value: RD.fmtMoney(bal),                color: bal > 0 ? "var(--red)" : "var(--green)" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "var(--warm-100)", borderRadius: "var(--radius)",
                    padding: "12px 14px", borderLeft: "3px solid var(--orange)",
                  }}>
                    <div style={{ fontSize: 9, color: "var(--navy-500)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: item.color, fontFamily: "var(--serif)" }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Instalment mini-table */}
              <div className="panel" style={{ overflow: "hidden" }}>
                <table className="tbl" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 28, textAlign: "center" }}>#</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th>Reference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.plan.map((p, i) => {
                      const overdue = !p.paid && RD.daysUntil(p.due) < 0;
                      return (
                        <tr key={p.id || i} style={{ cursor: "default" }}>
                          <td style={{ color: "var(--navy-400)", textAlign: "center" }}>{i + 1}</td>
                          <td>{p.label || `Instalment ${i + 1}`}</td>
                          <td style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{RD.fmtMoney(p.amount)}</td>
                          <td>{RD.fmtDate(p.due)}</td>
                          <td>
                            {p.paid
                              ? <span className="pill paid">Paid</span>
                              : overdue
                                ? <span className="pill overdue">Overdue</span>
                                : <span className="pill pending">Pending</span>
                            }
                          </td>
                          <td style={{ color: "var(--navy-400)", fontSize: 11 }}>{p.ref || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
          );
        })()}
      </div>
    </div>
  );
}

// ── Filterable report card ─────────────────────────────────────────────────────

function FilterableReportCard({ title, description, columns, filterLabel, filterOptions, onExcel, onPDF, countFor, busy }) {
  const [selected, setSelected] = useState([]);
  const toggle = (v) => setSelected(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);
  const count = countFor(selected);
  return (
    <div className="panel" style={{ padding: "20px 24px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--sans)", fontWeight: 600, fontSize: 15, color: "var(--navy-900)", marginBottom: 4 }}>
            {title}
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "var(--navy-300)" }}>
              {count} {count === 1 ? "row" : "rows"}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "var(--navy-500)", lineHeight: 1.5 }}>{description}</div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 5 }} onClick={() => onExcel(selected)} disabled={busy || count === 0}>
            <Icon name="file" size={13}/> Excel
          </button>
          <button className="btn btn-ghost" style={{ fontSize: 12, gap: 5 }} onClick={() => onPDF(selected)} disabled={busy || count === 0}>
            <Icon name="file" size={13}/> PDF
          </button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--navy-500)", marginBottom: 8 }}>
          {filterLabel} <span style={{ opacity: 0.6 }}>— leave all unselected to export everything</span>
        </div>
        <div className="chip-row">
          {filterOptions.map(opt => (
            <button key={opt} className={"chip" + (selected.includes(opt) ? " active" : "")} onClick={() => toggle(opt)}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {columns.map(col => (
          <span key={col} className="chip" style={{ fontSize: 11, padding: "2px 8px", background: "var(--warm-100)", color: "var(--navy-600)", cursor: "default" }}>
            {col}
          </span>
        ))}
      </div>

      {count === 0 && (
        <div style={{ fontSize: 12, color: "var(--navy-300)", fontStyle: "italic" }}>No data matches the selected filter.</div>
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

const LEAD_STATUSES  = ["New Interest", "Contacted", "Follow Up Needed", "Interested", "Not Interested"];
const TRAINEE_STAGES = ["initial-payment", "payment-plan", "payment-complete", "enrolled", "training-completed", "cert-ready", "cert-collected"];

export function ExportsView({ state }) {
  const [busy, setBusy]             = useState(false);
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

  const leadHeaders   = ["Name", "Company", "Phone", "Email", "Course", "Status", "Priority", "Source", "Inquiry Date", "Assigned To", "Follow-ups", "Notes"];
  const coHeaders     = ["Company", "Active Leads", "Trainees", "Courses Enrolled", "Total Course Value (TTD)", "Collected (TTD)", "Outstanding (TTD)"];

  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Exports & Reports</h1>
          <p className="view-sub">Download payment and lead data as Excel or PDF.</p>
        </div>
        {lastExport && (
          <div style={{ fontSize: 12, color: "var(--navy-300)", alignSelf: "flex-end" }}>
            Last export: {lastExport.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Individual trainee statement */}
        <TraineeStatementCard state={state} />

        {/* Company account statement */}
        <CompanyStatementCard state={state} />

        <ReportCard
          title="Company Account Summary"
          description="One row per company — active leads count, trainee count, total course value, amount collected, and outstanding balance. Sorted by total course value."
          columns={coHeaders}
          count={buildCompanySummary(state).length}
          busy={busy}
          onExcel={() => { const d = buildCompanySummary(state); run(() => toExcel(`Company_Summary_${today}.xlsx`, "Companies", d)); }}
          onPDF={() => { const d = buildCompanySummary(state); run(() => toPDF("Company Account Summary", coHeaders, d.map(r => coHeaders.map(h => r[h] ?? "—")), `Company_Summary_${today}.pdf`)); }}
        />

        <ReportCard
          title="Outstanding Payments"
          description="All unpaid instalments across active payment plans. Sorted by due date — overdue items appear first."
          columns={outHeaders}
          count={outstanding.length}
          busy={busy}
          onExcel={() => run(() => toExcel(`Outstanding_Payments_${today}.xlsx`, "Outstanding", outstanding))}
          onPDF={() => run(() => toPDF("Outstanding Payments", outHeaders, outstanding.map(r => outHeaders.map(h => r[h] ?? "—")), `Outstanding_Payments_${today}.pdf`))}
        />

        <FilterableReportCard
          title="Payment Plans Summary"
          description="One row per trainee — total cost, paid, balance, method, stage. Filter by stage to export specific groups."
          columns={sumHeaders}
          filterLabel="Filter by stage"
          filterOptions={TRAINEE_STAGES}
          countFor={(stages) => buildSummaryFiltered(state, stages).length}
          busy={busy}
          onExcel={(stages) => { const d = buildSummaryFiltered(state, stages); run(() => toExcel(`Payment_Summary_${today}.xlsx`, "Summary", d)); }}
          onPDF={(stages) => { const d = buildSummaryFiltered(state, stages); run(() => toPDF("Payment Plans Summary", sumHeaders, d.map(r => sumHeaders.map(h => r[h] ?? "—")), `Payment_Summary_${today}.pdf`)); }}
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

        <FilterableReportCard
          title="Training Leads"
          description="Contact details, course interest, status, priority, and assigned coordinator. Filter by status to export a specific stage of the pipeline."
          columns={leadHeaders}
          filterLabel="Filter by status"
          filterOptions={LEAD_STATUSES}
          countFor={(statuses) => buildLeads(state, statuses).length}
          busy={busy}
          onExcel={(statuses) => { const d = buildLeads(state, statuses); run(() => toExcel(`Leads_${today}.xlsx`, "Leads", d)); }}
          onPDF={(statuses) => { const d = buildLeads(state, statuses); run(() => toPDF("Training Leads", leadHeaders, d.map(r => leadHeaders.map(h => r[h] ?? "—")), `Leads_${today}.pdf`)); }}
        />

      </div>
    </div>
  );
}
