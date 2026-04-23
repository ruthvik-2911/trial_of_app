// ─── ProfileScreen.js ──────────────────────────────────────────────────────
import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    Switch,
    Alert,
    Platform,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationBadge from '../../components/NotificationBadge';
import { CONTACT_INFO } from '../../data/supportContent';
import addressService from '../../services/api/addressService';
import orderService from '../../services/api/orderService';
import profileService from '../../services/api/Profileservice';

const { width } = Dimensions.get('window');

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ value, label, icon, colors }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name={icon} size={18} color={colors.accent} style={{ marginBottom: 6 }} />
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
);

// ─── Menu Row ──────────────────────────────────────────────────────────────
const MenuRow = ({ icon, iconColor, label, sublabel, onPress, colors, right, isLast }) => {
    const scale = useRef(new Animated.Value(1)).current;

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
            onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
            activeOpacity={1}
        >
            <Animated.View
                style={[
                    styles.menuRow,
                    {
                        borderBottomColor: colors.divider,
                        borderBottomWidth: isLast ? 0 : 1,
                        transform: [{ scale }],
                    },
                ]}
            >
                <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={18} color={iconColor} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
                    {sublabel ? (
                        <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
                    ) : null}
                </View>
                {right ?? (
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Section Card ──────────────────────────────────────────────────────────
const SectionCard = ({ title, children, colors }) => (
    <View style={styles.sectionBlock}>
        {title ? (
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
        ) : null}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {children}
        </View>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const ProfileScreen = ({ navigation }) => {
    const { colors, gradients, isDark, toggle } = useTheme();
    const { isLoggedIn, user, logout, updateUser } = useAuth();
    const { wishlistItems } = useWishlist();
    const { createMobileNotification } = useNotifications();
    const [notificationsOn, setNotificationsOn] = useState(true);
    const [orderCount, setOrderCount] = useState(0);
    const [addressSublabel, setAddressSublabel] = useState('Manage your shipping addresses');
    const scrollY = useRef(new Animated.Value(0)).current;

    // Avatar ring pulsing animation
    const pulse = useRef(new Animated.Value(1)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.08, duration: 1800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
            ]),
        ).start();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            if (isLoggedIn && user?.uid) {
                fetchProfileData(user.uid);
            }
        }, [isLoggedIn, user?.uid])
    );

    const fetchProfileData = async (uid) => {
        try {
            // ── Re-fetch user profile from backend so latest edits are shown ──
            try {
                const profileRes = await profileService.getProfile(uid);
                const freshProfile = profileRes?.profile || profileRes;
                if (freshProfile && typeof freshProfile === 'object') {
                    updateUser(freshProfile);
                }
            } catch (profileErr) {
                console.warn('[ProfileScreen] Could not refresh profile from server:', profileErr.message);
                // Non-fatal — keep showing cached user data
            }
            // Fetch Orders — API returns { orders: [...] } or a plain array
            const ordersData = await orderService.getUserOrders(uid);
            const orderList = Array.isArray(ordersData) ? ordersData : (ordersData?.orders ?? []);
            setOrderCount(orderList.length);

            // Fetch Addresses — API returns { addresses: [...] } or a plain array
            const addrData = await addressService.getAddresses(uid);
            const addresses = addrData?.addresses || addrData || [];
            if (Array.isArray(addresses) && addresses.length > 0) {
                const defaultAddr = addresses.find(a => a.isDefault);
                if (defaultAddr) {
                    const typeLabel = defaultAddr.type
                        ? defaultAddr.type.charAt(0).toUpperCase() + defaultAddr.type.slice(1)
                        : 'Address';
                    const line = defaultAddr.addressLine || defaultAddr.address || '';
                    setAddressSublabel(`${typeLabel}: ${line}`);
                } else {
                    setAddressSublabel(`${addresses.length} Address${addresses.length > 1 ? 'es' : ''} saved`);
                }
            } else {
                setAddressSublabel('No addresses saved yet');
            }
        } catch (error) {
            console.error('[ProfileScreen] Error fetching profile data:', error);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out of GoodKart?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Log Out',
                    style: 'destructive',
                    onPress: () => {
                        logout();
                        Alert.alert('Logged out', 'See you again!');
                    },
                },
            ],
        );
    };

    const handleAccountAction = (title) => {
        if (!isLoggedIn) {
            navigation.navigate('Auth', { screen: 'Login' });
            return;
        }
        if (title === 'My Orders') {
            navigation.navigate('Orders');
            return;
        }
        if (title === 'Saved Addresses') {
            navigation.navigate('AddressList');
            return;
        }
        if (title === 'Payments') {
            navigation.navigate('PaymentMethods');
            return;
        }
        if (title === 'Wallet') {
            navigation.navigate('Wallet');
            return;
        }
        if (title === 'Coupons') {
            navigation.navigate('Coupons');
            return;
        }
        if (title === 'FAQ') {
            navigation.navigate('FAQ');
            return;
        }
        if (title === 'Contact Us') {
            Alert.alert(
                'Contact Support',
                `Our team is available ${CONTACT_INFO.hours}.\n\nEmail: ${CONTACT_INFO.email}\nPhone: ${CONTACT_INFO.phone}\nOffice: ${CONTACT_INFO.office}`
            );
            return;
        }
        if (['Cancellation & Returns', 'Terms of Use', 'Security', 'Privacy'].includes(title)) {
            navigation.navigate('SupportContent', { title });
            return;
        }
        Alert.alert(title, 'Coming soon!');
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 80],
        outputRange: [1, 0],
        extrapolate: 'clamp',
    });

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor="transparent"
                translucent
            />

            {/* ── Hero Header ─────────────────────────────────────────────────── */}
            <LinearGradient
                colors={isDark ? ['#1A1440', '#0D0B1E'] : ['#BAE6FD', '#E8F4FD']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Image 
                    source={require('../../assets/icons/2 (3).png')} 
                    style={[styles.heroBgImage, { opacity: isDark ? 0.08 : 0.05 }]} 
                    resizeMode="contain" 
                />

                <SafeAreaView>
                    {/* Top bar */}
                    <View style={styles.heroTopBar}>
                        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>My Profile</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <NotificationBadge iconSize={24} iconColor={colors.textSecondary} />
                            {isLoggedIn && (
                                <TouchableOpacity
                                    style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    activeOpacity={0.8}
                                    onPress={() => navigation.navigate('EditProfile', {
                                        photoUri: user?.photoURL ?? user?.profilePhoto ?? null,
                                    })}
                                >
                                    <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                                    <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Avatar + Info */}
                    <View style={styles.heroBody}>
                        <View style={styles.avatarWrapper}>
                            <Animated.View
                                style={[
                                    styles.avatarRing,
                                    {
                                        borderColor: colors.accent,
                                        transform: [{ scale: pulse }],
                                    },
                                ]}
                            />
                            {user?.photoURL ? (
                                <Image
                                    source={{ uri: user.photoURL }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <LinearGradient
                                    colors={(gradients?.primary || []).every(Boolean) ? gradients.primary : ['#7B5EEA', '#5A3EC8']}
                                    style={styles.avatar}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    {isLoggedIn ? (
                                        <Text style={styles.avatarText}>
                                            {(user?.fullName || user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                        </Text>
                                    ) : (
                                        <Ionicons name="person" size={32} color={colors.textPrimary} />
                                    )}
                                </LinearGradient>
                            )}
                            <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />
                        </View>

                        <View style={styles.heroInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.userName, { color: colors.textPrimary }]}>
                                    {isLoggedIn ? (user?.fullName || user?.name || 'User') : 'Guest User'}
                                </Text>
                                {isLoggedIn && (
                                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                                )}
                            </View>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                {isLoggedIn ? (user?.email || '') : 'Login to view, track & buy'}
                            </Text>
                        </View>
                    </View>

                    {isLoggedIn && (
                        <Text style={[styles.memberSince, { color: colors.textMuted }]}>
                            {user?.createdAt
                                ? `Member since ${new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}`
                                : 'Member'}
                        </Text>
                    )}
                </SafeAreaView>
            </LinearGradient>

            {/* ── Scrollable Content ───────────────────────────────────────────── */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false },
                )}
                scrollEventThrottle={16}
            >
                {/* Stats */}
                {isLoggedIn && (
                    <View style={styles.statsRow}>
                        <StatCard value={orderCount} label="Orders" icon="bag-outline" colors={colors} />
                        <StatCard value={wishlistItems.length} label="Wishlist" icon="heart-outline" colors={colors} />
                    </View>
                )}

                {/* ── Account ─────────────────────────────────────────────────── */}
                {isLoggedIn ? (
                    <SectionCard title="ACCOUNT" colors={colors}>
                        <MenuRow
                            icon="bag-handle-outline"
                            iconColor="#7B5EEA"
                            label="My Orders"
                            sublabel="Track, return or buy again"
                            onPress={() => handleAccountAction('My Orders')}
                            colors={colors}
                        />
                        <MenuRow
                            icon="location-outline"
                            iconColor="#60A5FA"
                            label="Saved Addresses"
                            sublabel={isLoggedIn ? addressSublabel : 'Home, Work & more'}
                            onPress={() => handleAccountAction('Saved Addresses')}
                            colors={colors}
                            isLast
                        />
                    </SectionCard>
                ) : (
                    <SectionCard colors={colors}>
                        <MenuRow
                            icon="log-in-outline"
                            iconColor="#7B5EEA"
                            label="Sign in to GoodKart"
                            sublabel="View orders, saved addresses & more"
                            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                            colors={colors}
                            isLast
                        />
                    </SectionCard>
                )}

                {/* ── Preferences ─────────────────────────────────────────────── */}
                <SectionCard title="PREFERENCES" colors={colors}>
                    <MenuRow
                        icon={isDark ? 'moon-outline' : 'sunny-outline'}
                        iconColor={isDark ? '#9B82F3' : '#FFD700'}
                        label="Dark Mode"
                        sublabel={isDark ? 'Currently ON' : 'Currently OFF'}
                        colors={colors}
                        right={
                            <Switch
                                value={isDark}
                                onValueChange={toggle}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={isDark ? colors.accent : colors.textMuted}
                                ios_backgroundColor={colors.border}
                            />
                        }
                    />
                    <MenuRow
                        icon="notifications-outline"
                        iconColor="#FB923C"
                        label="Notifications"
                        sublabel={notificationsOn ? 'Deals, offers & updates' : 'Muted'}
                        colors={colors}
                        right={
                            <Switch
                                value={notificationsOn}
                                onValueChange={setNotificationsOn}
                                trackColor={{ false: colors.border, true: colors.primary + '80' }}
                                thumbColor={notificationsOn ? colors.accent : colors.textMuted}
                                ios_backgroundColor={colors.border}
                            />
                        }
                    />

                </SectionCard>

                {/* ── Notification Demos ── */}
                <SectionCard title="NOTIFICATION DEMOS" colors={colors}>
                    <MenuRow
                        icon="cube-outline"
                        iconColor="#10B981"
                        label="Test: Order Delivered"
                        sublabel="Simulate a delivery mobile alert"
                        onPress={() => createMobileNotification(
                            'Order Delivered 📦',
                            'Great news! Your order #12345 has been delivered successfully. Enjoy your purchase!',
                            { orderId: '12345', status: 'delivered' }
                        )}
                        colors={colors}
                    />
                    <MenuRow
                        icon="close-circle-outline"
                        iconColor="#FF4757"
                        label="Test: Order Cancelled"
                        sublabel="Simulate a cancellation mobile alert"
                        onPress={() => createMobileNotification(
                            'Order Cancelled ❌',
                            'Your order #54321 has been cancelled as requested. Refund initiated.',
                            { orderId: '54321', status: 'cancelled' }
                        )}
                        colors={colors}
                    />
                    <MenuRow
                        icon="star-outline"
                        iconColor="#FFD700"
                        label="Test: New Products"
                        sublabel="Simulate a new arrival notification"
                        onPress={() => createMobileNotification(
                            'New Arrival alert! ✨',
                            'Check out the latest Summer Collection. Trending items are back in stock!',
                            { type: 'announcement', category: 'Fashion (Women)' }
                        )}
                        colors={colors}
                        isLast
                    />
                </SectionCard>

                {/* ── Support ── */}
                <SectionCard title="SUPPORT" colors={colors}>
                    <MenuRow
                        icon="help-circle-outline"
                        iconColor="#60A5FA"
                        label="Help Centre"
                        sublabel="Live chat with our team"
                        onPress={() => handleAccountAction('Contact Us')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="list-outline"
                        iconColor="#FB923C"
                        label="FAQ"
                        sublabel="Common questions & answers"
                        onPress={() => handleAccountAction('FAQ')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="information-circle-outline"
                        iconColor="#4ADE80"
                        label="About GoodKart"
                        sublabel="Version 1.0.0"
                        onPress={() => Alert.alert('About', 'GoodKart v1.0.0\nYour Premium Marketplace')}
                        colors={colors}
                        isLast
                    />
                </SectionCard>

                {/* ── Consumer Policy ─────────────────────────────────────────── */}
                <SectionCard title="CONSUMER POLICY" colors={colors}>
                    <MenuRow
                        icon="return-up-back-outline"
                        iconColor="#FF6B6B"
                        label="Cancellation & Returns"
                        onPress={() => handleAccountAction('Cancellation & Returns')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="document-text-outline"
                        iconColor="#7B5EEA"
                        label="Terms of Use"
                        onPress={() => handleAccountAction('Terms of Use')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="shield-checkmark-outline"
                        iconColor="#4ADE80"
                        label="Security"
                        onPress={() => handleAccountAction('Security')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="lock-closed-outline"
                        iconColor="#F472B6"
                        label="Privacy"
                        onPress={() => handleAccountAction('Privacy')}
                        colors={colors}
                        isLast
                    />
                </SectionCard>

                {/* ── Logout ──────────────────────────────────────────────────── */}
                {isLoggedIn ? (
                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: colors.card, borderColor: '#F87171' + '40' }]}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-out-outline" size={20} color="#F87171" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.logoutBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                        onPress={() => navigation.navigate('Auth', { screen: 'Login' })}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="log-in-outline" size={20} color="#0D0B1E" />
                        <Text style={[styles.logoutText, { color: '#0D0B1E' }]}>Login / Sign Up</Text>
                    </TouchableOpacity>
                )}

                {/* Brand footer */}
                <View style={styles.footer}>
                    <Text style={[styles.footerBrand, { color: colors.accent }]}>GoodKart</Text>
                    <Text style={[styles.footerTagline, { color: colors.textMuted }]}>
                        Your Premium Marketplace
                    </Text>
                </View>

                <View style={{ height: 90 }} />
            </Animated.ScrollView>
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    heroGradient: { paddingHorizontal: 20, paddingBottom: 0 },
    heroBgImage: { position: 'absolute', width: width * 0.8, height: width * 0.8, top: -width * 0.15, right: -width * 0.2 },
    heroTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginBottom: 20 },
    screenTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    editBtnText: { fontSize: 13, fontWeight: '600' },

    heroBody: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 10 },
    avatarWrapper: { position: 'relative', width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
    avatarRing: { position: 'absolute', width: 84, height: 84, borderRadius: 42, borderWidth: 2 },
    avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
    avatarText: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
    onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },

    heroInfo: { flex: 1, gap: 4 },
    userName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    userEmail: { fontSize: 13, fontWeight: '400' },
    memberSince: { fontSize: 11, fontWeight: '400', marginTop: 2 },

    scrollContent: { paddingTop: 4 },

    statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 16, marginBottom: 6 },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
    statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

    sectionBlock: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 8, paddingLeft: 4 },
    sectionCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },

    menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
    menuIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    menuLabel: { fontSize: 14, fontWeight: '600' },
    menuSublabel: { fontSize: 11, fontWeight: '400', marginTop: 1 },
    miniWallet: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    miniWalletText: { fontSize: 12, fontWeight: '700' },

    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginHorizontal: 16, marginTop: 24, paddingVertical: 16, borderRadius: 18, borderWidth: 1 },
    logoutText: { fontSize: 15, fontWeight: '700', color: '#F87171' },

    footer: { alignItems: 'center', marginTop: 28, gap: 4 },
    footerBrand: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    footerTagline: { fontSize: 11, fontWeight: '400', letterSpacing: 1, textTransform: 'uppercase' },
});

export default ProfileScreen;