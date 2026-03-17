import { Pressable, ScrollView, View } from "react-native";
import { Divider } from "@/components/ui/Divider";
import { Text } from "@/components/ui/Text";
import useAppSettings from "@/lib/settings";
import { useColorScheme } from "@/lib/useColorScheme";
import { Check } from "lucide-react-native";

export default function ThemePage() {
  const { settings, setSettings } = useAppSettings();
  const { colors } = useColorScheme();

  const options = (["light", "dark", "system"] as const)
    .map((theme) => {
      const isChecked = settings.theme === theme;
      return [
        <Pressable
          onPress={() => setSettings({ ...settings, theme })}
          className="flex flex-row items-center justify-between"
          key={theme}
        >
          <Text className="mr-2 flex-1" numberOfLines={1}>
            {
              { light: "Light Mode", dark: "Dark Mode", system: "System" }[
                theme
              ]
            }
          </Text>
          {isChecked && <Check color={colors.primary} />}
        </Pressable>,
        <Divider
          key={theme + "-divider"}
          orientation="horizontal"
          className="my-3 h-0.5 w-full"
        />,
      ];
    })
    .flat();
  options.pop();

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="flex w-full items-center px-4 py-2"
    >
      <View className="w-full rounded-lg bg-card px-4 py-2">{options}</View>
    </ScrollView>
  );
}
