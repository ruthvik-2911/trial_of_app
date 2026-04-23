// ─── OrdersScreen.js ───────────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// Features:
//   • Filter tabs — All, Active, Delivered, Cancelled
//   • Order cards with:
//       - Order ID + date
//       - Product previews (emoji stack)
//       - Status pill with colour + icon
//       - Delivery timeline progress bar
//       - Total amount
//       - Action buttons: Track / Reorder / Rate / Return
//   • Real API data via orderService
//   • Loading skeleton + error + pull-to-refresh
//   • Cancel order with confirmation
//   • Navigate to OrderDetailScreen on card/detail press
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
    Platform,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/api/orderService';

const { width } = Dimensions.get('window');

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

/**
 * Normalise the raw API order shape so the UI always sees a consistent object.
 * Adjust field mappings here if your backend returns different key names.
 */
const normaliseOrder = (raw) => ({
    id: raw._id ?? raw.id ?? '',
    date: raw.createdAt
        ? new Date(raw.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : raw.date ?? '',
    // Map backend status → UI status bucket
    status: (() => {
        const s = (raw.status ?? '').toLowerCase();
        if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
        if (s === 'delivered') return 'delivered';
        return 'active'; // pending / processing / shipped / out_for_delivery
    })(),
    statusLabel: raw.statusLabel ?? raw.status ?? '',
    estimatedDate: raw.estimatedDelivery ?? raw.estimatedDate ?? '',
    deliveredDate: raw.deliveredAt
        ? new Date(raw.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : raw.deliveredDate ?? '',
    cancelledDate: raw.cancelledAt
        ? new Date(raw.cancelledAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : raw.cancelledDate ?? '',
    cancelReason: raw.cancellationReason ?? raw.cancelReason ?? '',
    items: (raw.items ?? []).map((item) => ({
        id: item._id ?? item.id ?? item.productId ?? '',
        name: item.name ?? item.productName ?? '',
        emoji: item.emoji ?? '📦',
        qty: item.qty ?? item.quantity ?? 1,
        price: item.price ?? 0,
        desc: item.desc ?? item.description ?? '',
    })),
    total: raw.total ?? raw.totalAmount ?? 0,
    savings: raw.savings ?? raw.discount ?? 0,
    address: (() => {
        const s = raw.shippingDetails ?? {};
        if (raw.address) return raw.address;
        const parts = [s.name, s.address, s.city, s.state ? `${s.state} - ${s.pincode}` : s.pincode].filter(Boolean);
        return parts.join(', ');
    })(),
    payment: raw.payment ?? raw.paymentMethod ?? '',
    timeline: (raw.timeline ?? []).map((t) => ({
        label: t.label ?? t.status ?? '',
        date: t.date ?? t.timestamp ?? '',
        done: t.done ?? t.completed ?? false,
        desc: t.desc ?? t.description ?? '',
    })),
    refundStatus: raw.refundStatus ?? '',
    // Capabilities derived from status
    canTrack: (() => {
        const s = (raw.status ?? '').toLowerCase();
        return ['shipped', 'out_for_delivery', 'processing'].includes(s);
    })(),
    canRate: (raw.status ?? '').toLowerCase() === 'delivered',
    canReturn: raw.canReturn ?? false,
    canReorder: ['cancelled', 'delivered'].includes((raw.status ?? '').toLowerCase()),
    canCancel: ['pending', 'processing'].includes((raw.status ?? '').toLowerCase()),
});

// ─── Config ────────────────────────────────────────────────────────────────

const FILTER_TABS = [
    { id: 'all', label: 'All', icon: 'layers-outline' },
    { id: 'active', label: 'Active', icon: 'time-outline' },
    { id: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline' },
    { id: 'cancelled', label: 'Cancelled', icon: 'close-circle-outline' },
];

const STATUS_CONFIG = {
    active: { color: '#60A5FA', bg: '#60A5FA20', icon: 'time-outline' },
    delivered: { color: '#4ADE80', bg: '#4ADE8020', icon: 'checkmark-circle-outline' },
    cancelled: { color: '#F87171', bg: '#F8717120', icon: 'close-circle-outline' },
};

// ─── Timeline Step ─────────────────────────────────────────────────────────
const TimelineStep = ({ step, index, total, colors, isCancelled }) => {
    const dotColor = step.done
        ? isCancelled && index > 0 ? '#F87171' : colors.success
        : colors.border;
    const lineColor = step.done ? (isCancelled && index > 0 ? '#F87171' : colors.success) : colors.border;

    return (
        <View style={styles.timelineStep}>
            {index > 0 && <View style={[styles.timelineLine, { backgroundColor: lineColor }]} />}
            <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: dotColor }]}>
                {step.done && (
                    <Ionicons name={isCancelled && index > 0 ? 'close' : 'checkmark'} size={8} color="#fff" />
                )}
            </View>
            <Text style={[styles.timelineLabel, { color: step.done ? colors.textSecondary : colors.textMuted }]}>
                {step.label}
            </Text>
            <Text style={[styles.timelineDate, { color: step.done ? colors.accent : colors.textMuted }]}>
                {step.date}
            </Text>
        </View>
    );
};

// ─── Loading Skeleton ──────────────────────────────────────────────────────
const SkeletonCard = ({ colors }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const bg = { backgroundColor: colors.border, borderRadius: 8 };
    return (
        <Animated.View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pulse }]}>
            <View style={styles.cardTopRow}>
                <View style={[bg, { width: 120, height: 16 }]} />
                <View style={[bg, { width: 70, height: 24, borderRadius: 12 }]} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                {[1, 2].map((k) => <View key={k} style={[bg, { width: 40, height: 40, borderRadius: 12 }]} />)}
                <View style={{ flex: 1, gap: 6 }}>
                    <View style={[bg, { height: 12, width: '80%' }]} />
                    <View style={[bg, { height: 10, width: '50%' }]} />
                </View>
            </View>
            <View style={[bg, { height: 4, marginBottom: 12, borderRadius: 2 }]} />
            <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <View style={[bg, { width: 80, height: 20 }]} />
                <View style={[bg, { width: 100, height: 32, borderRadius: 8 }]} />
            </View>
        </Animated.View>
    );
};

// ─── Order Card ────────────────────────────────────────────────────────────
const OrderCard = ({ order, colors, gradients, onPress, animDelay, navigation, onCancel }) => {
    const cfg = STATUS_CONFIG[order.status];
    const isCancelled = order.status === 'cancelled';
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 350, delay: animDelay, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 0, duration: 350, delay: animDelay, useNativeDriver: true }),
        ]).start();
    }, []);

    const doneSteps = order.timeline.filter((s) => s.done).length;
    const totalSteps = order.timeline.length;
    const progress = totalSteps > 0 ? doneSteps / totalSteps : 0;

    const handleCancel = () => {
        Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${order.id}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: () => onCancel(order.id),
                },
            ]
        );
    };

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity
                style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={onPress}
                activeOpacity={0.88}
            >
                {/* ── Top row ── */}
                <View style={styles.cardTopRow}>
                    <View>
                        <Text style={[styles.orderId, { color: colors.textPrimary }]}>{order.id}</Text>
                        <Text style={[styles.orderDate, { color: colors.textMuted }]}>{order.date}</Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                        <Text style={[styles.statusText, { color: cfg.color }]}>
                            {order.statusLabel
                                ? order.statusLabel.charAt(0).toUpperCase() + order.statusLabel.slice(1)
                                : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* ── Product emoji preview ── */}
                <View style={styles.itemsPreview}>
                    {order.items.slice(0, 3).map((item, i) => (
                        <View
                            key={item.id || i}
                            style={[styles.emojiChip, { backgroundColor: colors.cardAlt, borderColor: colors.border, marginLeft: i > 0 ? -8 : 0 }]}
                        >
                            <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
                        </View>
                    ))}
                    {order.items.length > 3 && (
                        <View style={[styles.emojiChip, styles.moreChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40', marginLeft: -8 }]}>
                            <Text style={[styles.moreText, { color: colors.primary }]}>+{order.items.length - 3}</Text>
                        </View>
                    )}
                    <View style={styles.itemNamesCol}>
                        <Text style={[styles.itemNamesText, { color: colors.textSecondary }]} numberOfLines={1}>
                            {order.items.map((i) => i.name).join(', ')}
                        </Text>
                        <Text style={[styles.itemCount, { color: colors.textMuted }]}>
                            {order.items.reduce((a, i) => a + i.qty, 0)} item{order.items.reduce((a, i) => a + i.qty, 0) > 1 ? 's' : ''}
                        </Text>
                    </View>
                </View>

                {/* ── Progress bar ── */}
                {!isCancelled && (
                    <View style={styles.progressSection}>
                        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress * 100}%`,
                                        backgroundColor: order.status === 'delivered' ? colors.success : colors.primary,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={[styles.progressLabel, { color: colors.textMuted }]}>
                            {order.status === 'delivered'
                                ? `✅ Delivered on ${order.deliveredDate}`
                                : order.estimatedDate ? `🚚 Estimated: ${order.estimatedDate}` : '🚚 In progress'}
                        </Text>
                    </View>
                )}

                {/* Cancelled refund info */}
                {isCancelled && order.refundStatus && (
                    <View style={[styles.refundChip, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                        <Ionicons name="checkmark-circle-outline" size={13} color={colors.success} />
                        <Text style={[styles.refundChipText, { color: colors.success }]}>{order.refundStatus}</Text>
                    </View>
                )}

                {/* ── Divider ── */}
                <View style={[styles.cardDivider, { backgroundColor: colors.divider }]} />

                {/* ── Bottom row ── */}
                <View style={styles.cardBottomRow}>
                    <View>
                        <Text style={[styles.totalLabel, { color: colors.textMuted }]}>Total</Text>
                        <Text style={[styles.totalValue, { color: colors.accent }]}>{formatPrice(order.total)}</Text>
                    </View>

                    <View style={styles.actionBtns}>
                        {/* Cancel — only for pending/processing */}
                        {order.canCancel && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: '#F8717160', backgroundColor: '#F8717115' }]}
                                onPress={handleCancel}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="close-circle-outline" size={13} color="#F87171" />
                                <Text style={[styles.actionBtnText, { color: '#F87171' }]}>Cancel</Text>
                            </TouchableOpacity>
                        )}

                        {order.canTrack && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: colors.primary + '60', backgroundColor: colors.primary + '15' }]}
                                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="navigate-outline" size={13} color={colors.primary} />
                                <Text style={[styles.actionBtnText, { color: colors.primary }]}>Track</Text>
                            </TouchableOpacity>
                        )}

                        {order.canRate && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: colors.accent + '60', backgroundColor: colors.accent + '15' }]}
                                onPress={() => navigation.navigate('OrderDetail', { orderId: order.id })}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="star-outline" size={13} color={colors.accent} />
                                <Text style={[styles.actionBtnText, { color: colors.accent }]}>Rate</Text>
                            </TouchableOpacity>
                        )}

                        {order.canReturn && (
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: colors.textMuted + '60', backgroundColor: colors.card }]}
                                onPress={() => Alert.alert('Return', `Return request for ${order.id}`)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="return-down-back-outline" size={13} color={colors.textMuted} />
                                <Text style={[styles.actionBtnText, { color: colors.textMuted }]}>Return</Text>
                            </TouchableOpacity>
                        )}

                        {order.canReorder && (
                            <TouchableOpacity
                                style={styles.reorderBtn}
                                onPress={() => Alert.alert('Reorder', `Reordering items from ${order.id}`)}
                                activeOpacity={0.8}
                            >
                                <LinearGradient colors={gradients.button} style={styles.reorderGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <Ionicons name="refresh-outline" size={13} color="#fff" />
                                    <Text style={styles.reorderText}>Reorder</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}

                        {/* View details */}
                        <TouchableOpacity
                            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.cardAlt }]}
                            onPress={onPress}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ filter, colors, onShop }) => {
    const configs = {
        all: { emoji: '📦', title: 'No orders yet', sub: 'Start shopping to see your orders here' },
        active: { emoji: '🚚', title: 'No active orders', sub: 'All your deliveries are complete!' },
        delivered: { emoji: '✅', title: 'No delivered orders', sub: 'Your delivered orders will appear here' },
        cancelled: { emoji: '🚫', title: 'No cancelled orders', sub: "You haven't cancelled any orders" },
    };
    const { emoji, title, sub } = configs[filter] ?? configs.all;

    return (
        <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{emoji}</Text>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>{sub}</Text>
            {filter === 'all' && (
                <TouchableOpacity style={styles.shopBtn} onPress={onShop} activeOpacity={0.85}>
                    <Text style={[styles.shopBtnText, { color: colors.accent }]}>Start Shopping →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

// ─── Error State ───────────────────────────────────────────────────────────
const ErrorState = ({ colors, onRetry }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>⚠️</Text>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
        <Text style={[styles.emptySub, { color: colors.textMuted }]}>We couldn't load your orders. Please try again.</Text>
        <TouchableOpacity style={styles.shopBtn} onPress={onRetry} activeOpacity={0.85}>
            <Text style={[styles.shopBtnText, { color: colors.accent }]}>Retry</Text>
        </TouchableOpacity>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const OrdersScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { uid } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [cancellingId, setCancellingId] = useState(null);

    // ── Fetch orders ────────────────────────────────────────────────────────
    const fetchOrders = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);

        try {
            const data = await orderService.getUserOrders(uid);
            // API may return { orders: [...] } or a plain array
            const raw = Array.isArray(data) ? data : (data.orders ?? []);
            setOrders(raw.map(normaliseOrder));
        } catch (err) {
            console.error('Failed to load orders:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [uid]);

    useEffect(() => {
        fetchOrders();

        // Refresh when screen comes into focus (e.g. returning from Detail screen)
        const unsubscribe = navigation.addListener('focus', () => {
            fetchOrders(true); // silent refresh
        });

        return unsubscribe;
    }, [fetchOrders, navigation]);

    // ── Cancel order ────────────────────────────────────────────────────────
    const handleCancel = async (orderId) => {
        setCancellingId(orderId);
        try {
            await orderService.cancelOrder(orderId, 'Cancelled by user');
            // Optimistically update the local list
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId
                        ? { ...o, status: 'cancelled', statusLabel: 'Cancelled', canCancel: false, canTrack: false }
                        : o
                )
            );
            Alert.alert('Order Cancelled', `Order ${orderId} has been cancelled successfully.`);
        } catch (err) {
            Alert.alert('Error', 'Failed to cancel the order. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    // ── Filtered list ───────────────────────────────────────────────────────
    const filteredOrders = activeFilter === 'all'
        ? orders
        : orders.filter((o) => o.status === activeFilter);

    const counts = {
        all: orders.length,
        active: orders.filter((o) => o.status === 'active').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    // Navigate to OrderDetailScreen, pass orderId so it can fetch fresh data
    const openDetail = (order) => {
        navigation.navigate('OrderDetail', { orderId: order.id });
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* ── Header ── */}
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
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>My Orders</Text>
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                            {loading ? 'Loading…' : `${counts.all} orders total`}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.searchIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* ── Filter Tabs ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTabs}>
                    {FILTER_TABS.map((tab) => {
                        const isActive = activeFilter === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[
                                    styles.filterTab,
                                    {
                                        backgroundColor: isActive ? colors.accent : colors.card,
                                        borderColor: isActive ? colors.accent : colors.border,
                                    },
                                ]}
                                onPress={() => setActiveFilter(tab.id)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={tab.icon} size={14} color={isActive ? colors.textInverse : colors.textMuted} />
                                <Text style={[styles.filterTabText, { color: isActive ? colors.textInverse : colors.textSecondary }]}>
                                    {tab.label}
                                </Text>
                                {counts[tab.id] > 0 && (
                                    <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(0,0,0,0.1)' : colors.accent + '20' }]}>
                                        <Text style={[styles.filterCountText, { color: isActive ? colors.textInverse : colors.accent }]}>
                                            {counts[tab.id]}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </SafeAreaView>

            {/* ── Content ── */}
            {loading ? (
                <ScrollView contentContainerStyle={styles.listContent}>
                    {[1, 2, 3].map((k) => <SkeletonCard key={k} colors={colors} />)}
                </ScrollView>
            ) : error ? (
                <ErrorState colors={colors} onRetry={() => fetchOrders()} />
            ) : filteredOrders.length === 0 ? (
                <EmptyState
                    filter={activeFilter}
                    colors={colors}
                    onShop={() => navigation?.navigate('Main', { screen: 'Home' })}
                />
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(o) => o.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchOrders(true)}
                            tintColor={colors.accent}
                        />
                    }
                    renderItem={({ item, index }) => (
                        <View style={{ opacity: cancellingId === item.id ? 0.5 : 1 }}>
                            <OrderCard
                                order={item}
                                colors={colors}
                                gradients={gradients}
                                onPress={() => openDetail(item)}
                                animDelay={index * 80}
                                navigation={navigation}
                                onCancel={handleCancel}
                            />
                        </View>
                    )}
                    ListFooterComponent={<View style={{ height: 90 }} />}
                />
            )}
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { fontSize: 11, fontWeight: '400', marginTop: 1 },
    searchIconBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

    filterTabs: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    filterTab: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1,
    },
    filterTabText: { fontSize: 13, fontWeight: '600' },
    filterCount: { borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
    filterCountText: { fontSize: 10, fontWeight: '700' },

    listContent: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },

    orderCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 },
    orderId: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
    orderDate: { fontSize: 11, marginTop: 2 },

    statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    statusText: { fontSize: 11, fontWeight: '700' },

    itemsPreview: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    emojiChip: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    moreChip: {},
    moreText: { fontSize: 11, fontWeight: '700' },
    itemNamesCol: { flex: 1, marginLeft: 10 },
    itemNamesText: { fontSize: 12, fontWeight: '500' },
    itemCount: { fontSize: 11, marginTop: 2 },

    progressSection: { marginBottom: 14 },
    progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 6 },
    progressFill: { height: '100%', borderRadius: 2 },
    progressLabel: { fontSize: 11 },

    refundChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
        marginBottom: 12, alignSelf: 'flex-start',
    },
    refundChipText: { fontSize: 11, fontWeight: '600' },

    cardDivider: { height: 1, marginBottom: 12 },

    cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    totalLabel: { fontSize: 11 },
    totalValue: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
    actionBtns: { flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
    actionBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 4,
        borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6,
    },
    actionBtnText: { fontSize: 11, fontWeight: '600' },
    reorderBtn: { borderRadius: 8, overflow: 'hidden' },
    reorderGradient: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 7 },
    reorderText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10 },
    emptyEmoji: { fontSize: 56, marginBottom: 8 },
    emptyTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
    shopBtn: { marginTop: 8 },
    shopBtnText: { fontSize: 15, fontWeight: '700' },

    // Timeline (horizontal in modal)
    timelineStep: { flex: 1, alignItems: 'center', gap: 4 },
    timelineLine: { position: 'absolute', left: -50, right: 50, top: 8, height: 2 },
    timelineDot: {
        width: 18, height: 18, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, zIndex: 1,
    },
    timelineLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center' },
    timelineDate: { fontSize: 9, textAlign: 'center' },
});

export default OrdersScreen;