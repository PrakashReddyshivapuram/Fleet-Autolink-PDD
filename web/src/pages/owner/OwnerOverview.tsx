import { useAuth } from "@/context/AuthContext";
import { useVehicles, useJobs, useUsers } from "@/hooks/useFirestore";
import { Car, Wrench, AlertTriangle, CheckCircle, User, TrendingUp, Clock } from "lucide-react";

interface Props { onNavigate: (tab: string) => void; }

export default function OwnerOverview({ onNavigate }: Props) {
  const { appUser } = useAuth();
  const { vehicles, loading } = useVehicles(appUser?.uid);
  const { jobs } = useJobs();
  const { users: drivers } = useUsers("driver");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  // All jobs for owner's vehicles
  const myVehicleIds = new Set(vehicles.map(v => v.vehicleId));
  const myJobs = jobs.filter(j => myVehicleIds.has(j.vehicleId));

  const activeVehicles      = vehicles.filter(v => v.status === "active").length;
  const maintenanceVehicles = vehicles.filter(v => v.status === "maintenance").length;
  const idleVehicles        = vehicles.filter(v => v.status === "idle").length;

  const openJobs      = myJobs.filter(j => j.status === "pending" || j.status === "in_progress");
  const criticalJobs  = openJobs.filter(j => j.priority === "critical" || j.priority === "high");
  const completedJobs = myJobs.filter(j => j.status === "completed");

  const unassignedVehicles = vehicles.filter(v => !v.assignedDriverId);

  const now = new Date();
  const overdueJobs = openJobs.filter(j => new Date(j.scheduledAt) < now);

  // Vehicle with most open issues
  const vehicleByIssues = vehicles
    .map(v => ({
      vehicle: v,
      open: myJobs.filter(j => j.vehicleId === v.vehicleId && (j.status === "pending" || j.status === "in_progress")).length,
    }))
    .filter(x => x.open > 0)
    .sort((a, b) => b.open - a.open);

  const recentActivity = [...myJobs]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Owner</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
          Fleet overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">{vehicles.length} vehicles · {myJobs.length} maintenance records</p>
      </div>

      {/* Critical alert */}
      {(criticalJobs.length > 0 || overdueJobs.length > 0) && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Attention needed</p>
            <p className="text-xs text-amber-600 mt-0.5 leading-relaxed">
              {criticalJobs.length > 0 && `${criticalJobs.length} high/critical priority job${criticalJobs.length > 1 ? "s" : ""} open. `}
              {overdueJobs.length > 0 && `${overdueJobs.length} job${overdueJobs.length > 1 ? "s" : ""} past scheduled date.`}
            </p>
          </div>
          <button onClick={() => onNavigate("vehicles")}
            className="text-xs font-bold text-amber-700 hover:text-amber-900 flex-shrink-0">
            View →
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: vehicles.length,   label: "My vehicles",  sub: `${activeVehicles} active`,  color: "text-slate-900" },
          { value: openJobs.length,   label: "Open jobs",    sub: `${criticalJobs.length} critical`, color: openJobs.length > 0 ? "text-amber-600" : "text-slate-900" },
          { value: completedJobs.length, label: "Jobs done", sub: `of ${myJobs.length} total`, color: "text-emerald-600" },
          { value: unassignedVehicles.length, label: "Unassigned",  sub: "vehicles without driver", color: unassignedVehicles.length > 0 ? "text-red-500" : "text-slate-900" },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
            <p className={`text-3xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Fleet health + vehicle insights */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: fleet status + unassigned */}
        <div className="lg:col-span-2 space-y-4">

          {/* Fleet health bar */}
          {vehicles.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-brand-500" />
                <span className="text-xs font-bold text-slate-700">Fleet health</span>
              </div>
              <div className="h-3 rounded-full overflow-hidden flex gap-px bg-slate-100">
                {activeVehicles > 0 && (
                  <div className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${(activeVehicles / vehicles.length) * 100}%` }} />
                )}
                {maintenanceVehicles > 0 && (
                  <div className="bg-amber-400 h-full transition-all"
                    style={{ width: `${(maintenanceVehicles / vehicles.length) * 100}%` }} />
                )}
                {idleVehicles > 0 && (
                  <div className="bg-slate-300 h-full transition-all"
                    style={{ width: `${(idleVehicles / vehicles.length) * 100}%` }} />
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { label: "Active", n: activeVehicles, dot: "bg-emerald-500" },
                  { label: "Maintenance", n: maintenanceVehicles, dot: "bg-amber-400" },
                  { label: "Idle", n: idleVehicles, dot: "bg-slate-300" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span className="text-xs text-slate-500">
                      <span className="font-bold text-slate-700">{item.n}</span> {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicles needing attention */}
          {vehicleByIssues.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Needs attention</p>
              <div className="space-y-3">
                {vehicleByIssues.slice(0, 4).map(({ vehicle, open }) => (
                  <div key={vehicle.vehicleId} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Car size={14} className="text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{vehicle.make} {vehicle.model}</p>
                      <p className="text-[10px] font-mono text-slate-400">{vehicle.plateNumber}</p>
                    </div>
                    <span className="badge badge-yellow text-[10px] flex-shrink-0">{open} open</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unassigned drivers */}
          {unassignedVehicles.length > 0 && (
            <div className="bg-white border border-red-100 rounded-xl p-5">
              <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-3">No driver assigned</p>
              <div className="space-y-2">
                {unassignedVehicles.slice(0, 3).map(v => (
                  <div key={v.vehicleId} className="flex items-center gap-2.5 text-sm">
                    <User size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-slate-700 font-medium">{v.make} {v.model}</span>
                    <span className="text-xs font-mono text-slate-400 ml-auto">{v.plateNumber}</span>
                  </div>
                ))}
              </div>
              {unassignedVehicles.length > 3 && (
                <p className="text-[10px] text-slate-400 mt-2">+{unassignedVehicles.length - 3} more</p>
              )}
            </div>
          )}
        </div>

        {/* Right: vehicle list + recent activity */}
        <div className="lg:col-span-3 space-y-5">

          {/* All vehicles quick view */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Your vehicles</h2>
              <button onClick={() => onNavigate("vehicles")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                Manage →
              </button>
            </div>

            {vehicles.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                <Car size={28} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold text-slate-600">No vehicles yet</p>
                <p className="text-xs text-slate-400 mt-1">Ask your admin to register vehicles under your account.</p>
              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
                {vehicles.map(v => {
                  const vehicleJobs = myJobs.filter(j => j.vehicleId === v.vehicleId);
                  const openCount = vehicleJobs.filter(j => j.status === "pending" || j.status === "in_progress").length;
                  const driver = drivers.find(d => d.uid === v.assignedDriverId);
                  return (
                    <div key={v.vehicleId} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        v.status === "active" ? "bg-emerald-500" :
                        v.status === "maintenance" ? "bg-amber-400" : "bg-slate-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{v.make} {v.model}
                          <span className="text-slate-400 font-normal text-xs ml-1.5">{v.year}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{v.plateNumber}
                          {driver && <span className="ml-2 font-sans not-italic">· {driver.name}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {openCount > 0 && (
                          <span className="badge badge-yellow text-[10px]">{openCount} job{openCount > 1 ? "s" : ""}</span>
                        )}
                        <span className={`badge text-[10px] ${
                          v.status === "active" ? "badge-green" :
                          v.status === "maintenance" ? "badge-yellow" : "badge-gray"
                        }`}>{v.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent maintenance activity */}
          {recentActivity.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Recent maintenance activity</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
                {recentActivity.map(j => {
                  const vehicle = vehicles.find(v => v.vehicleId === j.vehicleId);
                  return (
                    <div key={j.jobId} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        j.status === "completed" ? "bg-emerald-50" :
                        j.status === "in_progress" ? "bg-blue-50" : "bg-amber-50"
                      }`}>
                        {j.status === "completed"
                          ? <CheckCircle size={13} className="text-emerald-600" />
                          : j.status === "in_progress"
                          ? <Clock size={13} className="text-blue-600" />
                          : <Wrench size={13} className="text-amber-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{j.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {vehicle ? `${vehicle.make} ${vehicle.model} · ` : ""}
                          {new Date(j.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className={`badge text-[10px] flex-shrink-0 ${
                        j.status === "completed" ? "badge-green" :
                        j.status === "in_progress" ? "badge-blue" :
                        j.status === "pending" ? "badge-yellow" : "badge-gray"
                      }`}>{j.status.replace("_", " ")}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
