// ─── HomeStack.js ──────────────────────────────────────────────────────────
// Stack navigator for the Home tab:
//   Home → Search → ProductDetail

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/home/HomeScreen';
import ProductDetailScreen from '../screens/products/ProductDetailScreen';
import SearchScreen from '../screens/home/SearchScreen';
import CategoryScreen from '../screens/home/CategoryScreen';
import AllCategoriesScreen from '../screens/home/AllCategoriesScreen';
import ProductListScreen from '../screens/products/ProductListScreen';

const Stack = createStackNavigator();

const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
    <Stack.Screen name="HomeMain"      component={HomeScreen}         />
    <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
    <Stack.Screen name="CategoryScreen" component={CategoryScreen}    />
    <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
    <Stack.Screen name="ProductList"   component={ProductListScreen} />
    <Stack.Screen name="Search"        component={SearchScreen}        options={{ animation: 'slide_from_bottom' }} />
  </Stack.Navigator>
);

export default HomeStack;
