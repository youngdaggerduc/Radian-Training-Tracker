import { useState, useRef } from 'react';
import { Icon } from './icons';
import { ScaffoldScene } from './scaffold3d';
import * as API from '../api';
import logo from '../assets/logo.png';

export function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const sceneRef = useRef(null);

  const submit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) { setError("Enter your username and password."); return; }
    setError("");
    setLoading(true);
    try {
      const data = await API.login(username.trim(), password);
      API.setToken(data.access_token);
      onLogin(data.user);
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-3d" ref={sceneRef}>
        <ScaffoldScene container={sceneRef} />
        <div className="login-3d-overlay"></div>

        <div className="login-brand">
          <img src={logo} alt="Radian H.A." style={{width:44,height:44,objectFit:"contain"}}/>
          <div>
            <div className="login-brand-name">Radian H.A. Limited</div>
            <div className="login-brand-sub">Training Operations</div>
          </div>
        </div>

        <div className="login-tag">
          <h1>Every learner. <br/>Every payment. <em>Every certificate.</em></h1>
          <p>The internal platform for the Radian training team — track interest, follow-ups, payments, enrollments and certificate collection in one place.</p>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="eyebrow">Staff Sign-in</div>
          <h2>Welcome back.</h2>
          <p className="sub">Use your Radian staff credentials to access the training tracking dashboard.</p>

          <div className="field">
            <label>Username</label>
            <input
              type="text" value={username} autoFocus autoComplete="username"
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. aaliyah"
            />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password" value={password} autoComplete="current-password"
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div style={{color:"var(--red)",fontSize:13,marginBottom:4}}>{error}</div>
          )}

          <button type="submit" className="btn btn-orange btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"} {!loading && <Icon name="arrowR" size={14}/>}
          </button>

          <div className="login-meta">
            <span>v1.0 · Internal use</span>
          </div>
        </form>
      </div>
    </div>
  );
}
