import { useState } from "react";
import { useJobs, useVehicles, useUsers } from "@/hooks/useFirestore";
import { useAuth } from "@/context/AuthContext";
import { MaintenanceJob, JobStatus, JobPriority } from "@/types";
import { Plus, Wrench, X, Pencil, Car, User, Calendar, AlertTriangle } from "lucide-react";

const STATUS_OPTIONS: JobStatus[] = ["pending", "in_progress", "completed", "cancelled"];
const PRIORITY_OPTIONS: JobPriority[] = ["low", "medium", "high", "critical"];
const emptyForm = {
  vehicleId: "", assignedMechanicId: "", title: "", description: "",
  status: "pending" as JobStatus, priority: "medium" as JobPriority, scheduledAt: "", notes: "",
};

const PRIORITY_STYLE: Record<JobPriority, string> = {
  low:      "badge-gray",
  medium:   "badge-blue",
  high:     "badge-yellow",
  critical: "badge-red",
};

const statusBadge = (s: JobStatus) =>
  s === "completed" ? "badge-green" : s === "in_progress" ? "badge-blue" :
  s === "pending" ? "badge-yellow" : "badge-gray";

export default function AdminJobs() {
  const { jobs, loading, addJob, updateJob } = useJobs();
  const { vehicles } = useVehicles();
  const { users: mechanics } = useUsers("mechanic");
  const { appUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MaintenanceJob | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (j: MaintenanceJob) => {
    setEditing(j);
    setForm({
      vehicleId: j.vehicleId, assignedMechanicId: j.assignedMechanicId || "",
      title: j.title, description: j.description, status: j.status,
      priority: j.priority ?? "medium",
      scheduledAt: j.scheduledAt.split("T")[0], notes: j.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vehicleId || !form.title || !form.scheduledAt) return;
    setSaving(true);
    try {
      const data = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString(), createdBy: appUser!.uid };
      if (editing) await updateJob(editing.jobId, data);
      else await addJob(data);
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Maintenance jobs</h2>
          <p className="page-sub">{jobs.length} total jobs</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> New job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No maintenance jobs yet.</p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
            <Plus size={14} /> Create first job
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {jobs.map((j) => {
            const vehicle = vehicles.find(v => v.vehicleId === j.vehicleId);
            const mechanic = mechanics.find(m => m.uid === j.assignedMechanicId);
            return (
              <div key={j.jobId} className="card-hover p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-sm font-bold text-slate-900">{j.title}</p>
                      <span className={`badge ${statusBadge(j.status)}`}>{j.status.replace("_", " ")}</span>
                      {j.priority && j.priority !== "medium" && (
                        <span className={`badge ${PRIORITY_STYLE[j.priority]}`}>
                          {j.priority === "critical" && <AlertTriangle size={9} />}
                          {j.priority}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-3 leading-relaxed">{j.description}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Car size={11} />
                        <span className="font-medium text-slate-600">{vehicle ? `${vehicle.make} ${vehicle.model}` : "—"}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <User size={11} />
                        <span className="font-medium text-slate-600">{mechanic?.name || "Unassigned"}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={11} />
                        <span className="font-medium text-slate-600">{new Date(j.scheduledAt).toLocaleDateString()}</span>
                      </span>
                    </div>
                    {j.notes && (
                      <p className="mt-2 text-xs text-slate-400 italic bg-slate-50 rounded-lg px-2.5 py-1.5">
                        {j.notes}
                      </p>
                    )}
                  </div>
                  <button onClick={() => openEdit(j)}
                    className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">
                    <Pencil size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? "Edit job" : "New maintenance job"}</h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="label">Job title</label>
                <input className="input" placeholder="Oil change, Tyre replacement…"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={2} placeholder="Describe the work needed…"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Vehicle</label>
                  <select className="input" value={form.vehicleId}
                    onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                    <option value="">Select vehicle</option>
                    {vehicles.map(v => (
                      <option key={v.vehicleId} value={v.vehicleId}>{v.make} {v.model} — {v.plateNumber}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Assign mechanic</label>
                  <select className="input" value={form.assignedMechanicId}
                    onChange={e => setForm({ ...form, assignedMechanicId: e.target.value })}>
                    <option value="">Unassigned</option>
                    {mechanics.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITY_OPTIONS.map(p => (
                    <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize ${
                        form.priority === p
                          ? p === "critical" ? "bg-red-50 border-red-300 text-red-700"
                          : p === "high"     ? "bg-amber-50 border-amber-300 text-amber-700"
                          : p === "medium"   ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-slate-100 border-slate-300 text-slate-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Scheduled date</label>
                  <input type="date" className="input" value={form.scheduledAt}
                    onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as JobStatus })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes <span className="text-slate-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="Additional notes…"
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                {saving && <span className="spinner border-white/60 border-t-transparent" />}
                {saving ? "Saving…" : editing ? "Save changes" : "Create job"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
