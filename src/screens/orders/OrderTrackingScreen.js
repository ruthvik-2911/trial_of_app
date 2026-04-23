import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Animated,
    Platform,
    Alert,
    ActivityIndicator,
    RefreshControl,
    StatusBar,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import orderService from '../../services/api/orderService';
import { LinearGradient } from '../../components/SafeLinearGradient';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';

const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
        const d = new Date(dateString);
        if (isNaN(d)) return dateString;
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return dateString;
    }
};

const mapOrderStatus = (order) => {
    if (!order) return { step: 0, label: 'Unknown' };
    const st = (order.status || '').toLowerCase();
    
    if (st === 'cancelled') return { step: -1, label: 'Cancelled' };
    if (st === 'delivered') return { step: 4, label: 'Delivered' };
    if (st === 'shipped') return { step: 3, label: 'Shipped' };
    if (st === 'processing') return { step: 2, label: 'Processing' };
    
    return { step: 1, label: 'Order Placed' };
};

const OrderTrackingScreen = ({ route, navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const scrollY = useRef(new Animated.Value(0)).current;
    
    const { orderId } = route.params || {};

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [downloadingInvoice, setDownloadingInvoice] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrder = useCallback(async (isRefresh = false) => {
        if (!orderId) {
            setLoading(false);
            return;
        }
        if (isRefresh) setRefreshing(true);
        try {
            const data = await orderService.getOrderById(orderId);
            // Handling wrapped vs unwrapped envelope
            const rawOrder = data.order || data;
            setOrder(rawOrder);
            setError(null);
        } catch (err) {
            console.error('[TrackScreen] Error:', err);
            setError('Could not load tracking information.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
    }, [fetchOrder]);


    // Cancel logic
    const handleCancelOrder = () => {
        Alert.alert(
            'Cancel Order',
            `Are you sure you want to cancel order ${orderId}?`,
            [
                { text: 'No, Keep it', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelling(true);
                        try {
                            const res = await orderService.cancelOrder(order.id || order._id, 'User requested cancellation');
                            if (res) {
                                Alert.alert('Cancelled', 'Your order was successfully cancelled.');
                                fetchOrder(true);
                            }
                        } catch (err) {
                            Alert.alert('Error', 'Failed to cancel the order. It might already be processed.');
                        } finally {
                            setCancelling(false);
                        }
                    }
                }
            ]
        );
    };

    // Invoice Logic 
    const handleInvoice = async () => {
        setDownloadingInvoice(true);
        try {
            let token = null;
            try {
                const { getAuth } = require('firebase/auth');
                const auth = getAuth();
                if (auth.currentUser) {
                    token = await auth.currentUser.getIdToken(false);
                }
            } catch (_) {}

            if (!token) {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                token = await AsyncStorage.getItem('@auth_token');
            }

            if (!token) {
                Alert.alert('Authentication', 'Please sign in again to download invoices.');
                return;
            }

            const url = orderService.getInvoiceUrl(order.id || order._id);
            const destPath = `${FileSystem.cacheDirectory}invoice_${orderId}.pdf`;

            const downloadResult = await FileSystem.downloadAsync(url, destPath, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (downloadResult.status === 200) {
                if (Platform.OS === 'android') {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        try {
                            const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, { encoding: FileSystem.EncodingType.Base64 });
                            const newUri = await FileSystem.StorageAccessFramework.createFileAsync(
                                permissions.directoryUri, 
                                `Invoice_${orderId}.pdf`, 
                                'application/pdf'
                            );
                            await FileSystem.StorageAccessFramework.writeAsStringAsync(newUri, base64, { encoding: FileSystem.EncodingType.Base64 });
                            
                            await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                                data: newUri,
                                flags: 1,
                                type: 'application/pdf'
                            });
                        } catch (e) {
                            Alert.alert('Error', 'Failed to save or preview the file.');
                        }
                    }
                } else {
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
                Alert.alert('Error', 'Failed to download invoice.');
            }
        } catch (e) {
            console.error('[Invoice Download Error]', e);
        } finally {
            setDownloadingInvoice(false);
        }
    };

    const headerBg = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: ['transparent', colors.surface],
        extrapolate: 'clamp',
    });

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    if (error || !order) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <Ionicons name="alert-circle-outline" size={64} color={colors.border} />
                <Text style={{ color: colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 16 }}>Order Not Found</Text>
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8 }}>{error || "We couldn't find the tracking details for this order."}</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 24, padding: 12, backgroundColor: colors.surface, borderRadius: 8 }}>
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const { step: currentStep, label: stepLabel } = mapOrderStatus(order);
    const isCancelled = order.status?.toLowerCase() === 'cancelled';
    const isDelivered = order.status?.toLowerCase() === 'delivered';
    const canCancel = ['Order Placed', 'placed', 'processing', 'pending'].includes(order.status?.toLowerCase());

    const awb = order.awbNumber || order.trackingNumber || order.awbCode;

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            
            <Animated.View style={[styles.safeHeader, { backgroundColor: headerBg }]}>
                <SafeAreaView edges={['top']}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.circleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Tracking Details</Text>
                        <View style={{ width: 40 }} />
                    </View>
                </SafeAreaView>
            </Animated.View>

            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchOrder(true)} tintColor={colors.accent} />
                }
            >
                {/* ── Meta Card ── */}
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.rowBetween}>
                        <View>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Order ID</Text>
                            <Text style={[styles.value, { color: colors.textPrimary }]}>#{order.orderId || order._id || order.id}</Text>
                        </View>
                        {awb && (
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={[styles.label, { color: colors.textSecondary }]}>AWB / Tracking NO</Text>
                                <Text style={[styles.value, { color: colors.primary }]}>{awb}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ── Status & Courier Card ── */}
                {!isCancelled && (
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="bus-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                            <Text style={[styles.sectionHeading, { color: colors.textPrimary, marginBottom: 0 }]}>Delivery Information</Text>
                        </View>
                        
                        {awb ? (
                            <View style={[styles.rowBetween, { flexWrap: 'wrap', gap: 16 }]}>
                                <View style={{ minWidth: '40%' }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Courier Partner</Text>
                                    <Text style={[styles.valueItem, { color: colors.textPrimary }]}>{order.courierName || 'Assigned Courier'}</Text>
                                </View>
                                <View style={{ minWidth: '40%' }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Est. Delivery</Text>
                                    <Text style={[styles.valueItem, { color: colors.textPrimary }]}>{order.estimatedDeliveryDays || order.estimatedDelivery || '--'}</Text>
                                </View>
                                <View style={{ width: '100%', marginTop: 8 }}>
                                    <Text style={[styles.label, { color: colors.textSecondary }]}>Track via Courier</Text>
                                    <TouchableOpacity onPress={() => Linking.openURL(`https://shiprocket.co/tracking/${awb}`)}>
                                        <Text style={[styles.valueItem, { color: colors.primary, textDecorationLine: 'underline' }]}>{awb}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : order.shipmentId ? (
                             <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                 <ActivityIndicator size="small" color={colors.accent} />
                                 <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }}>Courier assignment in progress. AWB will be generated shortly.</Text>
                             </View>
                        ) : (
                             <Text style={{ color: colors.textMuted, fontSize: 13 }}>Shipping details will be updated once the order is processed.</Text>
                        )}
                    </View>
                )}

                {/* ── Cancellation Banner ── */}
                {isCancelled && (
                    <View style={[styles.card, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                            <View>
                                <Text style={{ fontWeight: '700', color: '#ef4444', fontSize: 15 }}>Order Cancelled</Text>
                                <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>
                                    {order.cancellationReason || order.cancelReason || 'This order has been cancelled by the user.'}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* ── Detailed Tracking Events ── */}
                <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 24 }]}>TRACKING UPDATES</Text>
                
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 20 }]}>
                    {/* Shiprocket Events (Most detailed) */}
                    {order.trackingEvents && order.trackingEvents.length > 0 ? (
                        <View>
                            {order.trackingEvents.map((ev, idx) => (
                                <View key={idx} style={styles.timelineRow}>
                                    <View style={styles.timelineIndicators}>
                                        <View style={[styles.timelineDot, { backgroundColor: idx === 0 ? colors.primary : colors.surface, borderColor: idx === 0 ? colors.primary : colors.border }]} />
                                        {idx !== order.trackingEvents.length - 1 && <View style={[styles.timelineTrack, { backgroundColor: colors.border }]} />}
                                    </View>
                                    <View style={[styles.timelineContentBox, { paddingBottom: idx === order.trackingEvents.length - 1 ? 0 : 24 }]}>
                                        <Text style={[styles.timelineStatusTitle, { color: colors.textPrimary }]}>{ev.status}</Text>
                                        {ev.location && <Text style={[styles.timelineLocation, { color: colors.textSecondary }]}>{ev.location}</Text>}
                                        {ev.remarks && <Text style={[styles.timelineRemarks, { color: colors.textSecondary }]}>{ev.remarks}</Text>}
                                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(ev.date || ev.timestamp)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : order.timeline && order.timeline.length > 0 ? (
                        // Fallback GoodKart App basic timeline array
                        <View>
                            {order.timeline.map((ev, idx) => (
                                <View key={idx} style={styles.timelineRow}>
                                    <View style={styles.timelineIndicators}>
                                        <View style={[
                                            styles.timelineDot, 
                                            { 
                                                backgroundColor: ev.done || ev.completed ? colors.success : colors.surface, 
                                                borderColor: ev.done || ev.completed ? colors.success : colors.border 
                                            }
                                        ]}>
                                            {(ev.done || ev.completed) && <Ionicons name="checkmark" size={10} color="#fff" />}
                                        </View>
                                        {idx !== order.timeline.length - 1 && <View style={[styles.timelineTrack, { backgroundColor: ev.done || ev.completed ? colors.success : colors.border }]} />}
                                    </View>
                                    <View style={[styles.timelineContentBox, { paddingBottom: idx === order.timeline.length - 1 ? 0 : 24 }]}>
                                        <Text style={[styles.timelineStatusTitle, { color: ev.done || ev.completed ? colors.textPrimary : colors.textMuted }]}>{ev.label || ev.status}</Text>
                                        <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(ev.date)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ padding: 12, alignItems: 'center' }}>
                            <Ionicons name="time-outline" size={32} color={colors.textMuted} style={{ marginBottom: 12 }} />
                            <Text style={{ color: colors.textMuted, fontSize: 14 }}>Tracking updates will appear here once parsed.</Text>
                        </View>
                    )}
                </View>

                {/* ── Quick Actions ── */}
                <View style={{ marginTop: 24, gap: 16 }}>
                    <TouchableOpacity
                        style={styles.actionBtn}
                        activeOpacity={0.8}
                        onPress={handleInvoice}
                        disabled={downloadingInvoice}
                    >
                        <LinearGradient colors={gradients.button} style={styles.actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            {downloadingInvoice ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="document-text" size={20} color="#fff" />
                                    <Text style={styles.actionText}>Download Invoice</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>

                    {canCancel && (
                        <TouchableOpacity
                            style={[styles.outlineBtn, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}
                            activeOpacity={0.7}
                            onPress={handleCancelOrder}
                            disabled={cancelling}
                        >
                            {cancelling ? (
                                <ActivityIndicator size="small" color="#ef4444" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                                    <Text style={[styles.outlineBtnText, { color: '#ef4444' }]}>Cancel Order</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                <View style={{ height: 60 }} />
            </Animated.ScrollView>
        </View>
    );
};

export default OrderTrackingScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: 'transparent',
        paddingTop: Platform.OS === 'android' ? 12 : 0,
    },
    circleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
    scrollContent: { paddingTop: 100, paddingHorizontal: 16 },
    card: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        marginBottom: 16,
    },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 12, fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    value: { fontSize: 16, fontWeight: '800' },
    valueItem: { fontSize: 14, fontWeight: '700' },
    sectionHeading: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 },
    
    timelineRow: { flexDirection: 'row' },
    timelineIndicators: { alignItems: 'center', width: 24, marginRight: 12 },
    timelineDot: {
        width: 16, height: 16, borderRadius: 8, borderWidth: 2,
        alignItems: 'center', justifyContent: 'center', marginTop: 2, zIndex: 2
    },
    timelineTrack: { width: 2, flex: 1 },
    timelineContentBox: { flex: 1 },
    timelineStatusTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    timelineLocation: { fontSize: 13, marginBottom: 2 },
    timelineRemarks: { fontSize: 12, fontStyle: 'italic', marginBottom: 4 },
    timelineDate: { fontSize: 12 },

    actionBtn: { borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#1800AD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 10 },
    actionText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    outlineBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 10, borderRadius: 16, borderWidth: 2 },
    outlineBtnText: { fontSize: 15, fontWeight: '700' },
});
