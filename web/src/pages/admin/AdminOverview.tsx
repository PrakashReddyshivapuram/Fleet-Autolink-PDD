import { useVehicles, useJobs, useUsers } from "@/hooks/useFirestore";
import { ArrowRight, AlertTriangle, Radio } from "lucide-react";

interface Props { onNavigate: (tab: string) => void; }

export default function AdminOverview({ onNavigate }: Props) {
  const { vehicles } = useVehicles();
  const { jobs } = useJobs();
  const { users } = useUsers();

  const activeVehicles     = vehicles.filter(v => v.status === "active").length;
  const maintenanceVehicles= vehicles.filter(v => v.status === "maintenance").length;
  const idleVehicles       = vehicles.filter(v => v.status === "idle").length;
  const pendingJobs        = jobs.filter(j => j.status === "pending").length;
  const inProgressJobs     = jobs.filter(j => j.status === "in_progress").length;
  const completedJobs      = jobs.filter(j => j.status === "completed").length;
  const criticalJobs       = jobs.filter(j => j.priority === "critical" && j.status !== "completed").length;
  const drivers            = users.filter(u => u.role === "driver").length;

  const recentVehicles = vehicles.slice(0, 7);
  const urgentJobs = [...jobs]
    .filter(j => j.status !== "completed" && j.status !== "cancelled")
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.priority ?? "medium"] ?? 2) - (order[b.priority ?? "medium"] ?? 2);
    })
    .slice(0, 6);

  const utilizationPct = vehicles.length ? Math.round((activeVehicles / vehicles.length) * 100) : 0;

  return (
    <div className="animate-fade-in">

      {/* ── Page header ─────────────────────────────────────── */}
      <div className="flex items-end justify-between pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Fleet AutoLink</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Overview</h1>
        </div>
        <div className="flex items-center gap-3 mb-0.5">
          {criticalJobs > 0 && (
            <button onClick={() => onNavigate("jobs")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors">
              <AlertTriangle size={11} /> {criticalJobs} critical
            </button>
          )}
          <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <Radio size={11} className="animate-pulse" /> Live
          </div>
        </div>
      </div>

      {/* ── KPI strip — big numbers, no cards ────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        {[
          { value: vehicles.length, label: "Vehicles", sub: `${utilizationPct}% active`, tab: "vehicles" },
          { value: users.length,    label: "Team",     sub: `${drivers} drivers`, tab: "users" },
          { value: pendingJobs + inProgressJobs, label: "Open jobs", sub: `${inProgressJobs} in progress`, tab: "jobs" },
          { value: completedJobs,   label: "Resolved", sub: `${jobs.length} total`, tab: "jobs" },
        ].map((k, i) => (
          <button key={k.label} onClick={() => onNavigate(k.tab)}
            className="group flex flex-col px-6 py-5 text-left hover:bg-slate-50/70 transition-colors">
            <span className="text-4xl font-extrabold text-slate-900 tabular-nums leading-none group-hover:text-brand-700 transition-colors">
              {k.value}
            </span>
            <span className="text-sm font-semibold text-slate-700 mt-2">{k.label}</span>
            <span className="text-xs text-slate-400 mt-0.5">{k.sub}</span>
            {i === 0 && vehicles.length > 0 && (
              <div className="mt-3 h-1 rounded-full bg-slate-100 w-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${utilizationPct}%` }} />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* ── Body — two columns, no card containers ─────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 mt-0">

        {/* Vehicles — wider column */}
        <div className="lg:col-span-3 py-6 lg:pr-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Fleet vehicles</h2>
            <button onClick={() => onNavigate("vehicles")}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              Manage <ArrowRight size={11} />
            </button>
          </div>

          {vehicles.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No vehicles yet.</p>
              <button onClick={() => onNavigate("vehicles")} className="btn-primary mt-3 text-xs px-3 h-8">
                Add first vehicle
              </button>
            </div>
          ) : (
            <div>
              {recentVehicles.map((v, i) => (
                <div key={v.vehicleId}
                  className={`flex items-center justify-between py-3 ${i < recentVehicles.length - 1 ? "border-b border-slate-50" : ""} hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      v.status === "active" ? "bg-emerald-500" :
                      v.status === "maintenance" ? "bg-amber-400" : "bg-slate-300"
                    }`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {v.make} {v.model}
                        {v.year && <span className="text-slate-400 font-normal ml-1.5 text-xs">{v.year}</span>}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{v.plateNumber}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    v.status === "active" ? "badge-green" :
                    v.status === "maintenance" ? "badge-yellow" :
                    v.status === "idle" ? "badge-blue" : "badge-gray"
                  }`}>{v.status}</span>
                </div>
              ))}
              {vehicles.length > 7 && (
                <button onClick={() => onNavigate("vehicles")}
                  className="text-xs text-slate-400 hover:text-brand-600 transition-colors mt-2 font-medium">
                  +{vehicles.length - 7} more
                </button>
              )}
            </div>
          )}

          {/* Fleet health bar */}
          {vehicles.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet health</p>
                <p className="text-xs text-slate-400">{vehicles.length} total</p>
              </div>
              <div className="h-2.5 rounded-full overflow-hidden flex gap-px bg-slate-100">
                {activeVehicles > 0 && (
                  <div className="bg-emerald-500 h-full"
                    style={{ width: `${(activeVehicles / vehicles.length) * 100}%` }} />
                )}
                {maintenanceVehicles > 0 && (
                  <div className="bg-amber-400 h-full"
                    style={{ width: `${(maintenanceVehicles / vehicles.length) * 100}%` }} />
                )}
                {idleVehicles > 0 && (
                  <div className="bg-slate-300 h-full"
                    style={{ width: `${(idleVehicles / vehicles.length) * 100}%` }} />
                )}
              </div>
              <div className="flex gap-5 mt-2.5">
                {[
                  { label: "Active", n: activeVehicles, dot: "bg-emerald-500" },
                  { label: "Maintenance", n: maintenanceVehicles, dot: "bg-amber-400" },
                  { label: "Idle", n: idleVehicles, dot: "bg-slate-300" },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                    <span className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700">{item.n}</span> {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Jobs — narrower column */}
        <div className="lg:col-span-2 py-6 lg:pl-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Job queue</h2>
            <button onClick={() => onNavigate("jobs")}
              className="flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
              All jobs <ArrowRight size={11} />
            </button>
          </div>

          {/* Mini counts */}
          {jobs.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Pending", n: pendingJobs, color: "text-amber-600 bg-amber-50" },
                { label: "Active",  n: inProgressJobs, color: "text-blue-600 bg-blue-50" },
                { label: "Done",    n: completedJobs, color: "text-emerald-600 bg-emerald-50" },
              ].map(s => (
                <div key={s.label} className={`rounded-xl px-3 py-2.5 ${s.color.split(" ")[1]}`}>
                  <p className={`text-xl font-extrabold tabular-nums ${s.color.split(" ")[0]}`}>{s.n}</p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {urgentJobs.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-400">No open jobs.</p>
              <button onClick={() => onNavigate("jobs")} className="btn-primary mt-3 text-xs px-3 h-8">
                Create job
              </button>
            </div>
          ) : (
            <div>
              {urgentJobs.map((j, i) => (
                <div key={j.jobId}
                  className={`py-2.5 ${i < urgentJobs.length - 1 ? "border-b border-slate-50" : ""}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1 flex-1">{j.title}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {j.priority === "critical" && (
                        <span className="badge badge-red text-[10px]">
                          <AlertTriangle size={8} /> critical
                        </span>
                      )}
                      {j.priority === "high" && (
                        <span className="badge badge-yellow text-[10px]">high</span>
                      )}
                      <span className={`badge text-[10px] ${
                        j.status === "in_progress" ? "badge-blue" : "badge-yellow"
                      }`}>{j.status.replace("_", " ")}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(j.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
