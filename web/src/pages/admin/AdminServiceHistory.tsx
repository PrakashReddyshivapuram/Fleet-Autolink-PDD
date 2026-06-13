import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVehicles } from "@/hooks/useFirestore";
import { useServiceRecords } from "@/hooks/useFirestore";
import { BookOpen, Plus, X, Car, DollarSign, Gauge, Building2, Calendar } from "lucide-react";

export default function AdminServiceHistory() {
  const { appUser } = useAuth();
  const { vehicles } = useVehicles();
  const { records, loading, addRecord } = useServiceRecords();

  const [filterVehicle, setFilterVehicle] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vehicleId: "", title: "", description: "",
    serviceDate: new Date().toISOString().split("T")[0],
    cost: "", odometer: "", provider: "",
  });

  const displayed = filterVehicle === "all"
    ? records
    : records.filter(r => r.vehicleId === filterVehicle);

  const sorted = [...displayed].sort(
    (a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
  );

  const totalCost = records.reduce((s, r) => s + (r.cost ?? 0), 0);
  const vehiclesServiced = new Set(records.map(r => r.vehicleId)).size;

  const handleAdd = async () => {
    if (!form.vehicleId || !form.title || !appUser) return;
    setSaving(true);
    await addRecord({
      vehicleId: form.vehicleId,
      title: form.title,
      description: form.description || undefined,
      serviceDate: form.serviceDate,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      odometer: form.odometer ? parseInt(form.odometer) : undefined,
      provider: form.provider || undefined,
      loggedBy: appUser.uid,
    });
    setForm({ vehicleId: "", title: "", description: "", serviceDate: new Date().toISOString().split("T")[0], cost: "", odometer: "", provider: "" });
    setShowForm(false);
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <span className="spinner-brand" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Service History</h1>
          <p className="text-sm text-slate-500 mt-1">{records.length} service records · {vehicles.length} vehicles</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex-shrink-0">
          <Plus size={15} /> Log service
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: records.length,     label: "Total records",     color: "text-slate-900" },
          { value: vehiclesServiced,   label: "Vehicles serviced", color: "text-blue-600" },
          { value: `₹${totalCost.toLocaleString()}`, label: "Total spend",  color: "text-emerald-600" },
          { value: vehicles.length - vehiclesServiced, label: "Never serviced", color: (vehicles.length - vehiclesServiced) > 0 ? "text-amber-600" : "text-slate-900" },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white hover:bg-slate-50/60 transition-colors">
            <p className={`text-2xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
            <p className="text-xs font-semibold text-slate-700 mt-2">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-900">Log service manually</p>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Vehicle <span className="text-red-400">*</span></label>
              <select className="input" value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.vehicleId} value={v.vehicleId}>{v.make} {v.model} · {v.plateNumber}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Service title <span className="text-red-400">*</span></label>
              <input className="input" placeholder="e.g. Full oil change + filter"
                value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="Details about what was done…"
                value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label className="label">Service date</label>
              <input type="date" className="input"
                value={form.serviceDate} onChange={e => setForm(f => ({ ...f, serviceDate: e.target.value }))} />
            </div>
            <div>
              <label className="label">Service provider</label>
              <input className="input" placeholder="Mechanic / garage name"
                value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cost (₹) <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="number" className="input" placeholder="0"
                value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
            </div>
            <div>
              <label className="label">Odometer (km) <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="number" className="input" placeholder="Current km reading"
                value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAdd} disabled={!form.vehicleId || !form.title || saving} className="btn-primary">
              {saving ? "Saving…" : "Save record"}
            </button>
          </div>
        </div>
      )}

      {/* Filter by vehicle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setFilterVehicle("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            filterVehicle === "all"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}>
          All vehicles
        </button>
        {vehicles.map(v => (
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

      {/* Records */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={24} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700">No service records yet</p>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
            Log your first service to start building a history for your fleet.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-50">
          {sorted.map(r => {
            const vehicle = vehicles.find(v => v.vehicleId === r.vehicleId);
            return (
              <div key={r.recordId} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <Car size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-900">{r.title}</p>
                      <span className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                        <Calendar size={10} />
                        {new Date(r.serviceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <p className="text-xs text-brand-600 font-semibold mt-0.5">
                      {vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.plateNumber}` : "Unknown vehicle"}
                    </p>
                    {r.description && <p className="text-xs text-slate-500 mt-1">{r.description}</p>}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      {r.provider && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Building2 size={10} /> {r.provider}
                        </span>
                      )}
                      {r.cost !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-semibold">
                          <DollarSign size={10} /> ₹{r.cost.toLocaleString()}
                        </span>
                      )}
                      {r.odometer !== undefined && (
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Gauge size={10} /> {r.odometer.toLocaleString()} km
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
