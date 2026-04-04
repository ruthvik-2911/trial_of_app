// ─── ProfileScreen.js ──────────────────────────────────────────────────────
// Gudkart — Expo Go compatible
//
// Sections:
//   • Hero header — avatar, name, email, member badge
//   • Stats row  — Orders, Wishlist, Reviews
//   • Account menu — My Orders, Addresses, Payments, Coupons
//   • Preferences  — Theme toggle (Dark/Light), Notifications, Language
//   • Support      — Help Centre, Rate App, About Gudkart
//   • Logout button
// ──────────────────────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Animated,
    Switch,
    Alert,
    Platform,
    Dimensions,
    SafeAreaView,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import NotificationBadge from '../../components/NotificationBadge';

const { width } = Dimensions.get('window');

// ─── Mock user data ────────────────────────────────────────────────────────
const USER = {
    name: 'Rahul Mehta',
    email: 'rahul.mehta@gmail.com',
    phone: '+91 98765 43210',
    avatar: 'RM',
    memberSince: 'Member since Jan 2024',
    tier: 'Gold Member',
    stats: {
        orders: 24,
        wishlist: 12,
        reviews: 8,
    },
};

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
                {/* Icon bubble */}
                <View style={[styles.menuIcon, { backgroundColor: iconColor + '20' }]}>
                    <Ionicons name={icon} size={18} color={iconColor} />
                </View>

                {/* Label */}
                <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, { color: colors.textPrimary }]}>{label}</Text>
                    {sublabel ? (
                        <Text style={[styles.menuSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
                    ) : null}
                </View>

                {/* Right side — chevron or custom */}
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
    const { isAuthenticated, logout } = useAuth();
    const [notificationsOn, setNotificationsOn] = useState(true);
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

    const handleLogout = () => {
        Alert.alert(
            'Log Out',
            'Are you sure you want to log out of Gudkart?',
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
        if (!isAuthenticated) {
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
            Alert.alert('Contact Support', 'Our team is available 24/7.\nEmail: support@gudkart.com\nPhone: +91 1800-456-789');
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
                {/* Decorative circles */}
                <View style={[styles.heroCircle1, { borderColor: colors.primary + '20' }]} />
                <View style={[styles.heroCircle2, { borderColor: colors.accent + '15' }]} />

                <SafeAreaView>
                    {/* Top bar */}
                    <View style={[styles.heroTopBar, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }]}>
                        <Text style={[styles.screenTitle, { color: colors.textPrimary }]}>My Profile</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <NotificationBadge iconSize={18} iconColor={colors.textSecondary} />
                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('EditProfile')}
                            >
                                <Ionicons name="pencil-outline" size={16} color={colors.textSecondary} />
                                <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.editBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('Settings')}
                            >
                                <Ionicons name="settings-outline" size={16} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Avatar + Info */}
                    <View style={styles.heroBody}>
                        {/* Pulsing ring around avatar */}
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
                            <LinearGradient
                                colors={gradients.primary}
                                style={styles.avatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                {isAuthenticated ? (
                                    <Text style={styles.avatarText}>{USER.avatar}</Text>
                                ) : (
                                    <Ionicons name="person" size={32} color={colors.textPrimary} />
                                )}
                            </LinearGradient>

                            {/* Online indicator */}
                            <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.background }]} />
                        </View>

                        <View style={styles.heroInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={[styles.userName, { color: colors.textPrimary }]}>
                                    {isAuthenticated ? USER.name : 'Guest User'}
                                </Text>
                                {isAuthenticated && (
                                    <TouchableOpacity 
                                        onPress={() => navigation.navigate('Wallet')}
                                        style={[styles.miniWallet, { backgroundColor: colors.accent + '20' }]}
                                    >
                                        <Ionicons name="wallet" size={12} color={colors.accent} />
                                        <Text style={[styles.miniWalletText, { color: colors.accent }]}>₹2,840</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                                {isAuthenticated ? USER.email : 'Login to view, track & buy'}
                            </Text>
                            {isAuthenticated && (
                                <View style={[styles.tierBadge, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '50' }]}>
                                    <Ionicons name="star" size={11} color={colors.accent} />
                                    <Text style={[styles.tierText, { color: colors.accent }]}>{USER.tier}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Member since */}
                    {isAuthenticated && (
                        <Text style={[styles.memberSince, { color: colors.textMuted }]}>{USER.memberSince}</Text>
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
                {isAuthenticated && (
                    <View style={styles.statsRow}>
                        <StatCard value={USER.stats.orders} label="Orders" icon="bag-outline" colors={colors} />
                        <StatCard value={USER.stats.wishlist} label="Wishlist" icon="heart-outline" colors={colors} />
                        <StatCard value={USER.stats.reviews} label="Reviews" icon="star-outline" colors={colors} />
                    </View>
                )}

                {/* ── Account ─────────────────────────────────────────────────── */}
                <SectionCard title="ACCOUNT" colors={colors}>
                    <MenuRow
                        icon="wallet-outline"
                        iconColor="#FACC15"
                        label="GudCart Wallet"
                        sublabel="Coins, Rewards & Balance"
                        onPress={() => handleAccountAction('Wallet')}
                        colors={colors}
                    />
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
                        sublabel="Home, Work & more"
                        onPress={() => handleAccountAction('Saved Addresses')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="card-outline"
                        iconColor="#4ADE80"
                        label="Payment Methods"
                        sublabel="UPI, Cards & Wallets"
                        onPress={() => handleAccountAction('Payments')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="pricetag-outline"
                        iconColor="#FFD700"
                        label="Coupons & Offers"
                        sublabel={isAuthenticated ? "3 coupons available" : "Login to view coupons"}
                        onPress={() => handleAccountAction('Coupons')}
                        colors={colors}
                        isLast
                    />
                </SectionCard>

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
                    <MenuRow
                        icon="language-outline"
                        iconColor="#F472B6"
                        label="Language"
                        sublabel="English"
                        onPress={() => Alert.alert('Language', 'Coming soon!')}
                        colors={colors}
                        isLast
                    />
                </SectionCard>

                {/* ── Support ─────────────────────────────────────────────────── */}
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
                        icon="star-half-outline"
                        iconColor="#FFD700"
                        label="Rate Gudkart"
                        sublabel="Love the app? Tell us!"
                        onPress={() => Alert.alert('Rate', 'Thank you! 🙏')}
                        colors={colors}
                    />
                    <MenuRow
                        icon="information-circle-outline"
                        iconColor="#4ADE80"
                        label="About Gudkart"
                        sublabel="Version 1.0.0"
                        onPress={() => Alert.alert('About', 'Gudkart v1.0.0\nYour Premium Marketplace')}
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
                {isAuthenticated ? (
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
                    <Text style={[styles.footerBrand, { color: colors.accent }]}>Gudkart</Text>
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

    // Hero
    heroGradient: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    heroCircle1: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        borderWidth: 1,
        top: -60,
        right: -60,
    },
    heroCircle2: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        bottom: -30,
        left: -20,
    },
    heroTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        marginBottom: 20,
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
    },
    editBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Avatar
    heroBody: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 10,
    },
    avatarWrapper: {
        position: 'relative',
        width: 76,
        height: 76,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 2,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 26,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: -0.5,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 2,
    },

    // User info
    heroInfo: { flex: 1, gap: 4 },
    userName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    userEmail: { fontSize: 13, fontWeight: '400' },
    tierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginTop: 2,
    },
    tierText: { fontSize: 11, fontWeight: '700' },
    memberSince: { fontSize: 11, fontWeight: '400', marginTop: 2 },

    // Scroll
    scrollContent: { paddingTop: 4 },

    // Stats
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 10,
        marginTop: 16,
        marginBottom: 6,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    statValue: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
    statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

    // Section
    sectionBlock: { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 8,
        paddingLeft: 4,
    },
    sectionCard: {
        borderRadius: 18,
        borderWidth: 1,
        overflow: 'hidden',
    },

    // Menu row
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 14,
    },
    menuIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabel: { fontSize: 14, fontWeight: '600' },
    menuSublabel: { fontSize: 11, fontWeight: '400', marginTop: 1 },
    miniWallet: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    miniWalletText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Logout
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 16,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 18,
        borderWidth: 1,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#F87171',
    },

    // Footer
    footer: {
        alignItems: 'center',
        marginTop: 28,
        gap: 4,
    },
    footerBrand: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    footerTagline: {
        fontSize: 11,
        fontWeight: '400',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});

export default ProfileScreen;