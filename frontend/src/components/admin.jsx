import { useState, useEffect } from 'react';
import { Icon } from './icons';
import { Modal } from './modals';
import * as API from '../api';

export function AdminView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => API.listUsers().then(setUsers).catch(() => {});
  useEffect(() => { load(); }, []);

  const closeModal = () => { setModal(null); setError(""); };

  // ── Add staff ──────────────────────────────────────────────────────────────
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

  // ── Reset password ─────────────────────────────────────────────────────────
  const handleReset = async (userId, password) => {
    setBusy(true); setError("");
    try {
      await API.resetPassword(userId, password);
      closeModal();
    } catch {
      setError("Could not reset password.");
    } finally { setBusy(false); }
  };

  // ── Remove user ────────────────────────────────────────────────────────────
  const handleDelete = async (userId) => {
    if (!confirm("Remove this staff account? This cannot be undone.")) return;
    try {
      await API.deleteUser(userId);
      setUsers(u => u.filter(x => x.id !== userId));
    } catch {
      alert("Could not remove account.");
    }
  };

  return (
    <div className="view-root">
      <div className="view-header">
        <div>
          <h1 className="view-title">Staff Accounts</h1>
          <p className="view-sub">Manage login credentials for the training team.</p>
        </div>
        <button className="btn btn-orange" onClick={() => setModal({ type: "add" })}>
          <Icon name="plus" size={14}/> Add Staff
        </button>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table className="tbl" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: 48 }}></th>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th style={{ width: 80 }}>Access</th>
              <th style={{ width: 160 }}></th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Add Staff Modal ── */}
      {modal?.type === "add" && (
        <AddStaffModal
          onClose={closeModal}
          onSave={handleAdd}
          busy={busy}
          error={error}
        />
      )}

      {/* ── Reset Password Modal ── */}
      {modal?.type === "resetPw" && (
        <ResetPwModal
          user={modal.user}
          onClose={closeModal}
          onSave={(pw) => handleReset(modal.user.id, pw)}
          busy={busy}
          error={error}
        />
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

  const handleNameChange = (v) => {
    set("name", v);
    set("initials", autoInitials(v));
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
            onChange={e => handleNameChange(e.target.value)}
            placeholder="e.g. Marcus Henderson" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
          <div className="field">
            <label>Username <span style={{ opacity: 0.5, fontWeight: 400 }}>(used to log in)</span></label>
            <input type="text" value={form.username}
              onChange={e => set("username", e.target.value.toLowerCase().replace(/\s/g, ""))}
              placeholder="e.g. marcus" />
          </div>
          <div className="field">
            <label>Initials</label>
            <input type="text" value={form.initials} maxLength={3}
              onChange={e => set("initials", e.target.value.toUpperCase())} />
          </div>
        </div>
        <div className="field">
          <label>Role</label>
          <select value={form.role} onChange={e => set("role", e.target.value)}>
            <option>Training Coordinator</option>
            <option>Admin</option>
          </select>
        </div>
        <div className="field">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.isAdmin} onChange={e => set("isAdmin", e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "var(--orange)", cursor: "pointer" }}/>
            Grant admin access <span style={{ opacity: 0.55, fontWeight: 400 }}>(can manage staff accounts)</span>
          </label>
        </div>
        <div className="field">
          <label>Initial Password</label>
          <input type="text" value={form.password}
            onChange={e => set("password", e.target.value)}
            placeholder="Staff can use this to log in" />
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

  const submit = (e) => {
    e.preventDefault();
    if (!password) return;
    onSave(password);
  };

  return (
    <Modal title={`Reset Password — ${user.name}`} sub="Set a new password for this staff member." onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="field">
          <label>New Password</label>
          <input type="text" value={password} autoFocus
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter new password" />
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
