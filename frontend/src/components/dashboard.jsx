import { Icon } from './icons';
import {
  fmtDate as fD, fmtDateShort as fDS, fmtMoney as fM,
  todayISO as tISO, daysUntil as dU, relTime as rT,
  getCourse as gC, getStaff as gS,
  STAFF, COURSES,
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
            <div className="kv"><span className="k">CISRS courses tracked</span><span className="v">6</span></div>
            <div className="kv"><span className="k">GetmieSafe courses tracked</span><span className="v">4</span></div>
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
