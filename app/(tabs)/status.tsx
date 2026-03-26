import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import {
  PREMIUM_PRICE,
  useSubscription,
} from "@/contexts/SubscriptionContext";
import { fetchStreak, getMyFriendCode } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenTimeModule from "screen-time-module";

export default function StatusScreen() {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { state } = useMarshmallow();
  const { isPremium, status: subStatus, expiresAt, features } = useSubscription();
  const [authStatus, setAuthStatus] = useState("checking");
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [friendCode, setFriendCode] = useState<string | null>(null);

  const isAvailable = Platform.OS === "ios" && ScreenTimeModule;

  useEffect(() => {
    if (ScreenTimeModule) refreshAuth();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStreak(session.user.id)
        .then((data) => {
          setStreak({
            current: data.current_streak,
            longest: data.longest_streak,
          });
        })
        .catch(() => {});
      getMyFriendCode(session.user.id)
        .then(setFriendCode)
        .catch(() => {});
    }
  }, [session?.user?.id]);

  const refreshAuth = useCallback(() => {
    if (!ScreenTimeModule) return;
    try {
      setAuthStatus(ScreenTimeModule.getAuthorizationStatus());
    } catch {
      setAuthStatus("error");
    }
  }, []);

  const handleReauthorize = async () => {
    if (!ScreenTimeModule) return;
    try {
      await ScreenTimeModule.requestAuthorization();
      refreshAuth();
    } catch (err: any) {
      Alert.alert("Authorization Failed", err?.message ?? "Unknown error");
    }
  };

  const handleClearSelection = () => {
    Alert.alert(
      "Clear All Selections",
      "This removes all selected apps and disables blocking. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            if (!ScreenTimeModule) return;
            try {
              await ScreenTimeModule.clearSelection();
              Alert.alert("Done", "All selections and shields have been cleared.");
            } catch (err: any) {
              Alert.alert("Error", err?.message ?? "Unknown error");
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/login");
        },
      },
    ]);
  };

  const authBadgeStyle =
    authStatus === "approved"
      ? styles.badgeSuccess
      : authStatus === "denied"
        ? styles.badgeDanger
        : styles.badgeWarning;

  const formatExpiry = (date: string | null) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Status</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Marshmallow Info */}
        <Text style={styles.sectionHeader}>Marshmallow</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Name</Text>
            <Text style={styles.rowValue}>{state.name || "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Size</Text>
            <Text style={styles.rowValue}>{state.sizeCm} cm</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Total Blocked</Text>
            <Text style={styles.rowValue}>{state.totalBlockedMinutes} min</Text>
          </View>
        </View>

        {/* Streaks */}
        <Text style={styles.sectionHeader}>Streaks</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Current Streak</Text>
            <Text style={styles.rowValue}>{streak.current} days</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Longest Streak</Text>
            <Text style={styles.rowValue}>{streak.longest} days</Text>
          </View>
        </View>

        {/* Subscription */}
        <Text style={styles.sectionHeader}>Subscription</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Plan</Text>
            <View style={[styles.badge, isPremium ? styles.badgeSuccess : styles.badgeNeutral]}>
              <Text style={styles.badgeText}>
                {isPremium ? "PREMIUM" : "FREE"}
              </Text>
            </View>
          </View>
          {isPremium && (
            <>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Status</Text>
                <Text style={styles.rowValue}>{subStatus}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Renews</Text>
                <Text style={styles.rowValue}>{formatExpiry(expiresAt)}</Text>
              </View>
            </>
          )}
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Growth Rate</Text>
            <Text style={styles.rowValue}>{features.growth_rate}x</Text>
          </View>
          {!isPremium && (
            <Pressable
              style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
              onPress={() => router.push("/premium")}
            >
              <View style={styles.upgradeRow}>
                <Ionicons name="star" size={16} color={Theme.colors.secondary} />
                <Text style={styles.rowActionText}>
                  Upgrade to Premium — {PREMIUM_PRICE}
                </Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Screen Time */}
        <Text style={styles.sectionHeader}>Screen Time</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Authorization</Text>
            <View style={[styles.badge, authBadgeStyle]}>
              <Text style={styles.badgeText}>
                {isAvailable ? authStatus : "unavailable"}
              </Text>
            </View>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Blocking</Text>
            <View
              style={[
                styles.badge,
                state.isBlocking ? styles.badgeSuccess : styles.badgeNeutral,
              ]}
            >
              <Text style={styles.badgeText}>
                {state.isBlocking ? "active" : "inactive"}
              </Text>
            </View>
          </View>
          {isAvailable && authStatus !== "approved" && (
            <Pressable
              style={({ pressed }) => [styles.rowAction, pressed && styles.pressed]}
              onPress={handleReauthorize}
            >
              <Text style={styles.rowActionText}>Request Authorization</Text>
            </Pressable>
          )}
        </View>

        {/* Data */}
        {isAvailable && (
          <>
            <Text style={styles.sectionHeader}>Data</Text>
            <View style={styles.section}>
              <Pressable
                style={({ pressed }) => [
                  styles.rowAction,
                  styles.rowLast,
                  pressed && styles.pressed,
                ]}
                onPress={handleClearSelection}
              >
                <Text style={styles.rowActionDestructive}>
                  Clear All Selections
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Email</Text>
            <Text style={styles.rowValue} numberOfLines={1}>
              {session?.user?.email ?? "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Friend Code</Text>
            <Text style={styles.rowValue}>
              {friendCode
                ? `${friendCode.slice(0, 4)}-${friendCode.slice(4)}`
                : "—"}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.rowAction,
              styles.rowLast,
              pressed && styles.pressed,
            ]}
            onPress={handleSignOut}
          >
            <Text style={styles.rowActionDestructive}>Sign Out</Text>
          </Pressable>
        </View>

        {/* About */}
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>App</Text>
            <Text style={styles.rowValue}>Marshmallow</Text>
          </View>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: 24,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.cardBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
  },
  rowValue: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    maxWidth: "50%",
  },
  rowAction: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.cardBorder,
  },
  rowActionText: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
  },
  rowActionDestructive: {
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.danger,
  },
  upgradeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: Theme.colors.lightGray,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeSuccess: { backgroundColor: Theme.colors.success },
  badgeDanger: { backgroundColor: Theme.colors.danger },
  badgeWarning: { backgroundColor: Theme.colors.warning },
  badgeNeutral: { backgroundColor: Theme.colors.gray },
  badgeText: {
    color: Theme.colors.white,
    fontSize: 11,
    fontFamily: Theme.fonts.bold,
    textTransform: "uppercase",
  },
});
