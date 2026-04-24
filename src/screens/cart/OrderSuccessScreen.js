import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const OrderSuccessScreen = ({ navigation, route }) => {
    const { colors, gradients, isDark } = useTheme();
    const {
        orderId = '#ORD' + Date.now().toString().slice(-8),
        total = '0',
        rawTotal = 0,
        items = 0,
    } = route.params || {};

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const checkAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.delay(400),
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
            Animated.spring(checkAnim, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleContinue = () => {
        navigation.navigate('Main', { screen: 'Home' });
    };

    // ── Pass the new order's details so OrdersScreen can show an
    //    instant placeholder card while it waits for the API.
    const handleTrack = () => {
        navigation.navigate('Orders', {
            fromCheckout: true,
            newOrder: { orderId, total: rawTotal || Number(String(total).replace(/,/g, '')) || 0, items },
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1A0B2E', '#0D0B1E'] : ['#F0FDF4', '#FFFFFF']}
                style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Success Icon */}
                    <Animated.View style={[
                        styles.iconContainer,
                        {
                            backgroundColor: colors.success + '20',
                            transform: [{ scale: scaleAnim }],
                            opacity: opacityAnim,
                        }
                    ]}>
                        <LinearGradient
                            colors={['#00D97E', '#00B86B']}
                            style={styles.iconGradient}
                        >
                            <Animated.View style={{ transform: [{ scale: checkAnim }] }}>
                                <Ionicons name="checkmark-circle" size={80} color="#fff" />
                            </Animated.View>
                        </LinearGradient>
                    </Animated.View>

                    {/* Text content */}
                    <Animated.View style={[styles.textGroup, { opacity: opacityAnim }]}>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>Order Placed Successfully!</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Your luxury items are being prepared for lightning-fast delivery.
                        </Text>
                    </Animated.View>

                    {/* Order Details Card */}
                    <Animated.View style={[
                        styles.orderCard,
                        { backgroundColor: colors.surface, transform: [{ translateY: opacityAnim.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) }] }
                    ]}>
                        <View style={styles.cardRow}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Order ID</Text>
                            <Text style={[styles.cardValue, { color: colors.textPrimary }]}>{orderId}</Text>
                        </View>
                        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.cardRow}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Amount Paid</Text>
                            <Text style={[styles.cardValue, { color: colors.accent, fontWeight: '900' }]}>₹{total}</Text>
                        </View>
                        <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
                        <View style={styles.cardRow}>
                            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Est. Delivery</Text>
                            <Text style={[styles.cardValue, { color: colors.success }]}>Tomorrow, 10 AM</Text>
                        </View>
                    </Animated.View>

                    {/* Action Buttons */}
                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            onPress={handleTrack}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={gradients.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.btnGradient}
                            >
                                <Text style={[styles.primaryBtnText, { color: isDark ? '#1A0B2E' : '#fff' }]}>Track My Order</Text>
                                <Ionicons name="location-outline" size={20} color={isDark ? '#1A0B2E' : '#fff'} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryBtn, { borderColor: colors.border }]}
                            onPress={handleContinue}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Continue Shopping</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30 },

    iconContainer: {
        width: 160, height: 160, borderRadius: 80,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 40,
    },
    iconGradient: {
        width: 120, height: 120, borderRadius: 60,
        alignItems: 'center', justifyContent: 'center',
        elevation: 10, shadowColor: '#00D97E',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3, shadowRadius: 15,
    },

    textGroup: { alignItems: 'center', marginBottom: 40 },
    title: { fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
    subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, opacity: 0.8 },

    orderCard: {
        width: '100%', padding: 24, borderRadius: 24,
        marginBottom: 50, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
    },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardLabel: { fontSize: 14, fontWeight: '600' },
    cardValue: { fontSize: 16, fontWeight: '700' },
    cardDivider: { height: 1, marginVertical: 16 },

    buttonGroup: { width: '100%', gap: 12 },
    primaryBtn: { width: '100%', height: 60, borderRadius: 18, overflow: 'hidden' },
    btnGradient: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 10,
    },
    primaryBtnText: { fontSize: 17, fontWeight: '800' },
    secondaryBtn: {
        width: '100%', height: 60, borderRadius: 18,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1.5,
    },
    secondaryBtnText: { fontSize: 16, fontWeight: '700' },
});

export default OrderSuccessScreen;