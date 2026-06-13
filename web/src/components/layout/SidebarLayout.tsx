import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LogOut, Menu, X, ChevronDown, Check, Bell, Wrench, Car } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

function NotificationIcon({ type }: { type: string }) {
  if (type === "job_status") return <Wrench size={12} className="text-amber-500" />;
  return <Car size={12} className="text-violet-500" />;
}

const TruckLogo = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

interface NavItem { label: string; icon: React.ReactNode; key: string; }

interface Props {
  children: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (key: string) => void;
  roleLabel: string;
  roleColor: string;
}

const ROLE_DOT: Record<string, string> = {
  Admin:    "bg-violet-400",
  Driver:   "bg-emerald-400",
  Mechanic: "bg-amber-400",
  Owner:    "bg-blue-400",
};

export default function SidebarLayout({ children, navItems, activeTab, onTabChange, roleLabel }: Props) {
  const { appUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate("/login"); };
  const dotClass = ROLE_DOT[roleLabel] ?? "bg-slate-400";
  const initials = appUser?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="flex flex-col h-screen bg-[#fafafa] overflow-hidden">

      {/* ── Top navigation bar ───────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center h-[52px] px-4 gap-4 border-b border-zinc-200/80"
        style={{ background: "#0a0a0f" }}>

        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
            style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
            <TruckLogo />
          </div>
          <span className="text-white font-bold text-sm tracking-tight hidden sm:block">Fleet AutoLink</span>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-zinc-700 flex-shrink-0 hidden sm:block" />

        {/* Role indicator */}
        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
          <span className="text-zinc-500 text-xs font-medium">{roleLabel}</span>
        </div>

        {/* Desktop nav — scrollable so it never wraps */}
        <nav className="hidden lg:flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`flex items-center gap-2 px-3 h-8 rounded-md text-xs font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <span className={`flex-shrink-0 ${isActive ? "text-brand-400" : "text-zinc-600"}`}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && <Check size={10} className="text-brand-400 flex-shrink-0 ml-0.5" />}
              </button>
            );
          })}
        </nav>

        {/* Spacer for non-desktop */}
        <div className="flex-1 lg:hidden" />

        {/* Mobile hamburger */}
        <button
          className="lg:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-colors"
          onClick={() => setMobileOpen(true)}>
          <Menu size={16} />
        </button>

        {/* User menu */}
        <div className="relative flex-shrink-0 hidden sm:block">
          <button
            onClick={() => setUserMenuOpen(o => !o)}
            className="flex items-center gap-2 px-2.5 h-8 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/10 transition-all">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
              {initials}
            </div>
            <span className="text-xs font-medium text-zinc-400 hidden md:block max-w-[100px] truncate">
              {appUser?.name?.split(" ")[0]}
            </span>
            <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-xl shadow-card-lg border border-slate-200 py-1 animate-fade-in">
                <div className="px-3 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-900 truncate">{appUser?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{appUser?.email}</p>
                </div>
                <div className="p-1">
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ── Mobile slide-down drawer ──────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute top-0 left-0 right-0 animate-slide-up"
            style={{ background: "#0a0a0f", borderBottom: "1px solid #27272a" }}>
            <div className="flex items-center justify-between px-4 h-[52px] border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  <TruckLogo />
                </div>
                <span className="text-white font-bold text-sm">Fleet AutoLink</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-zinc-500 hover:text-zinc-300 transition-colors p-1">
                <X size={18} />
              </button>
            </div>
            <nav className="px-3 py-3 grid grid-cols-2 gap-1">
              {navItems.map(item => {
                const isActive = activeTab === item.key;
                return (
                  <button key={item.key}
                    onClick={() => { onTabChange(item.key); setMobileOpen(false); }}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                    }`}>
                    <span className={isActive ? "text-brand-400" : "text-zinc-600"}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{appUser?.name}</p>
                  <p className="text-[10px] text-zinc-500">{appUser?.email}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-950/40 transition-colors">
                <LogOut size={13} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active page tab label — subtle breadcrumb strip ───── */}
      <div className="flex-shrink-0 flex items-center gap-3 px-5 h-9 bg-white border-b border-slate-100">
        <span className="text-slate-300 text-xs">/</span>
        <span className="text-xs font-semibold text-slate-700">
          {navItems.find(n => n.key === activeTab)?.label ?? ""}
        </span>
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-5 xl:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
