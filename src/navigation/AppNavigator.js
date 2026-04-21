// ─── AppNavigator.js ───────────────────────────────────────────────────────
// GudKart — Expo Go compatible
// No mandatory login — browse freely, auth only when needed
// ──────────────────────────────────────────────────────────────────────────

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import BottomTabNavigator from './BottomTabNavigator';
import AuthStack from './AuthStack';
import Splash from '../screens/auth/SplashScreen';

import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import OrderTrackingScreen from '../screens/orders/OrderTrackingScreen';
import NotificationsScreen from '../screens/notification/NotificationsScreen';
import AddReviewScreen from '../screens/products/AddReviewScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';

// ✅ Cart Flow: Cart (tab) → Checkout → AddAddress → OrderSuccess
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import AddAddressScreen from '../screens/cart/AddAddressScreen';
import OrderSuccessScreen from '../screens/cart/OrderSuccessScreen';

const Stack = createStackNavigator();

const AppNavigator = () => (
    <NavigationContainer>
        <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                animationDuration: 200,         // faster transition (default ~350ms)
                detachPreviousScreen: false,    // keeps prev screen mounted for back-swipe
                gestureEnabled: true,
            }}
        >
            {/* Splash */}
            <Stack.Screen name="Splash" component={Splash} />

            {/* Auth */}
            <Stack.Screen name="Auth" component={AuthStack} />

            {/* Main Bottom Tabs */}
            <Stack.Screen name="Main" component={BottomTabNavigator} />

            {/* Orders */}
            <Stack.Screen name="Orders" component={OrdersScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />

            {/* Notifications */}
            <Stack.Screen name="Notifications" component={NotificationsScreen} />

            {/* Reviews */}
            <Stack.Screen name="AddReview" component={AddReviewScreen} />
            
            {/* Shared Products */}
            <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />

            {/* ── Checkout Flow ──────────────────────────────
                Tab:Cart → Checkout → AddAddress → OrderSuccess
            ─────────────────────────────────────────────── */}
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="AddAddress" component={AddAddressScreen} />
            <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
        </Stack.Navigator>
    </NavigationContainer>
);

export default AppNavigator;