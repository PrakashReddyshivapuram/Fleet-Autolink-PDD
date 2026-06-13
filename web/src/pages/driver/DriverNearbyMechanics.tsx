import { useEffect, useState } from "react";
import { MapPin, Star, Phone, Clock, Navigation, Wrench, ExternalLink } from "lucide-react";

interface MechanicCenter {
  id: number;
  name: string;
  rating: number;
  reviews: number;
  distance: string;
  isOpen: boolean;
  hours: string;
  phone: string;
  address: string;
  specialties: string[];
  type: string;
}

const CENTERS: MechanicCenter[] = [
  {
    id: 1, name: "AutoCare Pro", rating: 4.8, reviews: 234, distance: "0.8 km",
    isOpen: true, hours: "8AM – 8PM", phone: "+1-800-555-0101",
    address: "12 Industrial Park, Sector 4",
    specialties: ["Engine Repair", "Brakes", "AC Service"],
    type: "Multi-Specialty",
  },
  {
    id: 2, name: "QuickFix Garage", rating: 4.5, reviews: 187, distance: "1.2 km",
    isOpen: true, hours: "7AM – 9PM", phone: "+1-800-555-0102",
    address: "45 Commercial Ave, Block B",
    specialties: ["Tyre Change", "Oil & Filter", "Electrical"],
    type: "Quick Service",
  },
  {
    id: 3, name: "TruckMasters Service", rating: 4.7, reviews: 312, distance: "2.1 km",
    isOpen: false, hours: "9AM – 6PM", phone: "+1-800-555-0103",
    address: "Logistics Hub, NH-48",
    specialties: ["Heavy Vehicles", "Fleet Servicing", "Suspension"],
    type: "Fleet Specialist",
  },
  {
    id: 4, name: "Rapid Road Rescue", rating: 4.3, reviews: 98, distance: "2.4 km",
    isOpen: true, hours: "24/7", phone: "+1-800-555-0104",
    address: "Near Toll Booth 3, Highway Ring",
    specialties: ["Emergency Repair", "Towing", "Battery"],
    type: "24/7 Emergency",
  },
  {
    id: 5, name: "GreenTech Automotive", rating: 4.6, reviews: 156, distance: "3.7 km",
    isOpen: true, hours: "8AM – 7PM", phone: "+1-800-555-0105",
    address: "Green Zone Complex, Phase 2",
    specialties: ["EV Service", "Diagnostics", "Transmission"],
    type: "EV & Hybrid",
  },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={10}
          className={s <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}
        />
      ))}
    </div>
  );
}

export default function DriverNearbyMechanics() {
  const [city, setCity] = useState<string>("your area");
  const [locLoading, setLocLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "open">("all");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then(r => r.json())
          .then(data => {
            const c = data.address?.city || data.address?.town || data.address?.county || "your area";
            setCity(c);
          })
          .catch(() => {})
          .finally(() => setLocLoading(false));
      },
      () => setLocLoading(false)
    );
  }, []);

  const totalOpen = CENTERS.filter(c => c.isOpen).length;
  const avgRating = (CENTERS.reduce((s, c) => s + c.rating, 0) / CENTERS.length).toFixed(1);
  const displayed = filter === "open" ? CENTERS.filter(c => c.isOpen) : CENTERS;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">

      {/* Header */}
      <div className="pb-5 border-b border-slate-200">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Driver</p>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-none">Nearby Mechanics</h1>
        <p className="text-sm text-slate-500 mt-1">
          {locLoading ? "Detecting your location…" : `Showing results near ${city}`}
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
        {[
          { value: CENTERS.length, label: "Total Centres", icon: <Wrench size={14} className="text-brand-500" /> },
          { value: totalOpen, label: "Open Now", icon: <Clock size={14} className="text-emerald-500" /> },
          { value: avgRating, label: "Avg Rating", icon: <Star size={14} className="text-amber-400 fill-amber-400" /> },
        ].map(k => (
          <div key={k.label} className="px-5 py-4 bg-white text-center hover:bg-slate-50/60 transition-colors">
            <div className="flex items-center justify-center gap-1.5 mb-1">{k.icon}</div>
            <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{k.value}</p>
            <p className="text-[10px] font-semibold text-slate-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(["all", "open"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === f
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
            }`}
          >
            {f === "all" ? `All centres (${CENTERS.length})` : `Open now (${totalOpen})`}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {displayed.map(center => (
          <div key={center.id} className="bg-white border border-slate-200 rounded-xl p-4 hover:border-slate-300 transition-colors">
            <div className="flex items-start gap-4">

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                center.isOpen ? "bg-emerald-50" : "bg-slate-100"
              }`}>
                <Wrench size={20} className={center.isOpen ? "text-emerald-600" : "text-slate-400"} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-slate-900">{center.name}</p>
                    <span className="text-[10px] font-semibold text-slate-400">{center.type}</span>
                  </div>
                  <span className={`badge text-[10px] flex-shrink-0 ${center.isOpen ? "badge-green" : "badge-gray"}`}>
                    {center.isOpen ? "Open" : "Closed"}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1.5">
                  <StarRow rating={center.rating} />
                  <span className="text-xs font-bold text-slate-700">{center.rating}</span>
                  <span className="text-xs text-slate-400">({center.reviews} reviews)</span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={11} className="text-slate-400" /> {center.distance}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={11} className="text-slate-400" /> {center.hours}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">{center.address}</p>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {center.specialties.map(s => (
                    <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md">{s}</span>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <a href={`tel:${center.phone}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors">
                    <Phone size={11} /> Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/mechanic+near+${encodeURIComponent(center.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                  >
                    <Navigation size={11} /> Directions
                    <ExternalLink size={9} className="text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-slate-400 text-center pb-2">
        Results are approximate. Availability and hours may vary. Always call ahead to confirm.
      </p>
    </div>
  );
}
