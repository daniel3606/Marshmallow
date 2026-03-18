import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import ScreenTimeModule, { type SelectedItem } from "screen-time-module";

type CheckableItem = SelectedItem & { checked: boolean };

export default function AppBlockingScreen() {
  const [authStatus, setAuthStatus] = useState("checking…");
  const [items, setItems] = useState<CheckableItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [blockingActive, setBlockingActive] = useState(false);

  // On mount, read persisted state from the native module
  useEffect(() => {
    if (!ScreenTimeModule) return;
    refreshStatus();
  }, []);

  const refreshStatus = useCallback(async () => {
    if (!ScreenTimeModule) return;
    try {
      const status = ScreenTimeModule.getAuthorizationStatus();
      setAuthStatus(status);
      if (status === "approved") {
        const saved = await ScreenTimeModule.getSelectedItems();
        if (saved && saved.length > 0) {
          setItems(saved.map((it: SelectedItem) => ({ ...it, checked: true })));
        }
      }
    } catch {
      setAuthStatus("error");
    }
  }, []);

  // ---- Actions ----

  const handleAuthorize = async () => {
    if (!ScreenTimeModule) return;
    setLoading(true);
    try {
      await ScreenTimeModule.requestAuthorization();
      await refreshStatus();
    } catch (err: any) {
      Alert.alert("Authorization Failed", err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handlePickApps = async () => {
    if (!ScreenTimeModule) return;
    setLoading(true);
    try {
      const result = await ScreenTimeModule.openAppPicker();
      if (result !== null) {
        setItems(result.map((it: SelectedItem) => ({ ...it, checked: true })));
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it))
    );
  };

  const handleApplyBlocking = async () => {
    if (!ScreenTimeModule) return;
    const checkedIds = items.filter((i) => i.checked).map((i) => i.id);
    if (checkedIds.length === 0) {
      Alert.alert("Nothing Selected", "Toggle on at least one item to block.");
      return;
    }
    setLoading(true);
    try {
      await ScreenTimeModule.applyBlocking(checkedIds);
      setBlockingActive(true);
      Alert.alert(
        "Blocking Applied",
        `${checkedIds.length} item(s) are now shielded.\nTry opening a blocked app — you should see Apple's shield overlay.`
      );
    } catch (err: any) {
      Alert.alert("Blocking Error", err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleClearBlocking = async () => {
    if (!ScreenTimeModule) return;
    setLoading(true);
    try {
      await ScreenTimeModule.clearBlocking();
      setBlockingActive(false);
      // Reflect the cleared shielding state in the UI checklist.
      setItems((prev) => prev.map((it) => ({ ...it, checked: false })));
      Alert.alert("Blocking Cleared", "All shields have been removed.");
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ---- Non-iOS fallback ----

  if (Platform.OS !== "ios" || !ScreenTimeModule) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>iOS Only</Text>
        <Text style={styles.subtitle}>
          Screen Time APIs are only available on a real iOS 16+ device.
        </Text>
      </View>
    );
  }

  // ---- Render helpers ----

  const checkedCount = items.filter((i) => i.checked).length;
  const typeEmoji = (t: string) =>
    t === "application" ? "📱" : t === "category" ? "📂" : "🌐";

  const renderRow = ({ item }: { item: CheckableItem }) => (
    <View style={styles.row}>
      <Text style={styles.typeIcon}>{typeEmoji(item.type)}</Text>
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowType}>{item.type}</Text>
      </View>
      <Switch
        value={item.checked}
        onValueChange={() => toggleItem(item.id)}
        trackColor={{ false: "#D1D1D6", true: "#34C759" }}
      />
    </View>
  );

  // ---- Main UI ----

  return (
    <View style={styles.container}>
      {/* Status row */}
      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Auth:</Text>
        <View
          style={[
            styles.badge,
            authStatus === "approved"
              ? styles.badgeGreen
              : authStatus === "denied"
                ? styles.badgeRed
                : styles.badgeOrange,
          ]}
        >
          <Text style={styles.badgeText}>{authStatus}</Text>
        </View>
        {blockingActive && (
          <View style={[styles.badge, styles.badgePurple]}>
            <Text style={styles.badgeText}>BLOCKING</Text>
          </View>
        )}
      </View>

      {/* Authorize */}
      {authStatus !== "approved" && (
        <TouchableOpacity
          style={[styles.btn, styles.btnBlue]}
          onPress={handleAuthorize}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.btnLabel}>Authorize Screen Time</Text>
        </TouchableOpacity>
      )}

      {/* Pick apps */}
      {authStatus === "approved" && (
        <TouchableOpacity
          style={[styles.btn, styles.btnIndigo]}
          onPress={handlePickApps}
          disabled={loading}
          activeOpacity={0.7}
        >
          <Text style={styles.btnLabel}>
            {items.length > 0 ? "Change Selection" : "Pick Apps to Block"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Checklist */}
      {items.length > 0 && (
        <>
          <Text style={styles.sectionHeader}>
            Selected — {checkedCount}/{items.length} active
          </Text>
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            renderItem={renderRow}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}

      {/* Action buttons */}
      {items.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnRed,
              styles.flex1,
              { marginRight: 6 },
            ]}
            onPress={handleApplyBlocking}
            disabled={loading || checkedCount === 0}
            activeOpacity={0.7}
          >
            <Text style={styles.btnLabel}>
              Block Selected ({checkedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.btn,
              styles.btnGray,
              styles.flex1,
              { marginLeft: 6 },
            ]}
            onPress={handleClearBlocking}
            disabled={loading}
            activeOpacity={0.7}
          >
            <Text style={styles.btnLabel}>Unblock All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Spinner overlay */}
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F7",
    padding: 16,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: {
    fontSize: 15,
    color: "#8E8E93",
    textAlign: "center",
    marginTop: 8,
  },

  // Status
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  statusLabel: { fontSize: 15, fontWeight: "600", color: "#3C3C43" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeGreen: { backgroundColor: "#34C759" },
  badgeRed: { backgroundColor: "#FF3B30" },
  badgeOrange: { backgroundColor: "#FF9500" },
  badgePurple: { backgroundColor: "#AF52DE" },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  // Buttons
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  btnBlue: { backgroundColor: "#007AFF" },
  btnIndigo: { backgroundColor: "#5856D6" },
  btnRed: { backgroundColor: "#FF3B30" },
  btnGray: { backgroundColor: "#8E8E93" },
  btnLabel: { color: "#fff", fontSize: 16, fontWeight: "600" },
  flex1: { flex: 1 },

  // Section header
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8E8E93",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },

  // List
  list: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  listContent: { paddingBottom: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5EA",
  },
  typeIcon: { fontSize: 22, marginRight: 12 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: "500", color: "#000" },
  rowType: { fontSize: 12, color: "#8E8E93", marginTop: 2 },

  // Actions
  actionRow: { flexDirection: "row", marginBottom: 16 },

  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
});
