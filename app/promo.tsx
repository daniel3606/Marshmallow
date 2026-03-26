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
    icon: "infinite" as const,
    title: "Unlimited Scheduled Blocks",
    desc: "Create as many automated focus schedules as you need",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Unlocks Strong Block",
    desc: "Unbreakable blocking mode — no backing out early",
  },
  {
    icon: "rocket" as const,
    title: "Growth Rate x2.0",
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
    title: "Unlimited Color/Name Change",
    desc: "Change your marshmallow's look and name anytime",
  },
];

export default function PromoScreen() {
  const insets = useSafeAreaInsets();
  const { purchasePremium } = useSubscription();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // TODO: Integrate with App Store StoreKit 2
      Alert.alert(
        "App Store Purchase",
        "This will connect to the App Store for payment processing. StoreKit 2 integration required.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.iconCircle}>
            <Ionicons name="star" size={36} color={Theme.colors.secondary} />
          </View>
          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock the full Marshmallow experience
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceCard}>
          <Text style={styles.priceLabel}>Marshmallow Premium</Text>
          <Text style={styles.priceAmount}>{PREMIUM_PRICE}</Text>
          <Text style={styles.pricePeriod}>Billed monthly. Cancel anytime.</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresList}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconWrap}>
                <Ionicons
                  name={feature.icon}
                  size={20}
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

      {/* Bottom actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.subscribeButton,
            loading && styles.disabled,
            pressed && styles.pressed,
          ]}
          onPress={handleSubscribe}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Theme.colors.white} />
          ) : (
            <Text style={styles.subscribeButtonText}>
              Subscribe for {PREMIUM_PRICE}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
          onPress={handleContinue}
        >
          <Text style={styles.continueText}>Continue without Premium</Text>
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
  scrollContent: {
    paddingHorizontal: 28,
    paddingBottom: 16,
  },
  hero: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(139, 99, 92, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
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
  },
  priceCard: {
    backgroundColor: Theme.colors.secondary,
    borderRadius: 18,
    paddingVertical: 22,
    paddingHorizontal: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: Theme.colors.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  priceLabel: {
    fontSize: 14,
    fontFamily: Theme.fonts.semibold,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 36,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  pricePeriod: {
    fontSize: 14,
    fontFamily: Theme.fonts.regular,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  featuresList: {
    gap: 18,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  featureIconWrap: {
    width: 38,
    height: 38,
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
    paddingHorizontal: 28,
    gap: 12,
  },
  subscribeButton: {
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
  subscribeButtonText: {
    fontSize: 18,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.white,
  },
  continueButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  continueText: {
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
