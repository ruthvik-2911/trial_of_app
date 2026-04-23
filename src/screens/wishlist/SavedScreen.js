// ─── SavedScreen.js ────────────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// Features:
//   • Header with item count
//   • 2 view modes — Grid (2-col) & List (full-width rows)
//   • Sort bar — Recently Added, Price, Rating
//   • Swipe-to-remove hint  (X button on each card)
//   • Quick Add to Cart from wishlist card
//   • "Move all to Cart" bulk action
//   • Price drop badge  (if item is on sale vs when saved)
//   • Empty state with CTA to Home
//   • Animated heart removal
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback } from 'react';
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
    Image,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import { useToast } from '../../components/ToastNotification';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Constants ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
    { id: 'recent', label: 'Recently Added' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
    { id: 'rating', label: 'Top Rated' },
];

const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

// ─── Star Rating ───────────────────────────────────────────────────────────
const StarRating = ({ rating, color, size = 10 }) => (
    <View style={{ flexDirection: 'row', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
                key={s}
                name={s <= Math.floor(rating) ? 'star' : s - rating < 1 ? 'star-half' : 'star-outline'}
                size={size}
                color={color}
            />
        ))}
    </View>
);

// ─── Price Drop Badge ──────────────────────────────────────────────────────
const PriceDropBadge = ({ item, colors }) => {
    if (item.price >= item.savedPrice) return null;
    const drop = item.savedPrice - item.price;
    return (
        <View style={[styles.priceDropBadge, { backgroundColor: colors.success + '25', borderColor: colors.success + '60' }]}>
            <Ionicons name="trending-down" size={10} color={colors.success} />
            <Text style={[styles.priceDropText, { color: colors.success }]}>
                ↓ {formatPrice(drop)} drop!
            </Text>
        </View>
    );
};

// ─── Grid Card ─────────────────────────────────────────────────────────────
const GridCard = ({ item, colors, gradients, onRemove, onAddToCart, onPress }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    const handleRemove = () => {
        Animated.parallel([
            Animated.timing(scale, { toValue: 0.8, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onRemove(item.id));
    };

    return (
        <Animated.View style={{ transform: [{ scale }], opacity, width: CARD_WIDTH }}>
            <TouchableOpacity
                style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.9}
                onPress={onPress}
                onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
            >
                {/* Badge */}
                <View style={[styles.badge, { backgroundColor: item.badgeColor + '25', borderColor: item.badgeColor + '60' }]}>
                    <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                </View>

                {/* Remove button */}
                <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} activeOpacity={0.7}>
                    <Ionicons name="heart" size={16} color="#F472B6" />
                </TouchableOpacity>

                {/* Out of stock overlay */}
                {!item.inStock && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                )}

                {/* Image */}
                <View style={[styles.gridImageBox, { backgroundColor: colors.cardAlt }]}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.gridEmoji}>{item.emoji || '📦'}</Text>
                    )}
                </View>

                {/* Info */}
                <View style={styles.gridInfo}>
                    <Text style={[styles.gridName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                    </Text>

                    <View style={styles.ratingRow}>
                        <StarRating rating={item.rating} color={colors.accent} />
                        <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({item.reviews})</Text>
                    </View>

                    {/* Price drop badge */}
                    <PriceDropBadge item={item} colors={colors} />

                    <View style={styles.priceRow}>
                        <Text style={[styles.gridPrice, { color: colors.accent }]}>{formatPrice(item.price)}</Text>
                        <View style={[styles.discountTag, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.discountText, { color: colors.success }]}>{item.discount}%</Text>
                        </View>
                    </View>

                    <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                        {formatPrice(item.originalPrice)}
                    </Text>

                    <Text style={[styles.savedAt, { color: colors.textMuted }]}>
                        Saved {item.savedAt}
                    </Text>
                </View>

                {/* Add to cart */}
                <TouchableOpacity
                    style={[styles.gridCartBtn, { borderTopColor: colors.border, opacity: item.inStock ? 1 : 0.4 }]}
                    onPress={() => item.inStock && onAddToCart(item)}
                    activeOpacity={0.8}
                    disabled={!item.inStock}
                >
                    <LinearGradient
                        colors={item.inStock
                            ? ((gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8'])
                            : [colors.border || '#ccc', colors.border || '#ccc']}
                        style={styles.gridCartGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="bag-add-outline" size={13} color={item.inStock ? '#fff' : colors.textMuted} />
                        <Text style={[styles.gridCartText, { color: item.inStock ? '#fff' : colors.textMuted }]}>
                            {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── List Card ─────────────────────────────────────────────────────────────
const ListCard = ({ item, colors, gradients, onRemove, onAddToCart, onPress }) => {
    const opacity = useRef(new Animated.Value(1)).current;
    const translateX = useRef(new Animated.Value(0)).current;

    const handleRemove = () => {
        Animated.parallel([
            Animated.timing(translateX, { toValue: -width, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onRemove(item.id));
    };

    return (
        <Animated.View style={{ opacity, transform: [{ translateX }] }}>
            <TouchableOpacity
                style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.85}
                onPress={onPress}
            >
                {/* Image */}
                <View style={[styles.listImageBox, { backgroundColor: colors.cardAlt }]}>
                    {item.image ? (
                        <Image
                            source={{ uri: item.image }}
                            style={StyleSheet.absoluteFill}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.listEmoji}>{item.emoji || '📦'}</Text>
                    )}
                    {!item.inStock && (
                        <View style={styles.listOutOfStock}>
                            <Text style={styles.listOutOfStockText}>Out of Stock</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.listInfo}>
                    <View style={styles.listTopRow}>
                        <View style={[styles.badge, { backgroundColor: item.badgeColor + '25', borderColor: item.badgeColor + '60' }]}>
                            <Text style={[styles.badgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                        </View>
                        <Text style={[styles.savedAt, { color: colors.textMuted }]}>{item.savedAt}</Text>
                    </View>

                    <Text style={[styles.listName, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.name}
                    </Text>

                    <View style={styles.ratingRow}>
                        <StarRating rating={item.rating} color={colors.accent} size={11} />
                        <Text style={[styles.reviewCount, { color: colors.textMuted }]}>
                            {item.rating} ({item.reviews.toLocaleString('en-IN')})
                        </Text>
                    </View>

                    <PriceDropBadge item={item} colors={colors} />

                    <View style={styles.listPriceRow}>
                        <Text style={[styles.listPrice, { color: colors.accent }]}>{formatPrice(item.price)}</Text>
                        <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{formatPrice(item.originalPrice)}</Text>
                        <View style={[styles.discountTag, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.discountText, { color: colors.success }]}>{item.discount}% OFF</Text>
                        </View>
                    </View>

                    {/* Actions row */}
                    <View style={styles.listActions}>
                        <TouchableOpacity
                            style={[styles.listCartBtn, { opacity: item.inStock ? 1 : 0.5 }]}
                            onPress={() => item.inStock && onAddToCart(item)}
                            disabled={!item.inStock}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={item.inStock
                                    ? ((gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8'])
                                    : [colors.border || '#ccc', colors.border || '#ccc']}
                                style={styles.listCartGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="bag-add-outline" size={13} color={item.inStock ? '#fff' : colors.textMuted} />
                                <Text style={[styles.listCartText, { color: item.inStock ? '#fff' : colors.textMuted }]}>
                                    {item.inStock ? 'Add to Cart' : 'Unavailable'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.listRemoveBtn, { borderColor: '#F472B6' + '60', backgroundColor: '#F472B6' + '10' }]}
                            onPress={handleRemove}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart-dislike-outline" size={14} color="#F472B6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ colors, gradients, onStartShopping }) => (
    <View style={styles.emptyState}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={styles.emptyEmoji}>💔</Text>
        </View>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing saved yet</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Tap the heart icon on any product to save it here for later
        </Text>
        <TouchableOpacity style={styles.exploreBtn} onPress={onStartShopping} activeOpacity={0.85}>
            <LinearGradient colors={gradients.button} style={styles.exploreBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Ionicons name="bag-handle-outline" size={16} color="#fff" />
                <Text style={styles.exploreBtnText}>Start Shopping</Text>
            </LinearGradient>
        </TouchableOpacity>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const SavedScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { isLoggedIn } = useAuth();
    const { showToast } = useToast();
    const { addToCart, addMultipleToCart } = useCart();
    const { wishlistItems, removeFromWishlist, removeMultipleFromWishlist } = useWishlist();
    const [viewMode, setViewMode] = useState('grid');   // 'grid' | 'list'
    const [sortBy, setSortBy] = useState('recent');
    const [showSort, setShowSort] = useState(false);

    // Sort logic
    const sortedWishlist = React.useMemo(() => {
        const list = [...wishlistItems];
        switch (sortBy) {
            case 'price_asc': return list.sort((a, b) => a.price - b.price);
            case 'price_desc': return list.sort((a, b) => b.price - a.price);
            case 'rating': return list.sort((a, b) => b.rating - a.rating);
            default: return list; // recent — keep insertion order
        }
    }, [wishlistItems, sortBy]);

    const handleRemove = useCallback((id) => {
        removeFromWishlist(id);
    }, [removeFromWishlist]);

    const handleAddToCart = useCallback((item) => {
        addToCart(item, 1);
        showToast({
            type: 'cart',
            title: 'Added to Cart!',
            message: `${item.name} added to your GoodKart bag 🛍️`,
            duration: 2800,
        });
    }, [showToast, addToCart]);

    const handleMoveAllToCart = () => {
        const inStockItems = wishlistItems.filter((i) => i.inStock);
        const inStockCount = inStockItems.length;
        if (inStockCount === 0) {
            showToast({
                type: 'warning',
                title: 'Nothing in Stock',
                message: 'All your saved items are currently out of stock.',
                duration: 3000,
            });
            return;
        }
        showToast({
            type: 'confirm',
            title: 'Move All to Cart?',
            message: `Add all ${inStockCount} in-stock items to your GoodKart bag?`,
            confirmLabel: 'Move All 🛍️',
            cancelLabel: 'Not now',
            onConfirm: () => {
                // Move in-stock items to cart
                addMultipleToCart(inStockItems.map(item => ({ product: item, quantity: 1 })));
                
                // Remove moved items from wishlist
                const itemIdsToRemove = inStockItems.map(item => item.id);
                removeMultipleFromWishlist(itemIdsToRemove);

                showToast({
                    type: 'success',
                    title: 'Done! 🎉',
                    message: `${inStockCount} items moved to your cart.`,
                    duration: 3000,
                });
            },
        });
    };

    const priceDropCount = wishlistItems.filter((i) => i.price < i.savedPrice).length;

    if (!isLoggedIn) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
                <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.surface }}>
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View>
                            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved</Text>
                            <Text style={[styles.headerSub, { color: colors.textMuted }]}>0 items</Text>
                        </View>
                    </View>
                    <View style={styles.emptyState}>
                        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Ionicons name="lock-closed-outline" size={38} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Login Required</Text>
                        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                            Sign in to view your saved items across devices.
                        </Text>
                        <TouchableOpacity style={styles.exploreBtn} onPress={() => navigation.navigate('Auth', { screen: 'Login' })} activeOpacity={0.85}>
                            <LinearGradient colors={(gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8']} style={styles.exploreBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Ionicons name="log-in-outline" size={16} color="#fff" />
                                <Text style={styles.exploreBtnText}>Login / Sign Up</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <View>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Saved</Text>
                        <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
                            {priceDropCount > 0 ? `  ·  ${priceDropCount} price drop${priceDropCount > 1 ? 's' : ''}! 🎉` : ''}
                        </Text>
                    </View>

                    <View style={styles.headerRight}>
                        {/* View mode toggle */}
                        <View style={[styles.viewToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <TouchableOpacity
                                style={[styles.viewToggleBtn, viewMode === 'grid' && { backgroundColor: colors.primary }]}
                                onPress={() => setViewMode('grid')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="grid-outline" size={16} color={viewMode === 'grid' ? '#fff' : colors.textMuted} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.viewToggleBtn, viewMode === 'list' && { backgroundColor: colors.primary }]}
                                onPress={() => setViewMode('list')}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="list-outline" size={16} color={viewMode === 'list' ? '#fff' : colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* ── Action bar ──────────────────────────────────────────────── */}
                {wishlistItems.length > 0 && (
                    <View style={[styles.actionBar, { borderBottomColor: colors.border }]}>
                        {/* Sort */}
                        <TouchableOpacity
                            style={[styles.sortBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => setShowSort(!showSort)}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="swap-vertical-outline" size={14} color={colors.primary} />
                            <Text style={[styles.sortBtnText, { color: colors.primary }]}>
                                {SORT_OPTIONS.find((s) => s.id === sortBy)?.label}
                            </Text>
                            <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={13} color={colors.primary} />
                        </TouchableOpacity>

                        {/* Move all to cart */}
                        <TouchableOpacity
                            style={styles.moveAllBtn}
                            onPress={handleMoveAllToCart}
                            activeOpacity={0.85}
                        >
                            <LinearGradient
                                colors={(gradients?.accentButton || []).every(Boolean) ? gradients.accentButton : ['#FFD700', '#FFA500']}
                                style={styles.moveAllGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Ionicons name="bag-add-outline" size={14} color="#0D0B1E" />
                                <Text style={styles.moveAllText}>Move All to Cart</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Sort dropdown */}
                {showSort && wishlistItems.length > 0 && (
                    <View style={[styles.sortDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {SORT_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt.id}
                                style={[styles.sortOption, { borderBottomColor: colors.divider }]}
                                onPress={() => { setSortBy(opt.id); setShowSort(false); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.sortOptionText, {
                                    color: sortBy === opt.id ? colors.accent : colors.textSecondary,
                                    fontWeight: sortBy === opt.id ? '700' : '400',
                                }]}>
                                    {opt.label}
                                </Text>
                                {sortBy === opt.id && <Ionicons name="checkmark-circle" size={16} color={colors.accent} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </SafeAreaView>

            {/* ── Body ────────────────────────────────────────────────────────── */}
            {wishlistItems.length === 0 ? (
                <EmptyState
                    colors={colors}
                    gradients={gradients}
                    onStartShopping={() => navigation.navigate('Home')}
                />
            ) : (
                /* Single FlatList — key changes on viewMode toggle to force remount */
                <FlatList
                    key={viewMode}
                    data={sortedWishlist}
                    keyExtractor={(i) => i.id}
                    numColumns={viewMode === 'grid' ? 2 : 1}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={viewMode === 'grid' ? styles.gridContent : styles.listContent}
                    columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
                    renderItem={({ item }) =>
                        viewMode === 'grid' ? (
                            <GridCard
                                item={item}
                                colors={colors}
                                gradients={gradients}
                                onRemove={handleRemove}
                                onAddToCart={handleAddToCart}
                                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                            />
                        ) : (
                            <ListCard
                                item={item}
                                colors={colors}
                                gradients={gradients}
                                onRemove={handleRemove}
                                onAddToCart={handleAddToCart}
                                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                            />
                        )
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    headerSub: { fontSize: 12, fontWeight: '400', marginTop: 2 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    // View toggle
    viewToggle: {
        flexDirection: 'row',
        borderRadius: 10,
        borderWidth: 1,
        overflow: 'hidden',
    },
    viewToggleBtn: {
        width: 36,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
    },

    // Action bar
    actionBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        gap: 10,
    },
    sortBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    sortBtnText: { fontSize: 12, fontWeight: '600' },
    moveAllBtn: { borderRadius: 10, overflow: 'hidden' },
    moveAllGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    moveAllText: { fontSize: 12, fontWeight: '700', color: '#0D0B1E' },

    // Sort dropdown
    sortDropdown: {
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        zIndex: 100,
    },
    sortOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
    },
    sortOptionText: { fontSize: 14 },

    // Shared
    badge: {
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewCount: { fontSize: 10 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    discountTag: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    discountText: { fontSize: 9, fontWeight: '700' },
    originalPrice: { fontSize: 10, textDecorationLine: 'line-through' },
    savedAt: { fontSize: 10 },

    // Price drop badge
    priceDropBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderWidth: 1,
        borderRadius: 6,
        paddingHorizontal: 6,
        paddingVertical: 2,
        alignSelf: 'flex-start',
        marginTop: 3,
        marginBottom: 2,
    },
    priceDropText: { fontSize: 9, fontWeight: '700' },

    // Grid
    gridContent: { paddingHorizontal: 16, paddingTop: 14 },
    gridRow: { justifyContent: 'space-between', marginBottom: 12 },
    gridCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    gridImageBox: { height: 110, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    gridEmoji: { fontSize: 48 },
    removeBtn: {
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(244,114,182,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    outOfStockOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 3,
    },
    outOfStockText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
    gridInfo: { padding: 10, gap: 3 },
    gridName: { fontSize: 12, fontWeight: '600' },
    gridPrice: { fontSize: 14, fontWeight: '800' },
    gridCartBtn: { borderTopWidth: 1 },
    gridCartGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 9,
    },
    gridCartText: { fontSize: 11, fontWeight: '700' },

    // List
    listContent: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
    listCard: {
        flexDirection: 'row',
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        padding: 12,
        gap: 12,
    },
    listImageBox: {
        width: 90,
        height: 90,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        flexShrink: 0,
    },
    listEmoji: { fontSize: 38 },
    listOutOfStock: {
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
        borderRadius: 12,
    },
    listOutOfStockText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    listInfo: { flex: 1, gap: 4 },
    listTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    listName: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
    listPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    listPrice: { fontSize: 15, fontWeight: '800' },
    listActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    listCartBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
    listCartGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 8,
    },
    listCartText: { fontSize: 12, fontWeight: '700' },
    listRemoveBtn: {
        width: 36, height: 36, borderRadius: 10,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },

    // Empty
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 40, gap: 12,
    },
    emptyIconCircle: {
        width: 110, height: 110, borderRadius: 55,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
        marginBottom: 8,
    },
    emptyEmoji: { fontSize: 52 },
    emptyTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: '#888' },
    exploreBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, width: '100%' },
    exploreBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
    },
    exploreBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

export default SavedScreen;