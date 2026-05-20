import { useState } from 'react';
import { Icon } from './icons';
import { StatusPill } from './dashboard';
import * as RD from '../data';

// ============ LEADS TABLE ============
export function LeadsView({ state, openDrawer, openModal }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const statuses = ["All", "New Interest", "Contacted", "Follow Up Needed", "Interested", "Not Interested"];

  const filtered = state.leads
    .filter(l => filter === "All" || l.status === filter)
    .filter(l => !search || `${l.name} ${l.company} ${l.phone} ${l.email}`.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.inquiryDate.localeCompare(a.inquiryDate));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline · Stage 1</div>
          <h1>Training Leads</h1>
        </div>
        <div className="actions">
          <button className="btn btn-orange" onClick={() => openModal("addLead")}>
            <Icon name="plus" size={14}/> New Lead
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search by name, company, phone, email…" value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="chip-row">
          {statuses.map(s => (
            <button key={s} className={"chip" + (filter === s ? " active" : "")} onClick={() => setFilter(s)}>
              {s} {s !== "All" && <span style={{opacity: 0.6}}>· {state.leads.filter(l => l.status === s).length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr><th>Lead</th><th>Course</th><th>Source</th><th>Priority</th><th>Status</th><th>Assigned</th><th>Inquiry</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7">
                <div className="empty">
                  <div className="icon">∅</div>
                  <div className="ttl">No leads match</div>
                  <div>Adjust your filter or create a new lead.</div>
                </div>
              </td></tr>
            ) : filtered.map(l => {
              const course = RD.getCourse(l.courseId);
              const assigned = RD.getStaff(l.assignedTo);
              return (
                <tr key={l.id} onClick={() => openDrawer({ type: "lead", id: l.id })}>
                  <td>
                    <div className="nm">{l.name}</div>
                    <div className="sub">{l.company || "Individual"} · {l.phone}</div>
                  </td>
                  <td>
                    <div className="nm">{course.name}</div>
                    <div className="sub">{course.provider} · {RD.fmtMoney(course.price)}</div>
                  </td>
                  <td>{l.source}</td>
                  <td><span className={"pill " + l.priority.toLowerCase()}>{l.priority}</span></td>
                  <td><StatusPill status={l.status}/></td>
                  <td>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <div className="avatar" style={{width:26, height:26, fontSize:11}}>{assigned.initials}</div>
                      <span>{assigned.name.split(" ")[0]}</span>
                    </div>
                  </td>
                  <td>{RD.fmtDateShort(l.inquiryDate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ FOLLOW-UPS VIEW ============
export function FollowUpsView({ state, openDrawer, openModal, updateLead }) {
  const all = state.leads.flatMap(l =>
    l.followUps.map(f => ({ ...f, lead: l }))
  );

  const overdue = all.filter(f => RD.daysUntil(f.date) < 0 && !f.outcome).sort((a,b) => a.date.localeCompare(b.date));
  const today = all.filter(f => f.date === RD.todayISO() && !f.outcome);
  const upcoming = all.filter(f => RD.daysUntil(f.date) > 0 && !f.outcome).sort((a,b) => a.date.localeCompare(b.date));
  const completed = all.filter(f => f.outcome).sort((a,b) => b.date.localeCompare(a.date));

  const markComplete = (lead, fu, outcome) => {
    const updated = {
      ...lead,
      followUps: lead.followUps.map(f => f.id === fu.id ? { ...f, outcome } : f)
    };
    updateLead(updated);
  };

  const Section = ({ title, items, tone, empty }) => (
    <div className="panel" style={{marginBottom: 18}}>
      <div className="panel-header">
        <h3>{title}</h3>
        <div className="meta">{items.length} item{items.length===1?"":"s"}</div>
      </div>
      <div className="panel-body" style={{padding: 0}}>
        {items.length === 0 ? (
          <div className="empty" style={{padding: "30px 20px"}}><div className="ttl" style={{fontSize:14}}>{empty}</div></div>
        ) : items.map(f => (
          <div key={f.id + f.lead.id} className={"reminder " + tone}>
            <div className="icon-box"><Icon name={f.method === "Call" ? "phone" : f.method === "WhatsApp" ? "chat" : "mail"} size={16}/></div>
            <div className="body" onClick={() => openDrawer({ type: "lead", id: f.lead.id })} style={{cursor:"pointer"}}>
              <div className="ttl">{f.method} · {f.lead.name} {f.lead.company && <span style={{color:"var(--navy-500)", fontWeight: 400}}>· {f.lead.company}</span>}</div>
              <div className="sub">{f.notes || "Scheduled follow-up"} {f.outcome && ` — Outcome: ${f.outcome}`}</div>
            </div>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <div className="when">{RD.fmtDateShort(f.date)} · {f.time}</div>
              {!f.outcome && (
                <button className="btn btn-ghost" style={{padding:"6px 10px", fontSize:12}}
                  onClick={(e) => { e.stopPropagation(); markComplete(f.lead, f, "Completed"); }}>
                  <Icon name="check" size={12}/> Done
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline · Stage 2</div>
          <h1>Follow-up Management</h1>
        </div>
        <div className="actions">
          <button className="btn btn-orange" onClick={() => openModal("scheduleFollowup")}>
            <Icon name="plus" size={14}/> Schedule Follow-up
          </button>
        </div>
      </div>
      <Section title="Overdue" items={overdue} tone="danger" empty="No overdue follow-ups — well done."/>
      <Section title="Today" items={today} tone="warn" empty="Nothing scheduled for today."/>
      <Section title="Upcoming" items={upcoming} tone="info" empty="No upcoming follow-ups."/>
      <Section title="Recently Completed" items={completed.slice(0, 5)} tone="success" empty="No completed follow-ups yet."/>
    </div>
  );
}

// ============ LEAD DETAIL DRAWER ============
export function LeadDrawer({ lead, onClose, updateLead, convertToTrainee, openModal }) {
  const [tab, setTab] = useState("overview");
  const [newNote, setNewNote] = useState("");
  const course = RD.getCourse(lead.courseId);
  const assigned = RD.getStaff(lead.assignedTo);

  const updateStatus = (status) => updateLead({ ...lead, status });
  const addNote = () => {
    if (!newNote.trim()) return;
    updateLead({
      ...lead,
      notes: [{ date: RD.todayISO(), by: lead.assignedTo, text: newNote }, ...lead.notes]
    });
    setNewNote("");
  };
  const addFollowUp = (fu) => {
    updateLead({ ...lead, followUps: [fu, ...lead.followUps], status: "Follow Up Needed" });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-header">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14}}>
            <div>
              <div style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--orange)", marginBottom: 6}}>LEAD · {lead.id}</div>
              <h2>{lead.name}</h2>
            </div>
            <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
          </div>
          <div className="meta" style={{marginTop:12}}>
            <StatusPill status={lead.status}/>
            <span className={"pill " + lead.priority.toLowerCase()}>{lead.priority} Priority</span>
            <span>·</span>
            <span>{lead.company || "Individual"}</span>
            <span>·</span>
            <span>{lead.phone}</span>
          </div>
        </div>
        <div className="drawer-tabs">
          {["overview", "notes", "follow-ups", "actions"].map(t => (
            <button key={t} className={"drawer-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="drawer-body">
          {tab === "overview" && (
            <>
              <h3 style={{fontSize:16, marginBottom:12, color:"var(--navy-500)"}}>Course Interest</h3>
              <div style={{padding:"16px 18px", background:"var(--warm-100)", borderRadius:"var(--radius)", marginBottom:24}}>
                <div style={{fontSize:11, color:"var(--orange-dk)", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:4}}>{course.provider}</div>
                <div style={{fontFamily:"var(--serif)", fontSize:22, marginBottom:8}}>{course.name}</div>
                <div style={{display:"flex", gap:18, fontSize:13, color:"var(--navy-500)"}}>
                  <span>{course.days} day{course.days>1?"s":""}</span>
                  <span>·</span>
                  <span className="tnum" style={{color:"var(--navy-800)", fontWeight:500}}>{RD.fmtMoney(course.price)}</span>
                </div>
              </div>

              <h3 style={{fontSize:16, marginBottom:12, color:"var(--navy-500)"}}>Contact Information</h3>
              <div className="kv"><span className="k">Email</span><span className="v">{lead.email || "—"}</span></div>
              <div className="kv"><span className="k">Phone</span><span className="v">{lead.phone}</span></div>
              <div className="kv"><span className="k">Source of Inquiry</span><span className="v">{lead.source}</span></div>
              <div className="kv"><span className="k">Inquiry Date</span><span className="v">{RD.fmtDate(lead.inquiryDate)}</span></div>
              <div className="kv"><span className="k">Assigned Staff</span><span className="v">{assigned.name}</span></div>
            </>
          )}

          {tab === "notes" && (
            <>
              <div style={{marginBottom:18}}>
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note about this lead…"
                  style={{width:"100%", padding:12, border:"1px solid var(--navy-100)", borderRadius:"var(--radius)", minHeight:70, resize:"vertical"}}/>
                <button className="btn btn-orange" style={{marginTop:8}} onClick={addNote} disabled={!newNote.trim()}>Add Note</button>
              </div>
              <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>History ({lead.notes.length})</h3>
              {lead.notes.length === 0 ? (
                <div className="empty"><div className="ttl" style={{fontSize:14}}>No notes yet</div></div>
              ) : (
                <div className="timeline">
                  {lead.notes.map((n, i) => (
                    <div key={i} className="tl-item">
                      <div className="when">{RD.fmtDate(n.date)} · {RD.getStaff(n.by).name}</div>
                      <div className="what">{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "follow-ups" && (
            <>
              <button className="btn btn-orange" style={{marginBottom:16}} onClick={() => openModal("followupFor", lead, addFollowUp)}>
                <Icon name="plus" size={14}/> Schedule Follow-up
              </button>
              {lead.followUps.length === 0 ? (
                <div className="empty"><div className="ttl" style={{fontSize:14}}>No follow-ups scheduled</div></div>
              ) : (
                lead.followUps.map(f => (
                  <div key={f.id} className="note-item" style={{borderLeftColor: f.outcome ? "var(--green)" : (RD.daysUntil(f.date) < 0 ? "var(--red)" : "var(--orange)")}}>
                    <div className="meta">{RD.fmtDate(f.date)} · {f.time} · {f.method}</div>
                    <div>{f.notes || "Scheduled follow-up"}</div>
                    {f.outcome && <div style={{marginTop:6, fontSize:12, color:"var(--green)"}}>✓ {f.outcome}</div>}
                  </div>
                ))
              )}
            </>
          )}

          {tab === "actions" && (
            <>
              <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>Update Status</h3>
              <div className="chip-row" style={{marginBottom: 24}}>
                {["New Interest","Contacted","Follow Up Needed","Interested","Not Interested"].map(s => (
                  <button key={s} className={"chip" + (lead.status === s ? " active" : "")} onClick={() => updateStatus(s)}>{s}</button>
                ))}
              </div>
              <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>Reassign</h3>
              <div className="chip-row" style={{marginBottom: 24}}>
                {RD.STAFF.map(s => (
                  <button key={s.id} className={"chip" + (lead.assignedTo === s.id ? " active" : "")} onClick={() => updateLead({ ...lead, assignedTo: s.id })}>{s.name}</button>
                ))}
              </div>
              <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>Convert to Trainee</h3>
              <p style={{color:"var(--navy-500)", fontSize:13, marginBottom: 12}}>Once the prospect has confirmed interest and is ready to pay, convert them into the payment workflow.</p>
              <button className="btn btn-orange" onClick={() => convertToTrainee(lead)} disabled={lead.status === "Not Interested"}>
                <Icon name="arrowR" size={14}/> Record Initial Payment & Convert
              </button>
            </>
          )}
        </div>
        <div className="drawer-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={() => convertToTrainee(lead)} disabled={lead.status === "Not Interested"}>
            Move to Payment <Icon name="arrowR" size={14}/>
          </button>
        </div>
      </div>
    </>
  );
}
