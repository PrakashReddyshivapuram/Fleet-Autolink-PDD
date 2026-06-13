import { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { ref as dbRef, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { MapPin, Navigation, Wifi } from "lucide-react-native";

interface LiveLocation {
  lat: number;
  lng: number;
  driverId: string;
  vehicleId: string;
  timestamp: number;
  tripId: string | null;
}

interface VehicleInfo {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  ownerId: string;
}

interface Props {
  /** If provided, only show vehicles matching these IDs */
  filterVehicleIds?: string[];
  vehicles: VehicleInfo[];
  height?: number;
}

const DEFAULT_REGION = {
  latitude:      20.5937,
  longitude:     78.9629,
  latitudeDelta:  12,
  longitudeDelta: 12,
};

export default function LiveMapView({ filterVehicleIds, vehicles, height = 420 }: Props) {
  const mapRef = useRef<MapView>(null);
  const [liveLocations, setLiveLocations] = useState<Record<string, LiveLocation>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const locRef = dbRef(rtdb, "liveLocations");
    const unsub = onValue(locRef, snap => {
      setLoading(false);
      if (!snap.exists()) { setLiveLocations({}); return; }
      const raw = snap.val() as Record<string, LiveLocation>;
      setLiveLocations(raw);
    });
    return () => unsub();
  }, []);

  const allMarkers = Object.values(liveLocations).filter(loc => {
    if (!filterVehicleIds) return true;
    return filterVehicleIds.includes(loc.vehicleId);
  });

  const getVehicle = (vehicleId: string) =>
    vehicles.find(v => v.vehicleId === vehicleId);

  const fitAll = () => {
    if (allMarkers.length === 0 || !mapRef.current) return;
    mapRef.current.fitToCoordinates(
      allMarkers.map(m => ({ latitude: m.lat, longitude: m.lng })),
      { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: true }
    );
  };

  if (loading) return (
    <View style={[styles.root, { height }]}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
      <Text style={styles.loadingText}>Connecting to live tracking…</Text>
    </View>
  );

  return (
    <View style={[styles.root, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        onMapReady={() => { if (allMarkers.length > 0) fitAll(); }}
      >
        {allMarkers.map(loc => {
          const v = getVehicle(loc.vehicleId);
          const isStale = Date.now() - loc.timestamp > 60_000; // > 1 min old
          return (
            <Marker
              key={loc.vehicleId}
              coordinate={{ latitude: loc.lat, longitude: loc.lng }}
              title={v ? `${v.make} ${v.model}` : loc.vehicleId}
              description={v ? v.plateNumber : undefined}
              pinColor={isStale ? "#94a3b8" : colors.brand[600]}
            />
          );
        })}
      </MapView>

      {/* Live count badge */}
      <View style={styles.liveBadge}>
        <View style={[styles.liveDot, allMarkers.length > 0 && styles.liveDotActive]} />
        <Text style={styles.liveBadgeText}>
          {allMarkers.length} vehicle{allMarkers.length !== 1 ? "s" : ""} live
        </Text>
      </View>

      {/* Fit-all button */}
      {allMarkers.length > 0 && (
        <TouchableOpacity style={styles.fitBtn} onPress={fitAll} activeOpacity={0.85}>
          <Navigation size={15} color={colors.brand[600]} />
        </TouchableOpacity>
      )}

      {/* Empty state overlay */}
      {allMarkers.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <MapPin size={22} color={colors.slate[400]} />
            <Text style={styles.emptyTitle}>No vehicles live</Text>
            <Text style={styles.emptySub}>Drivers who go live will appear here in real-time.</Text>
          </View>
        </View>
      )}

      {/* Vehicle list pills at bottom */}
      {allMarkers.length > 0 && (
        <View style={styles.pillRow}>
          {allMarkers.map(loc => {
            const v  = getVehicle(loc.vehicleId);
            const age = Math.round((Date.now() - loc.timestamp) / 1000);
            const ageStr = age < 60 ? `${age}s ago` : `${Math.round(age / 60)}m ago`;
            return (
              <TouchableOpacity
                key={loc.vehicleId}
                style={styles.pill}
                activeOpacity={0.85}
                onPress={() => mapRef.current?.animateToRegion({
                  latitude: loc.lat, longitude: loc.lng,
                  latitudeDelta: 0.02, longitudeDelta: 0.02,
                }, 600)}
              >
                <View style={styles.pillDot} />
                <Text style={styles.pillText} numberOfLines={1}>
                  {v ? v.plateNumber : loc.vehicleId}
                </Text>
                <Text style={styles.pillAge}>{ageStr}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.xl,
    overflow: "hidden",
    backgroundColor: colors.slate[100],
    alignItems: "center",
    justifyContent: "center",
    ...shadow.cardMd,
  },
  loadingText: { fontSize: fontSize.sm, color: colors.slate[400], marginTop: spacing.md },

  liveBadge: {
    position: "absolute", top: 12, left: 12,
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    ...shadow.card,
  },
  liveDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.slate[300] },
  liveDotActive: { backgroundColor: colors.emerald[500] },
  liveBadgeText: { fontSize: 11, fontWeight: "700", color: colors.slate[700] },

  fitBtn: {
    position: "absolute", top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: "center", justifyContent: "center",
    ...shadow.card,
  },

  emptyOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  emptyCard:    { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", gap: spacing.sm, ...shadow.cardMd, maxWidth: 240 },
  emptyTitle:   { fontSize: fontSize.base, fontWeight: "700", color: colors.slate[700] },
  emptySub:     { fontSize: fontSize.sm, color: colors.slate[400], textAlign: "center", lineHeight: 19 },

  pillRow: {
    position: "absolute", bottom: 12, left: 12, right: 12,
    flexDirection: "row", flexWrap: "wrap", gap: spacing.sm,
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: colors.white, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    ...shadow.card,
  },
  pillDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.emerald[500] },
  pillText: { fontSize: 11, fontWeight: "700", color: colors.slate[800] },
  pillAge:  { fontSize: 10, color: colors.slate[400] },
});
