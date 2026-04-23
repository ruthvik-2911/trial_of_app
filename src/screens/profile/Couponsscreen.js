// ─── CouponsScreen.js ──────────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// Features:
//   • Enter coupon code manually + Apply button
//   • Filter tabs — All, Active, Used, Expired
//   • Coupon cards with dashed border (ticket style)
//       - Discount value (% or flat)
//       - Code pill with Copy button
//       - Min order, max discount, validity
//       - Category badge
//       - Apply / Already Used / Expired state
//   • Confetti burst animation on Apply
//   • Savings summary banner (total saved so far)
//   • Empty state per filter
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Dimensions,
    StatusBar,
    Animated,
    Platform,
    Alert,
    ScrollView,
    Clipboard,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

// ─── Mock Coupons Data ─────────────────────────────────────────────────────
const COUPONS = [
    {
        id: 'c1',
        code: 'GOODKART20',
        type: 'percent',
        value: 20,
        maxDiscount: 500,
        minOrder: 999,
        title: '20% Off Sitewide',
        description: 'Get 20% off on all products. Maximum discount ₹500.',
        category: 'All Products',
        categoryIcon: 'grid-outline',
        categoryColor: '#7B5EEA',
        expiry: '30 Apr 2025',
        status: 'active',
        gradient: ['#1E1A38', '#231F42'],
        accentColor: '#F5C842',
    },
    {
        id: 'c2',
        code: 'TECHFEST50',
        type: 'flat',
        value: 1500,
        minOrder: 5000,
        title: '₹1500 Off on Tech',
        description: 'Flat ₹1500 off on all electronics & gadgets.',
        category: 'Electronics',
        categoryIcon: 'phone-portrait-outline',
        categoryColor: '#7B5EEA',
        expiry: '15 Apr 2025',
        status: 'active',
        gradient: ['#0D1E3A', '#112240'],
        accentColor: '#60A5FA',
    },
    {
        id: 'c3',
        code: 'NEWUSER30',
        type: 'percent',
        value: 30,
        maxDiscount: 300,
        minOrder: 499,
        title: '30% Off for New Users',
        description: 'Welcome offer! 30% off on your first order.',
        category: 'First Order',
        categoryIcon: 'star-outline',
        categoryColor: '#4ADE80',
        expiry: '31 Mar 2025',
        status: 'active',
        gradient: ['#0D2018', '#0F2820'],
        accentColor: '#4ADE80',
    },
    {
        id: 'c4',
        code: 'JEWEL10',
        type: 'percent',
        value: 10,
        maxDiscount: 2000,
        minOrder: 3000,
        title: '10% Off on Jewellery',
        description: 'Special discount on all jewellery items.',
        category: 'Jewelry & Accessories',
        categoryIcon: 'diamond-outline',
        categoryColor: '#F5C842',
        expiry: '20 Apr 2025',
        status: 'active',
        gradient: ['#1E1A10', '#2A2414'],
        accentColor: '#F5C842',
    },
    {
        id: 'c5',
        code: 'FASHION25',
        type: 'percent',
        value: 25,
        maxDiscount: 750,
        minOrder: 1499,
        title: '25% Off on Fashion',
        description: 'Trendy clothes, shoes & accessories at 25% off.',
        category: 'Fashion (Men)',
        categoryIcon: 'shirt-outline',
        categoryColor: '#60A5FA',
        expiry: '10 Apr 2025',
        status: 'used',
        gradient: ['#1E0F1A', '#2A1422'],
        accentColor: '#F472B6',
        usedOn: '8 Mar 2025',
        savedAmount: 620,
    },
    {
        id: 'c6',
        code: 'HOLI200',
        type: 'flat',
        value: 200,
        minOrder: 799,
        title: '₹200 Holi Special',
        description: 'Flat ₹200 off on your Holi shopping.',
        category: 'All Products',
        categoryIcon: 'color-palette-outline',
        categoryColor: '#FB923C',
        expiry: '28 Mar 2025',
        status: 'expired',
        gradient: ['#1E1208', '#2A1A0C'],
        accentColor: '#FB923C',
    },
    {
        id: 'c7',
        code: 'FREEDEL',
        type: 'flat',
        value: 49,
        minOrder: 299,
        title: 'Free Delivery',
        description: 'No delivery charges on orders above ₹299.',
        category: 'Delivery',
        categoryIcon: 'bicycle-outline',
        categoryColor: '#4ADE80',
        expiry: '30 Apr 2025',
        status: 'active',
        gradient: ['#0D2018', '#0F2820'],
        accentColor: '#4ADE80',
    },
];

const FILTER_TABS = [
    { id: 'all', label: 'All', count: COUPONS.length },
    { id: 'active', label: 'Active', count: COUPONS.filter(c => c.status === 'active').length },
    { id: 'used', label: 'Used', count: COUPONS.filter(c => c.status === 'used').length },
    { id: 'expired', label: 'Expired', count: COUPONS.filter(c => c.status === 'expired').length },
];

const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

// ─── Confetti Particle ─────────────────────────────────────────────────────
const ConfettiParticle = ({ anim, x, color, delay }) => {
    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] });
    const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, (Math.random() - 0.5) * 200] });
    const opacity = anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
    const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${Math.random() * 720}deg`] });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                left: x,
                top: 0,
                width: 8,
                height: 8,
                borderRadius: Math.random() > 0.5 ? 4 : 0,
                backgroundColor: color,
                opacity,
                transform: [{ translateY }, { translateX }, { rotate }],
            }}
        />
    );
};

// ─── Coupon Card ───────────────────────────────────────────────────────────
const CouponCard = ({ coupon, colors, gradients, onApply, onCopy, animDelay }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
        ]).start();
    }, []);

    const isActive = coupon.status === 'active';
    const isUsed = coupon.status === 'used';
    const isExpired = coupon.status === 'expired';
    const dimmed = isUsed || isExpired;

    const handleApply = () => {
        Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
        onApply(coupon);
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
            {/* Ticket card */}
            <View style={[styles.couponCard, { opacity: dimmed ? 0.6 : 1 }]}>
                <LinearGradient colors={coupon.gradient} style={styles.couponGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>

                    {/* Dashed border */}
                    <View style={[styles.dashedBorder, { borderColor: coupon.accentColor + '40' }]} />

                    {/* Left notch */}
                    <View style={[styles.notchLeft, { backgroundColor: colors.background }]} />
                    <View style={[styles.notchRight, { backgroundColor: colors.background }]} />

                    {/* Dashed divider line */}
                    <View style={[styles.dashedDivider, { borderColor: coupon.accentColor + '30' }]} />

                    {/* ── Left section — discount value ── */}
                    <View style={styles.couponLeft}>
                        <View style={[styles.discountCircle, { backgroundColor: coupon.accentColor + '15', borderColor: coupon.accentColor + '40' }]}>
                            <Text style={[styles.discountValue, { color: coupon.accentColor }]}>
                                {coupon.type === 'percent' ? `${coupon.value}%` : formatPrice(coupon.value)}
                            </Text>
                            <Text style={[styles.discountLabel, { color: coupon.accentColor + 'AA' }]}>
                                {coupon.type === 'percent' ? 'OFF' : 'FLAT'}
                            </Text>
                        </View>

                        {/* Category badge */}
                        <View style={[styles.categoryBadge, { backgroundColor: coupon.categoryColor + '20', borderColor: coupon.categoryColor + '50' }]}>
                            <Ionicons name={coupon.categoryIcon} size={11} color={coupon.categoryColor} />
                            <Text style={[styles.categoryText, { color: coupon.categoryColor }]}>{coupon.category}</Text>
                        </View>
                    </View>

                    {/* ── Right section — details ── */}
                    <View style={styles.couponRight}>
                        <Text style={[styles.couponTitle, { color: '#FFFFFF' }]} numberOfLines={1}>
                            {coupon.title}
                        </Text>
                        <Text style={[styles.couponDesc, { color: '#B8B0D8' }]} numberOfLines={2}>
                            {coupon.description}
                        </Text>

                        {/* Terms row */}
                        <View style={styles.termsRow}>
                            <View style={styles.termChip}>
                                <Ionicons name="cart-outline" size={10} color="#6B6490" />
                                <Text style={styles.termText}>Min {formatPrice(coupon.minOrder)}</Text>
                            </View>
                            {coupon.maxDiscount && (
                                <View style={styles.termChip}>
                                    <Ionicons name="arrow-down-outline" size={10} color="#6B6490" />
                                    <Text style={styles.termText}>Max {formatPrice(coupon.maxDiscount)}</Text>
                                </View>
                            )}
                        </View>

                        {/* Code row */}
                        <View style={styles.codeRow}>
                            <View style={[styles.codePill, { backgroundColor: coupon.accentColor + '15', borderColor: coupon.accentColor + '50', borderStyle: 'dashed' }]}>
                                <Text style={[styles.codeText, { color: coupon.accentColor }]}>{coupon.code}</Text>
                            </View>
                            {isActive && (
                                <TouchableOpacity
                                    style={[styles.copyBtn, { backgroundColor: coupon.accentColor + '20' }]}
                                    onPress={() => onCopy(coupon.code)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="copy-outline" size={13} color={coupon.accentColor} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Expiry / Used info */}
                        <View style={styles.expiryRow}>
                            {isActive && (
                                <>
                                    <Ionicons name="time-outline" size={11} color="#6B6490" />
                                    <Text style={styles.expiryText}>Valid till {coupon.expiry}</Text>
                                </>
                            )}
                            {isUsed && (
                                <>
                                    <Ionicons name="checkmark-circle-outline" size={11} color={colors.success} />
                                    <Text style={[styles.expiryText, { color: colors.success }]}>Used on {coupon.usedOn} · Saved {formatPrice(coupon.savedAmount)}</Text>
                                </>
                            )}
                            {isExpired && (
                                <>
                                    <Ionicons name="close-circle-outline" size={11} color={colors.error} />
                                    <Text style={[styles.expiryText, { color: colors.error }]}>Expired on {coupon.expiry}</Text>
                                </>
                            )}
                        </View>

                        {/* Apply button */}
                        {isActive && (
                            <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
                                <LinearGradient
                                    colors={[coupon.accentColor, coupon.accentColor + 'CC']}
                                    style={styles.applyBtnGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={[styles.applyBtnText, { color: '#0D0B1E' }]}>Apply Coupon</Text>
                                    <Ionicons name="arrow-forward" size={13} color="#0D0B1E" />
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                        {isUsed && (
                            <View style={[styles.statusTag, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
                                <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                                <Text style={[styles.statusTagText, { color: colors.success }]}>Already Used</Text>
                            </View>
                        )}
                        {isExpired && (
                            <View style={[styles.statusTag, { backgroundColor: colors.error + '20', borderColor: colors.error + '40' }]}>
                                <Ionicons name="time-outline" size={13} color={colors.error} />
                                <Text style={[styles.statusTagText, { color: colors.error }]}>Expired</Text>
                            </View>
                        )}
                    </View>
                </LinearGradient>
            </View>
        </Animated.View>
    );
};

// ─── Confetti Burst ────────────────────────────────────────────────────────
const ConfettiBurst = ({ visible, onDone }) => {
    const anim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            anim.setValue(0);
            Animated.timing(anim, { toValue: 1, duration: 1200, useNativeDriver: true }).start(onDone);
        }
    }, [visible]);

    if (!visible) return null;

    const COLORS = ['#F5C842', '#7B5EEA', '#4ADE80', '#F472B6', '#60A5FA', '#FB923C'];
    const particles = Array.from({ length: 20 }, (_, i) => ({
        x: Math.random() * width,
        color: COLORS[i % COLORS.length],
        delay: i * 30,
    }));

    return (
        <View style={styles.confettiContainer} pointerEvents="none">
            {particles.map((p, i) => (
                <ConfettiParticle key={i} anim={anim} x={p.x} color={p.color} delay={p.delay} />
            ))}
        </View>
    );
};

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ filter, colors }) => {
    const cfg = {
        all: { emoji: '🏷️', title: 'No coupons yet', sub: 'New offers coming soon!' },
        active: { emoji: '✨', title: 'No active coupons', sub: 'Check back soon for new deals' },
        used: { emoji: '✅', title: 'No used coupons', sub: 'Apply coupons to save on orders' },
        expired: { emoji: '⏰', title: 'No expired coupons', sub: "You haven't let any deals expire" },
    }[filter] ?? { emoji: '🏷️', title: 'Nothing here', sub: '' };

    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{cfg.emoji}</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{cfg.title}</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>{cfg.sub}</Text>
        </View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
const CouponsScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const [activeFilter, setActiveFilter] = useState('all');
    const [inputCode, setInputCode] = useState('');
    const [showConfetti, setShowConfetti] = useState(false);
    const inputRef = useRef(null);

    const totalSaved = COUPONS
        .filter(c => c.status === 'used' && c.savedAmount)
        .reduce((sum, c) => sum + (c.savedAmount ?? 0), 0);

    const filtered = activeFilter === 'all'
        ? COUPONS
        : COUPONS.filter(c => c.status === 'activeFilter');

    const filteredCoupons = activeFilter === 'all'
        ? COUPONS
        : COUPONS.filter(c => c.status === activeFilter);

    const handleApply = (coupon) => {
        setShowConfetti(true);
        Alert.alert(
            '🎉 Coupon Applied!',
            `"${coupon.code}" applied successfully!\n${coupon.type === 'percent' ? `${coupon.value}% off` : `Flat ${formatPrice(coupon.value)} off`} on your order.`,
            [{ text: 'Great!' }],
        );
    };

    const handleCopy = (code) => {
        // Clipboard.setString(code); // uncomment if expo-clipboard is installed
        Alert.alert('Copied!', `"${code}" copied to clipboard.`);
    };

    const handleManualApply = () => {
        if (!inputCode.trim()) {
            Alert.alert('Enter Code', 'Please enter a coupon code first.');
            return;
        }
        const found = COUPONS.find(c => c.code.toLowerCase() === inputCode.trim().toLowerCase());
        if (!found) {
            Alert.alert('Invalid Code', `"${inputCode}" is not a valid coupon code.`);
            return;
        }
        if (found.status === 'expired') {
            Alert.alert('Expired', `"${inputCode}" has expired.`);
            return;
        }
        if (found.status === 'used') {
            Alert.alert('Already Used', `"${inputCode}" has already been used.`);
            return;
        }
        setInputCode('');
        inputRef.current?.blur();
        handleApply(found);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Confetti */}
            <ConfettiBurst visible={showConfetti} onDone={() => setShowConfetti(false)} />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => navigation?.goBack()}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Coupons & Offers</Text>
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                            {COUPONS.filter(c => c.status === 'active').length} active coupons available
                        </Text>
                    </View>
                    <View style={[styles.savingsBadge, { backgroundColor: colors.success + '20', borderColor: colors.success + '40' }]}>
                        <Ionicons name="wallet-outline" size={13} color={colors.success} />
                        <Text style={[styles.savingsText, { color: colors.success }]}>
                            Saved {formatPrice(totalSaved)}
                        </Text>
                    </View>
                </View>

                {/* ── Manual code input ───────────────────────────────────────── */}
                <View style={[styles.inputSection, { borderBottomColor: colors.border }]}>
                    <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Ionicons name="pricetag-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                        <TextInput
                            ref={inputRef}
                            style={[styles.codeInput, { color: colors.textPrimary }]}
                            placeholder="Enter coupon code..."
                            placeholderTextColor={colors.textMuted}
                            value={inputCode}
                            onChangeText={(t) => setInputCode(t.toUpperCase())}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            returnKeyType="done"
                            onSubmitEditing={handleManualApply}
                        />
                        {inputCode.length > 0 && (
                            <TouchableOpacity onPress={() => setInputCode('')}>
                                <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                    <TouchableOpacity style={styles.applyInputBtn} onPress={handleManualApply} activeOpacity={0.85}>
                        <LinearGradient colors={gradients.accentButton} style={styles.applyInputGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.applyInputText}>Apply</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* ── Filter tabs ─────────────────────────────────────────────── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                    {FILTER_TABS.map((tab) => {
                        const isActive = activeFilter === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.filterTab,
                                    {
                                        backgroundColor: isActive ? colors.primary : colors.card,
                                        borderColor: isActive ? colors.primary : colors.border,
                                    },
                                ]}
                                onPress={() => setActiveFilter(tab.id)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.filterTabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
                                    {tab.label}
                                </Text>
                                <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.primary + '20' }]}>
                                    <Text style={[styles.filterCountText, { color: isActive ? '#fff' : colors.primary }]}>
                                        {tab.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {/* ── Coupons List ────────────────────────────────────────────────── */}
            {filteredCoupons.length === 0 ? (
                <EmptyState filter={activeFilter} colors={colors} />
            ) : (
                <FlatList
                    data={filteredCoupons}
                    keyExtractor={(c) => c.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    renderItem={({ item, index }) => (
                        <CouponCard
                            coupon={item}
                            colors={colors}
                            gradients={gradients}
                            onApply={handleApply}
                            onCopy={handleCopy}
                            animDelay={index * 80}
                        />
                    )}
                    ListHeaderComponent={
                        /* Savings summary banner */
                        totalSaved > 0 ? (
                            <LinearGradient
                                colors={['#0D2018', '#0F2820']}
                                style={styles.savingsBanner}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <View style={styles.savingsBannerLeft}>
                                    <Text style={styles.savingsBannerEmoji}>🎉</Text>
                                    <View>
                                        <Text style={styles.savingsBannerTitle}>Total Savings</Text>
                                        <Text style={styles.savingsBannerSub}>Using GoodKart coupons</Text>
                                    </View>
                                </View>
                                <Text style={[styles.savingsBannerValue, { color: '#4ADE80' }]}>
                                    {formatPrice(totalSaved)}
                                </Text>
                            </LinearGradient>
                        ) : null
                    }
                    ListFooterComponent={<View style={{ height: 90 }} />}
                />
            )}
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 19,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { fontSize: 11, marginTop: 1 },
    savingsBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 10, paddingVertical: 5,
    },
    savingsText: { fontSize: 11, fontWeight: '700' },

    // Input
    inputSection: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    inputRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 11 : 7,
    },
    codeInput: { flex: 1, fontSize: 14, fontWeight: '600', letterSpacing: 1 },
    applyInputBtn: { borderRadius: 12, overflow: 'hidden' },
    applyInputGradient: { paddingHorizontal: 20, paddingVertical: Platform.OS === 'ios' ? 13 : 10 },
    applyInputText: { fontSize: 14, fontWeight: '800', color: '#0D0B1E' },

    // Filter tabs
    filterTabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    filterTab: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, borderWidth: 1,
    },
    filterTabText: { fontSize: 13, fontWeight: '600' },
    filterCount: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 1 },
    filterCountText: { fontSize: 10, fontWeight: '700' },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 14, gap: 14 },

    // Savings banner
    savingsBanner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, padding: 16, marginBottom: 4,
    },
    savingsBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    savingsBannerEmoji: { fontSize: 28 },
    savingsBannerTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
    savingsBannerSub: { fontSize: 11, color: '#6B9980', marginTop: 2 },
    savingsBannerValue: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },

    // Coupon card — ticket style
    couponCard: { borderRadius: 18, overflow: 'hidden' },
    couponGradient: {
        flexDirection: 'row',
        minHeight: 150,
        position: 'relative',
        overflow: 'hidden',
    },
    dashedBorder: {
        position: 'absolute', inset: 0,
        borderRadius: 18, borderWidth: 1.5,
        borderStyle: 'dashed',
        zIndex: 0,
    },
    notchLeft: {
        position: 'absolute',
        left: '32%',
        top: -12,
        width: 24, height: 24, borderRadius: 12,
        zIndex: 2,
    },
    notchRight: {
        position: 'absolute',
        left: '32%',
        bottom: -12,
        width: 24, height: 24, borderRadius: 12,
        zIndex: 2,
    },
    dashedDivider: {
        position: 'absolute',
        left: '33%',
        top: 10,
        bottom: 10,
        width: 1,
        borderLeftWidth: 1.5,
        borderStyle: 'dashed',
        zIndex: 1,
    },

    // Left section
    couponLeft: {
        width: '32%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        paddingLeft: 12,
        zIndex: 2,
    },
    discountCircle: {
        width: 72, height: 72, borderRadius: 36,
        borderWidth: 1.5,
        alignItems: 'center', justifyContent: 'center',
    },
    discountValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
    discountLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    categoryBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 3,
        borderWidth: 1, borderRadius: 20,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    categoryText: { fontSize: 9, fontWeight: '700' },

    // Right section
    couponRight: {
        flex: 1,
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 5,
        zIndex: 2,
    },
    couponTitle: { fontSize: 14, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
    couponDesc: { fontSize: 11, lineHeight: 15 },
    termsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    termChip: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    termText: { fontSize: 10, color: '#6B6490' },
    codeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    codePill: {
        borderWidth: 1.5, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 4,
    },
    codeText: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
    copyBtn: {
        width: 28, height: 28, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    expiryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    expiryText: { fontSize: 10, color: '#6B6490' },
    applyBtn: { marginTop: 6, borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start' },
    applyBtnGradient: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 7,
    },
    applyBtnText: { fontSize: 12, fontWeight: '800' },
    statusTag: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        alignSelf: 'flex-start',
        borderWidth: 1, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
        marginTop: 6,
    },
    statusTagText: { fontSize: 11, fontWeight: '600' },

    // Confetti
    confettiContainer: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 400,
        zIndex: 100,
        pointerEvents: 'none',
    },

    // Empty
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 40, gap: 10,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800' },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

export default CouponsScreen;