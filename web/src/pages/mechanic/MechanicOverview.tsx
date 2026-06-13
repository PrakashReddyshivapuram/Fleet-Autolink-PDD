import { useAuth } from "@/context/AuthContext";
import { useJobs, useVehicles } from "@/hooks/useFirestore";
import { CheckCircle, Clock, AlertTriangle, Wrench, TrendingUp, Calendar, Car } from "lucide-react";

interface Props { onNavigate: (tab: string) => void; }

export default function MechanicOverview({ onNavigate }: Props) {
  const { appUser } = useAuth();
  const { jobs, loading } = useJobs(appUser?.uid);
  const { vehicles } = useVehicles();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());

  const pending     = jobs.filter(j => j.status === "pending");
  const inProgress  = jobs.filter(j => j.status === "in_progress");
  const completed   = jobs.filter(j => j.status === "completed");
  const doneThisMonth = completed.filter(j => j.completedAt && new Date(j.completedAt) >= startOfMonth);
  const doneThisWeek  = completed.filter(j => j.completedAt && new Date(j.completedAt) >= startOfWeek);

  const overdue = jobs.filter(j =>
    (j.status === "pending" || j.status === "in_progress") &&
    new Date(j.scheduledAt) < now
  );

  const completionRate = jobs.length > 0
    ? Math.round((completed.length / jobs.length) * 100)
    : 0;

  const avgDaysToComplete = (() => {
    const timed = completed.filter(j => j.completedAt);
    if (!timed.length) return null;
    const total = timed.reduce((sum, j) => {
      const diff = new Date(j.completedAt!).getTime() - new Date(j.scheduledAt).getTime();
      return sum + diff / (1000 * 60 * 60 * 24);
    }, 0);
    return Math.round(total / timed.length);
  })();

  const recentCompleted = [...completed]
    .sort((a, b) => new Date(b.completedAt ?? b.scheduledAt).getTime() - new Date(a.completedAt ?? a.scheduledAt).getTime())
    .slice(0, 5);

  const urgentNext = [...pending, ...inProgress]
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 4);

  return (
    <div className="animate-fade-in space-y-6">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mechanic</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
          {appUser?.name?.split(" ")[0] ?? "Your"}'s dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">{jobs.length} jobs assigned · {inProgress.length} currently active</p>
      </div>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-700">
              {overdue.length} overdue job{overdue.length > 1 ? "s" : ""} need attention
            </p>
            <p className="text-xs text-red-500 mt-0.5">
              {overdue.map(j => j.title).join(" · ")}
            </p>
          </div>
          <button onClick={() => onNavigate("jobs")}
            className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors flex-shrink-0">
            View →
          </button>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: inProgress.length, label: "In progress", sub: "currently active", color: "text-blue-600" },
          { value: pending.length,    label: "Pending",      sub: "waiting to start",  color: "text-amber-600" },
          { value: doneThisMonth.length, label: "Done this month", sub: `${doneThisWeek.length} this week`, color: "text-emerald-600" },
          { value: completed.length,  label: "Total resolved", sub: `of ${jobs.length} assigned`, color: "text-slate-800" },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
            <p className={`text-3xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Performance + upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: performance */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold text-slate-900">Your performance</h2>

          {/* Completion rate */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-brand-500" />
                <span className="text-xs font-semibold text-slate-700">Completion rate</span>
              </div>
              <span className="text-lg font-extrabold text-slate-900 tabular-nums">{completionRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completionRate}%`,
                  background: completionRate >= 80 ? "#10b981" : completionRate >= 50 ? "#f59e0b" : "#ef4444"
                }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">
              {completed.length} completed of {jobs.length} total
            </p>
          </div>

          {/* Avg turnaround */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-700">Avg. turnaround</span>
            </div>
            {avgDaysToComplete !== null ? (
              <>
                <p className="text-3xl font-extrabold text-slate-900 tabular-nums">{avgDaysToComplete}<span className="text-sm font-medium text-slate-400 ml-1">days</span></p>
                <p className="text-[10px] text-slate-400 mt-1">from schedule date to completion</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Complete jobs to see your average</p>
            )}
          </div>

          {/* Workload summary */}
          {jobs.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Workload breakdown</p>
              <div className="space-y-2.5">
                {[
                  { label: "In progress", n: inProgress.length, color: "bg-blue-500" },
                  { label: "Pending",     n: pending.length,    color: "bg-amber-400" },
                  { label: "Completed",   n: completed.length,  color: "bg-emerald-500" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">{item.label}</span>
                      <span className="text-[11px] font-bold text-slate-700">{item.n}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color}`}
                        style={{ width: jobs.length ? `${(item.n / jobs.length) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: upcoming jobs + recent completions */}
        <div className="lg:col-span-3 space-y-5">

          {/* Upcoming / in-progress */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Up next</h2>
              <button onClick={() => onNavigate("jobs")}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors">
                All jobs →
              </button>
            </div>
            {urgentNext.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                <CheckCircle size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No pending or in-progress jobs.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentNext.map(j => {
                  const vehicle = vehicles.find(v => v.vehicleId === j.vehicleId);
                  const isOverdue = new Date(j.scheduledAt) < now;
                  const isActive = j.status === "in_progress";
                  return (
                    <div key={j.jobId}
                      className={`bg-white border rounded-xl p-4 flex items-start gap-3 ${isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-200"}`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-blue-100" : isOverdue ? "bg-red-100" : "bg-amber-100"
                      }`}>
                        <Wrench size={15} className={isActive ? "text-blue-600" : isOverdue ? "text-red-500" : "text-amber-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900">{j.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {vehicle && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Car size={10} /> {vehicle.make} {vehicle.model}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Calendar size={10} />
                            <span className={isOverdue ? "text-red-500 font-semibold" : ""}>
                              {isOverdue ? "Overdue · " : ""}{new Date(j.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        </div>
                      </div>
                      <span className={`badge text-[10px] flex-shrink-0 ${isActive ? "badge-blue" : isOverdue ? "badge-red" : "badge-yellow"}`}>
                        {isActive ? "active" : isOverdue ? "overdue" : "pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent completions */}
          {recentCompleted.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Recently completed</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
                {recentCompleted.map(j => {
                  const vehicle = vehicles.find(v => v.vehicleId === j.vehicleId);
                  return (
                    <div key={j.jobId} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{j.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {vehicle ? `${vehicle.make} ${vehicle.model} · ` : ""}
                          {j.completedAt ? new Date(j.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </p>
                      </div>
                      <span className="badge badge-green text-[10px]">done</span>
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
