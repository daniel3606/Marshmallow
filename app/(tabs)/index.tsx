import MarshmallowCharacter from "@/components/MarshmallowCharacter";
import { MARSHMALLOW_COLORS } from "@/constants/marshmallow";
import { formatTimeRemaining, getSizeDescription } from "@/constants/marshmallow";
import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { fetchStreak } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTimeModule from "screen-time-module";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { state, completeBlocking, cancelBlocking, changeColor } = useMarshmallow();
  const { features, isPremium } = useSubscription();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [streak, setStreak] = useState(0);

  const cosmeticSheetRef = useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ["55%"], []);

  // Refs to avoid stale closures in the timer interval
  const completeBlockingRef = useRef(completeBlocking);
  completeBlockingRef.current = completeBlocking;
  const growthRateRef = useRef(features.growth_rate);
  growthRateRef.current = features.growth_rate;

  // Load streak
  useEffect(() => {
    if (session?.user?.id) {
      fetchStreak(session.user.id)
        .then((data) => setStreak(data.current_streak))
        .catch(() => {});
    }
  }, [session?.user?.id]);

  // Countdown timer when blocking is active
  useEffect(() => {
    if (!state.isBlocking || !state.blockEndTime || !state.blockStartTime) return;

    const { blockStartTime, blockEndTime } = state;

    const tick = () => {
      const remaining = blockEndTime - Date.now();
      if (remaining <= 0) {
        // Compute actual session duration from stored start/end times
        const minutesBlocked = Math.max(
          1,
          Math.round((blockEndTime - blockStartTime) / 60000)
        );
        if (ScreenTimeModule) {
          ScreenTimeModule.clearBlocking().catch(() => {});
        }
        // Use refs to call the latest function with the latest growth rate
        completeBlockingRef.current(minutesBlocked, growthRateRef.current);
        setTimeRemaining(0);
      } else {
        setTimeRemaining(remaining);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [state.isBlocking, state.blockEndTime, state.blockStartTime]);

  // Estimated growth during active session
  const estimatedGrowth =
    state.isBlocking && state.blockStartTime && state.blockEndTime
      ? Math.round(
          (((state.blockEndTime - state.blockStartTime) / 60000 / 30) *
            features.growth_rate) *
            10
        ) / 10
      : 0;

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleStartBlocking = () => {
    if (Platform.OS !== "ios" || !ScreenTimeModule) {
      Alert.alert(
        "iOS Only",
        "Screen Time blocking requires a physical iOS 16+ device."
      );
      return;
    }
    router.push("/modal");
  };

  const handleStopBlocking = () => {
    Alert.alert(
      "End Session Early?",
      "Your marshmallow won't grow as much if you stop early.",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "End Session",
          style: "destructive",
          onPress: async () => {
            if (ScreenTimeModule) {
              await ScreenTimeModule.clearBlocking().catch(() => {});
            }
            cancelBlocking();
            setTimeRemaining(0);
          },
        },
      ]
    );
  };

  const handleOpenCosmetics = () => {
    cosmeticSheetRef.current?.present();
  };

  const handleSelectColor = async (hex: string) => {
    if (!isPremium && state.colorChangesUsed >= 3) {
      Alert.alert(
        "Limit Reached",
        "Free users can change color up to 3 times. Upgrade to Premium for unlimited changes.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "See Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    try {
      await changeColor(hex);
    } catch {
      Alert.alert("Error", "Failed to change color.");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar: Streak (left) + Profile (right) */}
      <View style={styles.topBar}>
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={18} color="#FF9500" />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
          onPress={() => router.push("/(tabs)/status")}
        >
          <Ionicons name="person-circle-outline" size={30} color={Theme.colors.secondary} />
        </Pressable>
      </View>

      {/* Size Display (above marshmallow, pushed down a bit) */}
      <View style={styles.sizeSection}>
        <Text style={styles.sizeValue}>
          {state.sizeCm} cm
          {state.isBlocking && estimatedGrowth > 0 && (
            <Text style={styles.growthPreview}>{" "}(+{estimatedGrowth} cm)</Text>
          )}
        </Text>
        <Text style={styles.sizeDesc}>{getSizeDescription(state.sizeCm)}</Text>
        {features.growth_rate > 1 && (
          <View style={styles.boostBadge}>
            <Text style={styles.boostText}>{features.growth_rate}x Growth</Text>
          </View>
        )}
      </View>

      {/* Marshmallow + Hanger icon */}
      <View style={styles.marshmallowSection}>
        <View style={styles.marshmallowRow}>
          <MarshmallowCharacter
            color={state.color}
            name={state.name}
            sizeCm={state.sizeCm}
            isBlocking={state.isBlocking}
          />
          <Pressable
            style={({ pressed }) => [styles.hangerButton, pressed && styles.pressed]}
            onPress={handleOpenCosmetics}
          >
            <Ionicons name="shirt-outline" size={22} color={Theme.colors.secondary} />
          </Pressable>
        </View>
      </View>

      {/* Action Area (moved up) */}
      <View style={styles.actionSection}>
        {state.isBlocking ? (
          <View style={styles.blockingCard}>
            <View style={styles.blockingHeader}>
              <View style={styles.blockingDot} />
              <Text style={styles.blockingTitle}>Focus Session Active</Text>
            </View>
            <Text style={styles.timer}>
              {formatTimeRemaining(timeRemaining)}
            </Text>
            <Text style={styles.blockingHint}>
              Your marshmallow is growing{features.growth_rate > 1 ? " at 2x speed!" : "..."}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.stopButton,
                pressed && styles.pressed,
              ]}
              onPress={handleStopBlocking}
            >
              <Text style={styles.stopButtonText}>End Session</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.pressed,
            ]}
            onPress={handleStartBlocking}
          >
            <Text style={styles.startButtonText}>Start Focus Session</Text>
          </Pressable>
        )}
      </View>

      {/* Cosmetics Bottom Sheet */}
      <BottomSheetModal
        ref={cosmeticSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Customize</Text>
          <Text style={styles.sheetSubtitle}>Choose a color for your marshmallow</Text>

          {!isPremium && (
            <Text style={styles.sheetLimit}>
              {Math.max(0, 3 - state.colorChangesUsed)} free changes remaining
            </Text>
          )}

          <View style={styles.colorGrid}>
            {MARSHMALLOW_COLORS.map((c) => (
              <Pressable
                key={c.hex}
                onPress={() => handleSelectColor(c.hex)}
                style={styles.colorOption}
              >
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.hex },
                    state.color === c.hex && styles.colorSelected,
                  ]}
                >
                  {state.color === c.hex && (
                    <Ionicons name="checkmark" size={20} color={Theme.colors.secondary} />
                  )}
                </View>
                <Text style={styles.colorLabel}>{c.name}</Text>
              </Pressable>
            ))}
          </View>

          {!isPremium && (
            <Pressable
              style={({ pressed }) => [styles.upgradeRow, pressed && styles.pressed]}
              onPress={() => {
                cosmeticSheetRef.current?.dismiss();
                router.push("/premium");
              }}
            >
              <Ionicons name="star" size={16} color={Theme.colors.secondary} />
              <Text style={styles.upgradeText}>
                Unlock rare colors & cosmetics with Premium
              </Text>
            </Pressable>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 149, 0, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 16,
    fontFamily: Theme.fonts.bold,
    color: "#FF9500",
  },
  profileButton: {
    padding: 4,
  },
  // Marshmallow area
  marshmallowSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  marshmallowRow: {
    alignItems: "center",
  },
  hangerButton: {
    position: "absolute",
    right: -48,
    top: "40%",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  // Size (above marshmallow)
  sizeSection: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 0,
  },
  sizeValue: {
    fontSize: 36,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
  },
  growthPreview: {
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.success,
  },
  sizeDesc: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 4,
  },
  boostBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(139, 99, 92, 0.12)",
  },
  boostText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
  },
  // Action area
  actionSection: {
    width: "100%",
    paddingHorizontal: 28,
    paddingBottom: 100,
    marginTop: 0,
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
  startButtonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.bold,
    fontSize: 18,
  },
  blockingCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  blockingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  blockingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.success,
    marginRight: 8,
  },
  blockingTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  timer: {
    fontSize: 48,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    marginVertical: 4,
  },
  blockingHint: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginBottom: 14,
  },
  stopButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.danger,
  },
  stopButtonText: {
    color: Theme.colors.danger,
    fontFamily: Theme.fonts.medium,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  // Bottom sheet
  sheetBackground: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: {
    width: 40,
    backgroundColor: Theme.colors.gray,
    opacity: 0.35,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  sheetSubtitle: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  sheetLimit: {
    fontSize: 13,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
    textAlign: "center",
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 8,
  },
  colorOption: {
    alignItems: "center",
    width: 68,
  },
  colorSwatch: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  colorSelected: {
    borderWidth: 3,
    borderColor: Theme.colors.secondary,
  },
  colorLabel: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
  },
  upgradeText: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.secondary,
  },
});
