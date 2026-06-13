import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useJobs, useVehicles } from "@/hooks/useFirestore";
import { JobStatus, MaintenanceJob } from "@/types";
import { Wrench, CheckCircle, Clock, X, MessageSquare, Car, Calendar } from "lucide-react";

const STATUS_OPTIONS: { value: JobStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusBadge = (s: JobStatus) =>
  s === "completed" ? "badge-green" : s === "in_progress" ? "badge-blue" :
  s === "pending" ? "badge-yellow" : "badge-gray";

export default function MechanicJobs() {
  const { appUser } = useAuth();
  const { jobs, loading, updateJob } = useJobs(appUser?.uid);
  const { vehicles } = useVehicles();
  const [updating, setUpdating] = useState<string | null>(null);
  const [noteJob, setNoteJob] = useState<MaintenanceJob | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const handleStatusChange = async (jobId: string, status: JobStatus) => {
    setUpdating(jobId);
    await updateJob(jobId, { status, ...(status === "completed" ? { completedAt: new Date().toISOString() } : {}) });
    setUpdating(null);
  };

  const handleSaveNote = async () => {
    if (!noteJob) return;
    setSavingNote(true);
    await updateJob(noteJob.jobId, { notes: note });
    setSavingNote(false);
    setNoteJob(null);
    setNote("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  const pending = jobs.filter(j => j.status === "pending");
  const inProgress = jobs.filter(j => j.status === "in_progress");
  const done = jobs.filter(j => j.status === "completed" || j.status === "cancelled");

  const sections = [
    { label: "In progress", items: inProgress, icon: <Clock size={13} className="text-blue-500" />, accent: "text-blue-600" },
    { label: "Pending", items: pending, icon: <Clock size={13} className="text-amber-500" />, accent: "text-amber-600" },
    { label: "Completed & cancelled", items: done, icon: <CheckCircle size={13} className="text-emerald-500" />, accent: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">My maintenance jobs</h2>
          <p className="page-sub">{jobs.length} jobs assigned to you</p>
        </div>
        {inProgress.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="status-dot-green" />
            <span className="text-xs font-semibold text-blue-700">{inProgress.length} in progress</span>
          </div>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <Wrench size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-600">No jobs assigned</p>
          <p className="text-slate-400 text-sm mt-1">Your admin will assign maintenance jobs here.</p>
        </div>
      ) : (
        <>
          {sections.map(section => section.items.length > 0 && (
            <div key={section.label} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                {section.icon}
                <h3 className={`text-xs font-bold uppercase tracking-wider ${section.accent}`}>
                  {section.label}
                </h3>
                <span className="text-xs text-slate-400 font-medium ml-1">({section.items.length})</span>
              </div>
              {section.items.map(j => {
                const vehicle = vehicles.find(v => v.vehicleId === j.vehicleId);
                return (
                  <div key={j.jobId} className="card-hover p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="font-bold text-slate-900">{j.title}</p>
                          <span className={`badge ${statusBadge(j.status)}`}>{j.status.replace("_", " ")}</span>
                        </div>
                        <p className="text-sm text-slate-500 mb-2.5 leading-relaxed">{j.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Car size={10} />
                            <span className="font-medium text-slate-600">
                              {vehicle ? `${vehicle.make} ${vehicle.model} — ${vehicle.plateNumber}` : "—"}
                            </span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Calendar size={10} />
                            <span className="font-medium text-slate-600">{new Date(j.scheduledAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                        {j.notes && (
                          <p className="mt-2 text-xs text-slate-400 italic bg-slate-50 rounded-lg px-2.5 py-1.5">
                            {j.notes}
                          </p>
                        )}
                      </div>
                      <button onClick={() => { setNoteJob(j); setNote(j.notes || ""); }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
                        title="Add note">
                        <MessageSquare size={13} />
                      </button>
                    </div>
                    {j.status !== "completed" && j.status !== "cancelled" && (
                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                        {STATUS_OPTIONS
                          .filter(s => s.value !== j.status && s.value !== "cancelled")
                          .map(s => (
                            <button key={s.value}
                              onClick={() => handleStatusChange(j.jobId, s.value)}
                              disabled={updating === j.jobId}
                              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200
                                         hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700
                                         transition-colors disabled:opacity-50 font-medium">
                              {updating === j.jobId
                                ? <span className="spinner border-slate-400 border-t-transparent !w-3.5 !h-3.5" />
                                : `Mark ${s.label.toLowerCase()}`}
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}

      {noteJob && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-md">
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Add note</h3>
                <p className="text-xs text-slate-400 mt-0.5">{noteJob.title}</p>
              </div>
              <button onClick={() => setNoteJob(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <textarea className="input resize-none" rows={4}
                placeholder="Describe what was done, parts used, observations…"
                value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button onClick={() => setNoteJob(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSaveNote} className="btn-primary flex-1" disabled={savingNote}>
                {savingNote && <span className="spinner border-white/60 border-t-transparent" />}
                {savingNote ? "Saving…" : "Save note"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
