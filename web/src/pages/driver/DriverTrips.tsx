import { useAuth } from "@/context/AuthContext";
import { useTrips, useVehicles } from "@/hooks/useFirestore";
import { Navigation, Clock, CheckCircle, Timer, TrendingUp, Calendar, Zap } from "lucide-react";

export default function DriverTrips() {
  const { appUser } = useAuth();
  const { trips, loading } = useTrips(appUser?.uid);
  const { vehicles } = useVehicles();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  const now = new Date();
  const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sorted = [...trips].sort((a, b) =>
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  const activeTrips    = trips.filter(t => t.status === "active");
  const completedTrips = trips.filter(t => t.status === "ended");
  const thisWeek       = completedTrips.filter(t => new Date(t.startedAt) >= startOfWeek);
  const thisMonth      = completedTrips.filter(t => new Date(t.startedAt) >= startOfMonth);

  const durations = completedTrips
    .filter(t => t.endedAt)
    .map(t => Math.round((new Date(t.endedAt!).getTime() - new Date(t.startedAt).getTime()) / 60000));

  const totalMinutes   = durations.reduce((s, d) => s + d, 0);
  const avgMinutes     = durations.length ? Math.round(totalMinutes / durations.length) : 0;
  const longestMinutes = durations.length ? Math.max(...durations) : 0;

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Trip history</h1>
        <p className="text-sm text-slate-500 mt-1">{trips.length} total trips recorded</p>
      </div>

      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Navigation size={24} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700">No trips yet</p>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
            Start your first trip from the <span className="font-semibold">My vehicle</span> tab.
          </p>
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {[
              {
                value: activeTrips.length,
                label: "Active now",
                sub: "in progress",
                color: activeTrips.length > 0 ? "text-emerald-600" : "text-slate-900"
              },
              {
                value: thisWeek.length,
                label: "This week",
                sub: `${thisMonth.length} this month`,
                color: "text-blue-600"
              },
              {
                value: avgMinutes > 0 ? formatDuration(avgMinutes) : "—",
                label: "Avg. duration",
                sub: "per completed trip",
                color: "text-slate-900"
              },
              {
                value: formatDuration(totalMinutes),
                label: "Total drive time",
                sub: `${completedTrips.length} completed`,
                color: "text-brand-700"
              },
            ].map(k => (
              <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
                <p className={`text-2xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
                <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Insight cards */}
          {completedTrips.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{thisWeek.length} trips this week</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{thisMonth.length} this month</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <Zap size={15} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Longest: {formatDuration(longestMinutes)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">single trip record</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <TrendingUp size={15} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{formatDuration(totalMinutes)} total</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">cumulative drive time</p>
                </div>
              </div>
            </div>
          )}

          {/* Active trip banner */}
          {activeTrips.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <p className="text-sm font-bold text-emerald-800">
                {activeTrips.length} trip{activeTrips.length > 1 ? "s" : ""} currently active
              </p>
              <span className="ml-auto text-xs text-emerald-600 font-medium">GPS sharing on</span>
            </div>
          )}

          {/* Trip list */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3">All trips</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
              {sorted.map(t => {
                const vehicle = vehicles.find(v => v.vehicleId === t.vehicleId);
                const duration = t.endedAt
                  ? Math.round((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 60000)
                  : null;
                const isActive = t.status === "active";
                const startDate = new Date(t.startedAt);

                return (
                  <div key={t.tripId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isActive ? "bg-emerald-100" : "bg-slate-100"
                    }`}>
                      {isActive
                        ? <Clock size={15} className="text-emerald-600 animate-pulse" />
                        : <CheckCircle size={15} className="text-slate-400" />
                      }
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown vehicle"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        {" · "}
                        {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {duration !== null && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Timer size={11} />
                          <span className="font-medium">{formatDuration(duration)}</span>
                        </div>
                      )}
                      <span className={`badge text-[10px] ${isActive ? "badge-green" : "badge-gray"}`}>
                        {isActive ? "active" : "ended"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
