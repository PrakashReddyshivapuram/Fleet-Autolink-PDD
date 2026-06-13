import { useState } from "react";
import { doc, collection, setDoc } from "firebase/firestore";
import { useVehicles, useUsers } from "@/hooks/useFirestore";
import { db } from "@/lib/firebase";
import { Vehicle, VehicleStatus, VehicleType } from "@/types";
import { Plus, Car, Pencil, Trash2, X, AlertTriangle } from "lucide-react";

const STATUS_OPTIONS: VehicleStatus[] = ["active", "maintenance", "idle", "retired"];
const TYPE_OPTIONS: VehicleType[] = ["car", "truck", "bike", "van", "other"];

const emptyForm = {
  make: "", model: "", year: "", plateNumber: "",
  type: "car" as VehicleType, status: "active" as VehicleStatus,
  ownerId: "", assignedDriverId: "",
};

const LoadingRow = () => (
  <div className="flex items-center justify-center h-64">
    <span className="spinner-brand" />
  </div>
);

export default function AdminVehicles() {
  const { vehicles, loading, updateVehicle, deleteVehicle } = useVehicles();
  const { users: owners } = useUsers("owner");
  const { users: drivers } = useUsers("driver");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (v: Vehicle) => {
    setEditing(v);
    setForm({
      make: v.make, model: v.model, year: v.year, plateNumber: v.plateNumber,
      type: v.type, status: v.status, ownerId: v.ownerId,
      assignedDriverId: v.assignedDriverId || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.make || !form.model || !form.plateNumber) return;
    setSaving(true);
    try {
      if (editing) {
        await updateVehicle(editing.vehicleId, form);
      } else {
        const ref = doc(collection(db, "vehicles"));
        await setDoc(ref, { ...form, vehicleId: ref.id, createdAt: new Date().toISOString() });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteVehicle(deleteTarget.vehicleId);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <LoadingRow />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="page-title">Vehicles</h2>
          <p className="page-sub">{vehicles.length} vehicles in fleet</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={15} /> Add vehicle
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="card p-12 text-center">
          <Car size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">No vehicles yet. Add your first vehicle.</p>
          <button onClick={openAdd} className="btn-primary mt-4 mx-auto">
            <Plus size={14} /> Add vehicle
          </button>
        </div>
      ) : (
        <div className="table-wrapper overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                {["Vehicle", "Plate", "Type", "Status", "Owner", "Driver", ""].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicles.map((v) => (
                <tr key={v.vehicleId} className="tr-hover">
                  <td className="td font-semibold text-slate-900">
                    {v.make} {v.model}
                    <span className="text-slate-400 font-normal ml-1 text-xs">({v.year})</span>
                  </td>
                  <td className="td font-mono text-slate-600 text-xs">{v.plateNumber}</td>
                  <td className="td capitalize text-slate-500">{v.type}</td>
                  <td className="td">
                    <span className={`badge ${
                      v.status === "active" ? "badge-green" :
                      v.status === "maintenance" ? "badge-yellow" :
                      v.status === "idle" ? "badge-blue" : "badge-gray"
                    }`}>{v.status}</span>
                  </td>
                  <td className="td text-slate-500">{owners.find(u => u.uid === v.ownerId)?.name || "—"}</td>
                  <td className="td text-slate-500">{drivers.find(u => u.uid === v.assignedDriverId)?.name || "—"}</td>
                  <td className="td">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(v)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleteTarget(v)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-lg">
            <div className="modal-header">
              <h3 className="modal-title">{editing ? "Edit vehicle" : "Add vehicle"}</h3>
              <button onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Make</label>
                  <input className="input" placeholder="Toyota"
                    value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} />
                </div>
                <div>
                  <label className="label">Model</label>
                  <input className="input" placeholder="Innova"
                    value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                </div>
                <div>
                  <label className="label">Year</label>
                  <input className="input" placeholder="2022"
                    value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
                </div>
                <div>
                  <label className="label">Plate number</label>
                  <input className="input" placeholder="TN01AB1234"
                    value={form.plateNumber} onChange={e => setForm({ ...form, plateNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as VehicleType })}>
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as VehicleStatus })}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Owner</label>
                  <select className="input" value={form.ownerId}
                    onChange={e => setForm({ ...form, ownerId: e.target.value })}>
                    <option value="">Select owner</option>
                    {owners.map(o => <option key={o.uid} value={o.uid}>{o.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Assigned driver</label>
                  <select className="input" value={form.assignedDriverId}
                    onChange={e => setForm({ ...form, assignedDriverId: e.target.value })}>
                    <option value="">Select driver</option>
                    {drivers.map(d => <option key={d.uid} value={d.uid}>{d.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSave} className="btn-primary flex-1" disabled={saving}>
                {saving && <span className="spinner border-white/60 border-t-transparent" />}
                {saving ? "Saving…" : editing ? "Save changes" : "Add vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-panel max-w-sm">
            <div className="modal-body">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Delete vehicle?</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{deleteTarget.make} {deleteTarget.model} — {deleteTarget.plateNumber}</span> will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="btn-danger flex-1">
                {deleting && <span className="spinner border-white/60 border-t-transparent" />}
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
