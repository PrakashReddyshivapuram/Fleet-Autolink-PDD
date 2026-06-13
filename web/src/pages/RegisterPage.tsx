import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { UserRole } from "@/types";

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "driver",   label: "Driver",   desc: "Manage trips" },
  { value: "mechanic", label: "Mechanic", desc: "Handle maintenance" },
];

const ROLE_COLOR: Record<UserRole, string> = {
  admin:    "#7c3aed",
  owner:    "#2563eb",
  driver:   "#059669",
  mechanic: "#d97706",
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "driver" as UserRole });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role, form.phone);
      navigate("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("email-already-in-use")) setError("This email is already registered.");
      else setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#050508" }}>

      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] opacity-[0.07]"
          style={{ background: "radial-gradient(ellipse, #4f46e5 0%, transparent 70%)", filter: "blur(40px)" }} />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      </div>

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
          <p className="text-zinc-500 text-xs mt-1 font-medium">Create your account</p>
        </div>

        <div className="rounded-2xl p-7"
          style={{ background: "#0f0f14", border: "1px solid rgba(255,255,255,0.07)" }}>

          <h2 className="text-white font-bold text-lg mb-1">Get started</h2>
          <p className="text-zinc-500 text-sm mb-6">Join your fleet in under a minute</p>

          {error && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl mb-5 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5" }}>
              <AlertCircle size={14} className="flex-shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Full name</label>
                <input placeholder="John Doe" required value={form.name} onChange={e => set("name", e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Phone <span className="text-zinc-600">(opt)</span>
                </label>
                <input placeholder="+91 ..." type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Email</label>
              <input type="email" placeholder="you@company.com" required value={form.email}
                onChange={e => set("email", e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" required
                  value={form.password} onChange={e => set("password", e.target.value)}
                  className="w-full h-10 pl-3.5 pr-10 rounded-xl text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  onFocus={e => { e.currentTarget.style.border = "1px solid rgba(99,102,241,0.5)"; }}
                  onBlur={e => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)"; }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-2">Select role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map(r => {
                  const isSelected = form.role === r.value;
                  const accent = ROLE_COLOR[r.value];
                  return (
                    <button key={r.value} type="button" onClick={() => set("role", r.value)}
                      className="p-3 rounded-xl text-left transition-all duration-150"
                      style={{
                        background: isSelected ? `${accent}18` : "rgba(255,255,255,0.03)",
                        border: isSelected ? `1px solid ${accent}60` : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      <p className="text-xs font-bold" style={{ color: isSelected ? accent : "#a1a1aa" }}>{r.label}</p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{r.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              style={{ background: "linear-gradient(160deg, #5b52f0, #4f46e5 60%, #4338ca)" }}>
              {loading ? <span className="spinner border-white/50 border-t-transparent" /> : null}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-600 mt-5">
            Already registered?{" "}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-zinc-700 mt-6">
          Fleet AutoLink · Secure platform · All rights reserved
        </p>
      </div>
    </div>
  );
}
