import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  Car, Wrench, LogOut, User, ChevronDown, ChevronUp,
  CheckCircle, AlertTriangle, Gauge, Radio,
} from "lucide-react-native";
import { Vehicle, Job } from "@/types";
import BottomNav, { NAV_HEIGHT, NavTab } from "@/components/BottomNav";
import LiveMapView from "@/components/LiveMapView";

type Tab = "vehicles" | "live" | "profile";

export default function OwnerScreen() {
  const { appUser } = useAuth();
  const router      = useRouter();
  const insets      = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("vehicles");

  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [jobs, setJobs]           = useState<Job[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (!appUser) return;
    const vq = query(collection(db, "vehicles"), where("ownerId", "==", appUser.uid));
    const vunsub = onSnapshot(vq, snap => {
      setVehicles(snap.docs.map(d => d.data() as Vehicle));
      setLoading(false);
    });
    const jq = query(collection(db, "jobs"), where("ownerId", "==", appUser.uid));
    const junsub = onSnapshot(jq, snap => {
      setJobs(snap.docs.map(d => d.data() as Job));
    });
    return () => { vunsub(); junsub(); };
  }, [appUser?.uid]);

  const handleLogout = async () => { await signOut(auth); router.replace("/login"); };

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const TABS: NavTab[] = [
    { key: "vehicles", label: "Vehicles", icon: a => <Car   size={20} color={a ? colors.brand[600]   : colors.slate[400]} /> },
    { key: "live",     label: "Live",     icon: a => <Radio size={20} color={a ? colors.emerald[600] : colors.slate[400]} /> },
    { key: "profile",  label: "Profile",  icon: a => <User  size={20} color={a ? colors.brand[600]   : colors.slate[400]} /> },
  ];

  const contentPad   = insets.top + spacing.md;
  const bottomPad    = NAV_HEIGHT + spacing.xl;
  const activeVehicles= vehicles.filter(v => v.status === "active").length;
  const maintVehicles = vehicles.filter(v => v.status === "maintenance").length;
  const pendingJobs   = jobs.filter(j => j.status !== "done").length;

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
            <View style={styles.logoBadge}><Gauge size={18} color={colors.white} /></View>
            <View>
              <Text style={styles.greeting}>{appUser?.name ? `Hi, ${appUser.name.split(" ")[0]}` : "Owner"}</Text>
              <View style={styles.rolePill}><Text style={styles.rolePillText}>Owner</Text></View>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.75} hitSlop={8}>
            <LogOut size={16} color={colors.red[500]} />
          </TouchableOpacity>
        </View>

        {/* ── VEHICLES TAB ── */}
        {tab === "vehicles" && (
          <>
            <View style={styles.statsRow}>
              {[
                { val: vehicles.length, lbl: "Total fleet" },
                { val: activeVehicles,  lbl: "Active" },
                { val: maintVehicles,   lbl: "Maintenance" },
                { val: pendingJobs,     lbl: "Open jobs" },
              ].map((s, i) => (
                <View key={s.lbl} style={[styles.statCell, i > 0 && styles.statDivider]}>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLbl}>{s.lbl}</Text>
                </View>
              ))}
            </View>

            {vehicles.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}><Car size={26} color={colors.slate[400]} /></View>
                <Text style={styles.emptyTitle}>No vehicles yet</Text>
                <Text style={styles.emptyBody}>Contact your fleet admin to register vehicles under your account.</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { marginBottom: spacing.sm }]}>Your fleet</Text>
                {vehicles.map(v => {
                  const vehicleJobs  = jobs.filter(j => j.vehicleId === v.vehicleId);
                  const openJobs     = vehicleJobs.filter(j => j.status !== "done");
                  const overdueJobs  = openJobs.filter(j => j.dueDate && new Date(j.dueDate) < new Date());
                  const isOpen       = expanded === v.vehicleId;
                  const isActive     = v.status === "active";
                  const isMaint      = v.status === "maintenance";

                  return (
                    <View key={v.vehicleId} style={[styles.accordionCard, isOpen && styles.accordionCardOpen]}>
                      <TouchableOpacity style={styles.accordionHeader} onPress={() => toggle(v.vehicleId)} activeOpacity={0.8}>
                        <View style={[styles.vehicleIconBox, { backgroundColor: isActive ? colors.brand[50] : isMaint ? colors.amber[50] : colors.slate[50] }]}>
                          <Car size={18} color={isActive ? colors.brand[600] : isMaint ? colors.amber[600] : colors.slate[400]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.vehicleName}>{v.make} {v.model}</Text>
                          <Text style={styles.vehicleSub}>{v.plateNumber}{v.year ? ` · ${v.year}` : ""}</Text>
                        </View>
                        <View style={styles.accordionRight}>
                          {overdueJobs.length > 0 && (
                            <View style={styles.overdueDot}>
                              <AlertTriangle size={10} color={colors.red[600]} />
                            </View>
                          )}
                          <View style={[styles.badge, isActive ? styles.badgeGreen : isMaint ? styles.badgeAmber : styles.badgeGray]}>
                            <Text style={[styles.badgeText, { color: isActive ? colors.emerald[700] : isMaint ? colors.amber[700] : colors.slate[600] }]}>{v.status}</Text>
                          </View>
                          {isOpen ? <ChevronUp size={16} color={colors.slate[400]} /> : <ChevronDown size={16} color={colors.slate[400]} />}
                        </View>
                      </TouchableOpacity>

                      {isOpen && (
                        <View style={styles.accordionBody}>
                          <View style={styles.accordionStatsRow}>
                            {[
                              { val: vehicleJobs.length, lbl: "All jobs",  clr: colors.slate[700] },
                              { val: openJobs.length,    lbl: "Open",      clr: colors.brand[600] },
                              { val: overdueJobs.length, lbl: "Overdue",   clr: overdueJobs.length > 0 ? colors.red[600] : colors.slate[400] },
                            ].map((s, i) => (
                              <View key={s.lbl} style={[styles.accordionStat, i > 0 && styles.accordionStatDivider]}>
                                <Text style={[styles.accordionStatVal, { color: s.clr }]}>{s.val}</Text>
                                <Text style={styles.accordionStatLbl}>{s.lbl}</Text>
                              </View>
                            ))}
                          </View>

                          {vehicleJobs.length === 0 ? (
                            <View style={styles.noJobsRow}>
                              <CheckCircle size={14} color={colors.emerald[500]} />
                              <Text style={styles.noJobsText}>No maintenance jobs — all good</Text>
                            </View>
                          ) : (
                            <View style={{ gap: spacing.xs }}>
                              {vehicleJobs.slice(0, 4).map((j, idx) => {
                                const overdue = j.status !== "done" && j.dueDate && new Date(j.dueDate) < new Date();
                                return (
                                  <View key={j.jobId ?? idx} style={styles.jobChip}>
                                    <Wrench size={11} color={overdue ? colors.red[500] : j.status === "done" ? colors.emerald[500] : colors.violet[500]} />
                                    <Text style={styles.jobChipText} numberOfLines={1}>{j.description ?? j.type ?? "Maintenance"}</Text>
                                    <View style={[styles.badge, j.status === "done" ? styles.badgeGreen : overdue ? styles.badgeRed : styles.badgePurple]}>
                                      <Text style={[styles.badgeText, { color: j.status === "done" ? colors.emerald[700] : overdue ? colors.red[700] : colors.violet[700] }]}>{j.status}</Text>
                                    </View>
                                  </View>
                                );
                              })}
                              {vehicleJobs.length > 4 && (
                                <Text style={styles.moreText}>+{vehicleJobs.length - 4} more jobs</Text>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
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
            <LiveMapView
              vehicles={vehicles}
              filterVehicleIds={vehicles.map(v => v.vehicleId)}
              height={460}
            />
            <View style={[styles.card, { marginTop: spacing.md }]}>
              <Text style={[styles.liveInfo]}>
                Only your vehicles are shown. Drivers appear when they tap <Text style={{ fontWeight: "700" }}>Go Live</Text> on the driver app.
              </Text>
            </View>
          </>
        )}

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}>
                <Text style={styles.profileAvatarText}>{appUser?.name?.charAt(0).toUpperCase() ?? "O"}</Text>
              </View>
              <Text style={styles.profileName}>{appUser?.name ?? "Owner"}</Text>
              <Text style={styles.profileEmail}>{appUser?.email}</Text>
              <View style={styles.rolePillLg}><Text style={styles.rolePillLgText}>Fleet Owner</Text></View>
            </View>
            <View style={styles.card}>
              {[
                { lbl: "Email",          val: appUser?.email ?? "—" },
                { lbl: "Role",           val: "Owner" },
                { lbl: "Vehicles owned", val: vehicles.length.toString() },
                { lbl: "Active vehicles",val: activeVehicles.toString() },
                { lbl: "Open jobs",      val: pendingJobs.toString() },
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

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.surface },
  content: { paddingHorizontal: spacing.xl },
  center:  { flex: 1, alignItems: "center", justifyContent: "center" },

  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.xxl },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: spacing.md },
  logoBadge:   { width: 42, height: 42, borderRadius: radius.lg, backgroundColor: colors.brand[600], alignItems: "center", justifyContent: "center", ...shadow.brand },
  greeting:    { fontSize: fontSize.lg, fontWeight: "700", color: colors.slate[900] },
  rolePill:    { marginTop: 3, alignSelf: "flex-start", backgroundColor: colors.amber[50], paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
  rolePillText:{ fontSize: 10, fontWeight: "800", color: colors.amber[700], letterSpacing: 0.3 },
  logoutBtn:   { padding: 9, backgroundColor: colors.red[50], borderRadius: radius.md, borderWidth: 1, borderColor: "#fee2e2" },

  statsRow:    { flexDirection: "row", backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.lg, ...shadow.cardMd },
  statCell:    { flex: 1, paddingVertical: spacing.lg, alignItems: "center" },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.slate[100] },
  statVal:     { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900] },
  statLbl:     { fontSize: 10, color: colors.slate[400], marginTop: 3 },

  sectionLabel:{ fontSize: 10, fontWeight: "800", color: colors.slate[400], textTransform: "uppercase", letterSpacing: 0.9 },

  accordionCard:     { backgroundColor: colors.white, borderRadius: radius.xl, marginBottom: spacing.sm, borderWidth: 1.5, borderColor: colors.slate[100], overflow: "hidden", ...shadow.card },
  accordionCardOpen: { borderColor: colors.brand[200] },
  accordionHeader:   { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg },
  vehicleIconBox:    { width: 44, height: 44, borderRadius: radius.lg, alignItems: "center", justifyContent: "center" },
  vehicleName:       { fontSize: fontSize.base, fontWeight: "700", color: colors.slate[900] },
  vehicleSub:        { fontSize: 11, color: colors.slate[400], marginTop: 2 },
  accordionRight:    { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  overdueDot:        { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.red[50], alignItems: "center", justifyContent: "center" },

  accordionBody:      { borderTopWidth: 1, borderTopColor: colors.slate[100], padding: spacing.lg, paddingTop: spacing.md },
  accordionStatsRow:  { flexDirection: "row", backgroundColor: colors.slate[50], borderRadius: radius.lg, marginBottom: spacing.md },
  accordionStat:      { flex: 1, paddingVertical: spacing.md, alignItems: "center" },
  accordionStatDivider:{ borderLeftWidth: 1, borderLeftColor: colors.slate[200] },
  accordionStatVal:   { fontSize: fontSize.lg, fontWeight: "800" },
  accordionStatLbl:   { fontSize: 10, color: colors.slate[400], marginTop: 2 },

  noJobsRow:  { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.emerald[50], borderRadius: radius.md, padding: spacing.md },
  noJobsText: { fontSize: fontSize.sm, color: colors.emerald[700], fontWeight: "600" },

  jobChip:     { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.slate[50], borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  jobChipText: { flex: 1, fontSize: 12, color: colors.slate[700], fontWeight: "500" },
  moreText:    { fontSize: 11, color: colors.slate[400], textAlign: "center", marginTop: spacing.xs },

  badge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full },
  badgeGreen:  { backgroundColor: colors.emerald[50], borderWidth: 1, borderColor: "#bbf7d0" },
  badgeAmber:  { backgroundColor: colors.amber[50],   borderWidth: 1, borderColor: "#fde68a" },
  badgeGray:   { backgroundColor: colors.slate[100],  borderWidth: 1, borderColor: colors.slate[200] },
  badgeRed:    { backgroundColor: colors.red[50],     borderWidth: 1, borderColor: "#fecaca" },
  badgePurple: { backgroundColor: "#f5f3ff",          borderWidth: 1, borderColor: "#e9d5ff" },
  badgeText:   { fontSize: 9, fontWeight: "800" },

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
  rolePillLg:       { backgroundColor: colors.amber[50], paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.full },
  rolePillLgText:   { fontSize: fontSize.sm, fontWeight: "800", color: colors.amber[700] },

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
});
