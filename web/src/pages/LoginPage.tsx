import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, FlaskConical } from "lucide-react";
import { UserRole } from "@/types";

const TEST_ACCOUNTS: { role: UserRole; label: string; email: string; name: string; accent: string }[] = [
  { role: "admin",    label: "Admin",    email: "admin@fleet.dev",    name: "Admin User",    accent: "#7c3aed" },
  { role: "owner",    label: "Owner",    email: "owner@fleet.dev",    name: "Vehicle Owner", accent: "#2563eb" },
  { role: "driver",   label: "Driver",   email: "driver@fleet.dev",   name: "Test Driver",   accent: "#059669" },
  { role: "mechanic", label: "Mechanic", email: "mechanic@fleet.dev", name: "Mechanic Pro",  accent: "#d97706" },
];
const DEV_PASSWORD = "test1234";
// Demo quick-login buttons. Set to false to hide on the live site.
const SHOW_DEMO_LOGINS = true;

const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "driver",   label: "Driver",   desc: "Manage trips" },
  { value: "mechanic", label: "Mechanic", desc: "Handle jobs" },
];

type Screen = "login" | "complete-profile";

export default function LoginPage() {
  const { login, register, loginWithGoogle, completeGoogleProfile } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [devLoading, setDevLoading] = useState<UserRole | null>(null);

  const handleDevLogin = async (account: typeof TEST_ACCOUNTS[0]) => {
    setError(""); setDevLoading(account.role);
    try {
      await login(account.email, DEV_PASSWORD);
      navigate("/");
    } catch {
      // Account doesn't exist yet — create it first
      try {
        await register(account.email, DEV_PASSWORD, account.name, account.role);
        navigate("/");
      } catch (regErr: unknown) {
        const msg = regErr instanceof Error ? regErr.message : "";
        // Already exists but wrong password (shouldn't happen), or other error
        if (msg.includes("email-already-in-use")) {
          setError(`Account exists but login failed. Check Firebase Auth for ${account.email}.`);
        } else {
          setError("Dev login failed. Check Firebase connection.");
        }
      }
    } finally {
      setDevLoading(null);
    }
  };

  const [screen, setScreen] = useState<Screen>("login");
  const [pendingUid, setPendingUid] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileRole, setProfileRole] = useState<UserRole>("driver");
  const [profileLoading, setProfileLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try { await login(email, password); navigate("/"); }
    catch { setError("Invalid email or password."); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.needsProfile) {
        setPendingUid(result.uid); setGoogleName(result.displayName || "");
        setProfileName(result.displayName || ""); setScreen("complete-profile");
      } else { navigate("/"); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (!msg.includes("popup-closed")) setError("Google sign-in failed. Try again.");
    } finally { setLoading(false); }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) return;
    setProfileLoading(true);
    try { await completeGoogleProfile(pendingUid, profileName, profileRole, profilePhone); navigate("/"); }
    catch { setError("Failed to save profile. Try again."); }
    finally { setProfileLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#050508" }}>

      {/* Ambient glow — pure CSS, no images */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #4f46e5 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] opacity-[0.05]"
          style={{ background: "radial-gradient(ellipse, #7c3aed 0%, transparent 70%)", filter: "blur(30px)" }} />
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

      {/* Form card */}
      <div className="relative z-10 w-full max-w-sm animate-slide-up">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", boxShadow: "0 8px 32px rgba(79,70,229,0.4)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
          </div>
          <h1 className="text-white font-extrabold text-xl tracking-tight">Fleet AutoLink</h1>
          <p className="text-zinc-500 text-xs mt-1 font-medium tracking-wide">Fleet Management Platform</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-7"
          style={{ background: "#0f0f14", border: "1px solid rgba(255,255,255,0.07)" }}>

          {screen === "login" ? (
            <>
              <h2 className="text-white font-bold text-lg mb-1">Sign in</h2>
              <p className="text-zinc-500 text-sm mb-6">Access your fleet dashboard</p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl mb-5 text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}

              {/* Google */}
              <button onClick={handleGoogleLogin} disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 h-10 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 mb-4"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e4e4e7" }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}>
                {loading ? <span className="spinner border-zinc-500 border-t-transparent" /> : <GoogleIcon />}
                Continue with Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
                <span className="text-zinc-600 text-xs font-medium">or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    <input type="email" placeholder="you@company.com" required
                      value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-10 pl-9 pr-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                      onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                    <input type={showPw ? "text" : "password"} placeholder="••••••••" required
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full h-10 pl-9 pr-10 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                      onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; e.currentTarget.style.background = "rgba(99,102,241,0.05)"; }}
                      onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(160deg, #5b52f0, #4f46e5 60%, #4338ca)" }}>
                  {loading ? <span className="spinner border-white/50 border-t-transparent" /> : null}
                  {loading ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <p className="text-center text-xs text-zinc-600 mt-5">
                No account?{" "}
                <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
                  Register
                </Link>
              </p>

              {/* ── Dev quick-login ─────────────────────────── */}
              {SHOW_DEMO_LOGINS && (
                <div className="mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <FlaskConical size={11} className="text-zinc-600" />
                    <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Test accounts</span>
                    <span className="text-[10px] text-zinc-700 ml-auto">pw: test1234</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_ACCOUNTS.map(acc => (
                      <button
                        key={acc.role}
                        onClick={() => handleDevLogin(acc)}
                        disabled={devLoading !== null}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all duration-150 disabled:opacity-50"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = `${acc.accent}18`)}
                        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}>
                        {devLoading === acc.role ? (
                          <span className="w-3 h-3 border border-zinc-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: acc.accent }} />
                        )}
                        <span className="text-xs font-semibold text-zinc-400">{acc.label}</span>
                        <span className="text-[10px] text-zinc-700 ml-auto font-mono truncate">{acc.email.split("@")[0]}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-700 text-center mt-2.5 leading-relaxed">
                    First click creates the account · data persists in Firebase
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Complete Google profile */
            <>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4"
                style={{ background: "rgba(79,70,229,0.15)", border: "1px solid rgba(79,70,229,0.3)" }}>
                <CheckCircle2 size={18} className="text-brand-400" />
              </div>
              <h2 className="text-white font-bold text-lg mb-1">Complete your profile</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Signed in as <span className="text-zinc-300 font-medium">{googleName}</span>
              </p>

              {error && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl mb-5 text-sm"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  <AlertCircle size={14} className="flex-shrink-0" /> {error}
                </div>
              )}

              <form onSubmit={handleCompleteProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full name</label>
                  <input placeholder="John Doe" required value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                    onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                    Phone <span className="text-zinc-600 font-normal">(optional)</span>
                  </label>
                  <input placeholder="+91 98765 43210" type="tel" value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                    onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">Select your role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {ROLES.map(r => {
                      const isSelected = profileRole === r.value;
                      return (
                        <button key={r.value} type="button" onClick={() => setProfileRole(r.value)}
                          className="p-3 rounded-xl text-left transition-all duration-150"
                          style={{
                            background: isSelected ? "rgba(79,70,229,0.12)" : "rgba(255,255,255,0.03)",
                            border: isSelected ? "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.06)",
                          }}>
                          <p className={`text-xs font-bold ${isSelected ? "text-brand-300" : "text-zinc-400"}`}>{r.label}</p>
                          <p className="text-[10px] text-zinc-600 mt-0.5">{r.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" disabled={profileLoading}
                  className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(160deg, #5b52f0, #4f46e5 60%, #4338ca)" }}>
                  {profileLoading ? <span className="spinner border-white/50 border-t-transparent" /> : null}
                  {profileLoading ? "Creating account…" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-zinc-700 mt-6">
          Fleet AutoLink · Secure platform · All rights reserved
        </p>
      </div>
    </div>
  );
}
