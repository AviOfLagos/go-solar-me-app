import { router } from "expo-router";
import { Button, Card, H3, P } from "@/ui";

export function SignInPrompt({ text }: { text: string }) {
  return (
    <Card>
      <H3>Sign in first</H3>
      <P>{text}</P>
      <Button title="Sign in" kind="ink" onPress={() => router.push("/sign-in")} />
    </Card>
  );
}
