mport { useEffect } from "react";
import { Stack, router, useSegments } from "expo-router";
import { AuthProvider, useAuth } from '../AuthContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!user && inAuthGroup) {
      // Not logged in but trying to access app — send to welcome
      router.replace('/WelcomePage');
    } else if (user && !inAuthGroup) {
      // Logged in but on auth screen — send to app
      router.replace('/(tabs)/HomeScreen');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="WelcomePage" />
      <Stack.Screen name="LoginScreen" />
      <Stack.Screen name="SignUpScreen" />
      <Stack.Screen name="VerifyEmailScreen" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
