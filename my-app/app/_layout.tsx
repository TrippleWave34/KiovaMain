import { Stack } from "expo-router";
import { AuthProvider } from '../AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="WelcomePage" />
        <Stack.Screen name="LoginScreen" />
        <Stack.Screen name="SignUpScreen" />
        <Stack.Screen name="VerifyEmailScreen" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
