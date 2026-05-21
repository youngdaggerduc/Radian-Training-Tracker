import { Icon } from './icons';
import {
  fmtDate as fD, fmtDateShort as fDS, fmtMoney as fM,
  todayISO as tISO, daysUntil as dU, relTime as rT,
  getCourse as gC, getStaff as gS,
  getAllCourses, STAFF,
} from '../data';

export function Dashboard({ state, setView, openModal, openDrawer, currentUser }) {
  const { leads, trainees } = state;

  const newLeads = leads.filter(l => l.status === "New Interest").length;
  const today = tISO();
  const todaysFollowUps = leads.flatMap(l =>
    l.followUps.filter(f => f.date === today && !f.outcome).map(f => ({ ...f, lead: l }))
  );
  const overdueFollowUps = leads.flatMap(l =>
    l.followUps.filter(f => dU(f.date) < 0 && !f.outcome).map(f => ({ ...f, lead: l }))
  );
  const upcomingFollowUps = leads.flatMap(l =>
    l.followUps.filter(f => dU(f.date) >= 0 && dU(f.date) <= 7 && !f.outcome).map(f => ({ ...f, lead: l }))
  );

  const upcomingPayments = trainees.flatMap(t =>
    t.plan.filter(p => !p.paid && dU(p.due) >= 0 && dU(p.due) <= 30)
       .map(p => ({ ...p, trainee: t }))
  );
  const overduePayments = trainees.flatMap(t =>
    t.plan.filter(p => !p.paid && dU(p.due) < 0).map(p => ({ ...p, trainee: t }))
  );

  const enrolledStudents = trainees.filter(t => t.enrollment && t.enrollment.status !== "Completed").length;
  const paymentComplete = trainees.filter(t => t.paid >= t.totalCost).length;
  const certsReady = trainees.filter(t => t.certificate?.status === "Ready for Collection").length;

  const importantReminders = [];

  overduePayments.slice(0, 5).forEach(p => {
    importantReminders.push({
      kind: "danger", icon: "warn",
      title: `${p.trainee.name} payment overdue`,
      sub: `${fM(p.amount)} due ${fD(p.due)} · ${rT(p.due)}`,
      when: rT(p.due),
      action: () => openDrawer({ type: "trainee", id: p.trainee.id }),
    });
  });

  overdueFollowUps.slice(0, 4).forEach(f => {
    importantReminders.push({
      kind: "danger", icon: "warn",
      title: `${f.lead.name} follow-up overdue`,
      sub: `${f.method} scheduled ${fD(f.date)} · ${rT(f.date)}`,
      when: rT(f.date),
      action: () => openDrawer({ type: "lead", id: f.lead.id }),
    });
  });

  upcomingPayments.slice(0, 5).forEach(p => {
    importantReminders.push({
      kind: dU(p.due) <= 3 ? "warn" : "info",
      icon: "cash",
      title: `${p.trainee.name} payment due ${rT(p.due)}`,
      sub: `${fM(p.amount)} · ${gC(p.trainee.courseId).name}`,
      when: rT(p.due),
      action: () => openDrawer({ type: "trainee", id: p.trainee.id }),
    });
  });

  todaysFollowUps.forEach(f => {
    importantReminders.push({
      kind: "warn", icon: "phone",
      title: `${f.method} ${f.lead.name} at ${f.time}`,
      sub: f.notes || `Scheduled follow-up`,
      when: "Today",
      action: () => openDrawer({ type: "lead", id: f.lead.id }),
    });
  });

  trainees.filter(t => t.certificate?.status === "Ready for Collection").slice(0, 3).forEach(t => {
    importantReminders.push({
      kind: "success", icon: "award",
      title: `Certificate ready for ${t.name}`,
      sub: `${t.certificate.number} · awaiting collection`,
      when: rT(t.certificate.readyOn),
      action: () => openDrawer({ type: "trainee", id: t.id }),
    });
  });

  trainees.filter(t => t.enrollment && dU(t.enrollment.startDate) >= 0 && dU(t.enrollment.startDate) <= 30).slice(0, 3).forEach(t => {
    importantReminders.push({
      kind: "info", icon: "calendar",
      title: `${gC(t.courseId).name} starts ${rT(t.enrollment.startDate)}`,
      sub: `${t.name} · Batch ${t.enrollment.batch} · ${t.enrollment.location}`,
      when: rT(t.enrollment.startDate),
      action: () => openDrawer({ type: "trainee", id: t.id }),
    });
  });

  const recentLeads = [...leads].sort((a, b) => b.inquiryDate.localeCompare(a.inquiryDate)).slice(0, 5);

  return (
    <div>
      <div className="topbar">
        <div>
          <div className="crumb">DASHBOARD · {new Date().toLocaleDateString("en-GB", {weekday:"long", day:"numeric", month:"long", year:"numeric"})}</div>
        </div>
        <div className="right">
          <button className="bell"><Icon name="bell" size={16}/><span className="badge"></span></button>
          <button className="btn btn-orange" onClick={() => openModal("addLead")}>
            <Icon name="plus" size={14}/> New Lead
          </button>
        </div>
      </div>

      <div className="page-header">
        <div>
          <div className="eyebrow">Welcome back, {currentUser.name.split(" ")[0]}</div>
          <h1>Training operations at a glance</h1>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="New Interests" value={newLeads} sub="awaiting first contact" onClick={() => setView("leads")} accent={newLeads > 0}/>
        <StatCard label="Today's Follow-ups" value={todaysFollowUps.length} sub={overdueFollowUps.length ? `${overdueFollowUps.length} overdue` : "all on schedule"} alert={overdueFollowUps.length > 0} onClick={() => setView("followups")}/>
        <StatCard label="Upcoming Payments" value={upcomingPayments.length} sub={`${fM(upcomingPayments.reduce((s,p)=>s+p.amount,0))} in next 30 days`} onClick={() => setView("payments")}/>
        <StatCard label="Overdue Payments" value={overduePayments.length} sub={`${fM(overduePayments.reduce((s,p)=>s+p.amount,0))} outstanding`} alert={overduePayments.length > 0} onClick={() => setView("payments")}/>
      </div>

      <div className="stats-grid">
        <StatCard label="Enrolled Students" value={enrolledStudents} sub="currently in training" onClick={() => setView("enrollment")}/>
        <StatCard label="Payment Complete" value={paymentComplete} sub="fully paid trainees" onClick={() => setView("payments")}/>
        <StatCard label="Certificates Ready" value={certsReady} sub="for collection" alert={certsReady > 0} onClick={() => setView("certificates")}/>
        <StatCard label="Active Pipeline" value={leads.length + trainees.filter(t => t.stage !== "cert-collected").length} sub="across all stages" onClick={() => setView("pipeline")}/>
      </div>

      <div className="two-col" style={{ marginTop: 0 }}>
        <RevenueChart trainees={trainees}/>
        <PipelineBreakdown leads={leads} trainees={trainees} setView={setView}/>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h3>Important Reminders</h3>
            <div className="meta">{importantReminders.length} alert{importantReminders.length === 1 ? "" : "s"} · 30-day window</div>
          </div>
          <div className="panel-body" style={{padding: 0}}>
            {importantReminders.length === 0 ? (
              <div className="empty">
                <div className="icon">✓</div>
                <div className="ttl">All clear</div>
                <div>No urgent reminders right now.</div>
              </div>
            ) : importantReminders.slice(0, 8).map((r, i) => (
              <div key={i} className={"reminder " + r.kind} onClick={r.action}>
                <div className="icon-box"><Icon name={r.icon} size={16}/></div>
                <div className="body">
                  <div className="ttl">{r.title}</div>
                  <div className="sub">{r.sub}</div>
                </div>
                <div className="when">{r.when}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Quick Actions</h3></div>
          <div className="qa-grid">
            <button className="qa" onClick={() => openModal("addLead")}>
              <div className="icon-box"><Icon name="plus" size={16}/></div>
              <div><div className="ttl">Add Lead</div></div>
            </button>
            <button className="qa" onClick={() => openModal("scheduleFollowup")}>
              <div className="icon-box"><Icon name="calendar" size={16}/></div>
              <div><div className="ttl">Schedule Follow-up</div></div>
            </button>
            <button className="qa" onClick={() => setView("payments")}>
              <div className="icon-box"><Icon name="cash" size={16}/></div>
              <div><div className="ttl">Record Payment</div></div>
            </button>
            <button className="qa" onClick={() => setView("enrollment")}>
              <div className="icon-box"><Icon name="enroll" size={16}/></div>
              <div><div className="ttl">Enroll Student</div></div>
            </button>
            <button className="qa" onClick={() => setView("certificates")}>
              <div className="icon-box"><Icon name="award" size={16}/></div>
              <div><div className="ttl">Issue Certificate</div></div>
            </button>
            <button className="qa" onClick={() => setView("pipeline")}>
              <div className="icon-box"><Icon name="pipeline" size={16}/></div>
              <div><div className="ttl">View Pipeline</div></div>
            </button>
          </div>
          <div style={{padding:"0 18px 18px"}}>
            <div className="divider"></div>
            {[...new Set(getAllCourses().map(c => c.provider))].sort().map(p => (
              <div key={p} className="kv">
                <span className="k">{p} courses</span>
                <span className="v">{getAllCourses().filter(c => c.provider === p && c.active).length}</span>
              </div>
            ))}
            <div className="kv"><span className="k">Active staff</span><span className="v">{STAFF.length}</span></div>
          </div>
        </div>
      </div>

      <div className="panel" style={{marginTop: 24}}>
        <div className="panel-header">
          <h3>Recent Leads</h3>
          <button className="btn-text" onClick={() => setView("leads")}>View all leads <Icon name="arrowR" size={12}/></button>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Lead</th><th>Course</th><th>Source</th><th>Priority</th><th>Status</th><th>Inquiry</th></tr>
          </thead>
          <tbody>
            {recentLeads.map(l => (
              <tr key={l.id} onClick={() => openDrawer({ type: "lead", id: l.id })}>
                <td>
                  <div className="nm">{l.name}</div>
                  <div className="sub">{l.company || "Individual"} · {l.phone}</div>
                </td>
                <td><div className="nm">{gC(l.courseId).name}</div><div className="sub">{gC(l.courseId).provider} · {fM(gC(l.courseId).price)}</div></td>
                <td>{l.source}</td>
                <td><span className={"pill " + l.priority.toLowerCase()}>{l.priority}</span></td>
                <td><StatusPill status={l.status}/></td>
                <td>{fDS(l.inquiryDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Monthly Revenue Bar Chart ─────────────────────────────────────────────────
function RevenueChart({ trainees }) {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    months.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString("en-GB", { month: "short" }), total: 0 });
  }
  for (const t of trainees) {
    for (const p of t.plan) {
      if (p.paid && p.paidOn) {
        const m = months.find(m => m.key === p.paidOn.slice(0, 7));
        if (m) m.total += p.amount;
      }
    }
  }
  const maxVal = Math.max(...months.map(m => m.total), 1);
  const totalCollected = months.reduce((s, m) => s + m.total, 0);
  const W = 440, H = 120, padB = 20, padL = 0, barW = 44, gap = (W - padL - months.length * barW) / (months.length + 1);

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Monthly Collections</h3>
        <div className="meta">{fM(totalCollected)} — last 6 months</div>
      </div>
      <div style={{ padding: "20px 22px 18px" }}>
        <svg width="100%" viewBox={`0 0 ${W} ${H + padB}`} style={{ overflow: "visible" }}>
          {months.map((m, i) => {
            const barH = m.total > 0 ? Math.max((m.total / maxVal) * H, 4) : 0;
            const x = padL + gap + i * (barW + gap);
            const y = H - barH;
            const isLast = i === months.length - 1;
            return (
              <g key={m.key}>
                {m.total > 0 && (
                  <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fill="var(--navy-500)" fontFamily="var(--mono)">
                    {fM(m.total).replace("$", "")}
                  </text>
                )}
                <rect
                  x={x} y={y} width={barW} height={barH || 0} rx={3}
                  fill={isLast ? "var(--orange)" : "var(--navy-700)"}
                  opacity={isLast ? 1 : 0.7}
                />
                <text x={x + barW / 2} y={H + padB - 2} textAnchor="middle" fontSize={10} fill="var(--navy-400)" fontFamily="var(--sans)">
                  {m.label}
                </text>
              </g>
            );
          })}
          {/* baseline */}
          <line x1={padL} y1={H} x2={W} y2={H} stroke="var(--navy-100)" strokeWidth={1}/>
        </svg>
      </div>
    </div>
  );
}

// ── Pipeline Stage Breakdown ──────────────────────────────────────────────────
function PipelineBreakdown({ leads, trainees, setView }) {
  const segments = [
    { label: "New Leads",       count: leads.filter(l => l.status === "New Interest").length,                       color: "var(--navy-300)", view: "leads" },
    { label: "In Follow-up",    count: leads.filter(l => l.status !== "New Interest").length,                       color: "var(--navy-600)", view: "followups" },
    { label: "Active Trainees", count: trainees.filter(t => !["cert-collected"].includes(t.stage)).length,          color: "var(--orange)",   view: "payments" },
    { label: "Certs Collected", count: trainees.filter(t => t.stage === "cert-collected").length,                   color: "var(--green)",    view: "certificates" },
  ];
  const total = Math.max(segments.reduce((s, g) => s + g.count, 0), 1);

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>Pipeline Breakdown</h3>
        <div className="meta">{total} total across all stages</div>
      </div>
      <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ cursor: "pointer" }} onClick={() => setView(seg.view)}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: "var(--navy-600)", fontWeight: 500 }}>{seg.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--navy-800)", fontVariantNumeric: "tabular-nums" }}>{seg.count}</span>
            </div>
            <div className="bar" style={{ height: 8 }}>
              <div style={{ width: `${(seg.count / total) * 100}%`, background: seg.color, height: "100%", borderRadius: 100, transition: "width 0.4s ease" }}/>
            </div>
          </div>
        ))}
        <div style={{ marginTop: 4, paddingTop: 12, borderTop: "1px solid var(--navy-50)" }}>
          <div className="kv" style={{ padding: "6px 0" }}>
            <span className="k">Conversion rate (lead → trainee)</span>
            <span className="v">{total > 0 ? Math.round((trainees.length / total) * 100) : 0}%</span>
          </div>
          <div className="kv" style={{ padding: "6px 0" }}>
            <span className="k">Total enrolled / active</span>
            <span className="v">{trainees.filter(t => t.enrollment && t.enrollment.status !== "Completed").length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub, onClick, accent, alert }) {
  return (
    <div className={"stat-card" + (accent ? " accent" : "") + (alert ? " alert" : "")} onClick={onClick}>
      {alert && <div className="corner-mark"></div>}
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
      <div className="sub">{sub}</div>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    "New Interest": "new",
    "Contacted": "contacted",
    "Follow Up Needed": "followup",
    "Interested": "interested",
    "Not Interested": "not-interested",
    "Pending Enrollment": "pending",
    "Enrolled": "enrolled",
    "Attending": "attending",
    "Completed": "completed",
    "Pending": "pending",
    "Ready for Collection": "ready",
    "Collected": "collected",
  };
  return <span className={"pill " + (map[status] || "")}>{status}</span>;
}
