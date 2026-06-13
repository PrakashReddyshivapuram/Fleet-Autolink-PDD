import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { User, Phone, MapPin, Shield, Mail, Calendar, Info, CheckCircle, Lock } from "lucide-react";

const ADMIN_CONTACT = {
  name:  "Fleet AutoLink Admin",
  email: "admin@fleet.dev",
  phone: "+1-800-000-0000",
};

const ROLE_COLORS: Record<string, string> = {
  admin:    "bg-violet-100 text-violet-700",
  owner:    "bg-blue-100 text-blue-700",
  driver:   "bg-emerald-100 text-emerald-700",
  mechanic: "bg-amber-100 text-amber-700",
};

export default function ProfileSettings() {
  const { appUser, updateProfile } = useAuth();

  const [form, setForm] = useState({
    name:    appUser?.name    ?? "",
    phone:   appUser?.phone   ?? "",
    address: appUser?.address ?? "",
  });
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const isDirty = form.name !== (appUser?.name ?? "")
    || form.phone   !== (appUser?.phone   ?? "")
    || form.address !== (appUser?.address ?? "");

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    await updateProfile({ name: form.name, phone: form.phone, address: form.address });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const initials = appUser?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "?";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Account</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Update your personal information</p>
      </div>

      {/* Avatar strip */}
      <div className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-lg">{appUser?.name}</p>
          <p className="text-sm text-slate-500">{appUser?.email}</p>
          <span className={`badge mt-1.5 text-[10px] capitalize ${ROLE_COLORS[appUser?.role ?? "driver"]}`}>
            {appUser?.role}
          </span>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
        <p className="text-sm font-bold text-slate-900">Update profile</p>

        <div>
          <label className="label flex items-center gap-1.5">
            <User size={13} className="text-slate-400" /> Full name
          </label>
          <input className="input"
            placeholder="Your full name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Phone size={13} className="text-slate-400" /> Contact number
          </label>
          <input className="input"
            placeholder="+1 (555) 000-0000"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <MapPin size={13} className="text-slate-400" /> Address
          </label>
          <input className="input"
            placeholder="Your address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!isDirty || saving}
            className="btn-primary"
          >
            {saved
              ? <><CheckCircle size={15} /> Saved!</>
              : saving
              ? "Saving…"
              : "Save changes"}
          </button>
          {isDirty && !saving && (
            <button
              onClick={() => setForm({ name: appUser?.name ?? "", phone: appUser?.phone ?? "", address: appUser?.address ?? "" })}
              className="btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock size={15} className="text-slate-500" />
          <p className="text-sm font-bold text-slate-900">Change Password</p>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          Password changes are managed by your fleet administrator for security. Contact your admin to request a password reset.
        </p>
        <button
          onClick={() => setShowAdmin(o => !o)}
          className="btn-secondary text-xs"
        >
          <Shield size={13} /> {showAdmin ? "Hide admin contact" : "Contact admin"}
        </button>

        {showAdmin && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 animate-fade-in">
            <p className="text-xs font-bold text-slate-700 mb-3">Admin contact details</p>
            <div className="flex items-center gap-2.5">
              <User size={13} className="text-slate-400 flex-shrink-0" />
              <p className="text-sm font-semibold text-slate-800">{ADMIN_CONTACT.name}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail size={13} className="text-slate-400 flex-shrink-0" />
              <a href={`mailto:${ADMIN_CONTACT.email}`} className="text-sm text-brand-600 hover:underline font-medium">
                {ADMIN_CONTACT.email}
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone size={13} className="text-slate-400 flex-shrink-0" />
              <a href={`tel:${ADMIN_CONTACT.phone}`} className="text-sm text-brand-600 hover:underline font-medium">
                {ADMIN_CONTACT.phone}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Account information */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info size={15} className="text-slate-500" />
          <p className="text-sm font-bold text-slate-900">Account information</p>
        </div>
        <div className="space-y-3">
          {[
            { icon: <Mail size={13} />,     label: "Email",        value: appUser?.email ?? "—" },
            { icon: <Shield size={13} />,   label: "Role",         value: appUser?.role ? appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1) : "—" },
            { icon: <Calendar size={13} />, label: "Member since", value: appUser?.createdAt
                ? new Date(appUser.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                : "—" },
            { icon: <User size={13} />,     label: "User ID",      value: appUser?.uid ? `${appUser.uid.slice(0, 8)}…` : "—" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
              <span className="text-slate-400 flex-shrink-0">{item.icon}</span>
              <span className="text-xs font-semibold text-slate-500 w-28 flex-shrink-0">{item.label}</span>
              <span className="text-sm font-medium text-slate-800 truncate">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
