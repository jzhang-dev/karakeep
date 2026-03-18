import * as React from "react";
import { Platform } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import useAppSettings from "@/lib/settings";
import { COLORS } from "@/theme/colors";
import { useColorScheme as useNativewindColorScheme } from "nativewind";

function useColorScheme() {
  const { settings, isLoading } = useAppSettings();
  const { colorScheme, setColorScheme: setNativewindColorScheme } =
    useNativewindColorScheme();

  // Sync user settings with native color scheme
  React.useEffect(() => {
    setNativewindColorScheme(settings.theme);
  }, [settings.theme, isLoading]);

  React.useEffect(() => {
    if (Platform.OS === "android") {
      setNavigationBar(colorScheme ?? "light").catch((error) => {
        console.error('useColorScheme.tsx", "setColorScheme', error);
      });
    }
  }, [colorScheme]);

  // Determine effective color scheme based on E-ink mode
  const effectiveColorScheme = settings.einkMode ? "eink" : (colorScheme ?? "light");
  
  return {
    colorScheme: effectiveColorScheme,
    isDarkColorScheme: effectiveColorScheme === "dark",
    colors: COLORS[effectiveColorScheme],
    isEinkMode: settings.einkMode,
  };
}

/**
 * Set the Android navigation bar color based on the color scheme.
 */
function useInitialAndroidBarSync() {
  const { colorScheme } = useColorScheme();
  React.useEffect(() => {
    if (Platform.OS !== "android") return;
    setNavigationBar(colorScheme).catch((error) => {
      console.error('useColorScheme.tsx", "useInitialColorScheme', error);
    });
  }, []);
}

export { useColorScheme, useInitialAndroidBarSync };

function setNavigationBar(colorScheme: string) {
  // Determine button style based on color scheme
  // For dark theme: light buttons, for light/eink: dark buttons
  const isDark = colorScheme === "dark";
  const buttonStyle = isDark ? "light" : "dark";
  return NavigationBar.setButtonStyleAsync(buttonStyle);
}
