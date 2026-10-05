import { Stack } from "expo-router";
import { ErrorBox, Loading, Screen } from "@/ui";
import { KitFinder } from "@/components/home/KitFinder";
import { useCatalog } from "@/lib/catalog";

/** The sizing calculator on its own (installers reach it from their home screen). */
export default function SizeScreen() {
  const cat = useCatalog();
  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: "Size a system" }} />
      {cat.isPending ? <Loading /> : cat.error ? <ErrorBox message={cat.error.message} onRetry={() => cat.refetch()} /> : (
        <KitFinder catalog={cat.data} askWho={false} title="What will it power?" />
      )}
    </Screen>
  );
}
