import { RefreshControl } from "react-native";
import { Screen } from "@/ui";
import { FundHub } from "@/components/home/FundHub";
import { useMine } from "@/lib/pools";
import { useAuth } from "@/stores/auth";

export default function GoSolarMeTab() {
  const user = useAuth((s) => s.user);
  const mine = useMine();
  return (
    <Screen refreshControl={user ? <RefreshControl refreshing={mine.isRefetching} onRefresh={() => mine.refetch()} /> : undefined}>
      <FundHub />
    </Screen>
  );
}
