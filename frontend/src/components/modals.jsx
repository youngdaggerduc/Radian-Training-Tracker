import { useState, useEffect } from 'react';
import { Icon } from './icons';
import {
  getAllCourses, STAFF, INSTRUCTORS, LOCATIONS,
  fmtDate, fmtMoney, todayISO, getCourse, getStaff, getInstructor,
} from '../data';

export function Modal({ title, sub, onClose, children, footer, wide }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={"modal" + (wide ? " wide" : "")} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ============ ADD LEAD ============
export function AddLeadModal({ onClose, onSave }) {
  const [f, setF] = useState({
    name: "", company: "", phone: "", email: "",
    courseId: getAllCourses()[0]?.id || "", source: "Website", priority: "Medium",
    notes: "", assignedTo: STAFF[0].id, inquiryDate: todayISO(),
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.name.trim() && f.phone.trim();
  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    onSave({
      id: "L-" + Math.floor(1050 + Math.random() * 900),
      name: f.name, company: f.company, phone: f.phone, email: f.email,
      courseId: f.courseId, source: f.source, priority: f.priority,
      status: "New Interest", inquiryDate: f.inquiryDate, assignedTo: f.assignedTo,
      notes: f.notes ? [{ date: todayISO(), by: f.assignedTo, text: f.notes }] : [],
      followUps: [],
    });
  };
  return (
    <Modal title="New Training Lead" sub="Capture an inquiry from a prospective trainee" onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit} disabled={!valid}>Create Lead</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Full Name *</label><input value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Jevon Marcano"/></div>
          <div className="field"><label>Company</label><input value={f.company} onChange={e => set("company", e.target.value)} placeholder="Optional"/></div>
        </div>
        <div className="field-row">
          <div className="field"><label>Phone *</label><input value={f.phone} onChange={e => set("phone", e.target.value)} placeholder="+1-868-..."/></div>
          <div className="field"><label>Email</label><input type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="name@email.com"/></div>
        </div>
        <div className="field">
          <label>Course Interested In</label>
          <select value={f.courseId} onChange={e => set("courseId", e.target.value)}>
            {getAllCourses().filter(c => c.active !== false).map(c => <option key={c.id} value={c.id}>{c.provider} · {c.name} — {fmtMoney(c.price)}</option>)}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Source of Inquiry</label>
            <select value={f.source} onChange={e => set("source", e.target.value)}>
              {["Website","Walk-in","WhatsApp","Phone","Referral"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Priority</label>
            <select value={f.priority} onChange={e => set("priority", e.target.value)}>
              {["High","Medium","Low"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Inquiry Date</label>
            <input type="date" value={f.inquiryDate} onChange={e => set("inquiryDate", e.target.value)}/>
          </div>
          <div className="field">
            <label>Assigned Staff</label>
            <select value={f.assignedTo} onChange={e => set("assignedTo", e.target.value)}>
              {STAFF.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Initial Notes</label>
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="What did they ask about? Any context to capture..."/>
        </div>
      </form>
    </Modal>
  );
}

// ============ SCHEDULE FOLLOW-UP ============
export function FollowUpModal({ lead, onClose, onSave }) {
  const [f, setF] = useState({
    date: todayISO(1), time: "10:00", method: "Call", notes: "",
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onSave({ id: "F" + Date.now(), ...f, outcome: "" });
  };
  return (
    <Modal title="Schedule Follow-up" sub={lead ? `For ${lead.name}` : "Pick a lead and schedule the next touchpoint"} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit}>Schedule</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Date</label><input type="date" value={f.date} onChange={e => set("date", e.target.value)}/></div>
          <div className="field"><label>Time</label><input type="time" value={f.time} onChange={e => set("time", e.target.value)}/></div>
        </div>
        <div className="field">
          <label>Method</label>
          <select value={f.method} onChange={e => set("method", e.target.value)}>
            <option>Call</option><option>WhatsApp</option><option>Email</option>
          </select>
        </div>
        <div className="field">
          <label>Discussion Notes / Purpose</label>
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="What needs to be discussed?"/>
        </div>
      </form>
    </Modal>
  );
}

// ============ CONVERT TO PAYMENT / RECORD PAYMENT ============
export function ConvertToPaymentModal({ lead, onClose, onConvert }) {
  const course = getCourse(lead.courseId);
  const [f, setF] = useState({
    courseId: lead.courseId,
    totalCost: course.price,
    depositPct: 25,
    deposit: +(course.price * 0.25).toFixed(2),
    method: "Bank Transfer",
    installments: 5,
    intervalDays: 30,
    firstDueOffset: 30,
    notes: "",
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const setDepositPct = (pct) => setF(s => ({ ...s, depositPct: pct, deposit: +(s.totalCost * pct / 100).toFixed(2) }));
  const remaining = Math.max(0, f.totalCost - f.deposit);
  const eachInstallment = f.installments > 0 ? +(remaining / f.installments).toFixed(2) : 0;
  const intervalLabel = f.intervalDays === 7 ? "weekly" : f.intervalDays === 14 ? "fortnightly" : f.intervalDays === 30 ? "monthly" : `every ${f.intervalDays} days`;

  const submit = (e) => {
    e.preventDefault();
    const plan = [{
      id: "P1", amount: Number(f.deposit), due: todayISO(), paid: true, paidOn: todayISO(),
      method: f.method, ref: "", label: "Deposit"
    }];
    if (remaining > 0 && f.installments > 0) {
      for (let i = 0; i < f.installments; i++) {
        plan.push({
          id: "P" + (i + 2),
          amount: eachInstallment,
          due: todayISO(Number(f.firstDueOffset) + i * Number(f.intervalDays)),
          paid: false, method: "", ref: "",
          label: `Installment ${i+1} of ${f.installments}`
        });
      }
    }
    onConvert({
      id: "T-" + Math.floor(2020 + Math.random() * 100),
      leadId: lead.id, name: lead.name, company: lead.company, phone: lead.phone, email: lead.email,
      courseId: f.courseId,
      totalCost: Number(f.totalCost),
      registrationDate: todayISO(),
      paymentMethod: f.method,
      paid: Number(f.deposit),
      plan,
      paymentNotes: f.notes,
      enrollment: null, certificate: null,
      stage: plan.length > 1 ? "payment-plan" : "payment-complete",
    });
  };

  const depositOk = f.deposit > 0;

  return (
    <Modal title="Deposit & Payment Plan" sub={`${lead.name} — pays deposit now, schedules balance after training`} onClose={onClose} wide
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit} disabled={!depositOk}>Record Deposit & Convert</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field">
          <label>Course Selected</label>
          <select value={f.courseId} onChange={e => {
            const c = getCourse(e.target.value);
            setF(s => ({ ...s, courseId: e.target.value, totalCost: c.price, deposit: +(c.price * s.depositPct / 100).toFixed(2) }));
          }}>
            {getAllCourses().filter(c => c.active !== false).map(c => <option key={c.id} value={c.id}>{c.provider} · {c.name} — {fmtMoney(c.price)}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Total Course Cost (TT$)</label>
          <input type="number" value={f.totalCost} onChange={e => {
            const total = Number(e.target.value);
            setF(s => ({ ...s, totalCost: total, deposit: +(total * s.depositPct / 100).toFixed(2) }));
          }} step="0.01"/>
        </div>

        <div className="field">
          <label>Deposit (paid today — unlocks enrollment)</label>
          <div className="chip-row" style={{marginBottom: 10}}>
            {[15, 25, 40, 50, 100].map(p => (
              <button type="button" key={p} className={"chip" + (f.depositPct === p ? " active" : "")} onClick={() => setDepositPct(p)}>{p}%</button>
            ))}
          </div>
          <div className="field-row">
            <input type="number" value={f.deposit} onChange={e => {
              const dep = Number(e.target.value);
              setF(s => ({ ...s, deposit: dep, depositPct: +(dep / s.totalCost * 100).toFixed(1) }));
            }} step="0.01" placeholder="Custom amount"/>
            <select value={f.method} onChange={e => set("method", e.target.value)}>
              {["Cash","Card","Bank Transfer","Online Payment","Company Credit"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {remaining > 0 && (
          <>
            <div className="divider"></div>
            <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--orange-dk)", marginBottom:14}}>Balance — payable after training</div>
            <div className="field-row">
              <div className="field">
                <label>Number of Installments</label>
                <input type="number" min="1" max="24" value={f.installments} onChange={e => set("installments", Number(e.target.value))}/>
              </div>
              <div className="field">
                <label>Frequency</label>
                <select value={f.intervalDays} onChange={e => set("intervalDays", Number(e.target.value))}>
                  <option value="7">Weekly</option>
                  <option value="14">Fortnightly (2 weeks)</option>
                  <option value="30">Monthly</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>First Installment Due (days from today)</label>
              <input type="number" min="0" value={f.firstDueOffset} onChange={e => set("firstDueOffset", Number(e.target.value))}/>
              <div style={{fontSize:12, color:"var(--navy-500)", marginTop:6}}>
                Tip: set this to roughly when training ends, so first payment falls after the course.
              </div>
            </div>
          </>
        )}

        <div style={{padding:"14px 16px", background:"var(--warm-100)", borderRadius:"var(--radius)", margin:"16px 0"}}>
          <div className="kv"><span className="k">Total course cost</span><span className="v tnum">{fmtMoney(f.totalCost)}</span></div>
          <div className="kv"><span className="k">Deposit today ({f.depositPct}%)</span><span className="v tnum" style={{color:"var(--green)"}}>{fmtMoney(f.deposit)}</span></div>
          <div className="kv"><span className="k">Remaining balance</span><span className="v tnum" style={{color:"var(--orange-dk)"}}>{fmtMoney(remaining)}</span></div>
          {remaining > 0 && f.installments > 0 && (
            <div className="kv"><span className="k">Plan</span><span className="v tnum">{f.installments} × {fmtMoney(eachInstallment)} {intervalLabel}</span></div>
          )}
        </div>
        <div className="field">
          <label>Payment Notes</label>
          <textarea value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="PO number, receipt info, terms agreed..."/>
        </div>
      </form>
    </Modal>
  );
}

// ============ RESTRUCTURE / EDIT PAYMENT PLAN ============
export function EditPlanModal({ trainee, onClose, onSave }) {
  const paidPlan = trainee.plan.filter(p => p.paid);
  const totalPaid = paidPlan.reduce((s, p) => s + p.amount, 0);
  const remainingBalance = trainee.totalCost - totalPaid;

  const initialUnpaid = trainee.plan.filter(p => !p.paid).map(p => ({ ...p }));
  const [unpaid, setUnpaid] = useState(initialUnpaid.length > 0 ? initialUnpaid : [
    { id: "P-new1", amount: remainingBalance, due: todayISO(30), paid: false, method: "", ref: "" }
  ]);
  const [intervalDays, setIntervalDays] = useState(30);

  const sumUnpaid = unpaid.reduce((s, p) => s + Number(p.amount || 0), 0);
  const variance = +(sumUnpaid - remainingBalance).toFixed(2);

  const updateRow = (idx, key, val) => {
    setUnpaid(rows => rows.map((r, i) => i === idx ? { ...r, [key]: val } : r));
  };
  const addRow = () => {
    setUnpaid(rows => {
      const last = rows[rows.length - 1];
      const lastDue = last?.due || todayISO();
      const nextDue = new Date(lastDue + "T00:00:00");
      nextDue.setDate(nextDue.getDate() + intervalDays);
      const newAmt = +(remainingBalance / (rows.length + 1)).toFixed(2);
      return [
        ...rows.map(r => ({ ...r, amount: newAmt })),
        { id: "P-new" + Date.now(), amount: newAmt, due: nextDue.toISOString().slice(0,10), paid: false, method: "", ref: "" }
      ];
    });
  };
  const removeRow = (idx) => {
    setUnpaid(rows => {
      if (rows.length <= 1) return rows;
      const filtered = rows.filter((_, i) => i !== idx);
      const newAmt = +(remainingBalance / filtered.length).toFixed(2);
      return filtered.map(r => ({ ...r, amount: newAmt }));
    });
  };
  const redistribute = () => {
    setUnpaid(rows => {
      const newAmt = +(remainingBalance / rows.length).toFixed(2);
      return rows.map(r => ({ ...r, amount: newAmt }));
    });
  };
  const reschedule = () => {
    setUnpaid(rows => {
      const start = rows[0]?.due || todayISO(intervalDays);
      return rows.map((r, i) => {
        const d = new Date(start + "T00:00:00");
        d.setDate(d.getDate() + i * intervalDays);
        return { ...r, due: d.toISOString().slice(0,10) };
      });
    });
  };
  const setCount = (n) => {
    n = Math.max(1, Math.min(24, n));
    setUnpaid(rows => {
      const newAmt = +(remainingBalance / n).toFixed(2);
      const start = rows[0]?.due || todayISO(intervalDays);
      return Array.from({ length: n }, (_, i) => {
        const existing = rows[i];
        const d = new Date(start + "T00:00:00");
        d.setDate(d.getDate() + i * intervalDays);
        return {
          id: existing?.id || ("P-new" + Date.now() + i),
          amount: newAmt,
          due: existing?.due || d.toISOString().slice(0,10),
          paid: false, method: "", ref: "",
          label: `Installment ${i+1} of ${n}`
        };
      });
    });
  };

  const submit = (e) => {
    e?.preventDefault();
    const merged = [...paidPlan, ...unpaid.map((r, i) => ({
      ...r,
      amount: Number(r.amount),
      label: r.label || `Installment ${i+1} of ${unpaid.length}`
    }))];
    onSave(merged);
  };

  const valid = Math.abs(variance) < 0.01 && unpaid.every(r => r.amount > 0 && r.due);

  return (
    <Modal title="Restructure Payment Plan" sub={`${trainee.name} — adjust remaining installments without touching paid ones`} onClose={onClose} wide
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit} disabled={!valid}>Save New Plan</button>
      </>}>
      <form onSubmit={submit}>
        <div style={{padding:"14px 16px", background:"var(--warm-100)", borderRadius:"var(--radius)", marginBottom:18}}>
          <div className="kv"><span className="k">Total course cost</span><span className="v tnum">{fmtMoney(trainee.totalCost)}</span></div>
          <div className="kv"><span className="k">Already paid ({paidPlan.length} payment{paidPlan.length===1?"":"s"})</span><span className="v tnum" style={{color:"var(--green)"}}>{fmtMoney(totalPaid)}</span></div>
          <div className="kv"><span className="k">Remaining balance (must equal sum below)</span><span className="v tnum" style={{color:"var(--orange-dk)"}}>{fmtMoney(remainingBalance)}</span></div>
        </div>

        <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12, flexWrap:"wrap", gap:10}}>
          <div>
            <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", marginBottom:4}}>Unpaid Installments</div>
            <div style={{fontSize:13, color:"var(--navy-500)"}}>{unpaid.length} payment{unpaid.length===1?"":"s"} totaling <span className="tnum" style={{color: Math.abs(variance) < 0.01 ? "var(--green)" : "var(--red)", fontWeight:600}}>{fmtMoney(sumUnpaid)}</span>
              {Math.abs(variance) >= 0.01 && <span style={{color:"var(--red)"}}> · {variance > 0 ? "over" : "under"} by {fmtMoney(Math.abs(variance))}</span>}
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{fontSize:11, color:"var(--navy-500)"}}>SPLIT INTO</span>
            <button type="button" className="btn btn-ghost" style={{padding:"6px 10px"}} onClick={() => setCount(unpaid.length - 1)} disabled={unpaid.length <= 1}>−</button>
            <input type="number" value={unpaid.length} onChange={e => setCount(Number(e.target.value))}
              style={{width:60, padding:"6px 10px", textAlign:"center", border:"1px solid var(--navy-100)", borderRadius:"var(--radius-sm)"}}/>
            <button type="button" className="btn btn-ghost" style={{padding:"6px 10px"}} onClick={() => setCount(unpaid.length + 1)}>+</button>
            <span style={{fontSize:11, color:"var(--navy-500)"}}>INSTALLMENTS</span>
          </div>
        </div>

        <div style={{display:"flex", gap:8, marginBottom:14, flexWrap:"wrap"}}>
          <select value={intervalDays} onChange={e => setIntervalDays(Number(e.target.value))}
            style={{padding:"7px 10px", border:"1px solid var(--navy-100)", borderRadius:"var(--radius-sm)", fontSize:12}}>
            <option value="7">Weekly</option>
            <option value="14">Fortnightly</option>
            <option value="30">Monthly</option>
          </select>
          <button type="button" className="btn btn-ghost" style={{padding:"6px 12px", fontSize:12}} onClick={reschedule}>Reschedule due dates</button>
          <button type="button" className="btn btn-ghost" style={{padding:"6px 12px", fontSize:12}} onClick={redistribute}>Split balance evenly</button>
        </div>

        <div style={{border:"1px solid var(--navy-100)", borderRadius:"var(--radius)", overflow:"hidden"}}>
          <div style={{display:"grid", gridTemplateColumns:"40px 1fr 1fr 38px", padding:"10px 14px", background:"var(--warm-100)", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", fontWeight:600, borderBottom:"1px solid var(--navy-100)"}}>
            <div>#</div><div>Amount (TT$)</div><div>Due Date</div><div></div>
          </div>
          {unpaid.map((row, idx) => (
            <div key={row.id} style={{display:"grid", gridTemplateColumns:"40px 1fr 1fr 38px", padding:"10px 14px", borderBottom: idx === unpaid.length - 1 ? "none" : "1px solid var(--navy-50)", alignItems:"center", gap:10}}>
              <div style={{fontSize:12, color:"var(--navy-500)"}}>{paidPlan.length + idx + 1}</div>
              <input type="number" step="0.01" value={row.amount} onChange={e => updateRow(idx, "amount", e.target.value)}
                style={{padding:"7px 10px", border:"1px solid var(--navy-100)", borderRadius:"var(--radius-sm)", fontSize:13, fontVariantNumeric:"tabular-nums"}}/>
              <input type="date" value={row.due} onChange={e => updateRow(idx, "due", e.target.value)}
                style={{padding:"7px 10px", border:"1px solid var(--navy-100)", borderRadius:"var(--radius-sm)", fontSize:13}}/>
              <button type="button" className="modal-close" onClick={() => removeRow(idx)} disabled={unpaid.length <= 1} title="Remove"
                style={{opacity: unpaid.length <= 1 ? 0.3 : 1}}>
                <Icon name="trash" size={14}/>
              </button>
            </div>
          ))}
        </div>

        <button type="button" className="btn btn-ghost" style={{marginTop:12, width:"100%"}} onClick={addRow}>
          <Icon name="plus" size={14}/> Add Installment
        </button>
      </form>
    </Modal>
  );
}

export function RecordPaymentModal({ trainee, installment, onClose, onRecord }) {
  const [f, setF] = useState({
    amount: installment.amount,
    method: trainee.paymentMethod || "Bank Transfer",
    ref: "",
    paidOn: todayISO(),
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onRecord({ ...installment, paid: true, paidOn: f.paidOn, method: f.method, ref: f.ref, amount: Number(f.amount) });
  };
  return (
    <Modal title="Record Payment" sub={`${trainee.name} · ${installment.id}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit}>Record Payment</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Amount (TT$)</label><input type="number" value={f.amount} onChange={e => set("amount", e.target.value)} step="0.01"/></div>
          <div className="field"><label>Paid On</label><input type="date" value={f.paidOn} onChange={e => set("paidOn", e.target.value)}/></div>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Method</label>
            <select value={f.method} onChange={e => set("method", e.target.value)}>
              {["Cash","Card","Bank Transfer","Online Payment","Company Credit"].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="field"><label>Reference / Receipt #</label><input value={f.ref} onChange={e => set("ref", e.target.value)} placeholder="BT-12345 / RCT-0091..."/></div>
        </div>
      </form>
    </Modal>
  );
}

// ============ ENROLL STUDENT ============
export function EnrollModal({ trainee, onClose, onEnroll }) {
  const course = getCourse(trainee.courseId);
  const [f, setF] = useState({
    startDate: todayISO(7),
    endDate: todayISO(7 + course.days - 1),
    instructor: INSTRUCTORS[0].id,
    location: LOCATIONS[0],
    batch: `${course.provider.slice(0,4).toUpperCase()}-${todayISO().slice(2,4)}-${Math.floor(Math.random()*99)+10}`,
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onEnroll({ ...f, status: "Enrolled", enrollmentDate: todayISO() });
  };
  return (
    <Modal title="Enroll Student" sub={`${trainee.name} · ${course.name}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit}>Confirm Enrollment</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Training Start</label><input type="date" value={f.startDate} onChange={e => {
            const sd = e.target.value;
            const ed = new Date(sd + "T00:00:00");
            ed.setDate(ed.getDate() + course.days - 1);
            setF(s => ({ ...s, startDate: sd, endDate: ed.toISOString().slice(0,10) }));
          }}/></div>
          <div className="field"><label>Training End ({course.days} day{course.days>1?"s":""})</label><input type="date" value={f.endDate} onChange={e => set("endDate", e.target.value)}/></div>
        </div>
        <div className="field">
          <label>Training Location</label>
          <select value={f.location} onChange={e => set("location", e.target.value)}>
            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Instructor</label>
            <select value={f.instructor} onChange={e => set("instructor", e.target.value)}>
              {INSTRUCTORS.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Batch / Class Code</label><input value={f.batch} onChange={e => set("batch", e.target.value)}/></div>
        </div>
      </form>
    </Modal>
  );
}

// ============ ISSUE CERTIFICATE ============
export function CertificateModal({ trainee, onClose, onIssue }) {
  const course = getCourse(trainee.courseId);
  const [f, setF] = useState({
    completionDate: trainee.enrollment?.endDate || todayISO(),
    number: `${course.provider.toUpperCase()}/${course.id.split("-")[1]?.toUpperCase() || "GEN"}/${todayISO().slice(2,4)}/${String(Math.floor(Math.random()*999)+100).padStart(5,"0")}`,
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onIssue({
      completionDate: f.completionDate,
      number: f.number,
      status: "Ready for Collection",
      readyOn: todayISO(),
      collectionDate: null, collectedBy: "", idVerified: false, staffNotes: "",
    });
  };
  return (
    <Modal title="Issue Certificate" sub={`${trainee.name} · ${course.name}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit}>Mark Ready for Collection</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field"><label>Training Completion Date</label><input type="date" value={f.completionDate} onChange={e => set("completionDate", e.target.value)}/></div>
        <div className="field"><label>Certificate Number</label><input value={f.number} onChange={e => set("number", e.target.value)}/></div>
      </form>
    </Modal>
  );
}

// ============ COLLECT CERTIFICATE ============
export function CollectCertModal({ trainee, onClose, onCollect }) {
  const [f, setF] = useState({
    collectionDate: todayISO(), collectedBy: trainee.name, idVerified: true, staffNotes: "",
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    onCollect({ ...trainee.certificate, ...f, status: "Collected" });
  };
  return (
    <Modal title="Record Certificate Collection" sub={`${trainee.name} · ${trainee.certificate?.number}`} onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-orange" onClick={submit}>Confirm Collection</button>
      </>}>
      <form onSubmit={submit}>
        <div className="field-row">
          <div className="field"><label>Collection Date</label><input type="date" value={f.collectionDate} onChange={e => set("collectionDate", e.target.value)}/></div>
          <div className="field"><label>Collected By</label><input value={f.collectedBy} onChange={e => set("collectedBy", e.target.value)}/></div>
        </div>
        <div className="field">
          <label style={{display:"flex", alignItems:"center", gap:"8px", textTransform:"none", letterSpacing:0, fontSize:13, color:"var(--navy-800)"}}>
            <input type="checkbox" checked={f.idVerified} onChange={e => set("idVerified", e.target.checked)} style={{width:"auto"}}/>
            ID Verified (Driver's Permit / National ID)
          </label>
        </div>
        <div className="field">
          <label>Staff Notes</label>
          <textarea value={f.staffNotes} onChange={e => set("staffNotes", e.target.value)} placeholder="Pickup confirmation, ID #, who released..."/>
        </div>
      </form>
    </Modal>
  );
}
