import { useState, useEffect } from 'react';
import { Icon } from './icons';
import { Modal } from './modals';
import { fmtMoney } from '../data';
import * as API from '../api';

export function AdminView({ currentUser, courses = [], onCoursesChange }) {
  const [tab, setTab]     = useState("staff");
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState("");

  const load = () => API.listUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const closeModal = () => { setModal(null); setError(""); };

  // ── Staff actions ──────────────────────────────────────────────────────────
  const handleAdd = async (form) => {
    setBusy(true); setError("");
    try {
      const created = await API.createUser(form);
      setUsers(u => [...u, created]);
      closeModal();
    } catch (e) {
      setError(e.message.includes("409") ? "Username already taken." : "Could not create account.");
    } finally { setBusy(false); }
  };

  const handleReset = async (userId, password) => {
    setBusy(true); setError("");
    try {
      await API.resetPassword(userId, password);
      closeModal();
    } catch {
      setError("Could not reset password.");
    } finally { setBusy(false); }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Remove this staff account? This cannot be undone.")) return;
    try {
      await API.deleteUser(userId);
      setUsers(u => u.filter(x => x.id !== userId));
    } catch {
      alert("Could not remove account.");
    }
  };

  // ── Course actions ─────────────────────────────────────────────────────────
  const handleAddCourse = async (form) => {
    setBusy(true); setError("");
    try {
      const created = await API.createCourse(form);
      onCoursesChange([...courses, created]);
      closeModal();
    } catch {
      setError("Could not create course.");
    } finally { setBusy(false); }
  };

  const handleEditCourse = async (id, form) => {
    setBusy(true); setError("");
    try {
      const updated = await API.updateCourse(id, form);
      onCoursesChange(courses.map(c => c.id === id ? updated : c));
      closeModal();
    } catch {
      setError("Could not update course.");
    } finally { setBusy(false); }
  };

  const handleArchiveCourse = async (course) => {
    try {
      const updated = await API.updateCourse(course.id, { active: !course.active });
      onCoursesChange(courses.map(c => c.id === course.id ? updated : c));
    } catch {
      alert("Could not update course.");
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm("Delete this course permanently? This cannot be undone.")) return;
    try {
      await API.deleteCourse(id);
      onCoursesChange(courses.filter(c => c.id !== id));
    } catch {
      alert("Could not delete course.");
    }
  };

  const tabStyle = (id) => ({
    padding: "14px 0", marginRight: 24, fontSize: 12, letterSpacing: "0.14em",
    textTransform: "uppercase", color: tab === id ? "var(--navy-800)" : "var(--navy-500)",
    borderBottom: `2px solid ${tab === id ? "var(--orange)" : "transparent"}`,
    marginBottom: -1, cursor: "pointer", background: "none", border: "none",
    borderBottom: tab === id ? "2px solid var(--orange)" : "2px solid transparent",
  });

  // Group courses by provider
  const providers = [...new Set(courses.map(c => c.provider))].sort();
  const activeCourses   = courses.filter(c => c.active);
  const archivedCourses = courses.filter(c => !c.active);

  return (
    <div className="view-root">
      <div className="view-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 className="view-title">Admin</h1>
          <p className="view-sub" style={{ color: "var(--navy-500)", marginTop: 4 }}>Manage staff accounts and the course catalog.</p>
        </div>
        {currentUser.isAdmin && (
          <button className="btn btn-orange" onClick={() => { setError(""); setModal({ type: tab === "staff" ? "addStaff" : "addCourse" }); }}>
            <Icon name="plus" size={14}/> {tab === "staff" ? "Add Staff" : "Add Course"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--navy-100)", marginBottom: 20 }}>
        <button style={tabStyle("staff")} onClick={() => setTab("staff")}>Staff Accounts</button>
        <button style={tabStyle("courses")} onClick={() => setTab("courses")}>Course Catalog</button>
      </div>

      {/* ── Staff tab ── */}
      {tab === "staff" && (
        <div className="panel" style={{ padding: 0 }}>
          <table className="tbl" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: 48 }}></th>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th style={{ width: 80 }}>Access</th>
                {currentUser.isAdmin && <th style={{ width: 160 }}></th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, margin: "0 auto" }}>{u.initials}</div>
                  </td>
                  <td>
                    <div className="nm">{u.name}</div>
                    {u.id === currentUser.id && <div className="sub" style={{ fontSize: 11, color: "var(--orange)" }}>You</div>}
                  </td>
                  <td style={{ fontFamily: "var(--mono)", fontSize: 13 }}>{u.username}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.isAdmin
                      ? <span className="pill" style={{ background: "var(--orange-lt)", color: "var(--orange-dk)", fontSize: 11 }}>Admin</span>
                      : <span className="pill" style={{ background: "var(--warm-100)", color: "var(--navy-600)", fontSize: 11 }}>Staff</span>
                    }
                  </td>
                  {currentUser.isAdmin && (
                    <td style={{ textAlign: "right", paddingRight: 16 }}>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px", marginRight: 6 }}
                        onClick={() => { setError(""); setModal({ type: "resetPw", user: u }); }}
                      >
                        Reset PW
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: 12, padding: "4px 10px", color: "var(--red)", opacity: u.id === currentUser.id ? 0.3 : 1 }}
                        disabled={u.id === currentUser.id}
                        onClick={() => handleDelete(u.id)}
                      >
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Courses tab ── */}
      {tab === "courses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {providers.map(provider => {
            const providerCourses = activeCourses.filter(c => c.provider === provider);
            if (!providerCourses.length) return null;
            return (
              <div key={provider} className="panel" style={{ padding: 0 }}>
                <div className="panel-header">
                  <h3 style={{ fontSize: 16 }}>{provider}</h3>
                  <div className="meta">{providerCourses.length} course{providerCourses.length !== 1 ? "s" : ""}</div>
                </div>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Course Name</th>
                      <th style={{ width: 120 }}>Price (TTD)</th>
                      <th style={{ width: 80 }}>Duration</th>
                      {currentUser.isAdmin && <th style={{ width: 140 }}></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {providerCourses.map(c => (
                      <tr key={c.id} style={{ cursor: "default" }}>
                        <td>
                          <div className="nm">{c.name}</div>
                          <div className="sub" style={{ fontSize: 11, fontFamily: "var(--mono)" }}>{c.id}</div>
                        </td>
                        <td style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{fmtMoney(c.price)}</td>
                        <td style={{ color: "var(--navy-500)" }}>{c.days} day{c.days !== 1 ? "s" : ""}</td>
                        {currentUser.isAdmin && (
                          <td style={{ textAlign: "right", paddingRight: 16 }}>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: "4px 10px", marginRight: 6 }}
                              onClick={() => { setError(""); setModal({ type: "editCourse", course: c }); }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-ghost"
                              style={{ fontSize: 12, padding: "4px 10px", color: "var(--amber)" }}
                              onClick={() => handleArchiveCourse(c)}
                            >
                              Archive
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}

          {/* Archived section */}
          {archivedCourses.length > 0 && (
            <div className="panel" style={{ padding: 0, opacity: 0.7 }}>
              <div className="panel-header">
                <h3 style={{ fontSize: 15, color: "var(--navy-500)" }}>Archived Courses</h3>
                <div className="meta">{archivedCourses.length} archived</div>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th style={{ width: 120 }}>Price (TTD)</th>
                    <th style={{ width: 80 }}>Duration</th>
                    {currentUser.isAdmin && <th style={{ width: 180 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {archivedCourses.map(c => (
                    <tr key={c.id} style={{ cursor: "default" }}>
                      <td>
                        <div className="nm" style={{ textDecoration: "line-through", color: "var(--navy-400)" }}>{c.name}</div>
                        <div className="sub" style={{ fontSize: 11 }}>{c.provider}</div>
                      </td>
                      <td style={{ color: "var(--navy-400)" }}>{fmtMoney(c.price)}</td>
                      <td style={{ color: "var(--navy-400)" }}>{c.days}d</td>
                      {currentUser.isAdmin && (
                        <td style={{ textAlign: "right", paddingRight: 16 }}>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: "4px 10px", marginRight: 6 }}
                            onClick={() => handleArchiveCourse(c)}
                          >
                            Restore
                          </button>
                          <button
                            className="btn btn-ghost"
                            style={{ fontSize: 12, padding: "4px 10px", color: "var(--red)" }}
                            onClick={() => handleDeleteCourse(c.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}
      {modal?.type === "addStaff" && (
        <AddStaffModal onClose={closeModal} onSave={handleAdd} busy={busy} error={error}/>
      )}
      {modal?.type === "resetPw" && (
        <ResetPwModal user={modal.user} onClose={closeModal} onSave={(pw) => handleReset(modal.user.id, pw)} busy={busy} error={error}/>
      )}
      {modal?.type === "addCourse" && (
        <CourseModal onClose={closeModal} onSave={handleAddCourse} busy={busy} error={error}/>
      )}
      {modal?.type === "editCourse" && (
        <CourseModal course={modal.course} onClose={closeModal} onSave={(form) => handleEditCourse(modal.course.id, form)} busy={busy} error={error}/>
      )}
    </div>
  );
}


// ── Add Staff Modal ───────────────────────────────────────────────────────────
function AddStaffModal({ onClose, onSave, busy, error }) {
  const [form, setForm] = useState({
    name: "", username: "", initials: "", role: "Training Coordinator", isAdmin: false, password: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const autoInitials = (name) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
    return "";
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.username || !form.password) return;
    onSave(form);
  };

  return (
    <Modal title="Add Staff Account" onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Full Name</label>
          <input type="text" value={form.name} autoFocus
            onChange={e => { set("name", e.target.value); set("initials", autoInitials(e.target.value)); }}
            placeholder="e.g. Marcus Henderson"/>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
          <div className="field">
            <label>Username <span style={{ opacity: 0.5, fontWeight: 400 }}>(used to log in)</span></label>
            <input type="text" value={form.username}
              onChange={e => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="e.g. marcus"/>
          </div>
          <div className="field">
            <label>Initials</label>
            <input type="text" value={form.initials} maxLength={3}
              onChange={e => set("initials", e.target.value.toUpperCase())}/>
          </div>
        </div>
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={e => set("role", e.target.value)}>
            <option>Training Coordinator</option>
            <option>Training / Marketing</option>
            <option>Training Assistant</option>
            <option>Business Process Analyst</option>
          </select>
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isAdmin} onChange={e => set("isAdmin", e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "var(--orange)", cursor: "pointer" }}/>
            Grant admin access <span style={{ opacity: 0.55, fontWeight: 400 }}>(can manage staff and courses)</span>
          </label>
        </div>
        <div className="field">
          <label>Initial Password</label>
          <input type="text" value={form.password} onChange={e => set("password", e.target.value)} placeholder="Staff can use this to log in"/>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-orange" disabled={busy || !form.name || !form.username || !form.password}>
            {busy ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


// ── Reset Password Modal ──────────────────────────────────────────────────────
function ResetPwModal({ user, onClose, onSave, busy, error }) {
  const [password, setPassword] = useState("");
  const submit = (e) => { e.preventDefault(); if (!password) return; onSave(password); };
  return (
    <Modal title={`Reset Password — ${user.name}`} sub="Set a new password for this staff member." onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>New Password</label>
          <input type="text" value={password} autoFocus onChange={e => setPassword(e.target.value)} placeholder="Enter new password"/>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-orange" disabled={busy || !password}>
            {busy ? "Saving…" : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}


// ── Course Modal (Add / Edit) ─────────────────────────────────────────────────
function CourseModal({ course, onClose, onSave, busy, error }) {
  const [form, setForm] = useState({
    provider: course?.provider || "",
    name:     course?.name     || "",
    price:    course?.price    ?? 0,
    days:     course?.days     ?? 1,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!form.provider.trim() || !form.name.trim()) return;
    onSave(form);
  };

  return (
    <Modal title={course ? "Edit Course" : "Add Course"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>Provider / Organisation</label>
          <input type="text" value={form.provider} autoFocus
            onChange={e => set("provider", e.target.value)} placeholder="e.g. CISRS, GetmieSafe"/>
        </div>
        <div className="field">
          <label>Course Name</label>
          <input type="text" value={form.name}
            onChange={e => set("name", e.target.value)} placeholder="Full course title"/>
        </div>
        <div className="field-row">
          <div className="field">
            <label>Price (TTD)</label>
            <input type="number" min={0} step={0.01} value={form.price}
              onChange={e => set("price", parseFloat(e.target.value) || 0)}/>
          </div>
          <div className="field">
            <label>Duration (days)</label>
            <input type="number" min={1} step={1} value={form.days}
              onChange={e => set("days", parseInt(e.target.value) || 1)}/>
          </div>
        </div>
        {error && <div style={{ color: "var(--red)", fontSize: 13 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-orange" disabled={busy || !form.provider.trim() || !form.name.trim()}>
            {busy ? "Saving…" : course ? "Save Changes" : "Add Course"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
