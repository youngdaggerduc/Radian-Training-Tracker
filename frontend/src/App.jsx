import { useState, useEffect } from 'react';
import { Icon } from './components/icons';
import { LoginPage } from './components/login';
import { Modal, AddLeadModal, FollowUpModal, ConvertToPaymentModal, RecordPaymentModal, EditPlanModal, EnrollModal, CertificateModal, CollectCertModal } from './components/modals';
import { Dashboard, StatusPill } from './components/dashboard';
import { LeadsView, FollowUpsView, LeadDrawer } from './components/leads';
import { PaymentsView, EnrollmentView, CertificatesView, TraineeDrawer } from './components/payments';
import { PipelineView } from './components/pipeline';
import { AdminView } from './components/admin';
import { ExportsView } from './components/exports';
import * as RD from './data';
import * as API from './api';

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [state, setState] = useState({ leads: [], trainees: [] });
  const [appLoading, setAppLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(null);
  const [toast, setToast] = useState(null);

  // Restore session from stored token on mount
  useEffect(() => {
    const stored = API.getStoredToken();
    if (!stored) { setAppLoading(false); return; }
    API.setToken(stored);
    API.getMe()
      .then(userData => {
        setUser(userData);
        return API.fetchState();
      })
      .then(data => setState(data))
      .catch(() => API.clearToken())
      .finally(() => setAppLoading(false));
  }, []);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast  = (msg) => setToast(msg);
  const showError  = (msg) => setToast("⚠ " + msg);

  const handleLogin = async (userData) => {
    setUser(userData);
    try {
      const data = await API.fetchState();
      setState(data);
    } catch {
      setState(RD.buildSeed());
    }
    showToast("Welcome to Radian Training Operations");
  };

  const handleLogout = () => {
    API.clearToken();
    setUser(null);
    setView("dashboard");
    setState({ leads: [], trainees: [] });
    setModal(null);
    setDrawer(null);
  };

  if (appLoading) {
    return (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",background:"var(--navy-900)",color:"var(--ivory)",fontFamily:"var(--sans)",fontSize:14,opacity:0.7}}>
        Loading…
      </div>
    );
  }

  if (!user) return <LoginPage onLogin={handleLogin}/>;

  // ============ DATA MUTATORS ============
  const addLead = async (lead) => {
    try {
      const created = await API.createLead(lead);
      setState(s => ({ ...s, leads: [created, ...s.leads] }));
      showToast(`Lead created — ${created.name}`);
      setModal(null);
    } catch {
      showError("Could not save lead — please try again");
    }
  };

  const updateLead = async (lead) => {
    try {
      const updated = await API.updateLead(lead);
      setState(s => ({ ...s, leads: s.leads.map(l => l.id === lead.id ? updated : l) }));
    } catch {
      showError("Could not save changes — please try again");
    }
  };

  const convertToTrainee = (lead) => {
    setModal({ type: "convertPayment", lead });
  };

  const completeConversion = async (trainee) => {
    try {
      const [created] = await Promise.all([
        API.createTrainee(trainee),
        API.deleteLead(trainee.leadId),
      ]);
      setState(s => ({
        ...s,
        trainees: [created, ...s.trainees],
        leads: s.leads.filter(l => l.id !== trainee.leadId),
      }));
      showToast(`${trainee.name} converted to trainee — payment recorded`);
      setModal(null);
      setDrawer({ type: "trainee", id: created.id });
    } catch {
      showError("Could not complete conversion — please try again");
    }
  };

  const updateTrainee = async (trainee) => {
    try {
      const updated = await API.updateTrainee(trainee);
      setState(s => ({ ...s, trainees: s.trainees.map(t => t.id === trainee.id ? updated : t) }));
    } catch {
      showError("Could not save changes — please try again");
    }
  };

  // ============ MODAL OPENER ============
  const openModal = (type, ...args) => {
    if (type === "addLead") setModal({ type });
    else if (type === "scheduleFollowup") setModal({ type: "scheduleFollowup" });
    else if (type === "followupFor") setModal({ type: "followupFor", lead: args[0], onSave: args[1] });
    else if (type === "enroll") setModal({ type: "enroll", trainee: args[0] });
    else if (type === "issueCert") setModal({ type: "issueCert", trainee: args[0] });
    else if (type === "collectCert") setModal({ type: "collectCert", trainee: args[0] });
    else if (type === "recordPayment") setModal({ type: "recordPayment", trainee: args[0], installment: args[1], onRecord: args[2] });
    else if (type === "editPlan") setModal({ type: "editPlan", trainee: args[0] });
  };
  const openDrawer = (d) => setDrawer(d);

  // ============ NAV ============
  const newLeadCount   = state.leads.filter(l => l.status === "New Interest").length;
  const todayFUCount   = state.leads.flatMap(l => l.followUps.filter(f => f.date === RD.todayISO() && !f.outcome)).length;
  const overdueFUCount = state.leads.flatMap(l => l.followUps.filter(f => RD.daysUntil(f.date) < 0 && !f.outcome)).length;
  const overduePay     = state.trainees.flatMap(t => t.plan.filter(p => !p.paid && RD.daysUntil(p.due) < 0)).length;
  const certReady      = state.trainees.filter(t => t.certificate?.status === "Ready for Collection").length;

  const navItems = [
    { id: "dashboard",   label: "Dashboard",       icon: "dashboard" },
    { id: "leads",       label: "Training Leads",  icon: "leads",    badge: newLeadCount || null },
    { id: "followups",   label: "Follow-ups",      icon: "followups", badge: (todayFUCount + overdueFUCount) || null },
    { id: "payments",    label: "Payments",        icon: "payments",  badge: overduePay || null },
    { id: "enrollment",  label: "Enrollment",      icon: "enroll" },
    { id: "certificates",label: "Certificates",    icon: "cert",      badge: certReady || null },
    { id: "pipeline",    label: "Full Pipeline",   icon: "pipeline" },
    { id: "exports",     label: "Exports",         icon: "download" },
    ...(user.isAdmin ? [{ id: "admin", label: "Staff Accounts", icon: "user" }] : []),
  ];

  // ============ VIEW ROUTING ============
  const renderView = () => {
    switch (view) {
      case "dashboard":    return <Dashboard state={state} setView={setView} openModal={openModal} openDrawer={openDrawer} currentUser={user}/>;
      case "leads":        return <LeadsView state={state} openDrawer={openDrawer} openModal={openModal}/>;
      case "followups":    return <FollowUpsView state={state} openDrawer={openDrawer} openModal={openModal} updateLead={updateLead}/>;
      case "payments":     return <PaymentsView state={state} openDrawer={openDrawer} openModal={openModal}/>;
      case "enrollment":   return <EnrollmentView state={state} openDrawer={openDrawer} openModal={openModal}/>;
      case "certificates": return <CertificatesView state={state} openDrawer={openDrawer} openModal={openModal}/>;
      case "pipeline":     return <PipelineView state={state} openDrawer={openDrawer}/>;
      case "exports":      return <ExportsView state={state}/>;
      case "admin":        return <AdminView currentUser={user}/>;
      default:             return null;
    }
  };

  // ============ DRAWER ============
  const renderDrawer = () => {
    if (!drawer) return null;
    if (drawer.type === "lead") {
      const lead = state.leads.find(l => l.id === drawer.id);
      if (!lead) { setDrawer(null); return null; }
      return <LeadDrawer
        lead={lead} onClose={() => setDrawer(null)}
        updateLead={updateLead}
        convertToTrainee={convertToTrainee}
        openModal={openModal}
      />;
    }
    if (drawer.type === "trainee") {
      const trainee = state.trainees.find(t => t.id === drawer.id);
      if (!trainee) { setDrawer(null); return null; }
      return <TraineeDrawer
        trainee={trainee} onClose={() => setDrawer(null)}
        updateTrainee={updateTrainee}
        openModal={openModal}
      />;
    }
    return null;
  };

  // ============ MODALS ============
  const renderModal = () => {
    if (!modal) return null;
    const close = () => setModal(null);
    switch (modal.type) {
      case "addLead":
        return <AddLeadModal onClose={close} onSave={addLead}/>;
      case "scheduleFollowup":
        return <ScheduleFromAnywhere state={state} onClose={close} onPicked={(lead, fu) => {
          updateLead({ ...lead, followUps: [fu, ...lead.followUps], status: "Follow Up Needed" });
          showToast(`Follow-up scheduled for ${lead.name}`);
          close();
        }}/>;
      case "followupFor":
        return <FollowUpModal lead={modal.lead} onClose={close} onSave={(fu) => { modal.onSave(fu); showToast("Follow-up scheduled"); close(); }}/>;
      case "convertPayment":
        return <ConvertToPaymentModal lead={modal.lead} onClose={close} onConvert={completeConversion}/>;
      case "recordPayment":
        return <RecordPaymentModal trainee={modal.trainee} installment={modal.installment}
          onClose={close} onRecord={(inst) => { modal.onRecord(inst); showToast(`Payment recorded — ${RD.fmtMoney(inst.amount)}`); close(); }}/>;
      case "editPlan":
        return <EditPlanModal trainee={modal.trainee} onClose={close} onSave={(newPlan) => {
          const newPaid = newPlan.filter(p => p.paid).reduce((s, p) => s + p.amount, 0);
          updateTrainee({ ...modal.trainee, plan: newPlan, paid: newPaid });
          showToast(`Payment plan restructured — ${newPlan.filter(p => !p.paid).length} instalment${newPlan.filter(p=>!p.paid).length===1?"":"s"} remaining`);
          close();
        }}/>;
      case "enroll":
        return <EnrollModal trainee={modal.trainee} onClose={close} onEnroll={(enrollment) => {
          updateTrainee({ ...modal.trainee, enrollment, stage: "enrolled" });
          showToast(`${modal.trainee.name} enrolled`);
          close();
        }}/>;
      case "issueCert":
        return <CertificateModal trainee={modal.trainee} onClose={close} onIssue={(cert) => {
          updateTrainee({ ...modal.trainee, certificate: cert, stage: "cert-ready" });
          showToast(`Certificate ${cert.number} ready for collection`);
          close();
        }}/>;
      case "collectCert":
        return <CollectCertModal trainee={modal.trainee} onClose={close} onCollect={(cert) => {
          updateTrainee({ ...modal.trainee, certificate: cert, stage: "cert-collected" });
          showToast(`Certificate collected by ${cert.collectedBy}`);
          close();
        }}/>;
      default: return null;
    }
  };

  return (
    <div className="app-root">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-mark"></div>
          <div>
            <div className="name">Radian H.A.</div>
            <div className="sub">Training Ops</div>
          </div>
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Workspace</div>
          {navItems.map(item => (
            <div key={item.id} className={"nav-item" + (view === item.id ? " active" : "")} onClick={() => setView(item.id)}>
              <Icon name={item.icon} className="nav-icon" size={16}/>
              <span>{item.label}</span>
              {item.badge ? <span className="nav-badge">{item.badge}</span> : null}
            </div>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-section-label">Catalog</div>
          <div className="nav-item" style={{cursor:"default", opacity: 0.85}}>
            <Icon name="book" className="nav-icon" size={16}/>
            <span>Courses</span>
            <span className="nav-badge" style={{background:"rgba(255,255,255,0.12)"}}>{RD.COURSES.length}</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="avatar">{user.initials}</div>
          <div className="who">
            <div className="nm">{user.name}</div>
            <div className="rl">{user.role}</div>
          </div>
          <button className="modal-close" style={{color:"rgba(255,255,255,0.5)"}} onClick={handleLogout} title="Sign out">
            <Icon name="logout" size={16}/>
          </button>
        </div>
      </aside>

      <main className="main">
        {renderView()}
      </main>

      {renderDrawer()}
      {renderModal()}

      {toast && (
        <div className="toast-zone">
          <div className="toast"><span className="check"><Icon name="check" size={14}/></span> {toast}</div>
        </div>
      )}
    </div>
  );
}

// ============ Helper: schedule follow-up from anywhere (pick lead first) ============
function ScheduleFromAnywhere({ state, onClose, onPicked }) {
  const [selected, setSelected] = useState(null);
  const [step, setStep] = useState("pick");

  if (step === "pick") {
    return (
      <Modal title="Schedule Follow-up" sub="Pick a lead to schedule a follow-up for" onClose={onClose}>
        <div style={{maxHeight:380, overflowY:"auto", margin:"-8px 0"}}>
          {state.leads.length === 0 ? (
            <div className="empty"><div className="ttl">No leads to follow up on</div></div>
          ) : state.leads.map(l => (
            <div key={l.id} className="panel-row" style={{borderRadius:0}}
              onClick={() => { setSelected(l); setStep("schedule"); }}>
              <div style={{flex:1}}>
                <div className="nm">{l.name}</div>
                <div className="sub">{l.company || "Individual"} · {RD.getCourse(l.courseId).name}</div>
              </div>
              <StatusPill status={l.status}/>
              <Icon name="chevR" size={14}/>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  return <FollowUpModal lead={selected} onClose={onClose} onSave={(fu) => onPicked(selected, fu)}/>;
}

export default App;
