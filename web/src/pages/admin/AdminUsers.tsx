import { useUsers, useVehicles } from "@/hooks/useFirestore";
import { Users, Shield, Car, Wrench, User, AlertCircle, UserCheck, Clock } from "lucide-react";
import { UserRole } from "@/types";

const ROLE_BADGES: Record<UserRole, string> = {
  admin:    "badge-purple",
  owner:    "badge-blue",
  driver:   "badge-green",
  mechanic: "badge-yellow",
};

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin:    <Shield size={12} />,
  owner:    <Car size={12} />,
  driver:   <User size={12} />,
  mechanic: <Wrench size={12} />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  admin:    "bg-violet-50 text-violet-700",
  owner:    "bg-blue-50 text-blue-700",
  driver:   "bg-emerald-50 text-emerald-700",
  mechanic: "bg-amber-50 text-amber-700",
};

export default function AdminUsers() {
  const { users, loading } = useUsers();
  const { vehicles }       = useVehicles();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  const byRole = (role: UserRole) => users.filter(u => u.role === role);

  const drivers = byRole("driver");
  const assignedDriverIds = new Set(vehicles.map(v => v.assignedDriverId).filter(Boolean));
  const unassignedDrivers = drivers.filter(d => !assignedDriverIds.has(d.uid));
  const assignedDrivers   = drivers.filter(d =>  assignedDriverIds.has(d.uid));

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentJoins  = [...users]
    .filter(u => new Date(u.createdAt) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const allSorted = [...users].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Users</h1>
        <p className="text-sm text-slate-500 mt-1">{users.length} registered accounts across {vehicles.length} vehicles</p>
      </div>

      {/* Unassigned drivers alert */}
      {unassignedDrivers.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">
              {unassignedDrivers.length} driver{unassignedDrivers.length > 1 ? "s" : ""} not assigned to any vehicle
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {unassignedDrivers.map(d => d.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {(["admin", "owner", "driver", "mechanic"] as UserRole[]).map(role => (
          <div key={role} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
            <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg mb-2 ${ROLE_COLORS[role]}`}>
              {ROLE_ICONS[role]}
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tabular-nums leading-none">{byRole(role).length}</p>
            <p className="text-xs font-semibold text-slate-700 mt-1.5 capitalize">{role}s</p>
          </div>
        ))}
      </div>

      {/* Insights row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <UserCheck size={15} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{assignedDrivers.length} drivers deployed</p>
            <p className="text-[10px] text-slate-400 mt-0.5">assigned to vehicles</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            unassignedDrivers.length > 0 ? "bg-amber-50" : "bg-slate-50"
          }`}>
            <AlertCircle size={15} className={unassignedDrivers.length > 0 ? "text-amber-500" : "text-slate-400"} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{unassignedDrivers.length} unassigned</p>
            <p className="text-[10px] text-slate-400 mt-0.5">drivers without a vehicle</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock size={15} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">{recentJoins.length} joined this week</p>
            <p className="text-[10px] text-slate-400 mt-0.5">new accounts in 7 days</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      {users.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700">No users yet</p>
          <p className="text-slate-400 text-sm mt-1.5">Users appear here after they register.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left: recent joins + coverage */}
          <div className="lg:col-span-2 space-y-4">

            {/* Driver coverage */}
            {drivers.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Driver coverage</p>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {drivers.length ? Math.round((assignedDrivers.length / drivers.length) * 100) : 0}%
                  </span>
                  <span className="text-xs text-slate-400 pb-1">deployed</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${drivers.length ? (assignedDrivers.length / drivers.length) * 100 : 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {assignedDrivers.length} of {drivers.length} drivers assigned
                </p>
              </div>
            )}

            {/* Recent joins */}
            {recentJoins.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Joined this week</p>
                <div className="space-y-3">
                  {recentJoins.map(u => (
                    <div key={u.uid} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-700 flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.email}</p>
                      </div>
                      <span className={`badge text-[10px] ${ROLE_BADGES[u.role]}`}>{u.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unassigned drivers list */}
            {unassignedDrivers.length > 0 && (
              <div className="bg-white border border-amber-100 rounded-xl p-5">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">Unassigned drivers</p>
                <div className="space-y-2">
                  {unassignedDrivers.map(d => (
                    <div key={d.uid} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-[11px] font-bold text-amber-700 flex-shrink-0">
                        {d.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{d.name}</p>
                      </div>
                      <span className="text-[10px] text-amber-500 font-medium">no vehicle</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: full user table */}
          <div className="lg:col-span-3">
            <h2 className="text-sm font-bold text-slate-900 mb-3">All users</h2>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Name", "Role", "Phone", "Joined"].map(h => (
                      <th key={h} className="th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allSorted.map(u => (
                    <tr key={u.uid} className="tr-hover">
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-bold text-brand-700 flex-shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="td">
                        <span className={`badge text-[10px] flex items-center gap-1 w-fit ${ROLE_BADGES[u.role]}`}>
                          {ROLE_ICONS[u.role]} {u.role}
                        </span>
                      </td>
                      <td className="td text-xs text-slate-500">{u.phone || "—"}</td>
                      <td className="td text-[11px] text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
