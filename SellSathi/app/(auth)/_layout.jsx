import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { C } from '../../constants/colors';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <View style={styles.container}>
        <Text style={styles.text}>Auth Stack Layout</Text>
      </View>
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: C.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
