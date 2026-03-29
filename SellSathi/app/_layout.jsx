import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { C } from '../constants/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/splash" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
