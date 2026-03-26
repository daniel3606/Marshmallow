import Theme from "@/constants/theme";
import { FriendData } from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

interface FriendCardProps {
  friend: FriendData;
  onRemove: (userId: string) => void;
}

export default function FriendCard({ friend, onRemove }: FriendCardProps) {
  const name = friend.marshmallow_name || friend.display_name || "Marshmallow";
  const color = friend.marshmallow_color || "#FFB5C2";
  const size = friend.size_cm ?? 1;
  const minutes = friend.total_blocked_minutes ?? 0;
  const streak = friend.current_streak ?? 0;

  const handleLongPress = () => {
    Alert.alert("Remove Friend", `Remove ${name} from your friends?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => onRemove(friend.user_id),
      },
    ]);
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.meta}>
            {size.toFixed(1)} cm · {minutes} min blocked
          </Text>
        </View>
      </View>

      {streak > 0 && (
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={14} color={Theme.colors.secondary} />
          <Text style={styles.streakText}>{streak}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Theme.colors.cardBorder,
  },
  pressed: {
    opacity: 0.6,
    backgroundColor: Theme.colors.lightGray,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  meta: {
    fontSize: 13,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  streakText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.secondary,
  },
});
