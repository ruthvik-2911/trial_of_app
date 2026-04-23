// ─── OrderDetailScreen.js ───────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// Connected to orderService:
//   • Fetches order by orderId from route.params
//   • Loading skeleton + error state + pull-to-refresh (ScrollView)
//   • Cancel order with confirmation (pending/processing only)
//   • Download Invoice via authenticated apiClient → temp file → share/open
//   • Track Shipment via orderService.trackOrder
//   • Rate Product → AddReview screen
// ──────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
    Platform,
    Alert,
    ActivityIndicator,
    Linking,
    RefreshControl,
    Image,
    ToastAndroid,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/api/orderService';
import apiClient from '../../services/api/apiClient';

const { width } = Dimensions.get('window');

// ─── Helpers ───────────────────────────────────────────────────────────────

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

const formatDate = (d) => {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
};

/**
 * Build a human-readable address string.
 *
 * Backend actually saves as `shippingAddress` (not shippingDetails):
 *   { name, addressLine, landmark, city, state, pincode, phone }
 *
 * Also accepts legacy shippingDetails / raw address string.
 */
const buildAddress = (raw) => {
    // If address is already a plain formatted string, use it directly
    if (raw.address && typeof raw.address === 'string') return raw.address;

    // Payment controller saves as `shippingAddress`
    // Legacy orders may use `shippingDetails` or `shipping`
    const s = raw.shippingAddress ?? raw.shippingDetails ?? raw.shipping ?? raw.customerInfo?.shippingAddress ?? {};

    const street = [s.addressLine, s.address].filter(Boolean).join(', ');
    const area = [street, s.landmark].filter(Boolean).join(', near ');
    const region = s.state && s.pincode
        ? `${s.city ? s.city + ', ' : ''}${s.state} — ${s.pincode}`
        : [s.city, s.state, s.pincode].filter(Boolean).join(', ');

    const lines = [
        s.name,
        area,
        region,
        s.phone ? `📞 ${s.phone}` : null,
    ].filter(Boolean);

    return lines.length > 0 ? lines.join('\n') : '—';
};

/**
 * Normalise raw API order to the shape the UI expects.
 * ⚠️  The API wraps the order: { success: true, order: {...} }
 *     Accept both the unwrapped and wrapped form.
 */
const normaliseOrder = (raw) => {
    // Unwrap API envelope if present
    const o = raw?.order ?? raw;

    // Compute item total from items array (most reliable source)
    const items = (o.items ?? []).map((item) => ({
        id: item._id ?? item.id ?? item.productId ?? '',
        productId: item.productId ?? item._id ?? item.id ?? '',
        name: item.name ?? item.productName ?? 'Product',
        image: item.imageUrl ?? item.image ?? item.images?.[0] ?? null,
        emoji: item.emoji ?? '📦',
        qty: Number(item.qty ?? item.quantity ?? 1),
        price: Number(item.price ?? item.unitPrice ?? 0),
        variant: item.variant ?? item.color ?? item.size ?? null,
        seller: item.seller ?? item.sellerName ?? null,
        desc: item.desc ?? item.description ?? '',
    }));

    const itemTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const apiTotal = Number(o.total ?? o.totalAmount ?? o.grandTotal ?? 0);
    // Use API total if present and non-zero, else compute from items
    const total = apiTotal > 0 ? apiTotal : itemTotal;
    const deliveryFee = Number(o.deliveryFee ?? o.shippingFee ?? (total >= 5000 ? 0 : 49));
    const savings = Number(o.savings ?? o.discount ?? o.discountAmount ?? 0);

    return {
        id: o._id ?? o.id ?? o.orderId ?? '',
        date: formatDate(o.createdAt ?? o.date),
        status: (() => {
            const s = (o.status ?? '').toLowerCase();
            if (['cancelled', 'canceled'].includes(s)) return 'cancelled';
            if (s === 'delivered') return 'delivered';
            return 'active';
        })(),
        statusLabel: o.statusLabel ?? o.status ?? '',
        items,
        itemTotal,
        total,
        deliveryFee,
        savings,
        address: buildAddress(o),
        payment: o.paymentMethod ?? o.payment ?? o.paymentMode ?? '—',
        trackingNumber: o.trackingNumber ?? o.awbCode ?? '',
        invoicePath: o.invoicePath ?? null,
        shiprocketOrderId: o.shiprocketOrderId ?? null,
        timeline: (o.timeline ?? []).map((t) => ({
            label: t.label ?? t.status ?? '',
            date: t.date
                ? (typeof t.date === 'string' ? t.date : new Date(t.date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }))
                : '',
            done: t.done ?? t.completed ?? false,
            desc: t.desc ?? t.description ?? '',
        })),
        canCancel: ['pending', 'processing', 'placed'].includes((o.status ?? '').toLowerCase()),
    };
};

// ─── Sub-components ─────────────────────────────────────────────────────────

const TimelineItem = ({ step, isLast, colors }) => (
    <View style={styles.timelineItem}>
        <View style={styles.timelineIndicator}>
            <View style={[styles.timelineDot, { backgroundColor: step.done ? colors.success : colors.border }]}>
                {step.done && <Ionicons name="checkmark" size={12} color="#fff" />}
            </View>
            {!isLast && <View style={[styles.timelineLine, { backgroundColor: step.done ? colors.success : colors.border }]} />}
        </View>
        <View style={styles.timelineContent}>
            <Text style={[styles.timelineTitle, { color: step.done ? colors.textPrimary : colors.textMuted }]}>{step.label}</Text>
            <Text style={[styles.timelineTime, { color: colors.textMuted }]}>{step.date}</Text>
            {step.desc ? <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>{step.desc}</Text> : null}
        </View>
    </View>
);

// Simple grey skeleton bar
const SkeletonBar = ({ width: w, height: h = 14, style, colors }) => (
    <View style={[{ width: w, height: h, borderRadius: h / 2, backgroundColor: colors.border }, style]} />
);

const LoadingSkeleton = ({ colors }) => {
    const pulse = useRef(new Animated.Value(0.5)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.5, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View style={{ opacity: pulse, paddingHorizontal: 16, paddingTop: 110 }}>
            {/* Status card */}
            <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.statusHeader}>
                    <SkeletonBar colors={colors} width={52} height={52} style={{ borderRadius: 26 }} />
                    <View style={{ gap: 8 }}>
                        <SkeletonBar colors={colors} width={140} height={18} />
                        <SkeletonBar colors={colors} width={100} height={12} />
                    </View>
                </View>
            </View>
            {/* Item card */}
            <SkeletonBar colors={colors} width={120} height={11} style={{ marginBottom: 10, marginLeft: 4 }} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, gap: 12 }]}>
                {[1, 2].map((k) => (
                    <View key={k} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                        <SkeletonBar colors={colors} width={64} height={64} style={{ borderRadius: 12 }} />
                        <View style={{ flex: 1, gap: 8 }}>
                            <SkeletonBar colors={colors} width="70%" height={14} />
                            <SkeletonBar colors={colors} width="50%" height={12} />
                        </View>
                    </View>
                ))}
            </View>
        </Animated.View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
const OrderDetailScreen = ({ route, navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { isLoggedIn } = useAuth();
    const scrollY = useRef(new Animated.Value(0)).current;

    // ── Auth Guard ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoggedIn) {
            navigation.navigate('Auth', { screen: 'Login' });
        }
    }, [isLoggedIn, navigation]);

    // Accept either a full `order` object (from deep link) or just `orderId`
    const orderId = route.params?.orderId ?? route.params?.order?._id ?? route.params?.order?.id;

    const [order, setOrder] = useState(
        route.params?.order ? normaliseOrder(route.params.order) : null
    );
    const [loading, setLoading] = useState(!route.params?.order);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [cancellingOrder, setCancellingOrder] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [tracking, setTracking] = useState(false);

    // ── Fetch ───────────────────────────────────────────────────────────────
    const fetchOrder = useCallback(async (isRefresh = false) => {
        if (!orderId) return;
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        setError(null);
        try {
            const data = await orderService.getOrderById(orderId);
            // data = { success: true, order: {...} }  OR  just the order object
            setOrder(normaliseOrder(data));
        } catch (err) {
            console.error('Failed to fetch order:', err);
            setError(err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orderId]);

    useEffect(() => {
        // Always fetch fresh from server for accurate billing / address
        fetchOrder();
    }, []);

    // ── Cancel ──────────────────────────────────────────────────────────────
    const handleCancel = () => {
        Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${order.id}?`,
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancellingOrder(true);
                        try {
                            await orderService.cancelOrder(order.id, 'Cancelled by user');
                            
                            // 1. Immediate UI update (Optimistic)
                            setOrder((prev) => ({ 
                                ...prev, 
                                status: 'cancelled', 
                                statusLabel: 'Cancelled', 
                                canCancel: false 
                            }));

                            // 2. Refresh from server to get updated timeline/details
                            await fetchOrder(true);
                            
                            Alert.alert('Cancelled', 'Your order has been cancelled successfully.');
                        } catch (err) {
                            console.error('Cancel Error:', err);
                            Alert.alert('Error', 'Failed to cancel the order. Please try again.');
                        } finally {
                            setCancellingOrder(false);
                        }
                    },
                },
            ]
        );
    };

    // ── Invoice ─────────────────────────────────────────────────────────────
    const handleInvoice = async () => {
        setDownloadingInvoice(true);
        try {
            if (Platform.OS === 'android') {
                ToastAndroid.show('Preparing download...', ToastAndroid.SHORT);
            }

            // Get the current Firebase token the same way apiClient does
            let token = null;
            try {
                const { getAuth } = require('firebase/auth');
                const auth = getAuth();
                if (auth.currentUser) {
                    token = await auth.currentUser.getIdToken(false);
                }
            } catch (_) { }

            if (!token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                token = await AsyncStorage.getItem('@auth_token');
            }

            if (!token) {
                Alert.alert('Invoice', 'Please sign in again and retry.');
                return;
            }

            const url = orderService.getInvoiceUrl(order.id);
            const destPath = `${FileSystem.cacheDirectory}invoice_${order.id}.pdf`;

            if (Platform.OS === 'android') {
                ToastAndroid.show('Downloading invoice...', ToastAndroid.SHORT);
            }

            const downloadResult = await FileSystem.downloadAsync(url, destPath, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (downloadResult.status === 200) {
                if (Platform.OS === 'android') {
                    // Native Android Download (Saves directly to user-selected folder like Downloads)
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        try {
                            if (Platform.OS === 'android') ToastAndroid.show('Saving file...', ToastAndroid.SHORT);

                            const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: FileSystem.EncodingType.Base64 });
                            const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
                                permissions.directoryUri,
                                `Invoice_${order.id}.pdf`,
                                'application/pdf'
                            );
                            await FileSystem.StorageAccessFramework.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });

                            ToastAndroid.show('Invoice downloaded! Opening preview...', ToastAndroid.LONG);

                            // 🚀 Auto-preview the PDF immediately after saving it
                            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                data: newUri,
                                flags: 1,
                                type: 'application/pdf'
                            });
                        } catch (e) {
                            console.error('[Invoice] Native save err:', e);
                            Alert.alert('Error', 'Failed to save or preview the file.');
                        }
                    } else {
                        ToastAndroid.show('Download cancelled.', ToastAndroid.SHORT);
                    }
                } else {
                    // iOS natively requires the Share Sheet to "Save to Files"
                    const canShare = await Sharing.isAvailableAsync();
                    if (canShare) {
                        await Sharing.shareAsync(downloadResult.uri, {
                            mimeType: 'application/pdf',
                            dialogTitle: 'Save Invoice',
                            UTI: 'com.adobe.pdf'
                        });
                    }
                }
            } else {
                console.error('[Invoice] Download failed, status:', downloadResult.status);
                Alert.alert('Invoice', `Could not download invoice (status ${downloadResult.status}). Please try again.`);
            }
        } catch (err) {
            console.error('[Invoice] error:', err);
            Alert.alert('Invoice', 'Unable to download invoice. Please try again later.');
        } finally {
            setDownloadingInvoice(false);
        }
    };

    // ── Track ───────────────────────────────────────────────────────────────
    const handleTrack = () => {
        navigation.navigate('OrderTracking', { orderId: orderId || order.id });
    };

    // ── Animated header ─────────────────────────────────────────────────────
    const headerBg = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: ['transparent', colors.surface],
        extrapolate: 'clamp',
    });

    // ── Render states ───────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
                <SafeAreaView edges={['top']} style={styles.safeHeader}>
                    <Animated.View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Order Details</Text>
                        <View style={{ width: 40 }} />
                    </Animated.View>
                </SafeAreaView>
                <LoadingSkeleton colors={colors} />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
                <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
                <Text style={[styles.headerTitle, { color: colors.textPrimary, textAlign: 'center' }]}>Couldn't load order</Text>
                <Text style={[styles.timelineDesc, { color: colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
                    Please check your connection and try again.
                </Text>
                <TouchableOpacity onPress={() => fetchOrder()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.accent, fontSize: 15, fontWeight: '700' }}>Retry</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 12 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isDelivered = order.status === 'delivered';
    const isCancelled = order.status === 'cancelled';
    const isActive = order.status === 'active';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Floating Header */}
            <Animated.View style={[styles.safeHeader, { backgroundColor: headerBg }]}>
                <SafeAreaView edges={['top']}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Order Details</Text>
                        <TouchableOpacity
                            onPress={() => Alert.alert('Help', 'Contact support at support@GoodKart.in')}
                            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchOrder(true)}
                        tintColor={colors.accent}
                        progressViewOffset={100}
                    />
                }
            >
                {/* ── Status Card ── */}
                <View style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.statusHeader}>
                        <View style={[
                            styles.statusIcon,
                            { backgroundColor: isDelivered ? colors.success + '20' : isCancelled ? '#F8717120' : colors.primary + '20' },
                        ]}>
                            <Ionicons
                                name={isDelivered ? 'checkmark-circle' : isCancelled ? 'close-circle' : 'cube'}
                                size={24}
                                color={isDelivered ? colors.success : isCancelled ? '#F87171' : colors.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.statusMain, { color: colors.textPrimary }]}>
                                {isDelivered ? 'Order Delivered' : isCancelled ? 'Order Cancelled' : order.statusLabel || 'In Transit'}
                            </Text>
                            <Text style={[styles.statusId, { color: colors.textMuted }]}>{order.id}</Text>
                            <Text style={[styles.statusId, { color: colors.textMuted }]}>Placed on {order.date}</Text>
                        </View>
                    </View>

                    {/* Cancel button */}
                    {order.canCancel && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <TouchableOpacity
                                style={styles.trackAction}
                                activeOpacity={0.7}
                                onPress={handleCancel}
                                disabled={cancellingOrder}
                            >
                                {cancellingOrder ? (
                                    <ActivityIndicator size="small" color="#F87171" />
                                ) : (
                                    <>
                                        <Text style={[styles.trackText, { color: '#F87171' }]}>Cancel Order</Text>
                                        <Ionicons name="close-circle-outline" size={16} color="#F87171" />
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Track shipment — for all non-cancelled/delivered orders */}
                    {isActive && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                            <TouchableOpacity
                                style={styles.trackAction}
                                activeOpacity={0.7}
                                onPress={handleTrack}
                                disabled={tracking}
                            >
                                {tracking ? (
                                    <ActivityIndicator size="small" color={colors.accent} />
                                ) : (
                                    <>
                                        <Text style={[styles.trackText, { color: colors.accent }]}>Track Shipment</Text>
                                        <Ionicons name="navigate-outline" size={16} color={colors.accent} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* ── Items Ordered ── */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ITEMS ORDERED</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {order.items.length === 0 ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.textMuted, fontSize: 13 }}>No item details available</Text>
                        </View>
                    ) : (
                        order.items.map((item, index) => (
                            <View
                                key={item.id || `item-${index}`}
                                style={[
                                    styles.productItem,
                                    { borderBottomWidth: index < order.items.length - 1 ? 1 : 0, borderBottomColor: colors.divider },
                                ]}
                            >
                                {/* Product Image or Emoji placeholder */}
                                {item.image ? (
                                    <Image
                                        source={{ uri: item.image }}
                                        style={[styles.imagePlaceholder, { borderRadius: 12 }]}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.imagePlaceholder, { backgroundColor: colors.cardAlt }]}>
                                        <Text style={styles.emoji}>{item.emoji}</Text>
                                    </View>
                                )}

                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={2}>
                                        {item.name}
                                    </Text>

                                    {/* Variant / Size */}
                                    {item.variant && (
                                        <View style={styles.variantRow}>
                                            <Ionicons name="color-palette-outline" size={11} color={colors.textMuted} />
                                            <Text style={[styles.variantText, { color: colors.textMuted }]}>{item.variant}</Text>
                                        </View>
                                    )}

                                    {/* Seller */}
                                    {item.seller && (
                                        <View style={styles.variantRow}>
                                            <Ionicons name="storefront-outline" size={11} color={colors.textMuted} />
                                            <Text style={[styles.variantText, { color: colors.textMuted }]} numberOfLines={1}>{item.seller}</Text>
                                        </View>
                                    )}

                                    <Text style={[styles.itemQty, { color: colors.textSecondary }]}>
                                        Qty: {item.qty} × {formatPrice(item.price)}
                                    </Text>

                                    {isDelivered && (
                                        <TouchableOpacity
                                            style={[styles.rateBtn, { borderColor: colors.accent }]}
                                            onPress={() => navigation.navigate('AddReview', { product: item, orderId: order.id })}
                                        >
                                            <Ionicons name="star-outline" size={12} color={colors.accent} />
                                            <Text style={[styles.rateText, { color: colors.accent }]}>Rate Product</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <Text style={[styles.itemPrice, { color: colors.accent }]}>
                                    {formatPrice(item.price * item.qty)}
                                </Text>
                            </View>
                        ))
                    )}

                    {/* Buy again — only for delivered orders */}
                    {isDelivered && (
                        <TouchableOpacity
                            style={styles.reorderLink}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert('Buy Again', 'Added to cart!')}
                        >
                            <LinearGradient colors={gradients.button} style={styles.reorderGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="refresh" size={16} color="#fff" />
                                <Text style={styles.reorderText}>Buy these items again</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Delivery Timeline ── */}
                {order.timeline.length > 0 && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DELIVERY UPDATES</Text>
                        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 20 }]}>
                            {order.timeline.map((step, index) => (
                                <TimelineItem
                                    key={index}
                                    step={step}
                                    isLast={index === order.timeline.length - 1}
                                    colors={colors}
                                />
                            ))}
                        </View>
                    </>
                )}

                {/* ── Shipping & Payment ── */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SHIPPING & PAYMENT</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.infoBlock}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="location-outline" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Delivery Address</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                {order.address || '—'}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.divider, marginLeft: 50 }]} />
                    <View style={styles.infoBlock}>
                        <View style={styles.infoIcon}>
                            <Ionicons name="card-outline" size={18} color={colors.accent} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Payment Mode</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                {order.payment
                                    ? order.payment.toUpperCase() === 'COD'
                                        ? 'Cash on Delivery (COD)'
                                        : order.payment.charAt(0).toUpperCase() + order.payment.slice(1)
                                    : '—'}
                            </Text>
                        </View>
                    </View>

                    {/* Tracking number if available */}
                    {order.trackingNumber ? (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.divider, marginLeft: 50 }]} />
                            <View style={styles.infoBlock}>
                                <View style={styles.infoIcon}>
                                    <Ionicons name="navigate-outline" size={18} color={colors.success} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tracking Number</Text>
                                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{order.trackingNumber}</Text>
                                </View>
                            </View>
                        </>
                    ) : null}
                </View>

                {/* ── Billing Details ── */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BILLING DETAILS</Text>
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 16 }]}>
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                            Item Total ({order.items.length} item{order.items.length !== 1 ? 's' : ''})
                        </Text>
                        <Text style={[styles.priceValue, { color: colors.textPrimary }]}>
                            {formatPrice(order.itemTotal || order.total)}
                        </Text>
                    </View>

                    {order.savings > 0 && (
                        <View style={styles.priceRow}>
                            <Text style={[styles.priceLabel, { color: colors.success }]}>Product Discount</Text>
                            <Text style={[styles.priceValue, { color: colors.success }]}>-{formatPrice(order.savings)}</Text>
                        </View>
                    )}

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Delivery Fee</Text>
                        {order.deliveryFee === 0 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.priceValue, { color: colors.textMuted, textDecorationLine: 'line-through', fontSize: 11 }]}>₹49</Text>
                                <Text style={[styles.priceValue, { color: colors.success, fontWeight: '700' }]}>FREE</Text>
                            </View>
                        ) : (
                            <Text style={[styles.priceValue, { color: colors.textPrimary }]}>{formatPrice(order.deliveryFee)}</Text>
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.divider, marginVertical: 8 }]} />

                    <View style={styles.priceRow}>
                        <Text style={[styles.priceTotalLabel, { color: colors.textPrimary }]}>Total Amount</Text>
                        <Text style={[styles.priceTotalValue, { color: colors.accent }]}>{formatPrice(order.total)}</Text>
                    </View>

                    {order.savings > 0 && (
                        <View style={[styles.savingsChip, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                            <Ionicons name="pricetag-outline" size={13} color={colors.success} />
                            <Text style={[styles.savingsChipText, { color: colors.success }]}>
                                You saved {formatPrice(order.savings)} on this order 🎉
                            </Text>
                        </View>
                    )}
                </View>

                {/* ── Invoice Button ── */}
                <TouchableOpacity
                    style={[styles.invoiceBtn, { borderColor: downloadingInvoice ? colors.border : colors.textMuted, backgroundColor: colors.card }]}
                    activeOpacity={0.8}
                    onPress={handleInvoice}
                    disabled={downloadingInvoice}
                >
                    {downloadingInvoice ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                        <>
                            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                            <Text style={[styles.invoiceBtnText, { color: colors.textSecondary }]}>Download Invoice</Text>
                            <Ionicons name="download-outline" size={16} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    safeHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12,
        paddingTop: Platform.OS === 'android' ? 12 : 0,
        borderBottomWidth: 1,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    scrollContent: { paddingTop: 100, paddingHorizontal: 16 },

    statusCard: { borderRadius: 20, borderWidth: 1, marginBottom: 20 },
    statusHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
    statusIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
    statusMain: { fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
    statusId: { fontSize: 12, marginTop: 2 },
    divider: { height: 1 },
    trackAction: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16,
    },
    trackText: { fontSize: 14, fontWeight: '700' },

    sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginLeft: 4, marginBottom: 10, marginTop: 10 },
    card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', marginBottom: 20 },

    productItem: { flexDirection: 'row', padding: 16, gap: 12, alignItems: 'flex-start' },
    imagePlaceholder: { width: 72, height: 72, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    emoji: { fontSize: 32 },
    itemName: { fontSize: 14, fontWeight: '700', lineHeight: 20, marginBottom: 4 },
    variantRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    variantText: { fontSize: 11 },
    itemQty: { fontSize: 12, marginTop: 4 },
    itemPrice: { fontSize: 14, fontWeight: '900', minWidth: 60, textAlign: 'right' },
    rateBtn: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 8, borderWidth: 1, marginTop: 8, alignSelf: 'flex-start', gap: 4,
    },
    rateText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    reorderLink: { padding: 16 },
    reorderGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12, gap: 8,
    },
    reorderText: { color: '#fff', fontSize: 14, fontWeight: '800' },

    timelineItem: { flexDirection: 'row', gap: 16 },
    timelineIndicator: { alignItems: 'center', width: 24 },
    timelineDot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
    timelineLine: { width: 2, flex: 1, marginVertical: -4 },
    timelineContent: { flex: 1, paddingBottom: 24 },
    timelineTitle: { fontSize: 14, fontWeight: '700' },
    timelineTime: { fontSize: 11, marginTop: 2 },
    timelineDesc: { fontSize: 12, marginTop: 6, lineHeight: 18 },

    infoBlock: { flexDirection: 'row', padding: 16, gap: 16, alignItems: 'flex-start' },
    infoIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f010', marginTop: 2 },
    infoLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
    infoValue: { fontSize: 13, lineHeight: 20 },

    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    priceLabel: { fontSize: 13 },
    priceValue: { fontSize: 13, fontWeight: '600' },
    priceTotalLabel: { fontSize: 15, fontWeight: '800' },
    priceTotalValue: { fontSize: 18, fontWeight: '900' },

    invoiceBtn: {
        flexDirection: 'row',
        alignItems: 'center',      // Centers vertically
        justifyContent: 'center',   // Centers horizontally
        paddingVertical: 16,
        paddingHorizontal: 20,     // Added horizontal padding for safety
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        gap: 10,                   // Space between icon and text
        marginTop: 10,
        width: '100%',             // Ensures it takes full width to show centering
    },
    invoiceBtnText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',       // Ensures text itself is centered
    },
});

export default OrderDetailScreen;