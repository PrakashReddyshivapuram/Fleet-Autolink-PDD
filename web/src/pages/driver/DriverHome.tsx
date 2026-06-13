import { useState, useEffect, useRef } from "react";
import { ref as dbRef, set, remove, onDisconnect } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useVehicles, useTrips } from "@/hooks/useFirestore";
import {
  Navigation, Car, MapPin, StopCircle, AlertCircle,
  Wifi, WifiOff, Radio, Clock, CheckCircle, Timer,
} from "lucide-react";

export default function DriverHome() {
  const { appUser } = useAuth();
  const { vehicles } = useVehicles();
  const { trips, startTrip, endTrip } = useTrips(appUser?.uid);

  // GPS state
  const [isLive, setIsLive] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [tripLoading, setTripLoading] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastWriteRef = useRef<number>(0);

  const assignedVehicle = vehicles.find(v => v.assignedDriverId === appUser?.uid);
  const activeTrip = trips.find(t => t.status === "active");
  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 4);
  const completedCount = trips.filter(t => t.status === "ended").length;

  // Sync with Firestore active trip
  useEffect(() => {
    if (activeTrip && !isLive) {
      setIsLive(true);
      setActiveTripId(activeTrip.tripId);
    } else if (!activeTrip && isLive && !activeTripId) {
      // standalone live mode — keep running
    } else if (!activeTrip && activeTripId) {
      setIsLive(false);
      setActiveTripId(null);
    }
  }, [activeTrip?.tripId]);

  // Cleanup on unmount
  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  // GPS watcher — runs whenever isLive changes
  useEffect(() => {
    if (!isLive || !assignedVehicle || !appUser) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      return;
    }

    const locationRef = dbRef(rtdb, `liveLocations/${assignedVehicle.vehicleId}`);
    onDisconnect(locationRef).remove();

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        const now = Date.now();
        if (now - lastWriteRef.current < 5000) return;
        lastWriteRef.current = now;
        set(locationRef, {
          lat, lng,
          driverId: appUser.uid,
          vehicleId: assignedVehicle.vehicleId,
          timestamp: now,
          tripId: activeTripId ?? null,
        }).catch(err => setError("Location update failed: " + err.message));
      },
      err => setError("GPS error: " + err.message),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
  }, [isLive, assignedVehicle?.vehicleId, appUser?.uid, activeTripId]);

  const handleGoLive = () => {
    setError("");
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setIsLive(true);
  };

  const handleStopLive = async () => {
    if (assignedVehicle) {
      await remove(dbRef(rtdb, `liveLocations/${assignedVehicle.vehicleId}`));
    }
    setIsLive(false);
    setCoords(null);
  };

  const handleStartTrip = async () => {
    if (!assignedVehicle || !appUser) return;
    setError("");
    setTripLoading(true);
    if (!navigator.geolocation) { setError("Geolocation not supported."); setTripLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const tripId = await startTrip(assignedVehicle.vehicleId, appUser.uid, lat, lng);
          setActiveTripId(tripId);
          setIsLive(true);
        } catch {
          setError("Could not start trip. Try again.");
        } finally {
          setTripLoading(false);
        }
      },
      () => { setError("Could not get location. Allow GPS access."); setTripLoading(false); }
    );
  };

  const handleEndTrip = async () => {
    if (!activeTripId || !assignedVehicle) return;
    setTripLoading(true);
    try {
      await endTrip(activeTripId, coords?.lat, coords?.lng);
      await remove(dbRef(rtdb, `liveLocations/${assignedVehicle.vehicleId}`));
      setActiveTripId(null);
      setIsLive(false);
      setCoords(null);
    } finally {
      setTripLoading(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-5 max-w-2xl">
      <div className="page-header">
        <div>
          <h2 className="page-title">Driver dashboard</h2>
          <p className="page-sub">
            {appUser?.name ? `Welcome back, ${appUser.name.split(" ")[0]}` : "Manage your vehicle and trips"}
          </p>
        </div>
        {isLive && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold">
            <Radio size={12} className="animate-pulse" />
            Live
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
          <AlertCircle size={15} className="flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600 text-xs font-bold">✕</button>
        </div>
      )}

      {!assignedVehicle ? (
        <div className="card p-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Car size={24} className="text-slate-400" />
          </div>
          <p className="font-bold text-slate-700">No vehicle assigned</p>
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs mx-auto">
            Contact your fleet admin to get assigned to a vehicle before starting trips.
          </p>
        </div>
      ) : (
        <>
          {/* Vehicle identity card */}
          <div className="card p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)" }}>
                <Car size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-slate-900 text-base leading-tight">
                  {assignedVehicle.make} {assignedVehicle.model}
                </p>
                <p className="text-sm text-slate-400 font-mono mt-0.5">
                  {assignedVehicle.plateNumber}
                  {assignedVehicle.year ? ` · ${assignedVehicle.year}` : ""}
                </p>
              </div>
              <span className={`badge flex-shrink-0 ${assignedVehicle.status === "active" ? "badge-green" : "badge-yellow"}`}>
                {assignedVehicle.status}
              </span>
            </div>
          </div>

          {/* GO LIVE panel — the hero feature */}
          <div className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${
            isLive
              ? "border-emerald-300 shadow-[0_0_0_4px_rgba(16,185,129,0.08)]"
              : "border-slate-200"
          }`}>
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${
              isLive ? "bg-emerald-50" : "bg-white"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  isLive ? "bg-emerald-500" : "bg-slate-100"
                }`}>
                  {isLive
                    ? <Wifi size={18} className="text-white" />
                    : <WifiOff size={18} className="text-slate-400" />
                  }
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">Live location sharing</p>
                  <p className={`text-xs mt-0.5 ${isLive ? "text-emerald-600 font-medium" : "text-slate-400"}`}>
                    {isLive ? "Your position is visible to admin in real time" : "Share your GPS with fleet admin"}
                  </p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${isLive ? "bg-emerald-500 animate-pulse" : "bg-slate-200"}`} />
            </div>

            {/* Coords strip */}
            {coords && isLive && (
              <div className="px-5 py-2.5 bg-emerald-50/60 border-t border-emerald-100 flex items-center gap-2">
                <MapPin size={12} className="text-emerald-600 flex-shrink-0" />
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
                </span>
                <span className="ml-auto text-[10px] text-emerald-500 font-bold">● LIVE</span>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 py-4 bg-white border-t border-slate-100 flex flex-col gap-3">
              {!isLive ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleGoLive}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-colors">
                    <Radio size={14} /> Go Live
                  </button>
                  <button
                    onClick={handleStartTrip}
                    disabled={tripLoading}
                    className="btn-primary flex items-center justify-center gap-2">
                    {tripLoading
                      ? <span className="spinner border-white/60 border-t-transparent" />
                      : <><Navigation size={14} /> Start Trip</>
                    }
                  </button>
                </div>
              ) : activeTripId ? (
                <button
                  onClick={handleEndTrip}
                  disabled={tripLoading}
                  className="btn-danger w-full flex items-center justify-center gap-2">
                  {tripLoading
                    ? <span className="spinner border-red-300 border-t-transparent" />
                    : <><StopCircle size={15} /> End Trip & Stop Sharing</>
                  }
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleStopLive}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
                    <WifiOff size={14} /> Stop Sharing
                  </button>
                  <button
                    onClick={handleStartTrip}
                    disabled={tripLoading}
                    className="btn-primary flex items-center justify-center gap-2">
                    {tripLoading
                      ? <span className="spinner border-white/60 border-t-transparent" />
                      : <><Navigation size={14} /> Log Trip</>
                    }
                  </button>
                </div>
              )}

              {!isLive && (
                <p className="text-[11px] text-slate-400 text-center">
                  <strong>Go Live</strong> shares location without logging a trip ·
                  <strong> Start Trip</strong> also creates a Firestore record
                </p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="stat-card">
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{trips.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total trips</p>
            </div>
            <div className="stat-card">
              <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{completedCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">Completed</p>
            </div>
            <div className="stat-card">
              <p className={`text-2xl font-extrabold tabular-nums ${isLive ? "text-emerald-600" : "text-slate-300"}`}>
                {isLive ? "ON" : "OFF"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Live now</p>
            </div>
          </div>

          {/* Recent trips */}
          {recentTrips.length > 0 && (
            <div className="card p-5">
              <p className="section-label mb-3">Recent trips</p>
              <div className="space-y-2">
                {recentTrips.map(t => {
                  const isActive = t.status === "active";
                  const duration = t.endedAt
                    ? Math.round((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 60000)
                    : null;
                  return (
                    <div key={t.tripId} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-emerald-100" : "bg-slate-100"
                      }`}>
                        {isActive
                          ? <Clock size={13} className="text-emerald-600 animate-pulse" />
                          : <CheckCircle size={13} className="text-slate-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700">
                          {new Date(t.startedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {duration !== null && (
                          <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                            <Timer size={9} /> {duration} min
                          </p>
                        )}
                      </div>
                      <span className={`badge text-[10px] ${isActive ? "badge-green" : "badge-gray"}`}>
                        {isActive ? "active" : "ended"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
