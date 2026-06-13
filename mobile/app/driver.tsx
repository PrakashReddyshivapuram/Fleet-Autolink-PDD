import { useState, useEffect, useRef } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { ref as dbRef, set, remove, onDisconnect } from "firebase/database";
import { collection, doc, setDoc, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import { rtdb, db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Car, Navigation, StopCircle, MapPin, LogOut, Clock,
  Truck, CheckCircle, Wifi, WifiOff, Radio, Timer, Bell,
  PhoneCall, AlertTriangle, User, Home, List, Send,
} from "lucide-react-native";
import { Vehicle, Trip } from "@/types";
import BottomNav, { NAV_HEIGHT, NavTab } from "@/components/BottomNav";

type Tab = "home" | "trips" | "emergency" | "profile";

const EMERGENCY = [
  { label: "Police / Emergency SOS", phone: "100",           color: colors.red[600],     bg: "#fef2f2" },
  { label: "Roadside Assistance",  phone: "+18001234567",  color: colors.amber[600],   bg: colors.amber[50] },
  { label: "Towing Service",       phone: "+18007654321",  color: colors.brand[600],   bg: colors.brand[50] },
  { label: "Battery Jump Start",   phone: "+18009876543",  color: colors.emerald[600], bg: colors.emerald[50] },
  { label: "Fuel Delivery",        phone: "+18005551234",  color: colors.violet[600],  bg: "#f5f3ff" },
  { label: "Accident - 108",      phone: "108",           color: colors.slate[700],   bg: colors.slate[100] },
];

export default function DriverScreen() {
  const { appUser } = useAuth();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("home");

  const [vehicle, setVehicle]           = useState<Vehicle | null>(null);
  const [trips, setTrips]               = useState<Trip[]>([]);
  const [isLive, setIsLive]             = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [coords, setCoords]             = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading]           = useState(true);
  const [tripLoading, setTripLoading]   = useState(false);
  const [emergencySending, setEmergencySending] = useState<string | null>(null); // label of service being alerted

  const locationSub     = useRef<Location.LocationSubscription | null>(null);
  const lastWriteRef    = useRef<number>(0);
  const activeTripIdRef = useRef<string | null>(null);
  const vehicleRef      = useRef<Vehicle | null>(null);
  const coordsRef       = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => { vehicleRef.current = vehicle; }, [vehicle]);
  useEffect(() => { activeTripIdRef.current = activeTripId; }, [activeTripId]);
  useEffect(() => { coordsRef.current = coords; }, [coords]);

  useEffect(() => {
    if (!appUser) return;
    const vq = query(collection(db, "vehicles"), where("assignedDriverId", "==", appUser.uid));
    const vunsub = onSnapshot(vq, snap => {
      setVehicle(snap.empty ? null : snap.docs[0].data() as Vehicle);
      setLoading(false);
    });
    const tq = query(collection(db, "trips"), where("driverId", "==", appUser.uid));
    const tunsub = onSnapshot(tq, snap => {
      const all = snap.docs.map(d => d.data() as Trip);
      setTrips(all);
      const active = all.find(t => t.status === "active");
      if (active) { setActiveTripId(active.tripId); setIsLive(true); }
    });
    return () => { vunsub(); tunsub(); };
  }, [appUser?.uid]);

  useEffect(() => {
    if (!isLive || !vehicle || !appUser) {
      locationSub.current?.remove(); locationSub.current = null; return;
    }
    startWatching();
    return () => { locationSub.current?.remove(); locationSub.current = null; };
  }, [isLive, vehicle?.vehicleId]);

  const startWatching = async () => {
    const v = vehicleRef.current;
    if (!v || !appUser) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Location required", "Allow location to share position."); setIsLive(false); return; }
    const locationRef = dbRef(rtdb, `liveLocations/${v.vehicleId}`);
    onDisconnect(locationRef).remove();
    locationSub.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      async (loc) => {
        const { latitude: lat, longitude: lng } = loc.coords;
        setCoords({ lat, lng });
        const now = Date.now();
        if (now - lastWriteRef.current < 5000) return;
        lastWriteRef.current = now;
        await set(locationRef, { lat, lng, driverId: appUser.uid, vehicleId: v.vehicleId, timestamp: now, tripId: activeTripIdRef.current ?? null }).catch(() => {});
      }
    );
  };

  const handleGoLive = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Permission needed", "Enable location to go live."); return; }
    setIsLive(true);
  };

  const handleStopLive = async () => {
    locationSub.current?.remove(); locationSub.current = null;
    const v = vehicleRef.current;
    if (v) await remove(dbRef(rtdb, `liveLocations/${v.vehicleId}`));
    setIsLive(false); setCoords(null);
  };

  const handleStartTrip = async () => {
    const v = vehicleRef.current;
    if (!v || !appUser) return;
    setTripLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") { Alert.alert("Location required", "Allow location to start a trip."); setTripLoading(false); return; }
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const tripRef = doc(collection(db, "trips"));
      const trip: Trip = { tripId: tripRef.id, vehicleId: v.vehicleId, driverId: appUser.uid, status: "active", startedAt: new Date().toISOString(), startLat: loc.coords.latitude, startLng: loc.coords.longitude };
      await setDoc(tripRef, trip);
      setActiveTripId(tripRef.id); activeTripIdRef.current = tripRef.id; setIsLive(true);
    } catch { Alert.alert("Error", "Could not start trip."); }
    finally { setTripLoading(false); }
  };

  const handleEndTrip = async () => {
    const tripId = activeTripIdRef.current; const v = vehicleRef.current;
    if (!tripId || !v) return;
    setTripLoading(true);
    try {
      locationSub.current?.remove(); locationSub.current = null;
      await updateDoc(doc(db, "trips", tripId), { status: "ended", endedAt: new Date().toISOString(), ...(coords ? { endLat: coords.lat, endLng: coords.lng } : {}) });
      await remove(dbRef(rtdb, `liveLocations/${v.vehicleId}`));
      setIsLive(false); setActiveTripId(null); activeTripIdRef.current = null; setCoords(null);
    } catch { Alert.alert("Error", "Could not end trip."); }
    finally { setTripLoading(false); }
  };

  // Sends emergency alert to RTDB (visible to Admin + Mechanic in real-time), then opens phone call
  const handleEmergencyCall = async (service: { label: string; phone: string }) => {
    if (!appUser) return;
    setEmergencySending(service.label);
    try {
      // Get current location (fall back to last known if permission already granted)
      let lat: number | null = coordsRef.current?.lat ?? null;
      let lng: number | null = coordsRef.current?.lng ?? null;

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
          setCoords({ lat, lng });
        } catch {
          // use last known coords if fresh fetch fails
        }
      }

      const v = vehicleRef.current;
      const alertPayload = {
        driverId:     appUser.uid,
        driverName:   appUser.name ?? "Driver",
        vehicleId:    v?.vehicleId ?? null,
        vehiclePlate: v?.plateNumber ?? null,
        vehicleMake:  v ? `${v.make} ${v.model}` : null,
        lat,
        lng,
        service:   service.label,
        phone:     service.phone,
        timestamp: Date.now(),
      };

      // Write to RTDB — admin and mechanic screens listen to this path
      await set(dbRef(rtdb, `emergencyAlerts/${appUser.uid}`), alertPayload);
    } catch {
      // Non-blocking — still open the call even if RTDB write fails
    } finally {
      setEmergencySending(null);
    }

    // Open phone dialler
    Linking.openURL(`tel:${service.phone}`);
  };

  const handleLogout = async () => {
    if (isLive) await handleStopLive();
    await signOut(auth); router.replace("/login");
  };

  const TABS: NavTab[] = [
    { key: "home",      label: "Home",      icon: a => <Home         size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "trips",     label: "Trips",     icon: a => <List         size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "emergency", label: "Emergency", icon: a => <AlertTriangle size={20} color={a ? colors.red[500]   : colors.slate[400]} /> },
    { key: "profile",   label: "Profile",   icon: a => <User         size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
  ];

  const contentPad    = insets.top + spacing.md;
  const bottomPad     = NAV_HEIGHT + spacing.xl;
  const completedCount= trips.filter(t => t.status === "ended").length;
  const sortedTrips   = [...trips].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: contentPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}><Truck size={18} color={colors.white} /></View>
            <View>
              <Text style={styles.greeting}>{appUser?.name ? `Hi, ${appUser.name.split(" ")[0]}` : "Driver"}</Text>
              <View style={styles.rolePill}><Text style={styles.rolePillText}>Driver</Text></View>
            </View>
          </View>
          <View style={styles.headerRight}>
            {isLive && (
              <View style={styles.liveChip}>
                <View style={styles.livePulse} />
                <Text style={styles.liveChipText}>LIVE</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75} hitSlop={8}>
              <LogOut size={16} color={colors.red[500]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HOME TAB ── */}
        {tab === "home" && (
          !vehicle ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Car size={26} color={colors.slate[400]} /></View>
              <Text style={styles.emptyTitle}>No vehicle assigned</Text>
              <Text style={styles.emptyText}>Contact your admin to get a vehicle assigned to your account.</Text>
            </View>
          ) : (
            <>
              <View style={styles.statsRow}>
                {[
                  { val: trips.length.toString(), lbl: "Total trips" },
                  { val: completedCount.toString(), lbl: "Completed" },
                  { val: isLive ? "ON" : "OFF", lbl: "Live GPS", accent: isLive },
                ].map((s, i) => (
                  <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                    <Text style={[styles.statVal, s.accent && { color: colors.emerald[600] }]}>{s.val}</Text>
                    <Text style={styles.statLbl}>{s.lbl}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <View style={styles.vehicleRow}>
                  <View style={styles.vehicleIconBox}><Car size={20} color={colors.brand[600]} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={styles.vehicleSub}>{vehicle.plateNumber}{vehicle.year ? ` · ${vehicle.year}` : ""}</Text>
                  </View>
                  <View style={[styles.badge, vehicle.status === "active" ? styles.badgeGreen : vehicle.status === "maintenance" ? styles.badgeAmber : styles.badgeGray]}>
                    <Text style={[styles.badgeText, { color: vehicle.status === "active" ? colors.emerald[700] : vehicle.status === "maintenance" ? colors.amber[700] : colors.slate[600] }]}>{vehicle.status}</Text>
                  </View>
                </View>
              </View>

              <View style={[styles.livePanel, isLive && styles.livePanelActive]}>
                <View style={styles.livePanelHeader}>
                  <View style={[styles.liveIconBox, { backgroundColor: isLive ? colors.emerald[500] : colors.slate[100] }]}>
                    {isLive ? <Wifi size={20} color={colors.white} /> : <WifiOff size={20} color={colors.slate[400]} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.livePanelTitle}>Live location</Text>
                    <Text style={[styles.livePanelSub, isLive && { color: colors.emerald[600] }]}>
                      {isLive ? (activeTripId ? "Trip active — fleet admin sees you" : "Sharing location only") : "Share your GPS with fleet admin"}
                    </Text>
                  </View>
                  <View style={[styles.liveDot, { backgroundColor: isLive ? colors.emerald[500] : colors.slate[200] }]} />
                </View>
                {coords && isLive && (
                  <View style={styles.coordsRow}>
                    <MapPin size={11} color={colors.emerald[700]} />
                    <Text style={styles.coordsText}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}</Text>
                    <View style={styles.liveTag}><Text style={styles.liveTagText}>LIVE</Text></View>
                  </View>
                )}
                <View style={styles.livePanelActions}>
                  {!isLive ? (
                    <>
                      <TouchableOpacity style={[styles.liveBtn, styles.liveBtnGreen]} onPress={handleGoLive} activeOpacity={0.85}>
                        <Radio size={16} color={colors.white} /><Text style={styles.liveBtnText}>Go Live</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.liveBtn, styles.liveBtnBrand, tripLoading && { opacity: 0.6 }]} onPress={handleStartTrip} disabled={tripLoading} activeOpacity={0.85}>
                        {tripLoading ? <ActivityIndicator size="small" color={colors.white} /> : <><Navigation size={16} color={colors.white} /><Text style={styles.liveBtnText}>Start Trip</Text></>}
                      </TouchableOpacity>
                    </>
                  ) : activeTripId ? (
                    <TouchableOpacity style={[styles.liveBtnFull, styles.liveBtnRed, tripLoading && { opacity: 0.6 }]} onPress={handleEndTrip} disabled={tripLoading} activeOpacity={0.85}>
                      {tripLoading ? <ActivityIndicator size="small" color={colors.white} /> : <><StopCircle size={16} color={colors.white} /><Text style={styles.liveBtnText}>End Trip & Stop Sharing</Text></>}
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.liveBtn, styles.liveBtnOutline]} onPress={handleStopLive} activeOpacity={0.85}>
                        <WifiOff size={15} color={colors.slate[700]} /><Text style={[styles.liveBtnText, { color: colors.slate[700] }]}>Stop</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.liveBtn, styles.liveBtnBrand, tripLoading && { opacity: 0.6 }]} onPress={handleStartTrip} disabled={tripLoading} activeOpacity={0.85}>
                        {tripLoading ? <ActivityIndicator size="small" color={colors.white} /> : <><Navigation size={16} color={colors.white} /><Text style={styles.liveBtnText}>Log Trip</Text></>}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {!isLive && <Text style={styles.liveHint}><Text style={{ fontWeight: "700" }}>Go Live</Text> — location only · <Text style={{ fontWeight: "700" }}>Start Trip</Text> — logs in fleet record</Text>}
              </View>

              {trips.length === 0 && (
                <View style={styles.nudgeCard}>
                  <Bell size={16} color={colors.brand[600]} />
                  <Text style={styles.nudgeText}>No trips yet. Tap <Text style={{ fontWeight: "700" }}>Start Trip</Text> to log your first drive.</Text>
                </View>
              )}
            </>
          )
        )}

        {/* ── TRIPS TAB ── */}
        {tab === "trips" && (
          <>
            <View style={styles.statsRow}>
              {[
                { val: trips.length.toString(), lbl: "Total" },
                { val: completedCount.toString(), lbl: "Completed" },
                { val: trips.filter(t => t.status === "active").length.toString(), lbl: "Active" },
              ].map((s, i) => (
                <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
            {sortedTrips.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Navigation size={24} color={colors.slate[400]} /></View>
                <Text style={styles.emptyTitle}>No trips yet</Text>
                <Text style={styles.emptyText}>Go to Home and tap Start Trip to log your first drive.</Text>
              </View>
            ) : (
              <View style={styles.card}>
                <Text style={styles.sectionLabel}>All trips</Text>
                <View style={{ marginTop: spacing.md }}>
                  {sortedTrips.map((t, idx) => {
                    const isActive = t.status === "active";
                    const duration = t.endedAt ? Math.round((new Date(t.endedAt).getTime() - new Date(t.startedAt).getTime()) / 60000) : null;
                    const d = new Date(t.startedAt);
                    return (
                      <View key={t.tripId} style={[styles.tripRow, idx === sortedTrips.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={[styles.tripIcon, { backgroundColor: isActive ? colors.emerald[50] : colors.slate[50] }]}>
                          {isActive ? <Clock size={13} color={colors.emerald[600]} /> : <CheckCircle size={13} color={colors.slate[400]} />}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tripDate}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
                          {duration !== null && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 }}>
                              <Timer size={9} color={colors.slate[400]} />
                              <Text style={styles.tripDur}>{duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}</Text>
                            </View>
                          )}
                        </View>
                        <View style={[styles.badge, isActive ? styles.badgeGreen : styles.badgeGray]}>
                          <Text style={[styles.badgeText, { color: isActive ? colors.emerald[700] : colors.slate[600] }]}>{isActive ? "active" : "ended"}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {/* ── EMERGENCY TAB ── */}
        {tab === "emergency" && (
          <>
            {/* SOS Big Button */}
            <TouchableOpacity
              style={[styles.sosBtn, emergencySending === "Police / Emergency SOS" && { opacity: 0.7 }]}
              onPress={() => handleEmergencyCall({ label: "Police / Emergency SOS", phone: "100" })}
              disabled={!!emergencySending}
              activeOpacity={0.85}
            >
              {emergencySending === "Police / Emergency SOS"
                ? <ActivityIndicator size="small" color={colors.white} />
                : <AlertTriangle size={28} color={colors.white} />}
              <Text style={styles.sosBtnText}>EMERGENCY SOS</Text>
              <Text style={styles.sosBtnSub}>Tap to call 100 · Alerts admin &amp; mechanic</Text>
            </TouchableOpacity>

            {/* Info strip */}
            <View style={styles.alertInfoStrip}>
              <Send size={12} color={colors.brand[600]} />
              <Text style={styles.alertInfoText}>
                Tapping <Text style={{ fontWeight: "800" }}>Call</Text> sends your live location to the fleet admin and mechanic instantly.
              </Text>
            </View>

            <Text style={[styles.sectionLabel, { marginBottom: spacing.md }]}>Emergency services</Text>

            {EMERGENCY.map(e => (
              <View key={e.label} style={[styles.emergencyCard, { backgroundColor: e.bg }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.emergencyLabel, { color: e.color }]}>{e.label}</Text>
                  <Text style={styles.emergencyPhone}>{e.phone}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.callBtn, { backgroundColor: e.color }, emergencySending === e.label && { opacity: 0.6 }]}
                  onPress={() => handleEmergencyCall(e)}
                  disabled={!!emergencySending}
                  activeOpacity={0.85}
                >
                  {emergencySending === e.label
                    ? <ActivityIndicator size="small" color={colors.white} />
                    : <><PhoneCall size={14} color={colors.white} /><Text style={styles.callBtnText}>Call</Text></>}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{appUser?.name?.charAt(0).toUpperCase() ?? "D"}</Text>
              </View>
              <Text style={styles.profileName}>{appUser?.name ?? "Driver"}</Text>
              <Text style={styles.profileEmail}>{appUser?.email}</Text>
              <View style={styles.rolePillLg}><Text style={styles.rolePillLgText}>Driver</Text></View>
            </View>
            <View style={styles.card}>
              {[
                { lbl: "Email",        val: appUser?.email ?? "—" },
                { lbl: "Role",         val: "Driver" },
                { lbl: "Member since", val: appUser?.createdAt ? new Date(appUser.createdAt).toLocaleDateString() : "—" },
              ].map((row, i, arr) => (
                <View key={row.lbl} style={[styles.infoRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoLabel}>{row.lbl}</Text>
                  <Text style={styles.infoVal}>{row.val}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.logoutFullBtn} onPress={handleLogout} activeOpacity={0.85}>
              <LogOut size={16} color={colors.red[600]} />
              <Text style={styles.logoutFullText}>Sign out</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <BottomNav tabs={TABS} active={tab} onPress={k => setTab(k as Tab)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xxl },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: spacing.md },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge:   { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", ...shadow.brand },
  greeting:    { fontSize: fontSize.lg, fontWeight: "700", color: colors.slate[900] },
  rolePill:    { marginTop: 3, alignSelf: "flex-start", backgroundColor: colors.emerald[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  rolePillText:{ fontSize: 10, fontWeight: "800", color: colors.emerald[700], letterSpacing: 0.3 },

  liveChip:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: colors.emerald[50], paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.full, borderWidth: 1, borderColor: "#bbf7d0" },
  livePulse:   { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.emerald[500] },
  liveChipText:{ fontSize: 10, fontWeight: "800", color: colors.emerald[700], letterSpacing: 0.6 },
  logoutBtn:   { padding: 9, backgroundColor: colors.red[50], borderRadius: radius.md, borderWidth: 1, borderColor: "#fee2e2" },

  statsRow:    { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.md, ...shadow.cardMd },
  statCell:    { flex: 1, paddingVertical: spacing.lg, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.slate[100] },
  statVal:     { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },
  statLbl:     { fontSize: 10, color: colors.slate[400], marginTop: 3 },

  card:         { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md, ...shadow.card },
  vehicleRow:   { flexDirection: "row", alignItems: "center", gap: spacing.md },
  vehicleIconBox:{ width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  vehicleName:  { fontSize: fontSize.md, fontWeight: "700", color: colors.slate[900] },
  vehicleSub:   { fontSize: fontSize.sm, color: colors.slate[400], marginTop: 2 },

  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  badgeGreen: { backgroundColor: colors.emerald[50], borderWidth: 1, borderColor: "#bbf7d0" },
  badgeAmber: { backgroundColor: colors.amber[50], borderWidth: 1, borderColor: "#fde68a" },
  badgeGray:  { backgroundColor: colors.slate[100], borderWidth: 1, borderColor: colors.slate[200] },
  badgeText:  { fontSize: 10, fontWeight: "800" },

  livePanel:       { backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.md, overflow: "hidden", borderWidth: 1.5, borderColor: colors.slate[200], ...shadow.card },
  livePanelActive: { borderColor: "#6ee7b7", shadowColor: "#10b981", shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  livePanelHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.xl },
  liveIconBox:     { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  livePanelTitle:  { fontSize: fontSize.base, fontWeight: "700", color: colors.slate[900] },
  livePanelSub:    { fontSize: fontSize.sm, color: colors.slate[400], marginTop: 2 },
  liveDot:         { width: 11, height: 11, borderRadius: 6 },
  coordsRow:       { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ecfdf5", paddingHorizontal: spacing.xl, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#d1fae5" },
  coordsText:      { flex: 1, fontSize: 11, color: colors.emerald[700], fontWeight: "600" },
  liveTag:         { backgroundColor: colors.emerald[500], paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.sm },
  liveTagText:     { fontSize: 9, fontWeight: "800", color: colors.white, letterSpacing: 0.5 },
  livePanelActions:{ flexDirection: "row", gap: spacing.sm, padding: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: "#f8fafc" },
  liveBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: 13, borderRadius: radius.lg },
  liveBtnFull:     { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: 13, borderRadius: radius.lg },
  liveBtnGreen:    { backgroundColor: "#10b981" },
  liveBtnBrand:    { backgroundColor: colors.brand[600] },
  liveBtnRed:      { backgroundColor: colors.red[600] },
  liveBtnOutline:  { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.slate[200] },
  liveBtnText:     { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },
  liveHint:        { fontSize: 10, color: colors.slate[400], textAlign: "center", paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, lineHeight: 15 },

  nudgeCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.brand[50], borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.brand[100] },
  nudgeText: { flex: 1, fontSize: fontSize.sm, color: colors.brand[700], lineHeight: 19 },

  sectionLabel: { fontSize: 10, fontWeight: "800", color: colors.slate[400], textTransform: "uppercase", letterSpacing: 0.9 },
  tripRow:      { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  tripIcon:     { width: 32, height: 32, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  tripDate:     { fontSize: fontSize.sm, color: colors.slate[700], fontWeight: "500" },
  tripDur:      { fontSize: 10, color: colors.slate[400] },

  sosBtn:      { backgroundColor: colors.red[600], borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", marginBottom: spacing.md, gap: spacing.sm, ...shadow.cardMd },
  sosBtnText:  { fontSize: fontSize.xl, fontWeight: "900", color: colors.white, letterSpacing: 1 },
  sosBtnSub:   { fontSize: fontSize.sm, color: "rgba(255,255,255,0.75)", textAlign: "center" },

  alertInfoStrip: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, backgroundColor: colors.brand[50], borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.brand[100] },
  alertInfoText:  { flex: 1, fontSize: 11, color: colors.brand[700], lineHeight: 16 },

  emergencyCard:{ flexDirection: "row", alignItems: "center", borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, gap: spacing.md },
  emergencyLabel:{ fontSize: fontSize.base, fontWeight: "700" },
  emergencyPhone:{ fontSize: fontSize.sm, color: colors.slate[500], marginTop: 2 },
  callBtn:     { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md },
  callBtnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.sm },

  profileCard:      { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", marginBottom: spacing.md, ...shadow.cardMd },
  profileAvatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", marginBottom: spacing.md, ...shadow.brand },
  profileAvatarText:{ fontSize: fontSize.xxl, fontWeight: "800", color: colors.white },
  profileName:      { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },
  profileEmail:     { fontSize: fontSize.sm, color: colors.slate[400], marginTop: 4, marginBottom: spacing.md },
  rolePillLg:       { backgroundColor: colors.emerald[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  rolePillLgText:   { fontSize: fontSize.sm, fontWeight: "800", color: colors.emerald[700] },

  infoRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  infoLabel: { fontSize: fontSize.sm, color: colors.slate[400] },
  infoVal:   { fontSize: fontSize.sm, fontWeight: "600", color: colors.slate[800], maxWidth: "60%", textAlign: "right" },

  logoutFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.red[50], borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderColor: colors.red[100] },
  logoutFullText:{ fontSize: fontSize.base, fontWeight: "700", color: colors.red[600] },

  emptyCard:  { backgroundColor: colors.white, borderRadius: radius.xl, paddingVertical: 60, paddingHorizontal: spacing.xxl, alignItems: "center", ...shadow.card },
  emptyIcon:  { width: 60, height: 60, borderRadius: radius.xxl, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.slate[700] },
  emptyText:  { fontSize: fontSize.sm, color: colors.slate[400], marginTop: spacing.sm, textAlign: "center", maxWidth: 250 },
});
