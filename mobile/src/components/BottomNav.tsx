import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, fontSize } from "@/lib/theme";

export interface NavTab {
  key: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

interface Props {
  tabs: NavTab[];
  active: string;
  onPress: (key: string) => void;
}

export const NAV_HEIGHT = 62;

export default function BottomNav({ tabs, active, onPress }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {tabs.map(tab => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.7}
            hitSlop={4}
          >
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              {tab.icon(isActive)}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.slate[100],
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingBottom: 4,
  },
  iconWrap: {
    width: 40, height: 32,
    alignItems: "center", justifyContent: "center",
    borderRadius: 10,
  },
  iconWrapActive: {
    backgroundColor: colors.brand[50],
  },
  label: {
    fontSize: 10,
    color: colors.slate[400],
    fontWeight: "500",
  },
  labelActive: {
    color: colors.brand[600],
    fontWeight: "700",
  },
});
