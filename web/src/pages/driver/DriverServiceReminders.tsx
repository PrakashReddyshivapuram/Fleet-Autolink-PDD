import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVehicles, useServiceReminders } from "@/hooks/useFirestore";
import { Bell, CheckCircle, AlertTriangle, Clock, Plus, X, Calendar, Wrench } from "lucide-react";
import { ReminderType, ReminderStatus } from "@/types";

const TYPE_LABELS: Record<ReminderType, string> = {
  oil_change:     "Oil Change",
  tire_rotation:  "Tyre Rotation",
  brake_check:    "Brake Check",
  inspection:     "Inspection",
  battery:        "Battery Check",
  other:          "Other",
};

const TYPE_ICONS: Record<ReminderType, React.ReactNode> = {
  oil_change:    <Wrench size={14} />,
  tire_rotation: <Wrench size={14} />,
  brake_check:   <Wrench size={14} />,
  inspection:    <Wrench size={14} />,
  battery:       <Wrench size={14} />,
  other:         <Bell size={14} />,
};

const STATUS_TABS: { key: ReminderStatus | "all"; label: string }[] = [
  { key: "all",       label: "All" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "overdue",   label: "Overdue" },
  { key: "completed", label: "Completed" },
];

export default function DriverServiceReminders() {
  const { appUser } = useAuth();
  const { vehicles } = useVehicles();
  const assignedVehicle = vehicles.find(v => v.assignedDriverId === appUser?.uid);
  const { reminders, loading, addReminder, updateReminder } = useServiceReminders(assignedVehicle?.vehicleId);

  const [activeTab, setActiveTab] = useState<ReminderStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const now = new Date();

  // Auto-compute overdue
  const enriched = reminders.map(r => {
    if (r.status !== "completed" && new Date(r.dueDate) < now) {
      return { ...r, status: "overdue" as ReminderStatus };
    }
    return r;
  });

  const filtered = activeTab === "all" ? enriched : enriched.filter(r => r.status === activeTab);
  const sorted = [...filtered].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const upcomingCount  = enriched.filter(r => r.status === "upcoming").length;
  const overdueCount   = enriched.filter(r => r.status === "overdue").length;
  const completedCount = enriched.filter(r => r.status === "completed").length;

  const [form, setForm] = useState({
    title: "", type: "oil_change" as ReminderType, dueDate: "", notes: "",
  });

  const handleAdd = async () => {
    if (!form.title || !form.dueDate || !assignedVehicle || !appUser) return;
    setSaving(true);
    const dueD = new Date(form.dueDate);
    const status: ReminderStatus = dueD < now ? "overdue" : "upcoming";
    await addReminder({
      vehicleId: assignedVehicle.vehicleId,
      title: form.title, type: form.type, dueDate: form.dueDate,
      status, notes: form.notes, createdBy: appUser.uid,
    });
    setForm({ title: "", type: "oil_change", dueDate: "", notes: "" });
    setShowForm(false);
    setSaving(false);
  };

  const handleComplete = async (reminderId: string) => {
    await updateReminder(reminderId, {
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Service Reminders</h1>
          <p className="text-sm text-slate-500 mt-1">
            {assignedVehicle
              ? `${assignedVehicle.make} ${assignedVehicle.model} · ${assignedVehicle.plateNumber}`
              : "No vehicle assigned"}
          </p>
        </div>
        {assignedVehicle && (
          <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
            <Plus size={15} /> Add reminder
          </button>
        )}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <p className="text-sm font-bold text-red-700">
            {overdueCount} overdue reminder{overdueCount > 1 ? "s" : ""} — service needed now
          </p>
          <button onClick={() => setActiveTab("overdue")} className="ml-auto text-xs font-bold text-red-600">View →</button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: upcomingCount,  label: "Upcoming",  color: "text-blue-600" },
          { value: overdueCount,   label: "Overdue",   color: overdueCount > 0 ? "text-red-600" : "text-slate-900" },
          { value: completedCount, label: "Completed", color: "text-emerald-600" },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors text-center">
            <p className={`text-3xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tab filter */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {STATUS_TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === t.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">New reminder</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Title</label>
              <input className="input" placeholder="e.g. Oil change due"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Service type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ReminderType }))}>
                {(Object.keys(TYPE_LABELS) as ReminderType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input"
                value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="Any notes…"
                value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={!form.title || !form.dueDate || saving} className="btn-primary">
              {saving ? "Saving…" : "Add reminder"}
            </button>
          </div>
        </div>
      )}

      {/* Reminder list */}
      {!assignedVehicle ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Bell size={28} className="mx-auto text-slate-300 mb-3" />
          <p className="font-bold text-slate-700">No vehicle assigned</p>
          <p className="text-slate-400 text-sm mt-1">Contact your admin to assign a vehicle.</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <CheckCircle size={28} className="mx-auto text-emerald-400 mb-3" />
          <p className="font-bold text-slate-700">
            {activeTab === "all" ? "No reminders yet" : `No ${activeTab} reminders`}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {activeTab === "all" ? "Add your first service reminder using the button above." : "Check other categories."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map(r => {
            const dueDate = new Date(r.dueDate);
            const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const isOverdue  = r.status === "overdue";
            const isComplete = r.status === "completed";

            return (
              <div key={r.reminderId}
                className={`bg-white border rounded-xl p-4 flex items-start gap-3.5 ${
                  isOverdue ? "border-red-200 bg-red-50/20" :
                  isComplete ? "border-slate-100" : "border-slate-200"
                }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isOverdue ? "bg-red-100 text-red-600" :
                  isComplete ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                }`}>
                  {isComplete ? <CheckCircle size={16} /> : TYPE_ICONS[r.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold ${isComplete ? "text-slate-400 line-through" : "text-slate-900"}`}>
                      {r.title}
                    </p>
                    <span className={`badge text-[10px] flex-shrink-0 ${
                      isOverdue ? "badge-red" : isComplete ? "badge-green" : "badge-blue"
                    }`}>
                      {isOverdue ? "overdue" : isComplete ? "done" : "upcoming"}
                    </span>
                  </div>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{TYPE_LABELS[r.type]}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar size={10} />
                      {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    {!isComplete && (
                      <span className={`text-xs font-semibold ${
                        isOverdue ? "text-red-600" : daysLeft <= 7 ? "text-amber-600" : "text-slate-500"
                      }`}>
                        {isOverdue
                          ? `${Math.abs(daysLeft)} days overdue`
                          : daysLeft === 0 ? "Due today"
                          : `${daysLeft} days left`}
                      </span>
                    )}
                  </div>
                  {r.notes && <p className="text-xs text-slate-400 mt-1">{r.notes}</p>}
                  {!isComplete && (
                    <button onClick={() => handleComplete(r.reminderId)}
                      className="mt-2.5 flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                      <CheckCircle size={12} /> Mark as completed
                    </button>
                  )}
                  {isComplete && r.completedAt && (
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Clock size={9} /> Completed {new Date(r.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
