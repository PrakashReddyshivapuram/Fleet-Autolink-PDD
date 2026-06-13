import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/lib/theme";

export default function Index() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!appUser) { router.replace("/login"); return; }
    switch (appUser.role) {
      case "admin": router.replace("/admin"); break;
      case "driver": router.replace("/driver"); break;
      case "mechanic": router.replace("/mechanic"); break;
      case "owner": router.replace("/owner"); break;
      default: router.replace("/login");
    }
  }, [appUser, loading]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface }}>
      <ActivityIndicator size="large" color={colors.brand[600]} />
    </View>
  );
}
