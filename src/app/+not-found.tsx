import { Stack, router } from "expo-router";
import { Button, Empty, Screen } from "@/ui";

export default function NotFound() {
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Not found" }} />
      <Empty title="This page doesn't exist" text="The link may be old or mistyped." action={<Button title="Go home" onPress={() => router.replace("/(tabs)")} />} />
    </Screen>
  );
}
