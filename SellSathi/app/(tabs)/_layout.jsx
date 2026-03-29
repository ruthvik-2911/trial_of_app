import { View, Text, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { C } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: C.bg,
          borderTopColor: C.surfaceBrd,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textSec,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ color: C.accent }}>⌂</Text>,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: () => <Text style={{ color: C.textSec }}>⊞</Text>,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: () => <Text style={{ color: C.textSec }}>🛒</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: () => <Text style={{ color: C.textSec }}>📋</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: () => <Text style={{ color: C.textSec }}>◯</Text>,
        }}
      />
    </Tabs>
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
