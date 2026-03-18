import React from "react";
import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import Colors from "@/constants/Colors";
import { useColorScheme } from "@/components/useColorScheme";
import { useClientOnlyValue } from "@/components/useClientOnlyValue";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Blocking",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "shield.lefthalf.filled",
                android: "shield",
                web: "shield",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: "Info",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "info.circle",
                android: "info",
                web: "info",
              }}
              tintColor={color}
              size={28}
            />
          ),
        }}
      />
    </Tabs>
  );
}
