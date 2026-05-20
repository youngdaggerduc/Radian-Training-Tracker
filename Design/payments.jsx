// Payments, Enrollment, Certificates, Trainee Drawer
const RD2 = window.RADIAN;

// ============ PAYMENTS VIEW ============
function PaymentsView({ state, openDrawer, openModal }) {
  const [tab, setTab] = React.useState("active");
  const [search, setSearch] = React.useState("");

  const matchesSearch = (t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [t.name, t.company, t.phone, t.email, t.id, RD2.getCourse(t.courseId).name]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  };

  const active = state.trainees.filter(t => t.paid < t.totalCost).filter(matchesSearch);
  const completed = state.trainees.filter(t => t.paid >= t.totalCost).filter(matchesSearch);

  // Stats always reflect global state, not filtered list
  const allActive = state.trainees.filter(t => t.paid < t.totalCost);
  const totalOutstanding = allActive.reduce((s, t) => s + (t.totalCost - t.paid), 0);
  const overdueAmount = state.trainees.reduce((s, t) => s + t.plan.filter(p => !p.paid && RD2.daysUntil(p.due) < 0).reduce((a, p) => a + p.amount, 0), 0);
  const upcoming30 = state.trainees.reduce((s, t) => s + t.plan.filter(p => !p.paid && RD2.daysUntil(p.due) >= 0 && RD2.daysUntil(p.due) <= 30).reduce((a, p) => a + p.amount, 0), 0);

  const list = tab === "active" ? active : completed;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline · Stage 3 – 7</div>
          <h1>Payment Tracking</h1>
        </div>
      </div>

      <div className="three-col">
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--navy-500)", marginBottom:14}}>Total Outstanding</div>
          <div className="amount-lg"><span className="cur">TT$</span>{Number(totalOutstanding).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>across {active.length} active trainee{active.length===1?"":"s"}</div>
        </div>
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--red)", marginBottom:14}}>Overdue</div>
          <div className="amount-lg" style={{color: overdueAmount > 0 ? "var(--red)" : "var(--navy-800)"}}><span className="cur">TT$</span>{Number(overdueAmount).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>past due as of today</div>
        </div>
        <div className="panel" style={{padding:"22px"}}>
          <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--orange-dk)", marginBottom:14}}>Next 30 Days</div>
          <div className="amount-lg"><span className="cur">TT$</span>{Number(upcoming30).toLocaleString("en-US", {minimumFractionDigits:2, maximumFractionDigits:2})}</div>
          <div style={{fontSize:12, color:"var(--navy-500)", marginTop:10}}>expected inflow</div>
        </div>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search trainee by name, company, phone, email, ID…" value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="chip-row">
          <button className={"chip" + (tab === "active" ? " active" : "")} onClick={() => setTab("active")}>Active Payments · {active.length}</button>
          <button className={"chip" + (tab === "complete" ? " active" : "")} onClick={() => setTab("complete")}>Payment Complete · {completed.length}</button>
        </div>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr><th>Trainee</th><th>Course</th><th>Progress</th><th>Paid</th><th>Remaining</th><th>Next Due</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="8"><div className="empty"><div className="ttl">{search ? `No trainees match "${search}"` : "No trainees in this group"}</div></div></td></tr>
            ) : list.map(t => {
              const course = RD2.getCourse(t.courseId);
              const next = t.plan.find(p => !p.paid);
              const overdue = next && RD2.daysUntil(next.due) < 0;
              const pct = Math.min(100, (t.paid / t.totalCost) * 100);
              return (
                <tr key={t.id} onClick={() => openDrawer({ type: "trainee", id: t.id })}>
                  <td>
                    <div className="nm">{t.name}</div>
                    <div className="sub">{t.company || "Individual"} · {t.id}</div>
                  </td>
                  <td>
                    <div className="nm">{course.name}</div>
                    <div className="sub">{course.provider}</div>
                  </td>
                  <td style={{width:160}}>
                    <div className="bar green"><div style={{width: pct + "%"}}/></div>
                    <div className="sub" style={{marginTop:4}}>{pct.toFixed(0)}% paid</div>
                  </td>
                  <td><span className="tnum">{RD2.fmtMoney(t.paid)}</span></td>
                  <td><span className="tnum" style={{color: t.totalCost - t.paid > 0 ? "var(--orange-dk)" : "var(--green)"}}>{RD2.fmtMoney(t.totalCost - t.paid)}</span></td>
                  <td>{next ? <div><div className="nm tnum">{RD2.fmtMoney(next.amount)}</div><div className="sub">{RD2.fmtDateShort(next.due)} · {RD2.relTime(next.due)}</div></div> : <span style={{color:"var(--green)"}}>Complete</span>}</td>
                  <td>
                    {t.paid >= t.totalCost ? <span className="pill paid">Paid in Full</span> :
                     overdue ? <span className="pill overdue">Overdue</span> :
                     t.plan.length > 1 ? <span className="pill partial">Payment Plan</span> :
                     <span className="pill pending">Pending</span>}
                  </td>
                  <td>
                    {t.totalCost - t.paid > 0 && (
                      <button className="btn btn-ghost" style={{padding:"6px 10px", fontSize:11}}
                        onClick={(ev) => { ev.stopPropagation(); openModal("editPlan", t); }}>
                        <Icon name="edit" size={11}/> Restructure
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ ENROLLMENT VIEW ============
function EnrollmentView({ state, openDrawer, openModal }) {
  const [tab, setTab] = React.useState("ready");
  const [search, setSearch] = React.useState("");

  const matchesSearch = (t) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [t.name, t.company, t.phone, t.email, t.id, RD2.getCourse(t.courseId).name, t.enrollment?.batch, t.enrollment?.location]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  };

  // Deposit paid unlocks enrollment (any positive paid amount = at least the deposit installment)
  const readyToEnroll = state.trainees.filter(t => !t.enrollment && t.paid > 0).filter(matchesSearch);
  const enrolled = state.trainees.filter(t => t.enrollment && t.enrollment.status === "Enrolled").filter(matchesSearch);
  const attending = state.trainees.filter(t => t.enrollment && t.enrollment.status === "Attending").filter(matchesSearch);
  const completed = state.trainees.filter(t => t.enrollment && t.enrollment.status === "Completed").filter(matchesSearch);

  const groups = { ready: readyToEnroll, enrolled, attending, completed };
  const list = groups[tab] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline · Stage 6</div>
          <h1>Course Enrollment</h1>
        </div>
      </div>

      <div className="toolbar">
        <input className="search-input" placeholder="Search by name, company, phone, batch, location…" value={search} onChange={e => setSearch(e.target.value)}/>
        <div className="chip-row">
          <button className={"chip" + (tab === "ready" ? " active" : "")} onClick={() => setTab("ready")}>Pending Enrollment · {readyToEnroll.length}</button>
          <button className={"chip" + (tab === "enrolled" ? " active" : "")} onClick={() => setTab("enrolled")}>Enrolled · {enrolled.length}</button>
          <button className={"chip" + (tab === "attending" ? " active" : "")} onClick={() => setTab("attending")}>Attending · {attending.length}</button>
          <button className={"chip" + (tab === "completed" ? " active" : "")} onClick={() => setTab("completed")}>Completed · {completed.length}</button>
        </div>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr><th>Trainee</th><th>Course</th><th>{tab === "ready" ? "Payment Status" : "Training Dates"}</th><th>{tab === "ready" ? "Action" : "Instructor / Batch"}</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="5"><div className="empty"><div className="ttl">{search ? `No trainees match "${search}"` : "No trainees in this group"}</div></div></td></tr>
            ) : list.map(t => {
              const course = RD2.getCourse(t.courseId);
              const e = t.enrollment;
              return (
                <tr key={t.id} onClick={() => openDrawer({ type: "trainee", id: t.id })}>
                  <td><div className="nm">{t.name}</div><div className="sub">{t.company || "Individual"}</div></td>
                  <td><div className="nm">{course.name}</div><div className="sub">{course.provider} · {course.days}d</div></td>
                  {tab === "ready" ? (
                    <>
                      <td>
                        <div className="tnum">{RD2.fmtMoney(t.paid)} / {RD2.fmtMoney(t.totalCost)}</div>
                        <div className="bar green" style={{marginTop:4, width:140}}><div style={{width: (t.paid / t.totalCost * 100) + "%"}}/></div>
                      </td>
                      <td>
                        <button className="btn btn-orange" style={{padding:"6px 12px", fontSize:12}}
                          onClick={(ev) => { ev.stopPropagation(); openModal("enroll", t); }}>
                          <Icon name="enroll" size={12}/> Enroll
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <div className="nm">{RD2.fmtDateShort(e.startDate)} – {RD2.fmtDateShort(e.endDate)}</div>
                        <div className="sub">{e.location}</div>
                      </td>
                      <td>
                        <div className="nm">{RD2.getInstructor(e.instructor).name}</div>
                        <div className="sub mono" style={{fontSize:11}}>{e.batch}</div>
                      </td>
                    </>
                  )}
                  <td><StatusPill status={tab === "ready" ? "Pending Enrollment" : e.status}/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ CERTIFICATES VIEW ============
function CertificatesView({ state, openDrawer, openModal }) {
  const [tab, setTab] = React.useState("pending");

  // Trainees who completed training but no cert yet
  const pending = state.trainees.filter(t => t.enrollment?.status === "Completed" && !t.certificate);
  const ready = state.trainees.filter(t => t.certificate?.status === "Ready for Collection");
  const collected = state.trainees.filter(t => t.certificate?.status === "Collected");

  const groups = { pending, ready, collected };
  const list = groups[tab] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline · Stage 8</div>
          <h1>Certificate Management</h1>
        </div>
      </div>

      <div className="toolbar">
        <div className="chip-row">
          <button className={"chip" + (tab === "pending" ? " active" : "")} onClick={() => setTab("pending")}>Pending Issue · {pending.length}</button>
          <button className={"chip" + (tab === "ready" ? " active" : "")} onClick={() => setTab("ready")}>Ready for Collection · {ready.length}</button>
          <button className={"chip" + (tab === "collected" ? " active" : "")} onClick={() => setTab("collected")}>Collected · {collected.length}</button>
        </div>
      </div>

      <div className="panel">
        <table className="tbl">
          <thead>
            <tr><th>Trainee</th><th>Course</th><th>Completion</th><th>Certificate No.</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan="6"><div className="empty"><div className="ttl">No certificates in this group</div></div></td></tr>
            ) : list.map(t => {
              const course = RD2.getCourse(t.courseId);
              return (
                <tr key={t.id} onClick={() => openDrawer({ type: "trainee", id: t.id })}>
                  <td><div className="nm">{t.name}</div><div className="sub">{t.company || "Individual"}</div></td>
                  <td><div className="nm">{course.name}</div><div className="sub">{course.provider}</div></td>
                  <td>{RD2.fmtDate(t.enrollment?.endDate || t.certificate?.completionDate)}</td>
                  <td><span className="mono" style={{fontSize:12}}>{t.certificate?.number || "—"}</span></td>
                  <td>
                    {tab === "pending" && <StatusPill status="Pending"/>}
                    {tab === "ready" && <StatusPill status="Ready for Collection"/>}
                    {tab === "collected" && <StatusPill status="Collected"/>}
                  </td>
                  <td>
                    {tab === "pending" && (
                      <button className="btn btn-orange" style={{padding:"6px 12px", fontSize:12}}
                        onClick={(ev) => { ev.stopPropagation(); openModal("issueCert", t); }}>
                        <Icon name="award" size={12}/> Issue
                      </button>
                    )}
                    {tab === "ready" && (
                      <button className="btn btn-orange" style={{padding:"6px 12px", fontSize:12}}
                        onClick={(ev) => { ev.stopPropagation(); openModal("collectCert", t); }}>
                        <Icon name="check" size={12}/> Record Collection
                      </button>
                    )}
                    {tab === "collected" && (
                      <div className="sub">Collected {RD2.fmtDateShort(t.certificate?.collectionDate)}</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ TRAINEE DETAIL DRAWER ============
function TraineeDrawer({ trainee, onClose, updateTrainee, openModal }) {
  const [tab, setTab] = React.useState("overview");
  const course = RD2.getCourse(trainee.courseId);
  const remaining = trainee.totalCost - trainee.paid;
  const pct = Math.min(100, (trainee.paid / trainee.totalCost) * 100);

  const handleRecord = (newInst) => {
    const newPlan = trainee.plan.map(p => p.id === newInst.id ? newInst : p);
    const newPaid = newPlan.filter(p => p.paid).reduce((s,p) => s + p.amount, 0);
    let stage = trainee.stage;
    if (newPaid >= trainee.totalCost && !trainee.enrollment) stage = "payment-complete";
    updateTrainee({ ...trainee, plan: newPlan, paid: newPaid, stage });
  };

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}></div>
      <div className="drawer">
        <div className="drawer-header">
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:14}}>
            <div>
              <div style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--orange)", marginBottom:6}}>TRAINEE · {trainee.id}</div>
              <h2>{trainee.name}</h2>
            </div>
            <button className="modal-close" onClick={onClose}><Icon name="close" size={18}/></button>
          </div>
          <div className="meta" style={{marginTop:12, flexWrap:"wrap"}}>
            <span>{trainee.company || "Individual"}</span><span>·</span>
            <span>{trainee.phone}</span><span>·</span>
            <span>{course.provider} · {course.name}</span>
          </div>
        </div>
        <div className="drawer-tabs">
          {["overview", "payments", "enrollment", "certificate"].map(t => (
            <button key={t} className={"drawer-tab" + (tab === t ? " active" : "")} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
        <div className="drawer-body">
          {tab === "overview" && (
            <>
              <div style={{padding:"18px 20px", background:"var(--navy-800)", color:"var(--ivory)", borderRadius:"var(--radius-lg)", marginBottom:24}}>
                <div style={{fontSize:11, letterSpacing:"0.16em", textTransform:"uppercase", opacity:0.65, marginBottom:10}}>Course Cost</div>
                <div className="amount-lg" style={{color:"var(--ivory)"}}><span className="cur" style={{color:"rgba(255,255,255,0.5)"}}>TT$</span>{Number(trainee.totalCost).toLocaleString("en-US",{minimumFractionDigits:2})}</div>
                <div className="bar" style={{marginTop:16, background:"rgba(255,255,255,0.12)"}}><div style={{width: pct + "%"}}/></div>
                <div style={{display:"flex", justifyContent:"space-between", marginTop:8, fontSize:12}}>
                  <span style={{opacity:0.65}}>Paid <span className="tnum">{RD2.fmtMoney(trainee.paid)}</span></span>
                  <span style={{color:"var(--orange)", fontWeight:500}} className="tnum">{remaining > 0 ? RD2.fmtMoney(remaining) + " remaining" : "Paid in full"}</span>
                </div>
              </div>

              <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>Trainee Journey</h3>
              <PipelineProgress stage={RD2.traineeStage(trainee)}/>

              <h3 style={{fontSize:14, marginTop:24, marginBottom:12, color:"var(--navy-500)"}}>Contact</h3>
              <div className="kv"><span className="k">Email</span><span className="v">{trainee.email || "—"}</span></div>
              <div className="kv"><span className="k">Registration</span><span className="v">{RD2.fmtDate(trainee.registrationDate)}</span></div>
              <div className="kv"><span className="k">Payment Method</span><span className="v">{trainee.paymentMethod}</span></div>
            </>
          )}

          {tab === "payments" && (
            <>
              <div className="kv"><span className="k">Course Cost</span><span className="v tnum">{RD2.fmtMoney(trainee.totalCost)}</span></div>
              <div className="kv"><span className="k">Total Paid</span><span className="v tnum" style={{color:"var(--green)"}}>{RD2.fmtMoney(trainee.paid)}</span></div>
              <div className="kv"><span className="k">Remaining Balance</span><span className="v tnum" style={{color: remaining > 0 ? "var(--orange-dk)" : "var(--green)"}}>{RD2.fmtMoney(remaining)}</span></div>

              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", margin:"24px 0 12px"}}>
                <h3 style={{fontSize:14, color:"var(--navy-500)", margin:0}}>Payment Schedule ({trainee.plan.length} installments)</h3>
                {remaining > 0 && (
                  <button className="btn btn-ghost" style={{padding:"6px 12px", fontSize:12}} onClick={() => openModal("editPlan", trainee)}>
                    <Icon name="edit" size={12}/> Restructure
                  </button>
                )}
              </div>
              {trainee.plan.map((p, i) => {
                const overdue = !p.paid && RD2.daysUntil(p.due) < 0;
                return (
                  <div key={p.id} className="note-item" style={{borderLeftColor: p.paid ? "var(--green)" : (overdue ? "var(--red)" : "var(--orange)"), background:"var(--paper)", border:"1px solid var(--navy-100)", borderLeftWidth:3, marginBottom:10}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:11, color: i === 0 ? "var(--orange-dk)" : "var(--navy-500)", marginBottom:4, letterSpacing: i === 0 ? "0.12em" : 0, textTransform: i === 0 ? "uppercase" : "none", fontWeight: i === 0 ? 600 : 400}}>
                          {p.label || (i === 0 ? "Deposit" : `Payment ${i+1} of ${trainee.plan.length}`)} · {p.id}
                        </div>
                        <div style={{fontSize:18, fontFamily:"var(--serif)"}} className="tnum">{RD2.fmtMoney(p.amount)}</div>
                        <div className="meta" style={{fontSize:12, color:"var(--navy-500)", marginTop:4}}>Due {RD2.fmtDate(p.due)} {!p.paid && <span style={{color: overdue ? "var(--red)" : "var(--navy-500)"}}>· {RD2.relTime(p.due)}</span>}</div>
                      </div>
                      {p.paid ? (
                        <div style={{textAlign:"right"}}>
                          <span className="pill paid"><Icon name="check" size={10}/> Paid {RD2.fmtDateShort(p.paidOn)}</span>
                          <div className="sub" style={{marginTop:4, fontSize:11}}>{p.method} {p.ref && `· ${p.ref}`}</div>
                        </div>
                      ) : (
                        <button className="btn btn-orange" style={{padding:"6px 10px", fontSize:12}} onClick={() => openModal("recordPayment", trainee, p, handleRecord)}>
                          <Icon name="cash" size={12}/> Record
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              {trainee.paymentNotes && (
                <>
                  <h3 style={{fontSize:14, margin:"20px 0 8px", color:"var(--navy-500)"}}>Notes</h3>
                  <div className="note-item">{trainee.paymentNotes}</div>
                </>
              )}
            </>
          )}

          {tab === "enrollment" && (
            <>
              {trainee.enrollment ? (
                <>
                  <div className="kv"><span className="k">Status</span><span className="v"><StatusPill status={trainee.enrollment.status}/></span></div>
                  <div className="kv"><span className="k">Start Date</span><span className="v">{RD2.fmtDate(trainee.enrollment.startDate)}</span></div>
                  <div className="kv"><span className="k">End Date</span><span className="v">{RD2.fmtDate(trainee.enrollment.endDate)}</span></div>
                  <div className="kv"><span className="k">Location</span><span className="v">{trainee.enrollment.location}</span></div>
                  <div className="kv"><span className="k">Instructor</span><span className="v">{RD2.getInstructor(trainee.enrollment.instructor).name}</span></div>
                  <div className="kv"><span className="k">Batch Code</span><span className="v mono">{trainee.enrollment.batch}</span></div>
                  <div className="kv"><span className="k">Enrolled On</span><span className="v">{RD2.fmtDate(trainee.enrollment.enrollmentDate)}</span></div>

                  {trainee.enrollment.status !== "Completed" && (
                    <div style={{marginTop:24}}>
                      <h3 style={{fontSize:14, marginBottom:12, color:"var(--navy-500)"}}>Update Status</h3>
                      <div className="chip-row">
                        {["Enrolled","Attending","Completed"].map(s => (
                          <button key={s} className={"chip" + (trainee.enrollment.status === s ? " active" : "")} onClick={() => updateTrainee({...trainee, enrollment: {...trainee.enrollment, status: s}, stage: s === "Completed" ? "training-completed" : "enrolled"})}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="empty" style={{padding:"30px 20px"}}>
                    <div className="icon">○</div>
                    <div className="ttl">Not yet enrolled</div>
                    <div>This trainee has not been scheduled into a training batch.</div>
                  </div>
                  <button className="btn btn-orange btn-block" onClick={() => openModal("enroll", trainee)}>
                    <Icon name="enroll" size={14}/> Enroll in {course.name}
                  </button>
                </>
              )}
            </>
          )}

          {tab === "certificate" && (
            <>
              {trainee.certificate ? (
                <>
                  <div className="kv"><span className="k">Certificate Number</span><span className="v mono">{trainee.certificate.number}</span></div>
                  <div className="kv"><span className="k">Completion Date</span><span className="v">{RD2.fmtDate(trainee.certificate.completionDate)}</span></div>
                  <div className="kv"><span className="k">Status</span><span className="v"><StatusPill status={trainee.certificate.status}/></span></div>
                  <div className="kv"><span className="k">Ready On</span><span className="v">{RD2.fmtDate(trainee.certificate.readyOn)}</span></div>
                  {trainee.certificate.collectionDate && (
                    <>
                      <div className="kv"><span className="k">Collected On</span><span className="v">{RD2.fmtDate(trainee.certificate.collectionDate)}</span></div>
                      <div className="kv"><span className="k">Collected By</span><span className="v">{trainee.certificate.collectedBy}</span></div>
                      <div className="kv"><span className="k">ID Verified</span><span className="v">{trainee.certificate.idVerified ? "✓ Yes" : "No"}</span></div>
                      {trainee.certificate.staffNotes && (
                        <div style={{marginTop:14}}>
                          <div style={{fontSize:11, color:"var(--navy-500)", marginBottom:6}}>STAFF NOTES</div>
                          <div className="note-item">{trainee.certificate.staffNotes}</div>
                        </div>
                      )}
                    </>
                  )}
                  {trainee.certificate.status === "Ready for Collection" && (
                    <button className="btn btn-orange btn-block" style={{marginTop:20}} onClick={() => openModal("collectCert", trainee)}>
                      <Icon name="check" size={14}/> Record Collection
                    </button>
                  )}
                </>
              ) : trainee.enrollment?.status === "Completed" ? (
                <>
                  <div className="empty" style={{padding:"30px 20px"}}>
                    <div className="icon">◇</div>
                    <div className="ttl">Training complete — issue certificate</div>
                    <div>Generate the certificate number and mark it ready for collection.</div>
                  </div>
                  <button className="btn btn-orange btn-block" onClick={() => openModal("issueCert", trainee)}>
                    <Icon name="award" size={14}/> Issue Certificate
                  </button>
                </>
              ) : (
                <div className="empty" style={{padding:"30px 20px"}}>
                  <div className="icon">○</div>
                  <div className="ttl">Training not yet completed</div>
                  <div>Certificate becomes available after training completion.</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function PipelineProgress({ stage }) {
  const stages = RD2.PIPELINE_STAGES;
  const idx = stages.findIndex(s => s.id === stage);
  return (
    <div style={{position:"relative"}}>
      <div style={{height:4, background:"var(--navy-50)", borderRadius:100, overflow:"hidden"}}>
        <div style={{height:"100%", background:"var(--orange)", width: ((idx+1)/stages.length*100) + "%", transition:"width 0.3s"}}/>
      </div>
      <div style={{display:"flex", justifyContent:"space-between", marginTop:8, fontSize:11, color:"var(--navy-500)"}}>
        <span>{stages[0].label}</span>
        <span style={{color:"var(--orange)", fontWeight:500}}>{stages[idx]?.label || stage}</span>
        <span>{stages[stages.length-1].label}</span>
      </div>
    </div>
  );
}

window.PaymentsView = PaymentsView;
window.EnrollmentView = EnrollmentView;
window.CertificatesView = CertificatesView;
window.TraineeDrawer = TraineeDrawer;
