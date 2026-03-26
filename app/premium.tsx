import Theme from "@/constants/theme";
import {
  PREMIUM_PRICE,
  useSubscription,
} from "@/contexts/SubscriptionContext";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FEATURES = [
  {
    icon: "calendar" as const,
    title: "Unlimited Scheduled Blocks",
    desc: "Create as many automated focus schedules as you need",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Strong Block",
    desc: "Unbreakable blocking mode — no backing out early",
  },
  {
    icon: "rocket" as const,
    title: "2x Growth Rate",
    desc: "Your marshmallow grows twice as fast during sessions",
  },
  {
    icon: "flame" as const,
    title: "Streak Saver",
    desc: "Save your streak once per month if you miss a day",
  },
  {
    icon: "sparkles" as const,
    title: "Rare Cosmetics (Twisted)",
    desc: "Exclusive effects, accessories, and colors",
  },
  {
    icon: "color-palette" as const,
    title: "Unlimited Customization",
    desc: "Change your marshmallow's name and color anytime",
  },
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium, purchasePremium, restorePurchase } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with App Store StoreKit 2
      // For now, show a placeholder
      Alert.alert(
        "App Store Purchase",
        "This will connect to the App Store for payment processing. StoreKit 2 integration required.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with App Store restore purchases
      Alert.alert(
        "Restore Purchases",
        "This will check the App Store for previous purchases. StoreKit 2 integration required.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.handle} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Marshmallow Premium</Text>
        <Text style={styles.subtitle}>
          Unlock the full experience and grow faster
        </Text>

        <View style={styles.priceCard}>
          <Text style={styles.priceAmount}>{PREMIUM_PRICE}</Text>
          <Text style={styles.pricePeriod}>Recurring monthly subscription</Text>
        </View>

        {isPremium && (
          <View style={styles.activeBadge}>
            <Ionicons name="checkmark-circle" size={20} color={Theme.colors.success} />
            <Text style={styles.activeBadgeText}>Premium Active</Text>
          </View>
        )}

        <View style={styles.featuresList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons
                  name={feature.icon}
                  size={22}
                  color={Theme.colors.secondary}
                />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {!isPremium && (
          <>
            <Pressable
              style={({ pressed }) => [
                styles.purchaseButton,
                loading && styles.disabled,
                pressed && styles.pressed,
              ]}
              onPress={handlePurchase}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Theme.colors.white} />
              ) : (
                <Text style={styles.purchaseButtonText}>
                  Subscribe for {PREMIUM_PRICE}
                </Text>
              )}
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}
              onPress={handleRestore}
              disabled={loading}
            >
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>
          </>
        )}
        <Pressable
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          onPress={() => router.back()}
        >
          <Text style={styles.closeText}>
            {isPremium ? "Done" : "Not Now"}
          </Text>
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
  title: {
    fontSize: 30,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  priceAmount: {
    fontSize: 32,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52, 199, 89, 0.12)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  activeBadgeText: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.success,
  },
  featuresList: {
    gap: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(139, 99, 92, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.semibold,
    color: Theme.colors.text,
  },
  featureDesc: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: Theme.colors.gray,
    marginTop: 2,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 10,
  },
  purchaseButton: {
    backgroundColor: Theme.colors.secondary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  restoreText: {
    fontSize: 15,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.secondary,
  },
  closeButton: {
    paddingVertical: 8,
    alignItems: "center",
  },
  closeText: {
    fontSize: 15,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.gray,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
  },
});
