import FriendCard from "@/components/FriendCard";
import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import {
  addFriendByCode,
  FriendData,
  getFriendsWithData,
  getMyFriendCode,
  removeFriend,
} from "@/lib/database";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [addCode, setAddCode] = useState("");
  const [adding, setAdding] = useState(false);

  const userId = session?.user?.id;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const [code, friendsList] = await Promise.all([
        getMyFriendCode(userId),
        getFriendsWithData(),
      ]);
      setFriendCode(code);
      setFriends(friendsList);
    } catch {
      // Silently fail — user sees empty state
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = async () => {
    if (!friendCode) return;
    try {
      await Share.share({
        message: `Add me on Marshmallow! My friend code is: ${friendCode}`,
      });
    } catch {
      // User cancelled share
    }
  };

  const handleAddFriend = async () => {
    const code = addCode.trim().toUpperCase();
    if (code.length === 0) return;

    setAdding(true);
    try {
      const result = await addFriendByCode(code);
      if (result.success) {
        setAddCode("");
        await loadData();
      } else {
        Alert.alert("Could not add friend", result.error ?? "Unknown error");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveFriend = async (friendUserId: string) => {
    try {
      const result = await removeFriend(friendUserId);
      if (result.success) {
        setFriends((prev) => prev.filter((f) => f.user_id !== friendUserId));
      } else {
        Alert.alert("Error", result.error ?? "Could not remove friend");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    }
  };

  const formatCode = (code: string) =>
    code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;

  const renderHeader = () => (
    <View>
      {/* Your Friend Code */}
      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your Friend Code</Text>
        <Text style={styles.codeValue}>
          {friendCode ? formatCode(friendCode) : "—"}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={16} color={Theme.colors.white} />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      {/* Add Friend */}
      <View style={styles.addSection}>
        <Text style={styles.sectionHeader}>Add Friend</Text>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Enter friend code"
            placeholderTextColor={Theme.colors.gray}
            value={addCode}
            onChangeText={setAddCode}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            returnKeyType="done"
            onSubmitEditing={handleAddFriend}
          />
          <Pressable
            style={({ pressed }) => [
              styles.addButton,
              pressed && styles.pressed,
              adding && styles.addButtonDisabled,
            ]}
            onPress={handleAddFriend}
            disabled={adding || addCode.trim().length === 0}
          >
            {adding ? (
              <ActivityIndicator size="small" color={Theme.colors.white} />
            ) : (
              <Ionicons name="person-add" size={18} color={Theme.colors.white} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Friends List Header */}
      {friends.length > 0 && (
        <Text style={[styles.sectionHeader, { marginTop: 8 }]}>
          Friends ({friends.length})
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <Ionicons
            name="people-outline"
            size={48}
            color={Theme.colors.tabIconDefault}
          />
        </View>
        <Text style={styles.emptyTitle}>No friends yet</Text>
        <Text style={styles.emptyDesc}>
          Share your friend code or enter a friend's code above to get started.
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social</Text>
        <Text style={styles.headerSubtitle}>Grow together with friends</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.user_id}
          renderItem={({ item }) => (
            <FriendCard friend={item} onRemove={handleRemoveFriend} />
          )}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => null}
          style={friends.length > 0 ? undefined : { flex: 1 }}
        />
      )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },

  // Friend Code Card
  codeCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 28,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    letterSpacing: 3,
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareText: {
    fontSize: 15,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.white,
  },

  // Add Friend
  addSection: {
    marginBottom: 24,
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
  addRow: {
    flexDirection: "row",
    gap: 10,
  },
  addInput: {
    flex: 1,
    backgroundColor: Theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.text,
    letterSpacing: 1,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.7,
  },

  // Empty State
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
});
