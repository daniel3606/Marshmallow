import Theme from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  const { session, loading: authLoading } = useAuth();
  const { isPremium, loading: subLoading } = useSubscription();

  if (authLoading || (session && subLoading)) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.colors.secondary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  // After login, show premium promo to free users before entering the app
  if (!isPremium) {
    return <Redirect href="/promo" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Theme.colors.background,
  },
});
