import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth, GoogleSignInResult } from "@/context/AuthContext";
import { colors, spacing, radius, fontSize, shadow } from "@/lib/theme";
import { UserRole } from "@/types";
import {
  Truck, Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle,
  ChevronDown, User,
} from "lucide-react-native";

WebBrowser.maybeCompleteAuthSession();

const FEATURES = [
  "Real-time GPS tracking",
  "Multi-role dashboards",
  "Maintenance scheduling",
];

const ROLES: { value: UserRole; label: string; desc: string }[] = [
  { value: "driver",   label: "Driver",   desc: "Drive & log trips" },
  { value: "owner",    label: "Owner",    desc: "Manage your vehicles" },
  { value: "mechanic", label: "Mechanic", desc: "Handle maintenance" },
  { value: "admin",    label: "Admin",    desc: "Full fleet access" },
];

// SVG Google G rendered as Unicode placeholder — no SVG lib needed
const GoogleG = () => (
  <View style={styles.googleG}>
    <Text style={styles.googleGText}>G</Text>
  </View>
);

export default function LoginScreen() {
  const { login, loginWithGoogleCredential, completeGoogleProfile, appUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Email/password form
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  // Google — new user profile completion
  const [profileModal, setProfileModal]   = useState(false);
  const [pendingUid, setPendingUid]       = useState("");
  const [googleName, setGoogleName]       = useState("");
  const [profileName, setProfileName]     = useState("");
  const [selectedRole, setSelectedRole]   = useState<UserRole>("driver");
  const [roleDropdown, setRoleDropdown]   = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError]   = useState("");

  // Google OAuth request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params.id_token;
    if (!idToken) { setError("Google sign-in failed. No token received."); return; }

    (async () => {
      setLoading(true);
      try {
        const result: GoogleSignInResult = await loginWithGoogleCredential(idToken);
        if (result.needsProfile) {
          setPendingUid(result.uid);
          setGoogleName(result.displayName ?? result.email ?? "");
          setProfileName(result.displayName ?? "");
          setProfileModal(true);
        }
        // If !needsProfile → appUser will be set → useEffect below navigates
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  // Navigate when appUser is set
  useEffect(() => {
    if (!appUser) return;
    switch (appUser.role) {
      case "admin":    router.replace("/admin");    break;
      case "driver":   router.replace("/driver");   break;
      case "mechanic": router.replace("/mechanic"); break;
      case "owner":    router.replace("/owner");    break;
    }
  }, [appUser]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  const handleCompleteProfile = async () => {
    if (!profileName.trim()) {
      setProfileError("Please enter your name.");
      return;
    }
    setProfileError("");
    setProfileLoading(true);
    try {
      await completeGoogleProfile(pendingUid, profileName.trim(), selectedRole);
      setProfileModal(false);
      // appUser is now set → useEffect navigates
    } catch {
      setProfileError("Failed to save profile. Please try again.");
    } finally {
      setProfileLoading(false);
    }
  };

  const isBusy = loading || authLoading;

  return (
    <>
      <StatusBar style="light" />

      {/* ── Complete Profile Modal (new Google users) ── */}
      <Modal visible={profileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacing.xl }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalIconRow}>
              <View style={styles.modalIcon}>
                <User size={20} color={colors.brand[600]} />
              </View>
            </View>
            <Text style={styles.modalTitle}>Complete your profile</Text>
            <Text style={styles.modalSub}>
              Signed in as <Text style={{ fontWeight: "700", color: colors.slate[700] }}>{googleName}</Text>
            </Text>

            {profileError ? (
              <View style={styles.errorBox}>
                <AlertCircle size={13} color={colors.red[600]} />
                <Text style={styles.errorText}>{profileError}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Your name</Text>
            <TextInput
              style={styles.input}
              placeholder="Full name"
              placeholderTextColor={colors.slate[400]}
              value={profileName}
              onChangeText={setProfileName}
              autoCapitalize="words"
            />

            <Text style={[styles.label, { marginTop: spacing.lg }]}>Your role</Text>
            <TouchableOpacity
              style={styles.roleSelector}
              onPress={() => setRoleDropdown(v => !v)}
              activeOpacity={0.85}
            >
              <Text style={styles.roleSelectorText}>
                {ROLES.find(r => r.value === selectedRole)?.label ?? "Select role"}
              </Text>
              <ChevronDown size={16} color={colors.slate[400]} />
            </TouchableOpacity>

            {roleDropdown && (
              <View style={styles.dropdown}>
                {ROLES.map(r => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.dropdownItem, r.value === selectedRole && styles.dropdownItemActive]}
                    onPress={() => { setSelectedRole(r.value); setRoleDropdown(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dropdownLabel, r.value === selectedRole && { color: colors.brand[600] }]}>
                      {r.label}
                    </Text>
                    <Text style={styles.dropdownDesc}>{r.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.btn, { marginTop: spacing.xl }, profileLoading && { opacity: 0.7 }]}
              onPress={handleCompleteProfile}
              disabled={profileLoading}
              activeOpacity={0.88}
            >
              {profileLoading
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.btnText}>Continue</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Main login screen ── */}
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero ── */}
          <View style={styles.hero}>
            <View style={styles.logoBadge}>
              <Truck size={28} color={colors.white} />
            </View>
            <Text style={styles.appName}>Fleet AutoLink</Text>
            <Text style={styles.heroTag}>Fleet Management Platform</Text>
            <Text style={styles.heroHeadline}>
              Intelligence{"\n"}<Text style={styles.heroAccent}>for every mile.</Text>
            </Text>
            <Text style={styles.heroSub}>
              Real-time GPS, maintenance scheduling, and multi-role dashboards — all in one platform.
            </Text>
            <View style={styles.featureList}>
              {FEATURES.map(f => (
                <View key={f} style={styles.featureRow}>
                  <CheckCircle size={14} color={colors.brand[400]} />
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Form card ── */}
          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Welcome back</Text>
            <Text style={styles.cardSub}>Sign in to your fleet dashboard</Text>

            {error ? (
              <View style={styles.errorBox}>
                <AlertCircle size={14} color={colors.red[600]} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Google button */}
            <TouchableOpacity
              style={[styles.googleBtn, isBusy && { opacity: 0.6 }]}
              onPress={() => {
                setError("");
                promptAsync();
              }}
              disabled={isBusy || !request}
              activeOpacity={0.85}
            >
              {isBusy
                ? <ActivityIndicator size="small" color={colors.slate[600]} />
                : <GoogleG />
              }
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or sign in with email</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrap}>
              <Mail size={15} color={colors.slate[400]} style={styles.iconLeft} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="you@company.com"
                placeholderTextColor={colors.slate[400]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Password</Text>
            <View style={styles.inputWrap}>
              <Lock size={15} color={colors.slate[400]} style={styles.iconLeft} />
              <TextInput
                style={[styles.inputWithIcon, { paddingRight: 48 }]}
                placeholder="••••••••"
                placeholderTextColor={colors.slate[400]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPw(p => !p)} style={styles.eyeBtn} hitSlop={8}>
                {showPw
                  ? <EyeOff size={16} color={colors.slate[400]} />
                  : <Eye size={16} color={colors.slate[400]} />
                }
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, isBusy && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={isBusy}
              activeOpacity={0.88}
            >
              {isBusy
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.btnText}>Sign in</Text>
              }
            </TouchableOpacity>
          </View>

          {/* ── Stats strip ── */}
          <View style={styles.statsStrip}>
            {[["500+", "Fleets"], ["2M+", "Trips"], ["99.9%", "Uptime"]].map(([val, lbl]) => (
              <View key={lbl} style={styles.statItem}>
                <Text style={styles.statVal}>{val}</Text>
                <Text style={styles.statLbl}>{lbl}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#09090b" },
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: spacing.xxxl, paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xxl, alignItems: "center",
  },
  logoBadge: {
    width: 68, height: 68, borderRadius: radius.xl,
    backgroundColor: colors.brand[600],
    alignItems: "center", justifyContent: "center",
    marginBottom: spacing.md, ...shadow.brand,
  },
  appName:      { fontSize: fontSize.md, fontWeight: "700", color: colors.white, marginBottom: spacing.xs },
  heroTag:      { fontSize: fontSize.xs, fontWeight: "700", color: colors.brand[400], letterSpacing: 1.4, textTransform: "uppercase", marginBottom: spacing.xl },
  heroHeadline: { fontSize: fontSize.xxl, fontWeight: "800", color: colors.white, textAlign: "center", lineHeight: 38, marginBottom: spacing.md },
  heroAccent:   { color: colors.brand[400] },
  heroSub:      { fontSize: fontSize.sm, color: colors.slate[400], textAlign: "center", lineHeight: 21, maxWidth: 280, marginBottom: spacing.xl },
  featureList:  { gap: spacing.sm + 2, alignSelf: "flex-start" },
  featureRow:   { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  featureText:  { fontSize: fontSize.sm, color: colors.slate[300] },

  formCard: {
    backgroundColor: colors.white, borderRadius: radius.xxl,
    padding: spacing.xxl, marginHorizontal: spacing.xl,
    marginBottom: spacing.xl, ...shadow.cardMd,
  },
  cardTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900], marginBottom: 4 },
  cardSub:   { fontSize: fontSize.sm, color: colors.slate[500], marginBottom: spacing.xl },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.red[50], borderRadius: radius.md,
    padding: spacing.md, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.red[100],
  },
  errorText: { color: colors.red[600], fontSize: fontSize.sm, flex: 1 },

  // Google button
  googleBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: spacing.md, paddingVertical: 13, borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1.5, borderColor: colors.slate[200],
    marginBottom: spacing.xl,
  },
  googleG: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "#4285F4",
    alignItems: "center", justifyContent: "center",
  },
  googleGText:   { color: "#fff", fontWeight: "800", fontSize: 13, lineHeight: 17 },
  googleBtnText: { fontSize: fontSize.base, fontWeight: "700", color: colors.slate[700] },

  // Divider
  divider:     { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.slate[200] },
  dividerText: { fontSize: fontSize.xs, color: colors.slate[400], fontWeight: "500" },

  label:    { fontSize: fontSize.sm, fontWeight: "600", color: colors.slate[700], marginBottom: 6 },
  inputWrap: { flexDirection: "row", alignItems: "center", position: "relative" },
  iconLeft:  { position: "absolute", left: 14, zIndex: 1 },
  inputWithIcon: {
    flex: 1,
    borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md,
    paddingLeft: 44, paddingRight: spacing.md,
    paddingVertical: Platform.OS === "ios" ? 13 : 11,
    fontSize: fontSize.base, color: colors.slate[900], backgroundColor: colors.white,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === "ios" ? 13 : 11,
    fontSize: fontSize.base, color: colors.slate[900], backgroundColor: colors.white,
  },
  eyeBtn: { position: "absolute", right: 12, padding: 4 },

  btn: {
    backgroundColor: colors.brand[600],
    borderRadius: radius.md, marginTop: spacing.xl,
    paddingVertical: spacing.md + 2,
    alignItems: "center", justifyContent: "center",
  },
  btnText: { color: colors.white, fontWeight: "700", fontSize: fontSize.base },

  statsStrip: {
    flexDirection: "row", justifyContent: "center",
    gap: spacing.xxxl, paddingVertical: spacing.xxl,
    borderTopWidth: 1, borderTopColor: "#1c1c1e",
  },
  statItem: { alignItems: "center" },
  statVal:  { fontSize: fontSize.lg, fontWeight: "800", color: colors.white },
  statLbl:  { fontSize: fontSize.xs, color: colors.slate[500], marginTop: 2 },

  // Complete profile modal
  modalOverlay: {
    flex: 1, justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl,
    padding: spacing.xxl, paddingTop: spacing.lg,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.slate[300],
    alignSelf: "center", marginBottom: spacing.xl,
  },
  modalIconRow: { alignItems: "center", marginBottom: spacing.md },
  modalIcon: {
    width: 48, height: 48, borderRadius: radius.xl,
    backgroundColor: colors.brand[50],
    alignItems: "center", justifyContent: "center",
  },
  modalTitle: { fontSize: fontSize.xl, fontWeight: "800", color: colors.slate[900], textAlign: "center", marginBottom: 4 },
  modalSub:   { fontSize: fontSize.sm, color: colors.slate[400], textAlign: "center", marginBottom: spacing.xl },

  roleSelector: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1.5, borderColor: colors.slate[200], borderRadius: radius.md,
    paddingHorizontal: spacing.lg, paddingVertical: 13,
    backgroundColor: colors.white,
  },
  roleSelectorText: { fontSize: fontSize.base, color: colors.slate[900], fontWeight: "500" },

  dropdown: {
    marginTop: 4, borderWidth: 1.5, borderColor: colors.slate[200],
    borderRadius: radius.md, overflow: "hidden", backgroundColor: colors.white,
  },
  dropdownItem: {
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.slate[100],
  },
  dropdownItemActive: { backgroundColor: colors.brand[50] },
  dropdownLabel:      { fontSize: fontSize.base, fontWeight: "600", color: colors.slate[900] },
  dropdownDesc:       { fontSize: fontSize.xs, color: colors.slate[400], marginTop: 2 },
});
