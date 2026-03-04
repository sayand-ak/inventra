import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/user";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await loginUser({ email, password });
      const { token, user } = res.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0f;
          overflow: hidden;
          position: relative;
        }

        /* Decorative left panel */
        .login-panel-left {
          flex: 1;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          overflow: hidden;
        }

        .panel-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #0d1117 0%, #111827 50%, #0f172a 100%);
          z-index: 0;
        }

        .panel-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          z-index: 1;
        }

        .panel-accent {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(99, 179, 237, 0.08) 0%, transparent 70%);
          top: -100px;
          right: -100px;
          z-index: 1;
          animation: pulse 6s ease-in-out infinite;
        }

        .panel-accent-2 {
          position: absolute;
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.06) 0%, transparent 70%);
          bottom: 50px;
          left: 50px;
          z-index: 1;
          animation: pulse 8s ease-in-out infinite reverse;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
        }

        .panel-logo {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: fadeDown 0.6s ease both;
        }

        .logo-mark {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #63b3ed, #a78bfa);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-mark svg {
          width: 20px;
          height: 20px;
          color: white;
        }

        .logo-text {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 18px;
          color: #f8fafc;
          letter-spacing: -0.3px;
        }

        .panel-hero {
          position: relative;
          z-index: 2;
          animation: fadeUp 0.8s 0.2s ease both;
        }

        .panel-hero-tag {
          display: inline-block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #63b3ed;
          background: rgba(99,179,237,0.1);
          border: 1px solid rgba(99,179,237,0.2);
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 20px;
        }

        .panel-hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(32px, 3vw, 48px);
          font-weight: 800;
          color: #f8fafc;
          line-height: 1.15;
          letter-spacing: -1px;
          margin-bottom: 16px;
        }

        .panel-hero h1 span {
          background: linear-gradient(90deg, #63b3ed, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .panel-hero p {
          color: #64748b;
          font-size: 15px;
          font-weight: 300;
          line-height: 1.7;
          max-width: 380px;
        }

        .panel-stats {
          position: relative;
          z-index: 2;
          display: flex;
          gap: 32px;
          animation: fadeUp 0.8s 0.4s ease both;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-value {
          font-family: 'Syne', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #e2e8f0;
        }

        .stat-label {
          font-size: 12px;
          color: #475569;
          font-weight: 400;
          letter-spacing: 0.5px;
        }

        .stat-divider {
          width: 1px;
          background: rgba(255,255,255,0.06);
          align-self: stretch;
        }

        /* Right form panel */
        .login-panel-right {
          width: 480px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
          background: #0f1117;
          border-left: 1px solid rgba(255,255,255,0.05);
          position: relative;
          animation: slideLeft 0.7s ease both;
        }

        @keyframes slideLeft {
          from { transform: translateX(40px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeDown {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes fadeUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .form-wrapper {
          width: 100%;
          max-width: 360px;
        }

        .form-header {
          margin-bottom: 36px;
          animation: fadeUp 0.6s 0.3s ease both;
        }

        .form-header h2 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.5px;
          margin-bottom: 8px;
        }

        .form-header p {
          color: #475569;
          font-size: 14px;
          font-weight: 400;
        }

        .form-group {
          margin-bottom: 18px;
          animation: fadeUp 0.6s ease both;
        }

        .form-group:nth-child(1) { animation-delay: 0.4s; }
        .form-group:nth-child(2) { animation-delay: 0.5s; }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #64748b;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #334155;
          transition: color 0.2s;
          pointer-events: none;
          display: flex;
        }

        .form-input {
          width: 100%;
          padding: 13px 14px 13px 42px;
          background: #161b27;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 400;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input::placeholder {
          color: #334155;
        }

        .form-input:focus {
          border-color: rgba(99,179,237,0.4);
          background: #1a2133;
          box-shadow: 0 0 0 3px rgba(99,179,237,0.08);
        }

        .input-wrapper.focused .input-icon {
          color: #63b3ed;
        }

        .form-options {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 28px;
          animation: fadeUp 0.6s 0.55s ease both;
        }

        .forgot-link {
          font-size: 13px;
          color: #63b3ed;
          text-decoration: none;
          font-weight: 400;
          transition: opacity 0.2s;
          cursor: pointer;
          background: none;
          border: none;
        }

        .forgot-link:hover { opacity: 0.7; }

        .error-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          margin-bottom: 20px;
          animation: fadeUp 0.3s ease both;
        }

        .error-box svg {
          flex-shrink: 0;
          color: #ef4444;
        }

        .error-box span {
          font-size: 13px;
          color: #fca5a5;
          font-weight: 400;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: all 0.25s ease;
          animation: fadeUp 0.6s 0.6s ease both;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          opacity: 0;
          transition: opacity 0.25s;
        }

        .login-btn:hover::before { opacity: 1; }
        .login-btn:active { transform: scale(0.98); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          margin-top: 28px;
          text-align: center;
          animation: fadeUp 0.6s 0.7s ease both;
        }

        .form-footer p {
          font-size: 13px;
          color: #334155;
        }

        .form-footer a {
          color: #63b3ed;
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .form-footer a:hover { opacity: 0.7; }

        @media (max-width: 768px) {
          .login-panel-left { display: none; }
          .login-panel-right { width: 100%; border-left: none; }
        }
      `}</style>

      <div className="login-root">
        {/* Left decorative panel */}
        <div className="login-panel-left">
          <div className="panel-bg" />
          <div className="panel-grid" />
          <div className="panel-accent" />
          <div className="panel-accent-2" />

          <div className="panel-logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span className="logo-text">Inventra</span>
          </div>

          <div className="panel-hero">
            <div className="panel-hero-tag">Inventory Management</div>
            <h1>Full control of<br />your <span>stock & assets</span></h1>
            <p>Real-time tracking, smart alerts, and powerful analytics — everything your team needs in one place.</p>
          </div>

          <div className="panel-stats">
            <div className="stat">
              <span className="stat-value">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">12k+</span>
              <span className="stat-label">Products tracked</span>
            </div>
            <div className="stat-divider" />
            <div className="stat">
              <span className="stat-value">&#60; 1s</span>
              <span className="stat-label">Sync time</span>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="login-panel-right">
          <div className="form-wrapper">
            <div className="form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="error-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <div className={`input-wrapper ${focused === "email" ? "focused" : ""}`}>
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className={`input-wrapper ${focused === "password" ? "focused" : ""}`}>
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  className="form-input"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="form-options">
              <button className="forgot-link">Forgot password?</button>
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={isLoading}
            >
              <div className="btn-content">
                {isLoading ? (
                  <>
                    <div className="spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </div>
            </button>

            <div className="form-footer">
              <p>Don't have an account? <a href="/register">Request access</a></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;