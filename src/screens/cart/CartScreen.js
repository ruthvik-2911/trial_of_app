import React, { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Image, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const CartScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { isLoggedIn, user } = useAuth();
    const insets = useSafeAreaInsets();
    const styles = React.useMemo(() => getStyles(colors, isDark, insets), [colors, isDark, insets]);
    const scrollRef = useRef(null);
    const [summaryY, setSummaryY] = useState(0);

    const scrollToSummary = () => {
        scrollRef.current?.scrollTo({ y: summaryY - 20, animated: true });
    };

    const {
        cartItems,
        isLoading,
        isSyncing,
        updateQuantity: ctxUpdateQty,
        removeFromCart,
    } = useCart();

    const getKey = (item) => item.id + (item.color || '');

    const [selectedItems, setSelectedItems] = useState({});

    useEffect(() => {
        setSelectedItems(
            cartItems.reduce((acc, item) => ({ ...acc, [getKey(item)]: true }), {})
        );
    }, [cartItems]);

    // ─── Totals ───────────────────────────────────────────────────────────────
    const subtotal = cartItems.reduce((total, item) =>
        selectedItems[getKey(item)] ? total + (Number(item.price) || 0) * item.quantity : total, 0);

    const savings = cartItems.reduce((total, item) =>
        selectedItems[getKey(item)] ? total + ((Number(item.originalPrice) || 0) - (Number(item.price) || 0)) * item.quantity : total, 0);

    const deliveryFee = subtotal > 5000 ? 0 : 49;
    const total = subtotal + deliveryFee;
    const selectedCount = Object.values(selectedItems).filter(Boolean).length;

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const updateQuantity = (itemId, color, newQty) => {
        if (newQty < 1) {
            // Remove the item when qty drops below 1
            removeFromCart(itemId, color);
            setSelectedItems(prev => {
                const updated = { ...prev };
                delete updated[itemId + (color || '')];
                return updated;
            });
            return;
        }
        if (newQty > 10) { Alert.alert('Limit Reached', 'Maximum 10 items per product'); return; }
        ctxUpdateQty(itemId, newQty, color);
    };

    const removeItem = (itemId, color) => {
        Alert.alert('Remove Item', 'Remove this item from cart?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove', style: 'destructive',
                onPress: () => {
                    removeFromCart(itemId, color);
                    setSelectedItems(prev => {
                        const updated = { ...prev };
                        delete updated[itemId + (color || '')];
                        return updated;
                    });
                },
            },
        ]);
    };

    const toggleSelectItem = (key) =>
        setSelectedItems(prev => ({ ...prev, [key]: !prev[key] }));

    const selectAllItems = () => {
        const allSelected = Object.values(selectedItems).every(v => v);
        setSelectedItems(cartItems.reduce((acc, item) => ({ ...acc, [getKey(item)]: !allSelected }), {}));
    };

    const handleCheckout = () => {
        const selectedCartItems = cartItems.filter(item => selectedItems[getKey(item)]);
        if (selectedCartItems.length === 0) {
            Alert.alert('No Items Selected', 'Please select at least one item to checkout');
            return;
        }
        navigation.navigate('Checkout', {
            cartTotal: subtotal,
            cartItems: selectedCartItems,
            itemCount: selectedCartItems.length,
            savings,
        });
    };

    // ─── CartItem Component ───────────────────────────────────────────────────
    const CartItem = ({ item }) => {
        const key = getKey(item);
        const isSelected = selectedItems[key];

        // Derive a hex from the color name for the dot
        const COLOR_HEX = {
            black: '#1a1a1a', white: '#e0e0e0', red: '#e53935', blue: '#1e88e5',
            green: '#43a047', yellow: '#fdd835', orange: '#fb8c00', pink: '#e91e63',
            purple: '#8e24aa', brown: '#6d4c41', grey: '#9e9e9e', gray: '#9e9e9e',
            navy: '#1a237e', teal: '#00897b', gold: '#ffd700', silver: '#bdbdbd',
        };
        const colorHex = item.color
            ? (COLOR_HEX[item.color.toLowerCase()] || item.color)
            : null;

        return (
            <View style={[styles.cartItem, isSelected && styles.cartItemSelected]}>
                {/* Selection checkbox */}
                <TouchableOpacity style={styles.checkbox} onPress={() => toggleSelectItem(key)}>
                    <View style={[styles.checkboxBox, isSelected && styles.checkboxChecked]}>
                        {isSelected && <Ionicons name="checkmark" size={14} color={isDark ? '#1A0B2E' : '#fff'} />}
                    </View>
                </TouchableOpacity>

                {/* Product Image */}
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                ) : (
                    <View style={[styles.productImage, styles.productImageFallback]}>
                        <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                )}

                {/* Details */}
                <View style={styles.productDetails}>
                    <View style={styles.productTopRow}>
                        <Text style={styles.productName} numberOfLines={2}>
                            {item.title || item.name}
                        </Text>
                        <TouchableOpacity style={styles.removeButton} onPress={() => removeItem(item.id, item.color)}>
                            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {item.color && (
                        <View style={styles.colorContainer}>
                            <View style={[styles.colorDot, { backgroundColor: colorHex || colors.border }]} />
                            <Text style={styles.colorValue}>{item.color}</Text>
                        </View>
                    )}

                    {item.size && (
                        <Text style={[styles.sizeValue, { color: colors.textSecondary }]}>
                            Size: {item.size}
                        </Text>
                    )}

                    {item.seller ? (
                        <View style={styles.sellerContainer}>
                            <Ionicons name="storefront-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.sellerText} numberOfLines={1}>{item.seller}</Text>
                        </View>
                    ) : null}

                    {/* Price row */}
                    <View style={styles.priceRow}>
                        <Text style={styles.currentPrice}>₹{(Number(item.price) || 0).toLocaleString()}</Text>
                        {item.originalPrice && Number(item.originalPrice) > Number(item.price) && (
                            <Text style={styles.originalPrice}>₹{(Number(item.originalPrice) || 0).toLocaleString()}</Text>
                        )}
                        {item.discount > 0 && (
                            <View style={styles.discountBadge}>
                                <Text style={styles.discountText}>{item.discount}% OFF</Text>
                            </View>
                        )}
                    </View>

                    {/* Quantity stepper — decrement below 1 removes item */}
                    <View style={styles.quantityRow}>
                        <View style={styles.quantityContainer}>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item.id, item.color, item.quantity - 1)}
                            >
                                <Ionicons
                                    name={item.quantity === 1 ? 'trash-outline' : 'remove'}
                                    size={16}
                                    color={item.quantity === 1 ? '#E53935' : colors.accent}
                                />
                            </TouchableOpacity>
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <TouchableOpacity
                                style={styles.quantityButton}
                                onPress={() => updateQuantity(item.id, item.color, item.quantity + 1)}
                            >
                                <Ionicons name="add" size={16} color={colors.accent} />
                            </TouchableOpacity>
                        </View>

                        {/* Item subtotal */}
                        {item.quantity > 1 && (
                            <Text style={styles.itemSubtotal}>
                                = ₹{((Number(item.price) || 0) * item.quantity).toLocaleString()}
                            </Text>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // ─── Unauthenticated State ────────────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <LinearGradient colors={isDark ? ['#1A0B2E', '#2E1A47'] : ['#E8F4FD', '#F0F9FF']} style={styles.gradient}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Cart</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="lock-closed-outline" size={80} color={colors.border} />
                        </View>
                        <Text style={styles.emptyTitle}>Login Required</Text>
                        <Text style={styles.emptySubtitle}>Sign in to view your bag and check out</Text>
                        <TouchableOpacity style={styles.shopNowButton}
                            onPress={() => navigation.navigate('Auth', { screen: 'Login' })}>
                            <LinearGradient colors={(gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shopNowGradient}>
                                <Text style={styles.shopNowText}>Login / Sign Up</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // ─── Loading State ────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <LinearGradient colors={isDark ? ['#1A0B2E', '#2E1A47'] : ['#E8F4FD', '#F0F9FF']} style={styles.gradient}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Cart</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={[styles.emptySubtitle, { marginTop: 16 }]}>Loading your cart…</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // ─── Empty State ──────────────────────────────────────────────────────────
    if (cartItems.length === 0) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                <LinearGradient colors={isDark ? ['#1A0B2E', '#2E1A47'] : ['#E8F4FD', '#F0F9FF']} style={styles.gradient}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Cart</Text>
                        <View style={{ width: 40 }} />
                    </View>
                    <View style={styles.emptyContainer}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="cart-outline" size={80} color={colors.border} />
                        </View>
                        <Text style={styles.emptyTitle}>Your cart is empty</Text>
                        <Text style={styles.emptySubtitle}>Add items to get started</Text>
                        <TouchableOpacity style={styles.shopNowButton}
                            onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
                            <LinearGradient colors={(gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shopNowGradient}>
                                <Text style={styles.shopNowText}>Shop Now</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </SafeAreaView>
        );
    }

    // ─── Main Render ──────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <LinearGradient
                colors={isDark ? ['#1A0B2E', '#2E1A47'] : ['#E8F4FD', '#F0F9FF']}
                style={styles.gradient}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.headerTitle}>My Cart</Text>
                        <Text style={styles.headerSubtitle}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</Text>
                    </View>
                    <TouchableOpacity style={styles.selectAllBtn} onPress={selectAllItems}>
                        <Text style={[styles.selectAllText, { color: colors.accent }]}>
                            {Object.values(selectedItems).every(v => v) ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ── Syncing bar ── */}
                {isSyncing && (
                    <View style={styles.syncBar}>
                        <ActivityIndicator size="small" color="#00D9FF" />
                        <Text style={styles.syncText}>Syncing cart…</Text>
                    </View>
                )}

                {/* ── Scrollable content: items + order summary ── */}
                <ScrollView
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Free Delivery Progress Banner */}
                    {subtotal < 5000 && subtotal > 0 && (
                        <View style={styles.deliveryBanner}>
                            <Ionicons name="bicycle-outline" size={16} color="#00D9FF" />
                            <Text style={styles.deliveryBannerText}>
                                Add{' '}
                                <Text style={styles.deliveryBannerBold}>
                                    ₹{(5000 - subtotal).toLocaleString()}
                                </Text>{' '}
                                more for <Text style={styles.deliveryBannerBold}>FREE delivery</Text>
                            </Text>
                        </View>
                    )}
                    {subtotal >= 5000 && (
                        <View style={[styles.deliveryBanner, styles.deliveryBannerSuccess]}>
                            <Ionicons name="checkmark-circle-outline" size={16} color="#00D97E" />
                            <Text style={[styles.deliveryBannerText, { color: '#00D97E' }]}>
                                You've unlocked <Text style={[styles.deliveryBannerBold, { color: '#00D97E' }]}>FREE delivery</Text>!
                            </Text>
                        </View>
                    )}

                    {/* ── Cart Items ── */}
                    <View style={styles.itemsSection}>
                        {cartItems.map(item => <CartItem key={getKey(item)} item={item} />)}
                    </View>

                    {/* ── Savings Highlight ── */}
                    {savings > 0 && (
                        <View style={styles.savingsBanner}>
                            <Ionicons name="pricetag-outline" size={16} color="#00D97E" />
                            <Text style={styles.savingsBannerText}>
                                You're saving <Text style={styles.savingsBannerBold}>₹{savings.toLocaleString()}</Text> on this order 🎉
                            </Text>
                        </View>
                    )}

                    {/* ── Price Breakdown Card ── */}
                    <View
                        onLayout={(e) => setSummaryY(e.nativeEvent.layout.y)}
                        style={styles.summaryCard}
                    >
                        <Text style={styles.summaryCardTitle}>Price Details</Text>
                        <View style={styles.summaryDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>
                                Price ({selectedCount} item{selectedCount !== 1 ? 's' : ''})
                            </Text>
                            <Text style={styles.summaryValue}>₹{subtotal.toLocaleString()}</Text>
                        </View>

                        {savings > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.savingsLabel}>Discount</Text>
                                <Text style={styles.savingsValue}>− ₹{savings.toLocaleString()}</Text>
                            </View>
                        )}

                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Delivery Charges</Text>
                            {deliveryFee === 0
                                ? (
                                    <View style={styles.freeDeliveryRow}>
                                        <Text style={styles.originalDelivery}>₹49</Text>
                                        <Text style={styles.freeDeliveryText}>FREE</Text>
                                    </View>
                                )
                                : <Text style={styles.summaryValue}>₹{deliveryFee}</Text>
                            }
                        </View>

                        <View style={styles.totalDivider} />

                        <View style={styles.summaryRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalValue}>₹{total.toLocaleString()}</Text>
                        </View>

                        {savings > 0 && (
                            <View style={styles.finalSavingsRow}>
                                <Ionicons name="wallet-outline" size={14} color="#00D97E" />
                                <Text style={styles.finalSavingsText}>
                                    You will save ₹{savings.toLocaleString()} on this order
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Safety notice */}
                    <View style={styles.safetyRow}>
                        <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.safetyText}>Safe and Secure Payments. Easy returns.</Text>
                    </View>

                    {/* Bottom padding so content clears the sticky button */}
                    <View style={{ height: insets.bottom + 88 }} />
                </ScrollView>
            </LinearGradient>

            {/* ── Sticky Checkout Bar ── */}
            <View style={[styles.checkoutBar, { paddingBottom: insets.bottom + 12 }]}>
                <View style={styles.checkoutBarInner}>

                    {/* Left: total snapshot */}
                    <View style={styles.checkoutTotalArea}>
                        <Text style={styles.checkoutTotalAmount}>₹{total.toLocaleString()}</Text>
                        {savings > 0 && (
                            <Text style={styles.checkoutSavingsHint}>Save ₹{savings.toLocaleString()}</Text>
                        )}
                    </View>

                    {/* Scroll to summary button */}
                    <TouchableOpacity
                        style={styles.scrollDownButton}
                        onPress={scrollToSummary}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-down" size={22} color={colors.accent} />
                    </TouchableOpacity>

                    {/* Right: CTA */}
                    <TouchableOpacity
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                        activeOpacity={0.87}
                    >
                        <LinearGradient
                            colors={(gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.checkoutGradient}
                        >
                            <Text style={[styles.checkoutText, { color: isDark ? '#1A0B2E' : '#fff' }]}>
                                Place Order
                            </Text>
                            <Ionicons name="arrow-forward" size={18} color={isDark ? '#1A0B2E' : '#fff'} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark, insets) => StyleSheet.create({
    // ── Layout ──
    container: { flex: 1, backgroundColor: colors.background },
    gradient: { flex: 1 },

    // ── Header ──
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    backButton: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    headerSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    selectAllBtn: { paddingVertical: 6, paddingHorizontal: 4 },
    selectAllText: { fontSize: 13, fontWeight: '700' },

    // ── Sync bar ──
    syncBar: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 5, backgroundColor: isDark ? 'rgba(0,217,255,0.1)' : 'rgba(0,217,255,0.06)',
    },
    syncText: { fontSize: 12, color: '#00D9FF', marginLeft: 6 },

    // ── Scroll content ──
    scrollContent: { paddingTop: 12, paddingHorizontal: 0 },

    // ── Delivery Banner ──
    deliveryBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,217,255,0.10)' : 'rgba(0,217,255,0.07)',
        marginHorizontal: 14, marginBottom: 12,
        paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,217,255,0.25)',
    },
    deliveryBannerSuccess: {
        backgroundColor: isDark ? 'rgba(0,217,126,0.10)' : 'rgba(0,217,126,0.07)',
        borderColor: 'rgba(0,217,126,0.25)',
    },
    deliveryBannerText: { fontSize: 13, color: colors.textSecondary, marginLeft: 8, flex: 1 },
    deliveryBannerBold: { fontWeight: '700', color: '#00D9FF' },

    // ── Items Section ──
    itemsSection: { paddingHorizontal: 14 },
    cartItem: {
        flexDirection: 'row', alignItems: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: 16, padding: 14,
        marginBottom: 10,
        borderWidth: 1, borderColor: colors.border,
    },
    cartItemSelected: {
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
    },

    // Checkbox
    checkbox: { paddingTop: 2, paddingRight: 10 },
    checkboxBox: {
        width: 22, height: 22, borderRadius: 6,
        borderWidth: 2, borderColor: colors.border,
        justifyContent: 'center', alignItems: 'center',
    },
    checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },

    // Image
    productImage: {
        width: 88, height: 88, borderRadius: 12,
        backgroundColor: colors.cardAlt,
    },
    productImageFallback: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.border + '30',
    },

    // Details
    productDetails: { flex: 1, marginLeft: 12 },
    productTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 },
    productName: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary, lineHeight: 20, paddingRight: 4 },
    removeButton: { padding: 2 },

    colorContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    colorDot: { width: 10, height: 10, borderRadius: 5, marginRight: 5, borderWidth: 1, borderColor: colors.border },
    colorValue: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    sizeValue: { fontSize: 12, fontWeight: '500', marginBottom: 4 },

    sellerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    sellerText: { fontSize: 11, color: colors.textMuted, marginLeft: 4, flex: 1 },

    priceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 },
    currentPrice: { fontSize: 17, fontWeight: '800', color: colors.accent },
    originalPrice: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through' },
    discountBadge: {
        backgroundColor: '#00D97E', paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },

    // Quantity
    quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    quantityContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
        borderRadius: 8, overflow: 'hidden',
    },
    quantityButton: {
        width: 32, height: 30,
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
    },
    quantityText: {
        fontSize: 14, fontWeight: '700', color: colors.textPrimary,
        paddingHorizontal: 14, minWidth: 32, textAlign: 'center',
    },
    itemSubtotal: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

    // ── Savings Banner ──
    savingsBanner: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,217,126,0.10)' : 'rgba(0,217,126,0.08)',
        marginHorizontal: 14, marginTop: 4, marginBottom: 14,
        paddingVertical: 10, paddingHorizontal: 14,
        borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,217,126,0.25)',
    },
    savingsBannerText: { fontSize: 13, color: '#00D97E', marginLeft: 8 },
    savingsBannerBold: { fontWeight: '800' },

    // ── Summary Card ──
    summaryCard: {
        backgroundColor: colors.surface,
        marginHorizontal: 14,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1, borderColor: colors.border,
        marginBottom: 12,
    },
    summaryCardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 12 },
    summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: 14 },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: { fontSize: 14, color: colors.textSecondary },
    summaryValue: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
    savingsLabel: { fontSize: 14, color: '#00D97E' },
    savingsValue: { fontSize: 14, color: '#00D97E', fontWeight: '600' },
    freeDeliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    originalDelivery: { fontSize: 12, color: colors.textMuted, textDecorationLine: 'line-through' },
    freeDeliveryText: { fontSize: 13, color: '#00D97E', fontWeight: '700' },
    totalDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: 14, marginTop: 2 },
    totalLabel: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
    totalValue: { fontSize: 18, fontWeight: '900', color: colors.accent },
    finalSavingsRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,217,126,0.08)',
        borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7,
        marginTop: 4, gap: 6,
    },
    finalSavingsText: { fontSize: 12, color: '#00D97E', fontWeight: '600' },

    // ── Safety ──
    safetyRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 6, gap: 5, marginBottom: 6,
    },
    safetyText: { fontSize: 11, color: colors.textMuted },

    // ── Sticky Checkout Bar ──
    checkoutBar: {
        position: 'absolute',
        bottom: -20, // Change this from -40 to 0
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
        paddingTop: 12,
        paddingHorizontal: 16,
        // ... rest of your shadow properties
        shadowColor: '#000',
        elevation: 16,
    },
    checkoutBarInner: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    checkoutTotalArea: { flex: 1 },
    checkoutTotalAmount: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
    checkoutSavingsHint: { fontSize: 11, color: '#00D97E', fontWeight: '600', marginTop: 1 },
    scrollDownButton: {
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: isDark ? 'rgba(0,217,255,0.12)' : 'rgba(0,217,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: isDark ? 'rgba(0,217,255,0.2)' : 'rgba(0,217,255,0.15)',
    },
    checkoutButton: {
        flex: 1.6, borderRadius: 14, overflow: 'hidden', height: 52,
    },
    checkoutGradient: {
        flex: 1, flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    checkoutText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },

    // ── Empty / Loading ──
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
    emptyIconContainer: {
        width: 160, height: 160, borderRadius: 80,
        backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
        marginBottom: 24, borderWidth: 2, borderColor: colors.border,
    },
    emptyTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
    emptySubtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
    shopNowButton: { borderRadius: 12, overflow: 'hidden', width: '100%' },
    shopNowGradient: { paddingVertical: 16, alignItems: 'center' },
    shopNowText: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#1A0B2E' : '#fff' },
});

export default CartScreen;