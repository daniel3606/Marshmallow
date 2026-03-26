import { DURATION_OPTIONS } from "@/constants/marshmallow";
import Theme from "@/constants/theme";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTimeModule from "screen-time-module";

export default function BlockSessionModal() {
  const insets = useSafeAreaInsets();
  const { startBlocking } = useMarshmallow();
  const { features, isPremium } = useSubscription();

  const [selectedDuration, setSelectedDuration] = useState(30);
  const [appsSelected, setAppsSelected] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [strongBlock, setStrongBlock] = useState(false);

  const handlePickApps = async () => {
    if (!ScreenTimeModule) {
      Alert.alert("iOS Only", "App picker requires a physical iOS 16+ device.");
      return;
    }

    const status = ScreenTimeModule.getAuthorizationStatus();
    if (status !== "approved") {
      try {
        await ScreenTimeModule.requestAuthorization();
      } catch {
        Alert.alert("Authorization Required", "Please authorize Screen Time access first.");
        return;
      }
    }

    setLoading(true);
    try {
      const result = await ScreenTimeModule.openAppPicker();
      if (result && result.length > 0) {
        setAppsSelected(true);
        setAppCount(result.length);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not open app picker.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    if (!appsSelected) {
      Alert.alert("Choose Apps", "Select at least one app to block first.");
      return;
    }

    setLoading(true);
    try {
      if (ScreenTimeModule) {
        await ScreenTimeModule.blockAll();
      }

      const endTime = Date.now() + selectedDuration * 60 * 1000;
      startBlocking(endTime, features.growth_rate);
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to start blocking.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStrongBlock = () => {
    if (!features.strong_block) {
      Alert.alert(
        "Premium Feature",
        "Strong Block is available with Marshmallow Premium. Upgrade to unlock unbreakable focus sessions.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "See Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setStrongBlock(!strongBlock);
  };

  const isSimulator = Platform.OS !== "ios" || !ScreenTimeModule;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* Handle */}
      <View style={styles.handle} />

      <Text style={styles.title}>Start Focus Session</Text>
      <Text style={styles.subtitle}>
        Choose how long to block and which apps
      </Text>

      {/* Duration Picker */}
      <Text style={styles.sectionLabel}>Duration</Text>
      <View style={styles.durationGrid}>
        {DURATION_OPTIONS.map((opt) => (
          <Pressable
            key={opt.minutes}
            style={[
              styles.durationPill,
              selectedDuration === opt.minutes && styles.durationPillSelected,
            ]}
            onPress={() => setSelectedDuration(opt.minutes)}
          >
            <Text
              style={[
                styles.durationText,
                selectedDuration === opt.minutes && styles.durationTextSelected,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* App Picker */}
      <Text style={styles.sectionLabel}>Apps to Block</Text>
      <Pressable
        style={({ pressed }) => [
          styles.appPickerButton,
          pressed && styles.pressed,
        ]}
        onPress={handlePickApps}
        disabled={loading}
      >
        <Text style={styles.appPickerText}>
          {appsSelected
            ? `${appCount} item${appCount !== 1 ? "s" : ""} selected`
            : "Choose apps to block"}
        </Text>
        <Text style={styles.appPickerArrow}>›</Text>
      </Pressable>

      {/* Strong Block Toggle */}
      <Pressable
        style={({ pressed }) => [
          styles.strongBlockRow,
          strongBlock && styles.strongBlockRowActive,
          pressed && styles.pressed,
        ]}
        onPress={handleToggleStrongBlock}
      >
        <View style={styles.strongBlockLeft}>
          <Ionicons
            name="shield-checkmark"
            size={20}
            color={strongBlock ? Theme.colors.white : Theme.colors.secondary}
          />
          <View>
            <Text style={[styles.strongBlockTitle, strongBlock && styles.strongBlockTitleActive]}>
              Strong Block
            </Text>
            <Text style={[styles.strongBlockDesc, strongBlock && styles.strongBlockDescActive]}>
              Can't end session early
            </Text>
          </View>
        </View>
        {!features.strong_block && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>PRO</Text>
          </View>
        )}
        {features.strong_block && (
          <View style={[styles.toggle, strongBlock && styles.toggleActive]}>
            <View style={[styles.toggleDot, strongBlock && styles.toggleDotActive]} />
          </View>
        )}
      </Pressable>

      {isSimulator && (
        <Text style={styles.simNote}>
          App selection requires a physical iOS 16+ device.
        </Text>
      )}

      {/* Growth rate indicator */}
      {features.growth_rate > 1 && (
        <View style={styles.growthIndicator}>
          <Ionicons name="rocket" size={16} color={Theme.colors.secondary} />
          <Text style={styles.growthText}>
            {features.growth_rate}x growth rate active
          </Text>
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Start Button */}
      <Pressable
        style={({ pressed }) => [
          styles.startButton,
          (!appsSelected || loading) && styles.startButtonDisabled,
          pressed && styles.pressed,
        ]}
        onPress={handleStart}
        disabled={!appsSelected || loading}
      >
        {loading ? (
          <ActivityIndicator color={Theme.colors.white} />
        ) : (
          <Text style={styles.startButtonText}>
            Start {DURATION_OPTIONS.find((d) => d.minutes === selectedDuration)?.label} Session
          </Text>
        )}
      </Pressable>

      {/* Cancel */}
      <Pressable
        style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>

      <View style={{ height: insets.bottom + 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 24,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.cardBorder,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  durationPill: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  durationPillSelected: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  durationText: {
    fontSize: 15,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  durationTextSelected: {
    color: Theme.colors.white,
  },
  appPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  appPickerText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
  },
  appPickerArrow: {
    fontSize: 22,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.gray,
  },
  strongBlockRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  strongBlockRowActive: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  strongBlockLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  strongBlockTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  strongBlockTitleActive: {
    color: Theme.colors.white,
  },
  strongBlockDesc: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 1,
  },
  strongBlockDescActive: {
    color: "rgba(255,255,255,0.7)",
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(139, 99, 92, 0.12)",
  },
  premiumBadgeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
    letterSpacing: 0.5,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: Theme.colors.cardBorder,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.white,
  },
  toggleDotActive: {
    alignSelf: "flex-end",
  },
  simNote: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 4,
  },
  growthIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
    alignSelf: "center",
  },
  growthText: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.secondary,
  },
  startButton: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
  },
  startButtonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.bold,
    fontSize: 18,
  },
  cancelButton: {
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.medium,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
