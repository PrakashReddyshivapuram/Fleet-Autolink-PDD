import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref as dbRef, onValue, remove } from "firebase/database";
import { db, rtdb, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Car, Wrench, AlertTriangle, LogOut,
  CheckCircle, Clock, User, LayoutDashboard,
  MapPin, PhoneCall, X, Siren, Radio,
} from "lucide-react-native";
import { Vehicle, Job } from "@/types";
import BottomNav, { NAV_HEIGHT, NavTab } from "@/components/BottomNav";
import LiveMapView from "@/components/LiveMapView";

interface EmergencyAlert {
  driverId: string;
  driverName: string;
  vehicleId: string | null;
  vehiclePlate: string | null;
  vehicleMake: string | null;
  lat: number | null;
  lng: number | null;
  service: string;
  phone: string;
  timestamp: number;
}

type Tab = "overview" | "vehicles" | "jobs" | "live" | "profile";

export default function AdminScreen() {
  const { appUser } = useAuth();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("overview");

  const [vehicles, setVehicles]         = useState<Vehicle[]>([]);
  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [loading, setLoading]           = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    const vunsub = onSnapshot(collection(db, "vehicles"), snap => {
      setVehicles(snap.docs.map(d => d.data() as Vehicle));
      setLoading(false);
    });
    const junsub = onSnapshot(collection(db, "jobs"), snap => {
      setJobs(snap.docs.map(d => ({ ...(d.data() as Job), id: d.id })));
    });
    return () => { vunsub(); junsub(); };
  }, []);

  // Real-time emergency alert listener
  useEffect(() => {
    const alertsRef = dbRef(rtdb, "emergencyAlerts");
    const unsub = onValue(alertsRef, snap => {
      if (!snap.exists()) { setEmergencyAlerts([]); return; }
      const raw = snap.val() as Record<string, EmergencyAlert>;
      setEmergencyAlerts(Object.values(raw));
    });
    return () => unsub();
  }, []);

  const dismissAlert = async (driverId: string) => {
    await remove(dbRef(rtdb, `emergencyAlerts/${driverId}`)).catch(() => {});
  };

  const handleLogout = async () => { await signOut(auth); router.replace("/login"); };

  const markJobDone = async (jobId: string) => {
    await updateDoc(doc(db, "jobs", jobId), { status: "done" }).catch(() => {});
  };

  const TABS: NavTab[] = [
    { key: "overview", label: "Overview", icon: a => <LayoutDashboard size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "vehicles", label: "Vehicles", icon: a => <Car    size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "jobs",     label: "Jobs",     icon: a => <Wrench size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "live",     label: "Live",     icon: a => <Radio  size={20} color={a ? colors.emerald[600] : colors.slate[400]} /> },
    { key: "profile",  label: "Profile",  icon: a => <User   size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
  ];

  const contentPad    = insets.top + spacing.md;
  const bottomPad     = NAV_HEIGHT + spacing.xl;
  const activeV       = vehicles.filter(v => v.status === "active").length;
  const maintV        = vehicles.filter(v => v.status === "maintenance").length;
  const pendingJ      = jobs.filter(j => j.status === "pending" || j.status === "in_progress").length;
  const overdueJobs   = jobs.filter(j => j.status !== "done" && j.dueDate && new Date(j.dueDate) < new Date());

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.surface }]}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* ── Real-time Emergency Alerts Banner ── */}
      {emergencyAlerts.length > 0 && (
        <View style={styles.emergencyBannerWrap}>
          {emergencyAlerts.map(alert => (
            <View key={alert.driverId} style={styles.emergencyBanner}>
              <View style={styles.emergencyBannerIcon}><Siren size={18} color={colors.white} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.emergencyBannerTitle}>
                  {alert.driverName} · {alert.service}
                </Text>
                {alert.vehicleMake && (
                  <Text style={styles.emergencyBannerSub}>{alert.vehicleMake}{alert.vehiclePlate ? ` (${alert.vehiclePlate})` : ""}</Text>
                )}
                {alert.lat && alert.lng && (
                  <View style={styles.emergencyBannerCoords}>
                    <MapPin size={9} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.emergencyBannerCoordsText}>{alert.lat.toFixed(4)}, {alert.lng.toFixed(4)}</Text>
                  </View>
                )}
                <Text style={styles.emergencyBannerTime}>
                  {new Date(alert.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <View style={styles.emergencyBannerActions}>
                <TouchableOpacity
                  style={styles.emergencyCallBtn}
                  onPress={() => Linking.openURL(`tel:${alert.phone}`)}
                  activeOpacity={0.85}
                >
                  <PhoneCall size={13} color={colors.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.emergencyDismissBtn}
                  onPress={() => dismissAlert(alert.driverId)}
                  activeOpacity={0.85}
                >
                  <X size={13} color={colors.red[600]} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: contentPad, paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBadge}><LayoutDashboard size={18} color={colors.white} /></View>
            <View>
              <Text style={styles.greeting}>{appUser?.name ? `Hi, ${appUser.name.split(" ")[0]}` : "Admin"}</Text>
              <View style={styles.rolePill}><Text style={styles.rolePillText}>Admin</Text></View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75} hitSlop={8}>
            <LogOut size={16} color={colors.red[500]} />
          </TouchableOpacity>
        </View>

        {/* ── OVERVIEW TAB ── */}
        {tab === "overview" && (
          <>
            <View style={styles.statsGrid}>
              {[
                { val: vehicles.length, lbl: "Total vehicles", icon: <Car size={18} color={colors.brand[600]} />,      bg: colors.brand[50]    },
                { val: activeV,         lbl: "Active",          icon: <CheckCircle size={18} color={colors.emerald[600]} />, bg: colors.emerald[50] },
                { val: maintV,          lbl: "Maintenance",     icon: <Wrench size={18} color={colors.amber[600]} />,   bg: colors.amber[50]    },
                { val: pendingJ,        lbl: "Pending jobs",    icon: <Clock size={18} color={colors.violet[600]} />,   bg: "#f5f3ff"           },
              ].map(s => (
                <View key={s.lbl} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: s.bg }]}>{s.icon}</View>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>

            {overdueJobs.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertIcon}><AlertTriangle size={18} color={colors.red[600]} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{overdueJobs.length} overdue job{overdueJobs.length > 1 ? "s" : ""}</Text>
                  <Text style={styles.alertSub}>
                    {overdueJobs.slice(0, 2).map(j => j.description ?? j.type ?? j.jobId).join(", ")}
                    {overdueJobs.length > 2 ? ` +${overdueJobs.length - 2} more` : ""}
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.sectionLabel}>Recent vehicles</Text>
            <View style={[styles.card, { marginTop: spacing.sm }]}>
              {vehicles.length === 0 ? (
                <Text style={styles.emptyText}>No vehicles in fleet yet.</Text>
              ) : vehicles.slice(0, 4).map((v, i) => (
                <View key={v.vehicleId} style={[styles.row, i === Math.min(vehicles.length, 4) - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.rowIcon}><Car size={16} color={colors.brand[600]} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{v.make} {v.model}</Text>
                    <Text style={styles.rowSub}>{v.plateNumber}{v.year ? ` · ${v.year}` : ""}</Text>
                  </View>
                  <StatusBadge status={v.status} />
                </View>
              ))}
            </View>

            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>Recent jobs</Text>
            <View style={[styles.card, { marginTop: spacing.sm }]}>
              {jobs.length === 0 ? (
                <Text style={styles.emptyText}>No jobs logged yet.</Text>
              ) : jobs.slice(0, 4).map((j, i) => {
                const overdue = j.status !== "done" && j.dueDate && new Date(j.dueDate) < new Date();
                return (
                  <View key={j.jobId ?? i} style={[styles.row, i === Math.min(jobs.length, 4) - 1 && { borderBottomWidth: 0 }]}>
                    <View style={[styles.rowIcon, { backgroundColor: overdue ? colors.red[50] : j.status === "done" ? colors.emerald[50] : "#f5f3ff" }]}>
                      <Wrench size={14} color={overdue ? colors.red[500] : j.status === "done" ? colors.emerald[500] : colors.violet[500]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{j.description ?? j.type ?? "Maintenance job"}</Text>
                      {j.dueDate && <Text style={[styles.rowSub, overdue && { color: colors.red[500] }]}>{overdue ? "Overdue · " : "Due "}{new Date(j.dueDate).toLocaleDateString()}</Text>}
                    </View>
                    <JobBadge status={j.status} overdue={!!overdue} />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ── VEHICLES TAB ── */}
        {tab === "vehicles" && (
          <>
            <View style={styles.statsRow}>
              {[{ val: vehicles.length, lbl: "Total" }, { val: activeV, lbl: "Active" }, { val: maintV, lbl: "Maintenance" }].map((s, i) => (
                <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                  <Text style={styles.statValLg}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
            {vehicles.length === 0 ? (
              <EmptyState icon={<Car size={26} color={colors.slate[400]} />} title="No vehicles yet" body="Add vehicles from the web admin dashboard." />
            ) : (
              <View style={styles.card}>
                <Text style={[styles.sectionLabel, { marginBottom: spacing.md }]}>All vehicles</Text>
                {vehicles.map((v, i) => (
                  <View key={v.vehicleId} style={[styles.row, i === vehicles.length - 1 && { borderBottomWidth: 0 }]}>
                    <View style={styles.rowIcon}><Car size={16} color={colors.brand[600]} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle}>{v.make} {v.model}</Text>
                      <Text style={styles.rowSub}>{v.plateNumber}{v.year ? ` · ${v.year}` : ""}</Text>
                    </View>
                    <StatusBadge status={v.status} />
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── JOBS TAB ── */}
        {tab === "jobs" && (
          <>
            <View style={styles.statsRow}>
              {[{ val: jobs.length, lbl: "Total" }, { val: pendingJ, lbl: "Pending" }, { val: jobs.filter(j => j.status === "done").length, lbl: "Done" }].map((s, i) => (
                <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                  <Text style={styles.statValLg}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>
            {jobs.length === 0 ? (
              <EmptyState icon={<Wrench size={26} color={colors.slate[400]} />} title="No jobs yet" body="Create maintenance jobs from the web dashboard." />
            ) : (
              <View style={styles.card}>
                <Text style={[styles.sectionLabel, { marginBottom: spacing.md }]}>All jobs</Text>
                {[...jobs].sort((a, b) => (a.status === "done" ? 1 : 0) - (b.status === "done" ? 1 : 0)).map((j, i, arr) => {
                  const overdue = j.status !== "done" && j.dueDate && new Date(j.dueDate) < new Date();
                  return (
                    <View key={j.jobId ?? i} style={[styles.row, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={[styles.rowIcon, { backgroundColor: overdue ? colors.red[50] : j.status === "done" ? colors.emerald[50] : "#f5f3ff" }]}>
                        <Wrench size={14} color={overdue ? colors.red[500] : j.status === "done" ? colors.emerald[500] : colors.violet[500]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rowTitle} numberOfLines={1}>{j.description ?? j.type ?? "Maintenance job"}</Text>
                        {j.dueDate && <Text style={[styles.rowSub, overdue && { color: colors.red[500] }]}>{overdue ? "Overdue · " : "Due "}{new Date(j.dueDate).toLocaleDateString()}</Text>}
                      </View>
                      {j.status !== "done" ? (
                        <TouchableOpacity style={styles.doneBtn} onPress={() => markJobDone(j.jobId)} activeOpacity={0.8}>
                          <Text style={styles.doneBtnText}>Mark done</Text>
                        </TouchableOpacity>
                      ) : (
                        <JobBadge status={j.status} overdue={false} />
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* ── LIVE TAB ── */}
        {tab === "live" && (
          <>
            <View style={styles.liveHeader}>
              <View style={styles.liveHeaderLeft}>
                <View style={styles.livePulse} />
                <Text style={styles.liveHeaderTitle}>Live fleet tracking</Text>
              </View>
              <Text style={styles.liveHeaderSub}>Updates every 5 s</Text>
            </View>
            <LiveMapView vehicles={vehicles} height={460} />
            <View style={[styles.card, { marginTop: spacing.md }]}>
              <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>About live tracking</Text>
              <Text style={styles.liveInfo}>
                Vehicles appear on the map as soon as a driver taps <Text style={{ fontWeight: "700" }}>Go Live</Text> or <Text style={{ fontWeight: "700" }}>Start Trip</Text> on their app. Tap a vehicle pill to zoom in. Markers fade when a signal is older than 1 minute.
              </Text>
            </View>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{appUser?.name?.charAt(0).toUpperCase() ?? "A"}</Text>
              </View>
              <Text style={styles.profileName}>{appUser?.name ?? "Admin"}</Text>
              <Text style={styles.profileEmail}>{appUser?.email}</Text>
              <View style={styles.rolePillLg}><Text style={styles.rolePillLgText}>Fleet Admin</Text></View>
            </View>
            <View style={styles.card}>
              {[
                { lbl: "Email",          val: appUser?.email ?? "—" },
                { lbl: "Role",           val: "Admin" },
                { lbl: "Total vehicles", val: vehicles.length.toString() },
                { lbl: "Total jobs",     val: jobs.length.toString() },
                { lbl: "Member since",   val: appUser?.createdAt ? new Date(appUser.createdAt).toLocaleDateString() : "—" },
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

function StatusBadge({ status }: { status: string }) {
  const isActive = status === "active";
  const isMaint  = status === "maintenance";
  return (
    <View style={[badgeBase, isActive ? badgeGreen : isMaint ? badgeAmber : badgeGray]}>
      <Text style={[badgeText, { color: isActive ? colors.emerald[700] : isMaint ? colors.amber[700] : colors.slate[600] }]}>{status}</Text>
    </View>
  );
}

function JobBadge({ status, overdue }: { status: string; overdue: boolean }) {
  const isDone = status === "done";
  return (
    <View style={[badgeBase, isDone ? badgeGreen : overdue ? badgeRed : badgePurple]}>
      <Text style={[badgeText, { color: isDone ? colors.emerald[700] : overdue ? colors.red[700] : colors.violet[700] }]}>{status}</Text>
    </View>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={emptyCardStyle}>
      <View style={emptyIconStyle}>{icon}</View>
      <Text style={emptyTitleStyle}>{title}</Text>
      <Text style={emptyBodyStyle}>{body}</Text>
    </View>
  );
}

const badgeBase   = { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 } as const;
const badgeGreen  = { backgroundColor: colors.emerald[50], borderWidth: 1, borderColor: "#bbf7d0" } as const;
const badgeAmber  = { backgroundColor: colors.amber[50],   borderWidth: 1, borderColor: "#fde68a" } as const;
const badgeGray   = { backgroundColor: colors.slate[100],  borderWidth: 1, borderColor: colors.slate[200] } as const;
const badgeRed    = { backgroundColor: colors.red[50],     borderWidth: 1, borderColor: "#fecaca" } as const;
const badgePurple = { backgroundColor: "#f5f3ff",          borderWidth: 1, borderColor: "#e9d5ff" } as const;
const badgeText   = { fontSize: 10, fontWeight: "800" } as const;
const emptyCardStyle  = { backgroundColor: colors.white, borderRadius: radius.xl, paddingVertical: 60, paddingHorizontal: spacing.xxl, alignItems: "center" as const, ...shadow.card };
const emptyIconStyle  = { width: 60, height: 60, borderRadius: radius.xxl, backgroundColor: colors.slate[100], alignItems: "center" as const, justifyContent: "center" as const, marginBottom: spacing.lg };
const emptyTitleStyle = { fontSize: fontSize.md, fontWeight: "700" as const, color: colors.slate[700] };
const emptyBodyStyle  = { fontSize: fontSize.sm, color: colors.slate[400], marginTop: spacing.sm, textAlign: "center" as const, maxWidth: 250 };

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xxl },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoBadge:   { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", ...shadow.brand },
  greeting:    { fontSize: fontSize.lg, fontWeight: "700", color: colors.slate[900] },
  rolePill:    { marginTop: 3, alignSelf: "flex-start", backgroundColor: colors.brand[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  rolePillText:{ fontSize: 10, fontWeight: "800", color: colors.brand[700], letterSpacing: 0.3 },
  logoutBtn:   { padding: 9, backgroundColor: colors.red[50], borderRadius: radius.md, borderWidth: 1, borderColor: "#fee2e2" },

  statsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  statCard:    { width: "47.5%", backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  statIconBox: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  statVal:     { fontSize: fontSize.xxl, fontWeight: "800", color: colors.slate[900] },
  statLbl:     { fontSize: 11, color: colors.slate[400] },

  statsRow:    { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.md, ...shadow.cardMd },
  statCell:    { flex: 1, paddingVertical: spacing.lg, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.slate[100] },
  statValLg:   { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },

  sectionLabel:{ fontSize: 10, fontWeight: "800", color: colors.slate[400], textTransform: "uppercase", letterSpacing: 0.9 },

  alertCard:  { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.red[50], borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.red[100] },
  alertIcon:  { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.red[100], alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.red[700] },
  alertSub:   { fontSize: 11, color: colors.red[500], marginTop: 2 },

  card:    { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md, ...shadow.card },
  row:     { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm + 4, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.brand[50], alignItems: "center", justifyContent: "center" },
  rowTitle:{ fontSize: fontSize.sm, fontWeight: "700", color: colors.slate[900] },
  rowSub:  { fontSize: 11, color: colors.slate[400], marginTop: 2 },

  doneBtn:    { backgroundColor: colors.brand[600], paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.md },
  doneBtnText:{ fontSize: 11, fontWeight: "700", color: colors.white },

  emptyText:{ fontSize: fontSize.sm, color: colors.slate[400], textAlign: "center", paddingVertical: spacing.md },

  profileCard:      { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", marginBottom: spacing.md, ...shadow.cardMd },
  profileAvatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", marginBottom: spacing.md, ...shadow.brand },
  profileAvatarText:{ fontSize: fontSize.xxl, fontWeight: "800", color: colors.white },
  profileName:      { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },
  profileEmail:     { fontSize: fontSize.sm, color: colors.slate[400], marginTop: 4, marginBottom: spacing.md },
  rolePillLg:       { backgroundColor: colors.brand[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  rolePillLgText:   { fontSize: fontSize.sm, fontWeight: "800", color: colors.brand[700] },

  infoRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  infoLabel: { fontSize: fontSize.sm, color: colors.slate[400] },
  infoVal:   { fontSize: fontSize.sm, fontWeight: "600", color: colors.slate[800], maxWidth: "60%", textAlign: "right" },

  logoutFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.red[50], borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderColor: colors.red[100] },
  logoutFullText:{ fontSize: fontSize.base, fontWeight: "700", color: colors.red[600] },

  // Live tab
  liveHeader:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  liveHeaderLeft:  { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  livePulse:       { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.emerald[500] },
  liveHeaderTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.slate[900] },
  liveHeaderSub:   { fontSize: 11, color: colors.slate[400] },
  liveInfo:        { fontSize: fontSize.sm, color: colors.slate[500], lineHeight: 20 },

  // Emergency alert banner
  emergencyBannerWrap:  { backgroundColor: colors.red[600], paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.sm },
  emergencyBanner:      { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, backgroundColor: "rgba(0,0,0,0.15)", borderRadius: radius.lg, padding: spacing.md },
  emergencyBannerIcon:  { width: 36, height: 36, borderRadius: radius.md, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginTop: 1 },
  emergencyBannerTitle: { fontSize: fontSize.base, fontWeight: "800", color: colors.white },
  emergencyBannerSub:   { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  emergencyBannerCoords:{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  emergencyBannerCoordsText: { fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  emergencyBannerTime:  { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  emergencyBannerActions: { gap: spacing.sm, alignItems: "center", justifyContent: "center" },
  emergencyCallBtn:     { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  emergencyDismissBtn:  { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
});
