import { useState } from "react";
import {
  Phone, AlertTriangle, Truck, Zap, Fuel, Shield, ChevronDown, ChevronUp,
  PhoneCall, Siren, Wrench, Battery, CheckCircle
} from "lucide-react";
import { rtdb } from "@/lib/firebase";
import { ref as dbRef, set as rtdbSet } from "firebase/database";
import { useAuth } from "@/context/AuthContext";

const EMERGENCY_SERVICES = [
  {
    id: "roadside",
    icon: <Truck size={22} />,
    title: "Roadside Assistance",
    desc: "Flat tyre, locked out, or stuck? Get help fast.",
    number: "1800-103-0000",
    color: "bg-blue-50 text-blue-600 border-blue-100",
    btnColor: "bg-blue-600 hover:bg-blue-700",
  },
  {
    id: "towing",
    icon: <Truck size={22} />,
    title: "Towing Service",
    desc: "Vehicle towing to nearest garage or destination.",
    number: "1800-103-0001",
    color: "bg-violet-50 text-violet-600 border-violet-100",
    btnColor: "bg-violet-600 hover:bg-violet-700",
  },
  {
    id: "mechanic",
    icon: <Wrench size={22} />,
    title: "Emergency Mechanic",
    desc: "On-site mechanic dispatch for critical failures.",
    number: "1800-103-0002",
    color: "bg-amber-50 text-amber-600 border-amber-100",
    btnColor: "bg-amber-600 hover:bg-amber-700",
  },
  {
    id: "battery",
    icon: <Battery size={22} />,
    title: "Battery Jump Start",
    desc: "Dead battery? We'll get you running in minutes.",
    number: "1800-103-0003",
    color: "bg-yellow-50 text-yellow-600 border-yellow-100",
    btnColor: "bg-yellow-500 hover:bg-yellow-600",
  },
  {
    id: "fuel",
    icon: <Fuel size={22} />,
    title: "Fuel Delivery",
    desc: "Emergency fuel delivered directly to your location.",
    number: "1800-103-0004",
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    btnColor: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    id: "police",
    icon: <Shield size={22} />,
    title: "Police / Emergency SOS",
    desc: "Traffic police and emergency response.",
    number: "100",
    color: "bg-red-50 text-red-600 border-red-100",
    btnColor: "bg-red-600 hover:bg-red-700",
  },
  {
    id: "ambulance",
    icon: <Siren size={22} />,
    title: "Ambulance / Accident",
    desc: "Medical emergencies and accident response.",
    number: "108",
    color: "bg-red-50 text-red-600 border-red-100",
    btnColor: "bg-red-600 hover:bg-red-700",
  },
];

const SAFETY_TIPS = [
  {
    title: "Turn on hazard lights immediately",
    body: "As soon as you notice an issue, activate your hazard lights to warn other drivers. Keep them on until help arrives or you have safely moved off the road.",
    icon: <AlertTriangle size={16} />,
  },
  {
    title: "Move to a safe location",
    body: "If possible, steer the vehicle to the shoulder or a side road. Never stop in a live traffic lane. Set up reflective triangles or flares at least 50 metres behind the vehicle.",
    icon: <Siren size={16} />,
  },
  {
    title: "Stay inside if on a highway",
    body: "On high-speed roads, it is safer to remain inside with seatbelt on and doors locked while waiting for emergency responders. Only exit if there is an immediate safety threat.",
    icon: <Shield size={16} />,
  },
  {
    title: "Call for help before attempting repairs",
    body: "Do not attempt to change a tyre or open the bonnet on a busy road. Call the appropriate emergency service and wait in a safe area away from traffic.",
    icon: <PhoneCall size={16} />,
  },
  {
    title: "Share your live location",
    body: "Use the Live Location feature in this app to broadcast your exact GPS position to fleet management. This allows faster dispatch of assistance.",
    icon: <CheckCircle size={16} />,
  },
  {
    title: "Keep calm and preserve battery",
    body: "Turn off non-essential electronics to extend battery life. Keep your phone charged enough to communicate. A calm mind makes better decisions in emergencies.",
    icon: <Zap size={16} />,
  },
];

export default function DriverEmergency() {
  const [sosPulsing, setSosPulsing] = useState(false);
  const [expandedTip, setExpandedTip] = useState<number | null>(null);
  const [calledService, setCalledService] = useState<string | null>(null);
  const { appUser } = useAuth();

  const handleSOS = () => {
    setSosPulsing(true);
    if (appUser) {
      const payload = { driverId: appUser.uid, driverName: appUser.name ?? "Driver", vehicleId: null, vehiclePlate: null, vehicleMake: null, lat: null, lng: null, service: "Police / Emergency SOS", phone: "100", timestamp: Date.now() };
      try { rtdbSet(dbRef(rtdb, `emergencyAlerts/${appUser.uid}`), payload); } catch (e) { console.error(e); }
    }
    window.open("tel:100");
    setTimeout(() => setSosPulsing(false), 3000);
  };

  const sendServiceAlert = async (s: any) => {
    if (!appUser) return;
    setCalledService(s.id);
    const getPos = () => new Promise<{ lat: number; lng: number } | null>((res) => {
      if (!navigator.geolocation) return res(null);
      let done = false;
      const timer = setTimeout(() => { if (!done) { done = true; res(null); } }, 5000);
      navigator.geolocation.getCurrentPosition(pos => {
        if (done) return; done = true; clearTimeout(timer);
        res({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => { if (!done) { done = true; clearTimeout(timer); res(null); } }, { enableHighAccuracy: true, timeout: 5000 });
    });

    const loc = await getPos();
    const payload = {
      driverId: appUser.uid,
      driverName: appUser.name ?? "Driver",
      vehicleId: null,
      vehiclePlate: null,
      vehicleMake: null,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      service: s.title,
      phone: s.number,
      timestamp: Date.now(),
    };
    try { await rtdbSet(dbRef(rtdb, `emergencyAlerts/${appUser.uid}`), payload); } catch (e) { console.error("RTDB write failed", e); }
    window.open(`tel:${s.number}`);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Emergency Support</h1>
        <p className="text-sm text-slate-500 mt-1">Instant access to emergency services and safety guidance</p>
      </div>

      {/* SOS Button */}
      <div className="flex flex-col items-center py-8 bg-red-50 border border-red-200 rounded-2xl">
        <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-5">Emergency SOS</p>
          <button
          onClick={handleSOS}
          className={`relative w-36 h-36 rounded-full flex flex-col items-center justify-center text-white font-extrabold text-lg shadow-2xl transition-all duration-200 active:scale-95 ${
            sosPulsing ? "scale-105" : ""
          }`}
          style={{ background: "linear-gradient(145deg, #ef4444, #dc2626, #b91c1c)" }}
        >
          {sosPulsing && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-40" />
          )}
          <Siren size={32} className="mb-1" />
          <span>SOS</span>
          <span className="text-xs font-medium text-red-200">Tap to call 100</span>
        </button>
        <p className="text-xs text-red-500 mt-5 font-medium text-center max-w-xs leading-relaxed">
          This will call emergency services (100). Only use in genuine emergencies.
        </p>
      </div>

      {/* Emergency services grid */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-4">Emergency Services</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EMERGENCY_SERVICES.map(s => (
            <div key={s.id} className={`bg-white border rounded-xl p-4 flex items-start gap-3.5 ${
              calledService === s.id ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200"
            }`}>
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${s.color}`}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">{s.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => sendServiceAlert(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-colors ${s.btnColor}`}
                  >
                    <Phone size={11} /> Call {s.number}
                  </button>
                  {calledService === s.id && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                      <CheckCircle size={10} /> Calling…
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Safety Tips */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
            <Shield size={15} className="text-amber-600" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">Safety Tips</h2>
          <span className="badge badge-yellow text-[10px]">Interactive</span>
        </div>
        <div className="space-y-2">
          {SAFETY_TIPS.map((tip, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedTip(expandedTip === i ? null : i)}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left hover:bg-slate-50/60 transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  expandedTip === i ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {tip.icon}
                </div>
                <p className="flex-1 text-sm font-semibold text-slate-800">{tip.title}</p>
                <span className="text-slate-400 flex-shrink-0 transition-transform duration-200">
                  {expandedTip === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </button>
              {expandedTip === i && (
                <div className="px-4 pb-4 pl-[3.75rem]">
                  <p className="text-sm text-slate-600 leading-relaxed">{tip.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-3 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl">
        <AlertTriangle size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Emergency numbers may vary by region. Ensure your phone has network coverage before attempting calls.
          Always inform fleet management of any incident via the app.
        </p>
      </div>
    </div>
  );
}
