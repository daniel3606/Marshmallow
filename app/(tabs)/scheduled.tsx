import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import {
  createScheduledBlock,
  deleteScheduledBlock,
  fetchScheduledBlocks,
  updateScheduledBlock,
} from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTimeModule from "screen-time-module";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FREE_LIMIT = 3;

type FocusMode = "flexible" | "deep";

interface ScheduledBlock {
  id: string;
  name: string;
  days_of_week: number[];
  start_time: string;
  end_time: string;
  is_strong_block: boolean;
  is_active: boolean;
}

export default function ScheduledScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { features, isPremium } = useSubscription();

  const [blocks, setBlocks] = useState<ScheduledBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [newName, setNewName] = useState("Focus Time");
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [newStartHour, setNewStartHour] = useState("09");
  const [newStartMin, setNewStartMin] = useState("00");
  const [newEndHour, setNewEndHour] = useState("17");
  const [newEndMin, setNewEndMin] = useState("00");
  const [newMode, setNewMode] = useState<FocusMode>("flexible");
  const [appsSelected, setAppsSelected] = useState(false);
  const [appCount, setAppCount] = useState(0);
  const [creating, setCreating] = useState(false);

  const loadBlocks = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const data = await fetchScheduledBlocks(session.user.id);
      setBlocks(data);
    } catch (err) {
      console.error("Failed to load scheduled blocks:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadBlocks();
  }, [loadBlocks]);

  const handleAddBlock = () => {
    if (!isPremium && blocks.length >= FREE_LIMIT) {
      Alert.alert(
        "Limit Reached",
        `Free users can create up to ${FREE_LIMIT} scheduled blocks. Upgrade to Premium for unlimited schedules.`,
        [
          { text: "Not Now", style: "cancel" },
          { text: "See Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setNewName("Focus Time");
    setNewDays([1, 2, 3, 4, 5]);
    setNewStartHour("09");
    setNewStartMin("00");
    setNewEndHour("17");
    setNewEndMin("00");
    setNewMode("flexible");
    setAppsSelected(false);
    setAppCount(0);
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!session?.user?.id) return;
    if (newDays.length === 0) {
      Alert.alert("Select Days", "Please select at least one day.");
      return;
    }

    setCreating(true);
    try {
      await createScheduledBlock(session.user.id, {
        name: newName.trim() || "Focus Time",
        days_of_week: newDays,
        start_time: `${newStartHour}:${newStartMin}:00`,
        end_time: `${newEndHour}:${newEndMin}:00`,
        is_strong_block: newMode === "deep",
      });
      setShowCreateModal(false);
      await loadBlocks();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to create schedule.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleBlock = async (block: ScheduledBlock) => {
    try {
      await updateScheduledBlock(block.id, { is_active: !block.is_active });
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === block.id ? { ...b, is_active: !b.is_active } : b
        )
      );
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Failed to update schedule.");
    }
  };

  const handleDeleteBlock = (block: ScheduledBlock) => {
    Alert.alert("Delete Schedule", `Delete "${block.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteScheduledBlock(block.id);
            setBlocks((prev) => prev.filter((b) => b.id !== block.id));
          } catch (err: any) {
            Alert.alert("Error", err?.message ?? "Failed to delete schedule.");
          }
        },
      },
    ]);
  };

  const handleSelectMode = (selected: FocusMode) => {
    if (selected === "deep" && !isPremium) {
      Alert.alert(
        "Premium Feature",
        "Deep Focus is available with Marshmallow Premium. Upgrade to unlock unbreakable focus sessions.",
        [
          { text: "Not Now", style: "cancel" },
          { text: "See Premium", onPress: () => router.push("/premium") },
        ]
      );
      return;
    }
    setNewMode(selected);
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

    try {
      const result = await ScreenTimeModule.openAppPicker();
      if (result && result.length > 0) {
        setAppsSelected(true);
        setAppCount(result.length);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not open app picker.");
    }
  };

  const isSimulator = Platform.OS !== "ios" || !ScreenTimeModule;

  const toggleDay = (day: number) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${display}:${m} ${ampm}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Scheduled Blocks</Text>
          <Text style={styles.headerSubtitle}>
            Automate your focus sessions
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          onPress={handleAddBlock}
        >
          <Ionicons name="add" size={24} color={Theme.colors.white} />
        </Pressable>
      </View>

      {!isPremium && (
        <View style={styles.limitBanner}>
          <Text style={styles.limitText}>
            {blocks.length}/{FREE_LIMIT} free schedules used
          </Text>
          <Pressable onPress={() => router.push("/premium")}>
            <Text style={styles.limitUpgrade}>Upgrade</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Theme.colors.secondary} />
        </View>
      ) : blocks.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={Theme.colors.tabIconDefault}
            />
          </View>
          <Text style={styles.emptyTitle}>No schedules yet</Text>
          <Text style={styles.emptyDesc}>
            Scheduled blocks let you automatically block apps at set times —
            like during work hours or before bed.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.emptyButton,
              pressed && styles.pressed,
            ]}
            onPress={handleAddBlock}
          >
            <Text style={styles.emptyButtonText}>Create Schedule</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {blocks.map((block) => (
            <View key={block.id} style={styles.blockCard}>
              <View style={styles.blockHeader}>
                <View style={styles.blockInfo}>
                  <Text style={styles.blockName}>{block.name}</Text>
                  <Text style={styles.blockTime}>
                    {formatTime(block.start_time)} - {formatTime(block.end_time)}
                  </Text>
                  <View
                    style={[
                      styles.modeBadge,
                      block.is_strong_block && styles.modeBadgeDeep,
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBadgeText,
                        block.is_strong_block && styles.modeBadgeTextDeep,
                      ]}
                    >
                      {block.is_strong_block ? "Deep Focus" : "Flexible"}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={block.is_active}
                  onValueChange={() => handleToggleBlock(block)}
                  trackColor={{
                    false: Theme.colors.cardBorder,
                    true: Theme.colors.secondary,
                  }}
                  thumbColor={Theme.colors.white}
                />
              </View>
              <View style={styles.blockDays}>
                {DAYS.map((day, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dayPill,
                      block.days_of_week.includes(i) && styles.dayPillActive,
                      !block.is_active && styles.dayPillInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        block.days_of_week.includes(i) && styles.dayTextActive,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                ))}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.deleteButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleDeleteBlock(block)}
              >
                <Ionicons name="trash-outline" size={16} color={Theme.colors.danger} />
              </Pressable>
            </View>
          ))}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>New Schedule</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Focus Time"
              placeholderTextColor={Theme.colors.gray}
              maxLength={30}
            />

            <Text style={styles.fieldLabel}>Days</Text>
            <View style={styles.daysRow}>
              {DAYS.map((day, i) => (
                <Pressable
                  key={i}
                  style={[
                    styles.daySelect,
                    newDays.includes(i) && styles.daySelectActive,
                  ]}
                  onPress={() => toggleDay(i)}
                >
                  <Text
                    style={[
                      styles.daySelectText,
                      newDays.includes(i) && styles.daySelectTextActive,
                    ]}
                  >
                    {day}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Focus Mode</Text>
            <View style={styles.modeRow}>
              <Pressable
                style={[
                  styles.modeCard,
                  newMode === "flexible" && styles.modeCardSelected,
                ]}
                onPress={() => handleSelectMode("flexible")}
              >
                <View style={styles.modeHeader}>
                  <View
                    style={[
                      styles.modeCheckbox,
                      newMode === "flexible" && styles.modeCheckboxSelected,
                    ]}
                  >
                    {newMode === "flexible" && (
                      <Ionicons name="checkmark" size={14} color={Theme.colors.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.modeTitle,
                      newMode === "flexible" && styles.modeTitleSelected,
                    ]}
                  >
                    Flexible
                  </Text>
                </View>
                <Text style={styles.modeDetail}>3 x 15 min breaks</Text>
                <Text style={styles.modeDetail}>Cancel anytime</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modeCard,
                  newMode === "deep" && styles.modeCardSelected,
                  !isPremium && styles.modeCardLocked,
                ]}
                onPress={() => handleSelectMode("deep")}
              >
                <View style={styles.modeHeader}>
                  <View
                    style={[
                      styles.modeCheckbox,
                      newMode === "deep" && styles.modeCheckboxSelected,
                    ]}
                  >
                    {newMode === "deep" && (
                      <Ionicons name="checkmark" size={14} color={Theme.colors.white} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.modeTitle,
                      newMode === "deep" && styles.modeTitleSelected,
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
                <Text style={styles.modeDetail}>No breaks</Text>
                <Text style={styles.modeDetail}>Can't cancel</Text>
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Apps to Block</Text>
            <Pressable
              style={({ pressed }) => [
                styles.appPickerButton,
                pressed && styles.pressed,
              ]}
              onPress={handlePickApps}
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

            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>Start</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={newStartHour}
                    onChangeText={(t) => setNewStartHour(t.replace(/[^0-9]/g, "").slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="09"
                    placeholderTextColor={Theme.colors.gray}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={newStartMin}
                    onChangeText={(t) => setNewStartMin(t.replace(/[^0-9]/g, "").slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={Theme.colors.gray}
                  />
                </View>
              </View>
              <View style={styles.timeField}>
                <Text style={styles.fieldLabel}>End</Text>
                <View style={styles.timeInputRow}>
                  <TextInput
                    style={styles.timeInput}
                    value={newEndHour}
                    onChangeText={(t) => setNewEndHour(t.replace(/[^0-9]/g, "").slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="17"
                    placeholderTextColor={Theme.colors.gray}
                  />
                  <Text style={styles.timeColon}>:</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={newEndMin}
                    onChangeText={(t) => setNewEndMin(t.replace(/[^0-9]/g, "").slice(0, 2))}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={Theme.colors.gray}
                  />
                </View>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  creating && styles.disabled,
                  pressed && styles.pressed,
                ]}
                onPress={handleCreate}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color={Theme.colors.white} />
                ) : (
                  <Text style={styles.modalButtonPrimaryText}>Create</Text>
                )}
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonGhost,
                  pressed && styles.pressed,
                ]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.modalButtonGhostText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  limitBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
  },
  limitText: {
    fontSize: 13,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  limitUpgrade: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.white,
  },
  blockCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    padding: 16,
    marginBottom: 12,
  },
  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  blockInfo: {
    flex: 1,
  },
  blockName: {
    fontSize: 17,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  blockTime: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 2,
  },
  blockDays: {
    flexDirection: "row",
    gap: 6,
  },
  dayPill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: Theme.colors.background,
  },
  dayPillActive: {
    backgroundColor: "rgba(139, 99, 92, 0.12)",
  },
  dayPillInactive: {
    opacity: 0.4,
  },
  dayText: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  dayTextActive: {
    color: Theme.colors.secondary,
  },
  modeBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(139, 99, 92, 0.08)",
  },
  modeBadgeDeep: {
    backgroundColor: "rgba(139, 99, 92, 0.15)",
  },
  modeBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  modeBadgeTextDeep: {
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: Theme.colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 2,
  },
  input: {
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    marginBottom: 16,
  },
  daysRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  daySelect: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Theme.colors.background,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
  },
  daySelectActive: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  daySelectText: {
    fontSize: 12,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
  },
  daySelectTextActive: {
    color: Theme.colors.white,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  timeField: {
    flex: 1,
  },
  timeInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeInput: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 18,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  timeColon: {
    fontSize: 20,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.gray,
    marginHorizontal: 4,
  },
  modalActions: {
    gap: 10,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  modalButtonPrimary: {
    backgroundColor: Theme.colors.secondary,
  },
  modalButtonPrimaryText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semibold,
    fontSize: 17,
  },
  modalButtonGhost: {
    backgroundColor: "transparent",
  },
  modalButtonGhostText: {
    color: Theme.colors.gray,
    fontFamily: Theme.fonts.medium,
    fontSize: 16,
  },
  // Focus Mode (create modal)
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  modeCard: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    padding: 12,
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
    gap: 6,
    marginBottom: 8,
  },
  modeCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Theme.colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  modeCheckboxSelected: {
    backgroundColor: Theme.colors.secondary,
    borderColor: Theme.colors.secondary,
  },
  modeTitle: {
    fontSize: 13,
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
  modeDetail: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 1,
  },
  // App Picker (create modal)
  appPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  appPickerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  appPickerText: {
    fontSize: 15,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
  },
  simNote: {
    fontSize: 11,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
