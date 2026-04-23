// ─── BottomTabNavigator.js ─────────────────────────────────────────────────
// GoodKart — Expo Go compatible
// All 5 tabs wired: Home ✅  Explore ✅  Cart ✅  Saved ✅  Profile ✅

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../hooks/useTheme';
import { useCart } from '../context/CartContext';

import HomeStack from './HomeStack';
import CartScreen from '../screens/cart/CartScreen';
import SavedScreen from '../screens/wishlist/SavedScreen';
import ProfileStack from './ProfileStack';

const Tab = createBottomTabNavigator();

const TAB_CONFIG = [
    { name: 'Home', icon: 'home', iconOutline: 'home-outline' },
    { name: 'Cart', icon: 'bag', iconOutline: 'bag-outline' },
    { name: 'Saved', icon: 'heart', iconOutline: 'heart-outline' },
    { name: 'Profile', icon: 'person', iconOutline: 'person-outline' },
];

// ─── Custom Tab Bar (memoised) ──────────────────────────────────────────────
const CustomTabBar = React.memo(({ state, descriptors, navigation }) => {
    const { colors } = useTheme();
    const insets = useSafeAreaInsets();
    const { cartItems } = useCart();
    const cartCount = cartItems.length;

    return (
        <View style={[
            styles.tabBarWrapper, 
            { 
                backgroundColor: colors.tabBar, 
                borderTopColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 12),
            }
        ]}>
            {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const config = TAB_CONFIG[index];

                const onPress = () => {
                    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                };

                return (
                    <View key={route.key} style={styles.tabItem}>
                        <View
                            style={styles.tabButton}
                            onStartShouldSetResponder={() => true}
                            onResponderRelease={onPress}
                        >
                            {isFocused && (
                                <View style={[styles.activeIndicator, { backgroundColor: colors.tabActive }]} />
                            )}
                            <Ionicons
                                name={isFocused ? config.icon : config.iconOutline}
                                size={22}
                                color={isFocused ? colors.tabActive : colors.tabInactive}
                            />
                            {config.name === 'Cart' && cartCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                                    <Text style={styles.badgeText}>{cartCount}</Text>
                                </View>
                            )}
                            <Text
                                style={[
                                    styles.tabLabel,
                                    {
                                        color: isFocused ? colors.tabActive : colors.tabInactive,
                                        fontWeight: isFocused ? '700' : '400',
                                    },
                                ]}
                            >
                                {route.name}
                            </Text>
                        </View>
                    </View>
                );
            })}
        </View>
    );
});

// ─── Navigator ─────────────────────────────────────────────────────────────
const BottomTabNavigator = () => (
    <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
        detachInactiveScreens={true}
    >
        <Tab.Screen name="Home" component={HomeStack} />
        <Tab.Screen name="Cart" component={CartScreen} />
        <Tab.Screen name="Saved" component={SavedScreen} />
        <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    tabBarWrapper: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingTop: 8,
        paddingHorizontal: 4,
    },
    tabItem: { flex: 1, alignItems: 'center' },
    tabButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2, minWidth: 50 },
    activeIndicator: { position: 'absolute', top: -6, width: 24, height: 3, borderRadius: 2 },
    tabLabel: { fontSize: 10 },
    badge: {
        position: 'absolute',
        top: 0,
        right: 4,
        backgroundColor: '#FFD700',
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        zIndex: 1,
    },
    badgeText: {
        color: '#1A0B2E',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default BottomTabNavigator;