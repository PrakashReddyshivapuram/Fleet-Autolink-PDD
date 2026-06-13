import { useState } from "react";
import { useTrips, useVehicles, useUsers } from "@/hooks/useFirestore";
import { Navigation, Car, Clock, Timer, CheckCircle, User, Filter } from "lucide-react";

function formatDuration(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function AdminTripHistory() {
  const { trips, loading } = useTrips();
  const { vehicles } = useVehicles();
  const { users: drivers } = useUsers("driver");
  const [filterVehicle, setFilterVehicle] = useState("all");

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  const completed  = trips.filter(t => t.status === "ended");
  const active     = trips.filter(t => t.status === "active");

  const durations = completed
    .filter(t => t.endedAt)
    .map(t => Math.round((new Date(t.endedAt!).getTime() - new Date(t.startedAt).getTime()) / 60000));
  const totalMinutes = durations.reduce((s, d) => s + d, 0);
  const avgMinutes   = durations.length ? Math.round(totalMinutes / durations.length) : 0;

  const vehiclesWithTrips = new Set(trips.map(t => t.vehicleId)).size;

  const displayed = filterVehicle === "all"
    ? trips
    : trips.filter(t => t.vehicleId === filterVehicle);

  const sorted = [...displayed].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Trip History</h1>
        <p className="text-sm text-slate-500 mt-1">{trips.length} total trips · {vehiclesWithTrips} vehicles operated</p>
      </div>

      {/* Active trip banner */}
      {active.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
          <p className="text-sm font-bold text-emerald-800">{active.length} trip{active.length > 1 ? "s" : ""} currently active</p>
          <span className="ml-auto text-xs text-emerald-600 font-medium">Live GPS tracking on</span>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: trips.length,      label: "Total trips",      sub: "all time",                color: "text-slate-900" },
          { value: active.length,     label: "Active now",       sub: "in progress",             color: active.length > 0 ? "text-emerald-600" : "text-slate-900" },
          { value: formatDuration(totalMinutes), label: "Total drive time", sub: `${completed.length} completed`, color: "text-blue-600" },
          { value: avgMinutes > 0 ? formatDuration(avgMinutes) : "—", label: "Avg. duration", sub: "per trip", color: "text-slate-900" },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
            <p className={`text-2xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Vehicle filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <Filter size={11} /> Filter
        </span>
        <button onClick={() => setFilterVehicle("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            filterVehicle === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}>
          All vehicles
        </button>
        {vehicles.filter(v => trips.some(t => t.vehicleId === v.vehicleId)).map(v => (
          <button key={v.vehicleId} onClick={() => setFilterVehicle(v.vehicleId)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filterVehicle === v.vehicleId
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}>
            {v.make} {v.model}
          </button>
        ))}
      </div>

      {/* Trip list */}
      {trips.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Navigation size={24} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700">No trips recorded yet</p>
          <p className="text-slate-400 text-sm mt-1.5">Trips appear here when drivers start them from the app.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
          {sorted.map(t => {
            const vehicle = vehicles.find(v => v.vehicleId === t.vehicleId);
            const driver  = drivers.find(u => u.uid === t.driverId);
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
                    ? <Navigation size={15} className="text-emerald-600 animate-pulse" />
                    : <CheckCircle size={15} className="text-slate-400" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown vehicle"}
                    {vehicle?.plateNumber && (
                      <span className="text-xs font-mono text-slate-400 ml-2">{vehicle.plateNumber}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {driver && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <User size={10} /> {driver.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Car size={10} />
                      {startDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      {" · "}
                      {startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {duration !== null && (
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                      <Timer size={11} />
                      <span className="font-medium">{formatDuration(duration)}</span>
                    </span>
                  )}
                  {isActive && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock size={11} />
                      <span className="text-emerald-600 font-medium">ongoing</span>
                    </span>
                  )}
                  <span className={`badge text-[10px] ${isActive ? "badge-green" : "badge-gray"}`}>
                    {isActive ? "active" : "ended"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
