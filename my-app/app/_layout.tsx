import { Stack } from "expo-router";
import { useEffect } from "react";
import { depositSharedImage } from "../Services/share_inbox";
import { useShareIntent } from "expo-share-intent";

export default function RootLayout() {
  // expo-share-intent (v4/v5) : on lit via any pour éviter les différences de types selon versions
  const share = useShareIntent() as any;

  useEffect(() => {
    const hasShareIntent: boolean = !!share?.hasShareIntent;
    const shareIntent = share?.shareIntent;
    const resetShareIntent: (() => void) | undefined = share?.resetShareIntent;
    const error = share?.error;

    if (error) {
      console.warn("[share-intent] error:", error);
      return;
    }

    if (!hasShareIntent) return;

    const files: Array<{ path?: string; uri?: string; mimeType?: string }> =
      shareIntent?.files ?? [];

    if (!files.length) {
      resetShareIntent?.();
      return;
    }

    (async () => {
      try {
        for (const f of files) {
          const fromUri = f.path ?? f.uri;
          if (!fromUri) continue;

          await depositSharedImage({
            fromUri,
            mimeType: f.mimeType,
          });
        }
      } finally {
        // IMPORTANT: sinon ça re-trigger quand le layout re-render
        resetShareIntent?.();
      }
    })();
  }, [share?.hasShareIntent, share?.shareIntent, share?.error]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="WelcomePage" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}