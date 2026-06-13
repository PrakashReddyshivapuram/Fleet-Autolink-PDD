import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVehicles, useJobs, useUsers } from "@/hooks/useFirestore";
import { Car, Wrench, ChevronDown, ChevronUp, User, Phone } from "lucide-react";

export default function OwnerVehicles() {
  const { appUser } = useAuth();
  const { vehicles, loading } = useVehicles(appUser?.uid);
  const { jobs } = useJobs();
  const { users: drivers } = useUsers("driver");
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">My vehicles</h2>
          <p className="page-sub">{vehicles.length} vehicles registered to you</p>
        </div>
      </div>

      {vehicles.length === 0 ? (
        <div className="card p-12 text-center">
          <Car size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="font-semibold text-slate-700">No vehicles yet</p>
          <p className="text-slate-400 text-sm mt-1">Ask your admin to register vehicles under your account.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map(v => {
            const vehicleJobs = jobs.filter(j => j.vehicleId === v.vehicleId);
            const driver = drivers.find(d => d.uid === v.assignedDriverId);
            const isOpen = expanded === v.vehicleId;
            const openJobs = vehicleJobs.filter(j => j.status === "pending" || j.status === "in_progress").length;

            return (
              <div key={v.vehicleId} className="card overflow-hidden">
                <button
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : v.vehicleId)}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                      <Car size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">
                        {v.make} {v.model}
                        <span className="text-slate-400 font-normal ml-1 text-sm">({v.year})</span>
                      </p>
                      <p className="text-sm text-slate-400 font-mono mt-0.5">{v.plateNumber} · {v.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {openJobs > 0 && (
                      <span className="badge badge-yellow">{openJobs} open job{openJobs > 1 ? "s" : ""}</span>
                    )}
                    <span className={`badge ${
                      v.status === "active" ? "badge-green" :
                      v.status === "maintenance" ? "badge-yellow" :
                      v.status === "idle" ? "badge-blue" : "badge-gray"
                    }`}>{v.status}</span>
                    {isOpen
                      ? <ChevronUp size={15} className="text-slate-400" />
                      : <ChevronDown size={15} className="text-slate-400" />
                    }
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 p-5 bg-slate-50/60 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                      <div className="card p-4">
                        <p className="section-label">Assigned driver</p>
                        {driver ? (
                          <div className="flex items-center gap-3 mt-1">
                            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700">
                              {driver.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{driver.name}</p>
                              {driver.phone && (
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                  <Phone size={9} /> {driver.phone}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1">
                            <User size={13} /> Not assigned
                          </p>
                        )}
                      </div>
                      <div className="card p-4">
                        <p className="section-label">Maintenance records</p>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">{vehicleJobs.length}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{openJobs} currently open</p>
                      </div>
                    </div>

                    <div>
                      <p className="section-label">Maintenance history</p>
                      {vehicleJobs.length === 0 ? (
                        <p className="text-sm text-slate-400 py-3">No maintenance records for this vehicle.</p>
                      ) : (
                        <div className="space-y-2">
                          {vehicleJobs.map(j => (
                            <div key={j.jobId}
                              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                              <div className="flex items-center gap-2.5">
                                <Wrench size={12} className="text-slate-300 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">{j.title}</p>
                                  <p className="text-xs text-slate-400">{new Date(j.scheduledAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <span className={`badge flex-shrink-0 ${
                                j.status === "completed" ? "badge-green" :
                                j.status === "in_progress" ? "badge-blue" :
                                j.status === "pending" ? "badge-yellow" : "badge-gray"
                              }`}>{j.status.replace("_", " ")}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
