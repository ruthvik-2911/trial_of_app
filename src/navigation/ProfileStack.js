import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AddressListScreen from '../screens/profile/AddressListScreen';
import AddEditAddressScreen from '../screens/profile/AddEditAddressScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import AddPaymentMethodScreen from '../screens/profile/AddPaymentMethodScreen';
import WalletScreen from '../screens/profile/WalletScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import CouponsScreen from '../screens/profile/Couponsscreen';
import ThemeSettingsScreen from '../screens/profile/ThemeSettingsScreen';
import FAQScreen from '../screens/profile/FAQScreen';
import SupportContentScreen from '../screens/profile/SupportContentScreen';

const Stack = createStackNavigator();

const ProfileStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                animationEnabled: true,
            }}
        >
            <Stack.Screen name="ProfileMain" component={ProfileScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="AddressList" component={AddressListScreen} />
            <Stack.Screen name="AddEditAddress" component={AddEditAddressScreen} />
            <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
            <Stack.Screen name="AddPaymentMethod" component={AddPaymentMethodScreen} />
            <Stack.Screen name="Wallet" component={WalletScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Coupons" component={CouponsScreen} />
            <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
            <Stack.Screen name="FAQ" component={FAQScreen} />
            <Stack.Screen name="SupportContent" component={SupportContentScreen} />
        </Stack.Navigator>
    );
};

export default ProfileStack;
