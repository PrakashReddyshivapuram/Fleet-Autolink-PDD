import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useVehicles, useUsers } from "@/hooks/useFirestore";
import { LiveLocation } from "@/types";
import { MapPin, Radio, Clock, Navigation, Car, Signal, AlertCircle } from "lucide-react";

declare global {
  interface Window { L: typeof import("leaflet"); }
}

function timeAgo(timestamp: number): string {
  const secs = Math.floor((Date.now() - timestamp) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
}

export default function AdminMap() {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<unknown>(null);
  const markersRef   = useRef<Record<string, unknown>>({});
  const centeredRef  = useRef(false);
  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);
  const { vehicles } = useVehicles();
  const { users }   = useUsers("driver");

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const liveRef = ref(rtdb, "liveLocations");
    return onValue(liveRef, snap => setLiveLocations(snap.exists() ? snap.val() : {}));
  }, []);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView([20.5937, 78.9629], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://openstreetmap.org">OSM</a>',
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    mapInstance.current = map;
    navigator.geolocation?.getCurrentPosition(
      pos => { if (!centeredRef.current) map.setView([pos.coords.latitude, pos.coords.longitude], 12); },
      () => {}
    );
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!L || !mapInstance.current) return;
    const map = mapInstance.current as ReturnType<typeof L.map>;
    const entries = Object.entries(liveLocations);

    if (entries.length > 0 && !centeredRef.current) {
      const avgLat = entries.reduce((s, [, l]) => s + l.lat, 0) / entries.length;
      const avgLng = entries.reduce((s, [, l]) => s + l.lng, 0) / entries.length;
      map.setView([avgLat, avgLng], 13);
      centeredRef.current = true;
    }
    if (entries.length === 0) centeredRef.current = false;

    entries.forEach(([vehicleId, loc]) => {
      const vehicle  = vehicles.find(v => v.vehicleId === vehicleId);
      const driver   = users.find(u => u.uid === loc.driverId);
      const label    = vehicle ? `${vehicle.make} ${vehicle.model}` : vehicleId;
      const isSelected = selectedVehicle === vehicleId;
      const staleSecs  = (Date.now() - loc.timestamp) / 1000;
      const isMoving   = staleSecs < 15;

      const popupHtml = `
        <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;min-width:200px;padding:2px 0">
          <p style="font-weight:800;font-size:13px;color:#0f172a;margin:0 0 6px">${escapeHtml(label)}</p>
          <p style="font-size:12px;color:#475569;margin:0 0 3px">Driver: <strong style="color:#0f172a">${escapeHtml(driver?.name ?? "—")}</strong></p>
          <p style="font-size:12px;color:#475569;margin:0 0 3px">Plate: <code style="color:#0f172a;background:#f1f5f9;padding:1px 4px;border-radius:3px;font-size:11px">${escapeHtml(vehicle?.plateNumber ?? "—")}</code></p>
          <p style="font-size:11px;color:#94a3b8;margin:4px 0 2px">Lat: ${loc.lat.toFixed(5)} · Lng: ${loc.lng.toFixed(5)}</p>
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${isMoving ? "#10b981" : "#f59e0b"};flex-shrink:0"></span>
            <span style="font-size:11px;font-weight:700;color:${isMoving ? "#059669" : "#d97706"}">${isMoving ? "Moving" : "Idle"}</span>
            <span style="font-size:11px;color:#94a3b8;margin-left:4px">· ${timeAgo(loc.timestamp)}</span>
          </div>
        </div>`;

      if (markersRef.current[vehicleId]) {
        const marker = markersRef.current[vehicleId] as ReturnType<typeof L.marker>;
        marker.setLatLng([loc.lat, loc.lng]);
        marker.setPopupContent(popupHtml);
        if (isSelected) marker.openPopup();
      } else {
        const icon = L.divIcon({
          html: `<div style="
            width:42px;height:42px;
            background:${isMoving ? "#059669" : "#4f46e5"};
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:19px;
            border:3px solid white;
            box-shadow:0 4px 16px rgba(0,0,0,0.25);
            transition:transform 0.2s
          ">🚗</div>`,
          iconSize: [42, 42], iconAnchor: [21, 21], className: "",
        });
        const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map).bindPopup(popupHtml, { maxWidth: 260 });
        marker.on("click", () => setSelectedVehicle(vehicleId));
        markersRef.current[vehicleId] = marker;
      }
    });

    Object.keys(markersRef.current).forEach(id => {
      if (!liveLocations[id]) {
        (markersRef.current[id] as ReturnType<typeof L.marker>).remove();
        delete markersRef.current[id];
      }
    });
  }, [liveLocations, vehicles, users, selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle || !mapInstance.current) return;
    const L = window.L;
    if (!L) return;
    const loc = liveLocations[selectedVehicle];
    if (!loc) return;
    const map = mapInstance.current as ReturnType<typeof L.map>;
    map.setView([loc.lat, loc.lng], 15, { animate: true });
    const marker = markersRef.current[selectedVehicle] as ReturnType<typeof L.marker>;
    marker?.openPopup();
  }, [selectedVehicle]);

  const activeCount = Object.keys(liveLocations).length;
  const movingCount = Object.values(liveLocations).filter(l => (Date.now() - l.timestamp) / 1000 < 15).length;
  const idleCount   = activeCount - movingCount;

  return (
    <div className="animate-fade-in space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Live Tracking</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time GPS positions · auto-refreshes every 10s</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold flex-shrink-0 ${
          activeCount > 0
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-slate-100 border-slate-200 text-slate-500"
        }`}>
          <Radio size={13} className={activeCount > 0 ? "animate-pulse" : ""} />
          {activeCount > 0 ? `${activeCount} vehicle${activeCount !== 1 ? "s" : ""} online` : "No vehicles online"}
        </div>
      </div>

      {/* Stats row */}
      {activeCount > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Signal size={14} className="text-emerald-600" />, value: activeCount, label: "Online now",  sub: "sharing location", color: "text-emerald-700" },
            { icon: <Navigation size={14} className="text-blue-600" />, value: movingCount, label: "Moving",     sub: "updated < 15s",  color: "text-blue-700"   },
            { icon: <Clock size={14} className="text-amber-500" />,   value: idleCount,   label: "Idle",         sub: "no recent update", color: "text-amber-700"  },
          ].map(k => (
            <div key={k.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                {k.icon}
              </div>
              <div>
                <p className={`text-xl font-extrabold tabular-nums leading-none ${k.color}`}>{k.value}</p>
                <p className="text-[10px] font-semibold text-slate-700 mt-0.5">{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map + side panel */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: "calc(100vh - 260px)", minHeight: "480px" }}>

        {/* Side panel */}
        <div className="w-72 flex-shrink-0 bg-white border-r border-slate-100 flex flex-col">

          {/* Panel header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active vehicles</p>
              <span className={`badge text-[10px] ${activeCount > 0 ? "badge-green" : "badge-gray"}`}>
                {activeCount} live
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activeCount === 0 ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin size={22} className="text-slate-400" />
                </div>
                <p className="text-sm font-bold text-slate-700">No vehicles online</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Drivers share their location when they tap <strong>Go Live</strong> or <strong>Start Trip</strong> in the app.
                </p>
                <div className="mt-4 space-y-2 text-left w-full">
                  {[
                    "Driver opens the app",
                    "Taps My vehicle → Go Live",
                    "GPS position appears here",
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-xs text-slate-500">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              Object.entries(liveLocations).map(([vehicleId, loc]) => {
                const vehicle  = vehicles.find(v => v.vehicleId === vehicleId);
                const driver   = users.find(u => u.uid === loc.driverId);
                const isSelected = selectedVehicle === vehicleId;
                const staleSecs  = (Date.now() - loc.timestamp) / 1000;
                const isMoving   = staleSecs < 15;

                return (
                  <button
                    key={vehicleId}
                    onClick={() => setSelectedVehicle(vehicleId === selectedVehicle ? null : vehicleId)}
                    className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-colors ${
                      isSelected
                        ? "bg-brand-50 border-l-[3px] border-l-brand-500"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isMoving ? "bg-emerald-100" : "bg-amber-100"
                      }`}>
                        <Car size={14} className={isMoving ? "text-emerald-600" : "text-amber-600"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {vehicle ? `${vehicle.make} ${vehicle.model}` : "Unknown"}
                        </p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">{vehicle?.plateNumber ?? "—"}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <span>{driver?.name ?? "Unknown driver"}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isMoving ? "bg-emerald-500 animate-pulse" : "bg-amber-400"}`} />
                          <span className={`text-[10px] font-semibold ${isMoving ? "text-emerald-600" : "text-amber-600"}`}>
                            {isMoving ? "Moving" : "Idle"}
                          </span>
                          <span className="text-[10px] text-slate-400">· {timeAgo(loc.timestamp)}</span>
                        </div>
                        <p className="text-[9px] font-mono text-slate-300 mt-0.5">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Offline vehicles */}
          {vehicles.length > activeCount && activeCount > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Offline ({vehicles.length - activeCount})
              </p>
              {vehicles
                .filter(v => !liveLocations[v.vehicleId])
                .slice(0, 3)
                .map(v => (
                  <div key={v.vehicleId} className="flex items-center gap-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    <span className="text-[11px] text-slate-500 truncate">{v.make} {v.model}</span>
                    <span className="text-[10px] font-mono text-slate-300 ml-auto">{v.plateNumber}</span>
                  </div>
                ))}
              {vehicles.length - activeCount > 3 && (
                <p className="text-[10px] text-slate-300 mt-1">+{vehicles.length - activeCount - 3} more offline</p>
              )}
            </div>
          )}

          {/* Footer */}
          {activeCount > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center gap-1.5">
              <AlertCircle size={10} className="text-slate-400" />
              <p className="text-[10px] text-slate-400 font-medium">Click a vehicle to zoom in · updates every 5s</p>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />
          {activeCount === 0 && (
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center pb-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-sm border border-slate-200">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                  <Radio size={11} className="text-slate-400" />
                  Waiting for drivers to go live…
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
