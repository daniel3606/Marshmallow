import Theme from "@/constants/theme";
import { useMarshmallow } from "@/contexts/MarshmallowContext";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACHIEVEMENTS = [
  { id: "first_block", title: "First Steps", desc: "Complete your first focus session", icon: "🌱", requirement: 1 },
  { id: "ten_minutes", title: "Getting Started", desc: "Block 10 total minutes", icon: "⏱️", requirement: 10 },
  { id: "one_hour", title: "Hour Power", desc: "Block 60 total minutes", icon: "⚡", requirement: 60 },
  { id: "three_hours", title: "Focus Master", desc: "Block 3 hours total", icon: "🎯", requirement: 180 },
  { id: "five_cm", title: "Growth Spurt", desc: "Grow your marshmallow to 5 cm", icon: "📏", requirement: 5, isSizeBased: true },
  { id: "ten_cm", title: "Big Mallow", desc: "Grow your marshmallow to 10 cm", icon: "🍡", requirement: 10, isSizeBased: true },
  { id: "twenty_cm", title: "Mega Mallow", desc: "Grow your marshmallow to 20 cm", icon: "🏆", requirement: 20, isSizeBased: true },
  { id: "fifty_cm", title: "Legendary", desc: "Grow your marshmallow to 50 cm", icon: "👑", requirement: 50, isSizeBased: true },
] as const;

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useMarshmallow();

  const isUnlocked = (a: (typeof ACHIEVEMENTS)[number]) => {
    if ("isSizeBased" in a && a.isSizeBased) return state.sizeCm >= a.requirement;
    return state.totalBlockedMinutes >= a.requirement;
  };

  const unlockedCount = ACHIEVEMENTS.filter(isUnlocked).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Awards</Text>
        <Text style={styles.headerSubtitle}>
          {unlockedCount} of {ACHIEVEMENTS.length} unlocked
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {ACHIEVEMENTS.map((a) => {
          const unlocked = isUnlocked(a);
          return (
            <View
              key={a.id}
              style={[styles.card, !unlocked && styles.cardLocked]}
            >
              <Text style={[styles.cardIcon, !unlocked && styles.cardIconLocked]}>
                {unlocked ? a.icon : "🔒"}
              </Text>
              <Text style={[styles.cardTitle, !unlocked && styles.textLocked]}>
                {a.title}
              </Text>
              <Text style={[styles.cardDesc, !unlocked && styles.textLocked]}>
                {a.desc}
              </Text>
            </View>
          );
        })}
        <View style={{ height: 24 }} />
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 12,
  },
  card: {
    width: "47%",
    backgroundColor: Theme.colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  cardLocked: {
    opacity: 0.5,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  cardIconLocked: {
    fontSize: 28,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    lineHeight: 16,
  },
  textLocked: {
    color: Theme.colors.gray,
  },
});
