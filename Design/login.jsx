// Login page with 3D scaffold background
function LoginPage({ onLogin }) {
  const [email, setEmail] = React.useState("aaliyah.mohammed@radian-ha.com");
  const [password, setPassword] = React.useState("••••••••••");
  const [loading, setLoading] = React.useState(false);
  const sceneRef = React.useRef(null);

  const submit = (e) => {
    e?.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin({ id: "s1", name: "Aaliyah Mohammed", role: "Training Coordinator", initials: "AM" });
    }, 700);
  };

  return (
    <div className="login-root">
      <div className="login-3d" ref={sceneRef}>
        <ScaffoldScene container={sceneRef} />
        <div className="login-3d-overlay"></div>

        <div className="login-brand">
          <div className="logo-mark"></div>
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
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus/>
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}/>
          </div>

          <button type="submit" className="btn btn-orange btn-block" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"} {!loading && <Icon name="arrowR" size={14}/>}
          </button>

          <div className="login-meta">
            <span>v1.0 · Internal use</span>
            <button type="button" className="btn-text">Forgot password?</button>
          </div>
        </form>
      </div>
    </div>
  );
}

window.LoginPage = LoginPage;
