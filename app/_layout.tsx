import { useColorScheme } from "@/components/useColorScheme";
import { AuthProvider } from "@/contexts/AuthContext";
import { MarshmallowProvider } from "@/contexts/MarshmallowContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "SF-Compact-Rounded-Regular": require("../assets/fonts/SF-Compact-Rounded-Regular.ttf"),
    "SF-Compact-Rounded-Medium": require("../assets/fonts/SF-Compact-Rounded-Medium.ttf"),
    "SF-Compact-Rounded-Semibold": require("../assets/fonts/SF-Compact-Rounded-Semibold.ttf"),
    "SF-Compact-Rounded-Bold": require("../assets/fonts/SF-Compact-Rounded-Bold.ttf"),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AuthProvider>
          <MarshmallowProvider>
            <SubscriptionProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="promo" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal", headerShown: false }}
                  />
                  <Stack.Screen
                    name="premium"
                    options={{ presentation: "modal", headerShown: false }}
                  />
                </Stack>
              </ThemeProvider>
            </SubscriptionProvider>
          </MarshmallowProvider>
        </AuthProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
