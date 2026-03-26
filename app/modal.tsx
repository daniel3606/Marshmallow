import Theme from "@/constants/theme";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTimeModule from "screen-time-module";

// ── Wheel Picker ──────────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

function WheelPicker({
  data,
  selectedIndex,
  onSelect,
}: {
  data: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(index, data.length - 1));
    if (clamped !== selectedIndex) onSelect(clamped);
  };

  return (
    <View style={wheelStyles.container}>
      <View style={wheelStyles.highlight} />
      <ScrollView
        ref={scrollRef}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
      >
        {/* Top padding (2 empty slots) */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
        {data.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <View key={index} style={wheelStyles.item}>
              <Text
                style={[
                  wheelStyles.itemText,
                  isSelected && wheelStyles.itemTextSelected,
                ]}
              >
                {item}
              </Text>
            </View>
          );
        })}
        {/* Bottom padding (2 empty slots) */}
        <View style={{ height: ITEM_HEIGHT * 2 }} />
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    overflow: "hidden",
  },
  highlight: {
    position: "absolute",
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
    borderRadius: 10,
    zIndex: -1,
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  itemText: {
    fontSize: 20,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  itemTextSelected: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
  },
});

// ── Hours / Minutes data ──────────────────────────────────────────────────────

const HOURS = Array.from({ length: 13 }, (_, i) => String(i)); // 0–12
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")); // 00, 05, …, 55

// ── Main component ────────────────────────────────────────────────────────────

type FocusMode = "flexible" | "deep";

export default function BlockSessionModal() {
  const insets = useSafeAreaInsets();
  const { startBlocking } = useMarshmallow();
  const { features, isPremium } = useSubscription();

  const [mode, setMode] = useState<FocusMode>("flexible");
  const [hoursIndex, setHoursIndex] = useState(1); // default 1 hour
  const [minutesIndex, setMinutesIndex] = useState(0); // default 0 min
  const [appsSelected, setAppsSelected] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const totalMinutes = Number(HOURS[hoursIndex]) * 60 + Number(MINUTES[minutesIndex]);
  const growthRate = mode === "deep" ? 2.0 : features.growth_rate;
  const estimatedGrowth = totalMinutes > 0
    ? Math.round(((totalMinutes / 30) * growthRate) * 10) / 10
    : 0;

  const handleSelectMode = (selected: FocusMode) => {
    if (selected === "deep" && !isPremium) {
      Alert.alert(
        "Premium Feature",
        "Deep Focus is available with Marshmallow Premium. Upgrade to unlock unbreakable focus sessions with x2 growth.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "See Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setMode(selected);
  };

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
    if (totalMinutes === 0) {
      Alert.alert("Set Duration", "Please set a focus duration.");
      return;
    }
    if (!appsSelected) {
      Alert.alert("Choose Apps", "Select at least one app to block first.");
      return;
    }

    setLoading(true);
    try {
      if (ScreenTimeModule) {
        await ScreenTimeModule.blockAll();
      }

      const endTime = Date.now() + totalMinutes * 60 * 1000;
      startBlocking(endTime, growthRate);
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to start blocking.");
    } finally {
      setLoading(false);
    }
  };

  const isSimulator = Platform.OS !== "ios" || !ScreenTimeModule;

  const formatDuration = () => {
    const h = Number(HOURS[hoursIndex]);
    const m = Number(MINUTES[minutesIndex]);
    if (h === 0 && m === 0) return "0 min";
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(" ");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.handle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Estimated Growth */}
        <View style={styles.growthCard}>
          <Ionicons name="leaf-outline" size={20} color={Theme.colors.secondary} />
          <View>
            <Text style={styles.growthLabel}>Estimated Growth</Text>
            <Text style={styles.growthValue}>+{estimatedGrowth} cm</Text>
          </View>
        </View>

        {/* Focus Mode Selection */}
        <Text style={styles.sectionLabel}>Focus Mode</Text>
        <View style={styles.modeRow}>
          {/* Flexible Focus */}
          <Pressable
            style={[
              styles.modeCard,
              mode === "flexible" && styles.modeCardSelected,
            ]}
            onPress={() => handleSelectMode("flexible")}
          >
            <View style={styles.modeHeader}>
              <View
                style={[
                  styles.checkbox,
                  mode === "flexible" && styles.checkboxSelected,
                ]}
              >
                {mode === "flexible" && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.white} />
                )}
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  mode === "flexible" && styles.modeTitleSelected,
                ]}
              >
                Flexible Focus
              </Text>
            </View>
            <View style={styles.modeDetails}>
              <Text style={styles.modeDetail}>3 x 15 min breaks</Text>
              <Text style={styles.modeDetail}>Cancel anytime</Text>
            </View>
          </Pressable>

          {/* Deep Focus */}
          <Pressable
            style={[
              styles.modeCard,
              mode === "deep" && styles.modeCardSelected,
              !isPremium && styles.modeCardLocked,
            ]}
            onPress={() => handleSelectMode("deep")}
          >
            <View style={styles.modeHeader}>
              <View
                style={[
                  styles.checkbox,
                  mode === "deep" && styles.checkboxSelected,
                ]}
              >
                {mode === "deep" && (
                  <Ionicons name="checkmark" size={16} color={Theme.colors.white} />
                )}
              </View>
              <Text
                style={[
                  styles.modeTitle,
                  mode === "deep" && styles.modeTitleSelected,
                ]}
              >
                Deep Focus
              </Text>
              {!isPremium && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <View style={styles.modeDetails}>
              <Text style={styles.modeDetail}>No breaks allowed</Text>
              <Text style={styles.modeDetail}>Can't cancel session</Text>
              <Text style={styles.modeDetail}>Can't delete apps</Text>
              <Text style={styles.modeDetail}>Can't change Time & Date</Text>
              <Text style={styles.modeDetailHighlight}>x2 Growth Rate</Text>
            </View>
          </Pressable>
        </View>

        {/* Apps to Block */}
        <Text style={styles.sectionLabel}>Apps to Block</Text>
        <Pressable
          style={({ pressed }) => [
            styles.appPickerButton,
            pressed && styles.pressed,
          ]}
          onPress={handlePickApps}
          disabled={loading}
        >
          <View style={styles.appPickerLeft}>
            <Ionicons name="apps-outline" size={20} color={Theme.colors.secondary} />
            <Text style={styles.appPickerText}>
              {appsSelected
                ? `${appCount} app${appCount !== 1 ? "s" : ""} selected`
                : "Choose apps to block"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Theme.colors.gray} />
        </Pressable>

        {isSimulator && (
          <Text style={styles.simNote}>
            App selection requires a physical iOS 16+ device.
          </Text>
        )}

        {/* Time Picker */}
        <Text style={styles.sectionLabel}>Duration</Text>
        <View style={styles.pickerRow}>
          <View style={styles.pickerColumn}>
            <WheelPicker
              data={HOURS}
              selectedIndex={hoursIndex}
              onSelect={setHoursIndex}
            />
            <Text style={styles.pickerUnit}>hours</Text>
          </View>
          <Text style={styles.pickerColon}>:</Text>
          <View style={styles.pickerColumn}>
            <WheelPicker
              data={MINUTES}
              selectedIndex={minutesIndex}
              onSelect={setMinutesIndex}
            />
            <Text style={styles.pickerUnit}>min</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.startButton,
            (totalMinutes === 0 || !appsSelected || loading) && styles.startButtonDisabled,
            pressed && styles.pressed,
          ]}
          onPress={handleStart}
          disabled={totalMinutes === 0 || !appsSelected || loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.startButtonText}>
              Start Focus Session — {formatDuration()}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.cardBorder,
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  // Estimated Growth
  growthCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  growthLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  growthValue: {
    fontSize: 22,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
    marginTop: 1,
  },
  // Section labels
  sectionLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
  },
  // Focus Mode
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    padding: 14,
  },
  modeCardSelected: {
    borderColor: Theme.colors.secondary,
  },
  modeCardLocked: {
    opacity: 0.7,
  },
  modeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  modeTitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    flex: 1,
  },
  modeTitleSelected: {
    color: Theme.colors.secondary,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "rgba(139, 99, 92, 0.12)",
  },
  proBadgeText: {
    fontSize: 9,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
    letterSpacing: 0.5,
  },
  modeDetails: {
    gap: 3,
  },
  modeDetail: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
  },
  modeDetailHighlight: {
    fontSize: 12,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
  },
  // App Picker
  appPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  appPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appPickerText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
  },
  simNote: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  // Time Picker
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  pickerColumn: {
    alignItems: "center",
    width: 80,
  },
  pickerColon: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  pickerUnit: {
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
    marginTop: 4,
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
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
    fontSize: 17,
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
