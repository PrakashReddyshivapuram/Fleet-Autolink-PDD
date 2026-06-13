import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where, doc, updateDoc } from "firebase/firestore";
import { ref as dbRef, onValue, remove } from "firebase/database";
import { db, rtdb, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Wrench, AlertTriangle, LogOut, CheckCircle,
  Clock, User, AlertCircle, Timer,
  MapPin, PhoneCall, X, Siren,
} from "lucide-react-native";
import { Job } from "@/types";
import BottomNav, { NAV_HEIGHT, NavTab } from "@/components/BottomNav";

type Tab = "jobs" | "profile";

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

export default function MechanicScreen() {
  const { appUser } = useAuth();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("jobs");

  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [loading, setLoading]           = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  useEffect(() => {
    if (!appUser) return;
    const q = query(collection(db, "jobs"), where("mechanicId", "==", appUser.uid));
    const unsub = onSnapshot(q, snap => {
      setJobs(snap.docs.map(d => ({ ...(d.data() as Job), id: d.id })));
      setLoading(false);
    });
    return () => unsub();
  }, [appUser?.uid]);

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

  const updateStatus = async (jobId: string, status: string) => {
    await updateDoc(doc(db, "jobs", jobId), { status }).catch(() => {});
  };

  const TABS: NavTab[] = [
    { key: "jobs",    label: "My Jobs", icon: a => <Wrench size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
    { key: "profile", label: "Profile", icon: a => <User   size={20} color={a ? colors.brand[600] : colors.slate[400]} /> },
  ];

  const contentPad  = insets.top + spacing.md;
  const bottomPad   = NAV_HEIGHT + spacing.xl;
  const pendingJobs = jobs.filter(j => j.status === "pending");
  const activeJobs  = jobs.filter(j => j.status === "in_progress");
  const doneJobs    = jobs.filter(j => j.status === "done");
  const overdueJobs = jobs.filter(j => j.status !== "done" && j.dueDate && new Date(j.dueDate) < new Date());

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
            <View style={styles.logoBadge}><Wrench size={18} color={colors.white} /></View>
            <View>
              <Text style={styles.greeting}>{appUser?.name ? `Hi, ${appUser.name.split(" ")[0]}` : "Mechanic"}</Text>
              <View style={styles.rolePill}><Text style={styles.rolePillText}>Mechanic</Text></View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75} hitSlop={8}>
            <LogOut size={16} color={colors.red[500]} />
          </TouchableOpacity>
        </View>

        {/* ── JOBS TAB ── */}
        {tab === "jobs" && (
          <>
            <View style={styles.statsRow}>
              {[
                { val: jobs.length,        lbl: "Total",   clr: colors.slate[900] },
                { val: activeJobs.length,  lbl: "Active",  clr: colors.brand[600] },
                { val: doneJobs.length,    lbl: "Done",    clr: colors.emerald[600] },
                { val: overdueJobs.length, lbl: "Overdue", clr: colors.red[500] },
              ].map((s, i) => (
                <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                  <Text style={[styles.statVal, { color: s.clr }]}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>

            {overdueJobs.length > 0 && (
              <View style={styles.alertCard}>
                <View style={styles.alertIcon}><AlertTriangle size={18} color={colors.red[600]} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>{overdueJobs.length} overdue job{overdueJobs.length > 1 ? "s" : ""}</Text>
                  <Text style={styles.alertSub}>Please address these as soon as possible</Text>
                </View>
              </View>
            )}

            {jobs.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Wrench size={26} color={colors.slate[400]} /></View>
                <Text style={styles.emptyTitle}>No jobs assigned</Text>
                <Text style={styles.emptyBody}>Your admin will assign maintenance jobs here.</Text>
              </View>
            ) : (
              <>
                {activeJobs.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>In progress</Text>
                    {activeJobs.map(j => <JobCard key={j.jobId} job={j} onUpdate={updateStatus} />)}
                  </>
                )}
                {pendingJobs.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginBottom: spacing.sm, marginTop: activeJobs.length > 0 ? spacing.lg : 0 }]}>Pending</Text>
                    {pendingJobs.map(j => <JobCard key={j.jobId} job={j} onUpdate={updateStatus} />)}
                  </>
                )}
                {doneJobs.length > 0 && (
                  <>
                    <Text style={[styles.sectionLabel, { marginBottom: spacing.sm, marginTop: spacing.lg }]}>Completed</Text>
                    {doneJobs.map(j => <JobCard key={j.jobId} job={j} onUpdate={updateStatus} />)}
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{appUser?.name?.charAt(0).toUpperCase() ?? "M"}</Text>
              </View>
              <Text style={styles.profileName}>{appUser?.name ?? "Mechanic"}</Text>
              <Text style={styles.profileEmail}>{appUser?.email}</Text>
              <View style={styles.rolePillLg}><Text style={styles.rolePillLgText}>Mechanic</Text></View>
            </View>
            <View style={styles.card}>
              {[
                { lbl: "Email",         val: appUser?.email ?? "—" },
                { lbl: "Role",          val: "Mechanic" },
                { lbl: "Jobs assigned", val: jobs.length.toString() },
                { lbl: "Jobs done",     val: doneJobs.length.toString() },
                { lbl: "Member since",  val: appUser?.createdAt ? new Date(appUser.createdAt).toLocaleDateString() : "—" },
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

function JobCard({ job, onUpdate }: { job: Job; onUpdate: (id: string, status: string) => void }) {
  const isOverdue = job.status !== "done" && job.dueDate && new Date(job.dueDate) < new Date();
  const isDone    = job.status === "done";
  const isActive  = job.status === "in_progress";

  const borderColor = isOverdue ? colors.red[200] : isActive ? colors.brand[200] : isDone ? "#bbf7d0" : colors.slate[100];
  const iconBg      = isOverdue ? colors.red[50]  : isActive ? colors.brand[50] : isDone ? colors.emerald[50] : colors.slate[50];
  const iconColor   = isOverdue ? colors.red[500] : isActive ? colors.brand[500] : isDone ? colors.emerald[500] : colors.slate[400];

  return (
    <View style={[jobStyles.root, { borderColor }]}>
      <View style={jobStyles.topRow}>
        <View style={[jobStyles.iconBox, { backgroundColor: iconBg }]}>
          {isDone
            ? <CheckCircle size={16} color={iconColor} />
            : isOverdue
              ? <AlertCircle size={16} color={iconColor} />
              : <Wrench size={16} color={iconColor} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={jobStyles.title} numberOfLines={2}>{job.description ?? job.type ?? "Maintenance job"}</Text>
          {job.vehicleId && <Text style={jobStyles.sub}>Vehicle: {job.vehicleId}</Text>}
        </View>
        {isOverdue && (
          <View style={jobStyles.overduePill}>
            <Text style={jobStyles.overduePillText}>OVERDUE</Text>
          </View>
        )}
      </View>

      {job.dueDate && (
        <View style={jobStyles.dueRow}>
          <Timer size={11} color={isOverdue ? colors.red[500] : colors.slate[400]} />
          <Text style={[jobStyles.dueText, isOverdue && { color: colors.red[500] }]}>
            {isOverdue ? "Was due " : "Due "}
            {new Date(job.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      )}

      {!isDone && (
        <View style={jobStyles.actions}>
          {job.status === "pending" && (
            <TouchableOpacity style={[jobStyles.btn, jobStyles.btnBrand]} onPress={() => onUpdate(job.jobId, "in_progress")} activeOpacity={0.85}>
              <Clock size={13} color={colors.white} />
              <Text style={jobStyles.btnText}>Start job</Text>
            </TouchableOpacity>
          )}
          {job.status === "in_progress" && (
            <TouchableOpacity style={[jobStyles.btn, jobStyles.btnGreen]} onPress={() => onUpdate(job.jobId, "done")} activeOpacity={0.85}>
              <CheckCircle size={13} color={colors.white} />
              <Text style={jobStyles.btnText}>Mark done</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const jobStyles = StyleSheet.create({
  root:           { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1.5, ...shadow.card },
  topRow:         { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  iconBox:        { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center", marginTop: 1 },
  title:          { fontSize: fontSize.base, fontWeight: "700", color: colors.slate[900], lineHeight: 20 },
  sub:            { fontSize: 11, color: colors.slate[400], marginTop: 3 },
  overduePill:    { backgroundColor: colors.red[600], paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full },
  overduePillText:{ fontSize: 9, fontWeight: "800", color: colors.white, letterSpacing: 0.5 },
  dueRow:         { flexDirection: "row", alignItems: "center", gap: 5, marginTop: spacing.sm, paddingLeft: 38 + spacing.md },
  dueText:        { fontSize: 11, color: colors.slate[400] },
  actions:        { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, paddingLeft: 38 + spacing.md },
  btn:            { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md },
  btnBrand:       { backgroundColor: colors.brand[600] },
  btnGreen:       { backgroundColor: colors.emerald[500] },
  btnText:        { fontSize: fontSize.sm, fontWeight: "700", color: colors.white },
});

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xxl },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoBadge:   { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", ...shadow.brand },
  greeting:    { fontSize: fontSize.lg, fontWeight: "700", color: colors.slate[900] },
  rolePill:    { marginTop: 3, alignSelf: "flex-start", backgroundColor: "#f5f3ff", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  rolePillText:{ fontSize: 10, fontWeight: "800", color: colors.violet[700], letterSpacing: 0.3 },
  logoutBtn:   { padding: 9, backgroundColor: colors.red[50], borderRadius: radius.md, borderWidth: 1, borderColor: "#fee2e2" },

  statsRow:    { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.md, ...shadow.cardMd },
  statCell:    { flex: 1, paddingVertical: spacing.lg, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.slate[100] },
  statVal:     { fontSize: fontSize.xl, fontWeight: "800" },
  statLbl:     { fontSize: 10, color: colors.slate[400], marginTop: 3 },

  sectionLabel:{ fontSize: 10, fontWeight: "800", color: colors.slate[400], textTransform: "uppercase", letterSpacing: 0.9 },

  alertCard:  { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.red[50], borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.red[100] },
  alertIcon:  { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.red[100], alignItems: "center", justifyContent: "center" },
  alertTitle: { fontSize: fontSize.sm, fontWeight: "700", color: colors.red[700] },
  alertSub:   { fontSize: 11, color: colors.red[500], marginTop: 2 },

  emptyCard:  { backgroundColor: colors.white, borderRadius: radius.xl, paddingVertical: 60, paddingHorizontal: spacing.xxl, alignItems: "center", ...shadow.card },
  emptyIcon:  { width: 60, height: 60, borderRadius: radius.xxl, backgroundColor: colors.slate[100], alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  emptyTitle: { fontSize: fontSize.md, fontWeight: "700", color: colors.slate[700] },
  emptyBody:  { fontSize: fontSize.sm, color: colors.slate[400], marginTop: spacing.sm, textAlign: "center", maxWidth: 250 },

  card:        { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.md, ...shadow.card },

  profileCard:      { backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.xxl, alignItems: "center", marginBottom: spacing.md, ...shadow.cardMd },
  profileAvatar:    { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", marginBottom: spacing.md, ...shadow.brand },
  profileAvatarText:{ fontSize: fontSize.xxl, fontWeight: "800", color: colors.white },
  profileName:      { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },
  profileEmail:     { fontSize: fontSize.sm, color: colors.slate[400], marginTop: 4, marginBottom: spacing.md },
  rolePillLg:       { backgroundColor: "#f5f3ff", paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  rolePillLgText:   { fontSize: fontSize.sm, fontWeight: "800", color: colors.violet[700] },

  infoRow:   { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  infoLabel: { fontSize: fontSize.sm, color: colors.slate[400] },
  infoVal:   { fontSize: fontSize.sm, fontWeight: "600", color: colors.slate[800], maxWidth: "60%", textAlign: "right" },

  logoutFullBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.red[50], borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md, borderWidth: 1, borderColor: colors.red[100] },
  logoutFullText:{ fontSize: fontSize.base, fontWeight: "700", color: colors.red[600] },

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
