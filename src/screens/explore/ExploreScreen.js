// ─── ExploreScreen.js ──────────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// States:
//   1. IDLE      — trending searches + browse by category grid
//   2. SEARCHING — live filtered product grid + sort/filter bar
//   3. EMPTY     — no results state
//
// Features:
//   • Animated search bar (expands on focus)
//   • Recent searches with clear
//   • Trending search chips
//   • Browse by category full grid
//   • Live search filtering across all products
//   • Sort modal (Price low-high, high-low, Rating, Newest)
//   • Filter chips (category pills)
//   • 2-col product grid with Add to Cart
//   • Empty state illustration
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    ScrollView,
    Dimensions,
    StatusBar,
    Animated,
    Platform,
    Modal,
    Pressable,
    Alert,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import useTheme from '../../hooks/useTheme';
import { PRODUCT_DETAIL } from '../../data/mockData';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Extended product catalogue ────────────────────────────────────────────
const ALL_PRODUCTS = [
    { id: 'p1', name: 'Air Max Prestige', price: 4299, originalPrice: 7000, discount: 39, rating: 4.5, reviews: 128, category: 'Fashion (Men)', badge: 'HOT', badgeColor: '#F5C842', emoji: '👟' },
    { id: 'p2', name: 'Gold Watch Pro', price: 8999, originalPrice: 14000, discount: 36, rating: 4.8, reviews: 312, category: 'Jewelry & Accessories', badge: 'EXCLUSIVE', badgeColor: '#7B5EEA', emoji: '⌚' },
    { id: 'p3', name: 'Pixel 9 Ultra', price: 72000, originalPrice: 85000, discount: 15, rating: 4.7, reviews: 541, category: 'Electronics', badge: 'NEW', badgeColor: '#60A5FA', emoji: '📱' },
    { id: 'p4', name: 'Sony WH-1000XM5', price: 18999, originalPrice: 29990, discount: 37, rating: 4.8, reviews: 5441, category: 'Electronics', badge: 'TOP RATED', badgeColor: '#4ADE80', emoji: '🎧' },
    { id: 'p5', name: 'Diamond Pendant', price: 12500, originalPrice: 18000, discount: 31, rating: 4.6, reviews: 89, category: 'Jewelry & Accessories', badge: 'TRENDING', badgeColor: '#F5C842', emoji: '💎' },
    { id: 'p6', name: 'Silk Kurta Set', price: 3200, originalPrice: 5000, discount: 36, rating: 4.4, reviews: 203, category: 'Fashion (Women)', badge: 'HOT', badgeColor: '#F472B6', emoji: '👗' },
    { id: 'p7', name: 'Smart Speaker', price: 5499, originalPrice: 8000, discount: 31, rating: 4.3, reviews: 167, category: 'Electronics', badge: 'NEW', badgeColor: '#60A5FA', emoji: '🔊' },
    { id: 'p8', name: 'Leather Wallet', price: 1299, originalPrice: 2000, discount: 35, rating: 4.5, reviews: 432, category: 'Fashion (Men)', badge: 'SALE', badgeColor: '#FB923C', emoji: '👛' },
    { id: 'p9', name: 'Scented Candle Set', price: 899, originalPrice: 1500, discount: 40, rating: 4.2, reviews: 76, category: 'Home & Living', badge: 'SALE', badgeColor: '#FB923C', emoji: '🕯️' },
    { id: 'p10', name: 'Yoga Mat Pro', price: 2199, originalPrice: 3500, discount: 37, rating: 4.6, reviews: 234, category: 'Sports & Fitness', badge: 'HOT', badgeColor: '#4ADE80', emoji: '🧘' },
    { id: 'p11', name: 'Lipstick Collection', price: 799, originalPrice: 1200, discount: 33, rating: 4.3, reviews: 512, category: 'Beauty & Personal Care', badge: 'NEW', badgeColor: '#F472B6', emoji: '💄' },
    { id: 'p12', name: 'Running Shoes X3', price: 5999, originalPrice: 9000, discount: 33, rating: 4.7, reviews: 389, category: 'Sports & Fitness', badge: 'TRENDING', badgeColor: '#4ADE80', emoji: '👠' },
    { id: 'p13', name: 'Indoor Plant Pot', price: 699, originalPrice: 1100, discount: 36, rating: 4.1, reviews: 94, category: 'Home & Living', badge: 'SALE', badgeColor: '#FB923C', emoji: '🪴' },
    { id: 'p14', name: 'Emerald Ring', price: 22000, originalPrice: 35000, discount: 37, rating: 4.9, reviews: 67, category: 'Jewelry & Accessories', badge: 'EXCLUSIVE', badgeColor: '#7B5EEA', emoji: '💍' },
    { id: 'p15', name: 'MacBook Air M3', price: 114900, originalPrice: 129900, discount: 12, rating: 4.9, reviews: 823, category: 'Electronics', badge: 'NEW', badgeColor: '#60A5FA', emoji: '💻' },
    { id: 'p16', name: 'Face Serum Kit', price: 1499, originalPrice: 2500, discount: 40, rating: 4.4, reviews: 318, category: 'Beauty & Personal Care', badge: 'HOT', badgeColor: '#F472B6', emoji: '🧴' },
];

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'grid-outline', color: '#7B5EEA' },
    { id: 'Fashion (Men)', name: 'Mens Fashion', icon: 'shirt-outline', color: '#60A5FA' },
    { id: 'Fashion (Women)', name: 'Womens Fashion', icon: 'woman-outline', color: '#F472B6' },
    { id: 'Electronics', name: 'Electronics', icon: 'phone-portrait-outline', color: '#7B5EEA' },
    { id: 'Jewelry & Accessories', name: 'Jewelry', icon: 'diamond-outline', color: '#F5C842' },
    { id: 'Home & Living', name: 'Home', icon: 'home-outline', color: '#4ADE80' },
    { id: 'Beauty & Personal Care', name: 'Beauty', icon: 'rose-outline', color: '#F472B6' },
    { id: 'Sports & Fitness', name: 'Sports', icon: 'fitness-outline', color: '#FB923C' },
];

const SORT_OPTIONS = [
    { id: 'relevant', label: 'Most Relevant' },
    { id: 'price_asc', label: 'Price: Low to High' },
    { id: 'price_desc', label: 'Price: High to Low' },
    { id: 'rating', label: 'Top Rated' },
    { id: 'discount', label: 'Best Discount' },
];

const TRENDING_SEARCHES = [
    'Gold Watch', 'AirPods', 'Silk Saree', 'Running Shoes',
    'Diamond Ring', 'Laptop', 'Perfume', 'Yoga Mat',
];

const RECENT_SEARCHES_INITIAL = ['Sony headphones', 'Kurta set', 'Smart watch'];

const formatPrice = (p) => `₹${p.toLocaleString('en-IN')}`;

// ─── Star Rating ───────────────────────────────────────────────────────────
const StarRating = ({ rating, color }) => (
    <View style={{ flexDirection: 'row', gap: 1 }}>
        {[1, 2, 3, 4, 5].map((s) => (
            <Ionicons
                key={s}
                name={s <= Math.floor(rating) ? 'star' : s - rating < 1 ? 'star-half' : 'star-outline'}
                size={10}
                color={color}
            />
        ))}
    </View>
);

// ─── Product Card ──────────────────────────────────────────────────────────
const ProductCard = ({ item, colors, gradients, onPress, onAddToCart, onToggleWishlist, inWishlist }) => {
    const scale = useRef(new Animated.Value(1)).current;
    return (
        <Animated.View style={{ transform: [{ scale }], width: CARD_WIDTH }}>
            <TouchableOpacity
                style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={1}
                onPress={onPress}
                onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
            >
                <View style={[styles.productBadge, { backgroundColor: item.badgeColor + '25', borderColor: item.badgeColor + '60' }]}>
                    <Text style={[styles.productBadgeText, { color: item.badgeColor }]}>{item.badge}</Text>
                </View>
                <TouchableOpacity style={styles.wishBtn} activeOpacity={0.7} onPress={() => onToggleWishlist(item)}>
                    <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={15} color={inWishlist ? "#FF4444" : colors.textMuted} />
                </TouchableOpacity>
                <View style={[styles.productImageBox, { backgroundColor: colors.cardAlt }]}>
                    <Text style={styles.productEmoji}>{item.emoji}</Text>
                </View>
                <View style={styles.productInfo}>
                    <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <View style={styles.ratingRow}>
                        <StarRating rating={item.rating} color={colors.accent} />
                        <Text style={[styles.reviewCount, { color: colors.textMuted }]}>({item.reviews})</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.accent }]}>{formatPrice(item.price)}</Text>
                        <View style={[styles.discountBadge, { backgroundColor: colors.success + '20' }]}>
                            <Text style={[styles.discountText, { color: colors.success }]}>{item.discount}% OFF</Text>
                        </View>
                    </View>
                    <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{formatPrice(item.originalPrice)}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, { borderTopColor: colors.border }]}
                    onPress={() => onAddToCart(item)}
                    activeOpacity={0.8}
                >
                    <LinearGradient colors={gradients.button} style={styles.addBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="add" size={14} color="#fff" />
                        <Text style={styles.addBtnText}>Add to Cart</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Category Browse Card ──────────────────────────────────────────────────
const CategoryBrowseCard = ({ item, colors, onPress }) => (
    <TouchableOpacity
        style={[styles.browseCatCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <View style={[styles.browseCatIcon, { backgroundColor: item.color + '20' }]}>
            <Ionicons name={item.icon} size={26} color={item.color} />
        </View>
        <Text style={[styles.browseCatLabel, { color: colors.textPrimary }]}>{item.name}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
);

// ─── Sort Modal ────────────────────────────────────────────────────────────
const SortModal = ({ visible, onClose, selected, onSelect, colors, gradients }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
            <Pressable style={[styles.sortSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Sort By</Text>
                {SORT_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.sortOption, { borderBottomColor: colors.divider }]}
                        onPress={() => { onSelect(opt.id); onClose(); }}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.sortOptionText, { color: selected === opt.id ? colors.accent : colors.textPrimary, fontWeight: selected === opt.id ? '700' : '400' }]}>
                            {opt.label}
                        </Text>
                        {selected === opt.id && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                    </TouchableOpacity>
                ))}
            </Pressable>
        </Pressable>
    </Modal>
);

// ─── Empty State ───────────────────────────────────────────────────────────
const EmptyState = ({ query, colors }) => (
    <View style={styles.emptyState}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No results for</Text>
        <Text style={[styles.emptyQuery, { color: colors.accent }]}>"{query}"</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            Try different keywords or browse categories
        </Text>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const ExploreScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { addToCart } = useCart();
    const { isLoggedIn } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('relevant');
    const [showSort, setShowSort] = useState(false);
    const [recentSearches, setRecentSearches] = useState(RECENT_SEARCHES_INITIAL);

    const inputRef = useRef(null);
    const searchBarWidth = useRef(new Animated.Value(1)).current;

    // Animate search bar on focus
    const onFocus = () => {
        setIsFocused(true);
        Animated.spring(searchBarWidth, { toValue: 1, useNativeDriver: false }).start();
    };

    const onBlur = () => {
        if (!query) setIsFocused(false);
    };

    const handleSearch = (text) => {
        setQuery(text);
    };

    const handleClear = () => {
        setQuery('');
        setIsFocused(false);
        inputRef.current?.blur();
    };

    const handleTrendingPress = (term) => {
        setQuery(term);
        setIsFocused(true);
        inputRef.current?.focus();
    };

    const handleRecentPress = (term) => {
        setQuery(term);
        setIsFocused(true);
    };

    const handleRecentDelete = (term) => {
        setRecentSearches((r) => r.filter((s) => s !== term));
    };

    const handleSubmit = () => {
        if (query.trim() && !recentSearches.includes(query.trim())) {
            setRecentSearches((r) => [query.trim(), ...r].slice(0, 6));
        }
    };

    const handleCategoryPress = (catId) => {
        setSelectedCategory(catId);
        if (catId !== 'all') {
            setQuery(catId);
            setIsFocused(true);
        }
    };

    // Filtered + sorted products
    const filteredProducts = useMemo(() => {
        let list = ALL_PRODUCTS;

        // Text filter
        if (query.trim()) {
            const q = query.toLowerCase();
            list = list.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.category.toLowerCase().includes(q) ||
                    p.badge.toLowerCase().includes(q),
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            list = list.filter((p) => p.category === selectedCategory);
        }

        // Sort
        switch (sortBy) {
            case 'price_asc': return [...list].sort((a, b) => a.price - b.price);
            case 'price_desc': return [...list].sort((a, b) => b.price - a.price);
            case 'rating': return [...list].sort((a, b) => b.rating - a.rating);
            case 'discount': return [...list].sort((a, b) => b.discount - a.discount);
            default: return list;
        }
    }, [query, selectedCategory, sortBy]);

    const isSearching = query.trim().length > 0 || selectedCategory !== 'all';
    const showEmpty = isSearching && filteredProducts.length === 0;

    const goToDetail = (product) => navigation.navigate('Home', { screen: 'ProductDetail', params: { product: product || PRODUCT_DETAIL } });

    const handleAddToCart = (item) => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        addToCart(item, 1);
        Alert.alert('✅ Added!', `${item.name} added to your bag`);
    };

    const handleToggleWishlist = useCallback((item) => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        toggleWishlist(item);
    }, [isLoggedIn, navigation, toggleWishlist]);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface, zIndex: 10 }}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>

                    {/* Title — hides when searching */}
                    {!isFocused && !query ? (
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Explore</Text>
                    ) : null}

                    {/* Search bar */}
                    <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: isFocused ? colors.primary : colors.border, flex: 1 }]}>
                        <Ionicons name="search-outline" size={18} color={isFocused ? colors.primary : colors.textMuted} style={{ marginRight: 8 }} />
                        <TextInput
                            ref={inputRef}
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            placeholder="Search products, brands..."
                            placeholderTextColor={colors.textMuted}
                            value={query}
                            onChangeText={handleSearch}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            onSubmitEditing={handleSubmit}
                            returnKeyType="search"
                            autoCorrect={false}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={handleClear}>
                                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Cancel button */}
                    {(isFocused || query) && (
                        <TouchableOpacity onPress={handleClear} style={styles.cancelBtn}>
                            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Filter + Sort bar (only when searching) ──────────────────── */}
                {isSearching && (
                    <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                            {/* Sort button */}
                            <TouchableOpacity
                                style={[styles.filterChip, { backgroundColor: colors.card, borderColor: colors.primary + '60' }]}
                                onPress={() => setShowSort(true)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name="swap-vertical-outline" size={14} color={colors.primary} />
                                <Text style={[styles.filterChipText, { color: colors.primary }]}>
                                    {SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? 'Sort'}
                                </Text>
                            </TouchableOpacity>

                            {/* Category filter pills */}
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[
                                        styles.filterChip,
                                        {
                                            backgroundColor: selectedCategory === cat.id ? cat.color : colors.card,
                                            borderColor: selectedCategory === cat.id ? cat.color : colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedCategory(cat.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text
                                        style={[
                                            styles.filterChipText,
                                            { color: selectedCategory === cat.id ? '#fff' : colors.textSecondary },
                                        ]}
                                    >
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Result count */}
                        <View style={styles.resultCount}>
                            <Text style={[styles.resultCountText, { color: colors.textMuted }]}>
                                {filteredProducts.length} results
                            </Text>
                        </View>
                    </View>
                )}
            </SafeAreaView>

            {/* ── Body ────────────────────────────────────────────────────────── */}
            {!isSearching ? (
                /* ── IDLE STATE ─────────────────────────────────────────────── */
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.idleContent}>

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent</Text>
                                <TouchableOpacity onPress={() => setRecentSearches([])}>
                                    <Text style={[styles.clearAll, { color: colors.textMuted }]}>Clear all</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.recentList}>
                                {recentSearches.map((term) => (
                                    <View key={term} style={[styles.recentRow, { borderBottomColor: colors.divider }]}>
                                        <TouchableOpacity style={styles.recentLeft} onPress={() => handleRecentPress(term)} activeOpacity={0.7}>
                                            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                                            <Text style={[styles.recentText, { color: colors.textSecondary }]}>{term}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleRecentDelete(term)} activeOpacity={0.7}>
                                            <Ionicons name="close" size={16} color={colors.textMuted} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Trending Searches */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>🔥 Trending Searches</Text>
                        <View style={styles.trendingChips}>
                            {TRENDING_SEARCHES.map((term) => (
                                <TouchableOpacity
                                    key={term}
                                    style={[styles.trendingChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => handleTrendingPress(term)}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="trending-up-outline" size={13} color={colors.accent} />
                                    <Text style={[styles.trendingChipText, { color: colors.textSecondary }]}>{term}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Browse by Category */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Browse Categories</Text>
                        <View style={styles.browseCatGrid}>
                            {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                                <CategoryBrowseCard
                                    key={cat.id}
                                    item={cat}
                                    colors={colors}
                                    onPress={() => handleCategoryPress(cat.id)}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 90 }} />
                </ScrollView>
            ) : showEmpty ? (
                /* ── EMPTY STATE ─────────────────────────────────────────────── */
                <EmptyState query={query} colors={colors} />
            ) : (
                /* ── RESULTS GRID ────────────────────────────────────────────── */
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(i) => i.id}
                    numColumns={2}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.gridRow}
                    renderItem={({ item }) => (
                        <ProductCard
                            item={item}
                            colors={colors}
                            gradients={gradients}
                            onPress={() => goToDetail(item)}
                            onAddToCart={handleAddToCart}
                            onToggleWishlist={handleToggleWishlist}
                            inWishlist={isInWishlist(item.id)}
                        />
                    )}
                    ListFooterComponent={<View style={{ height: 90 }} />}
                />
            )}

            {/* Sort Modal */}
            <SortModal
                visible={showSort}
                onClose={() => setShowSort(false)}
                selected={sortBy}
                onSelect={setSortBy}
                colors={colors}
                gradients={gradients}
            />
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
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        letterSpacing: -0.3,
        marginRight: 4,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === 'ios' ? 11 : 8,
        borderRadius: 14,
        borderWidth: 1.5,
    },
    searchInput: { flex: 1, fontSize: 14 },
    cancelBtn: { paddingLeft: 4 },
    cancelText: { fontSize: 14, fontWeight: '600' },

    // Filter bar
    filterBar: {
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    filterScroll: {
        paddingHorizontal: 16,
        paddingTop: 10,
        gap: 8,
    },
    filterChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 20,
        borderWidth: 1,
    },
    filterChipText: { fontSize: 12, fontWeight: '600' },
    resultCount: {
        paddingHorizontal: 16,
        paddingTop: 6,
    },
    resultCountText: { fontSize: 12 },

    // Idle content
    idleContent: { paddingTop: 8 },
    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
    clearAll: { fontSize: 13, fontWeight: '500' },

    // Recent
    recentList: { borderRadius: 16, overflow: 'hidden' },
    recentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 13,
        borderBottomWidth: 1,
    },
    recentLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    recentText: { fontSize: 14 },

    // Trending chips
    trendingChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    trendingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    trendingChipText: { fontSize: 13, fontWeight: '500' },

    // Browse categories
    browseCatGrid: { gap: 10 },
    browseCatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
    },
    browseCatIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    browseCatLabel: { flex: 1, fontSize: 15, fontWeight: '600' },

    // Product grid
    gridContent: { paddingHorizontal: 16, paddingTop: 14 },
    gridRow: { justifyContent: 'space-between', marginBottom: 12 },
    productCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
    productBadge: {
        position: 'absolute', top: 10, left: 10, zIndex: 2,
        borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
    },
    productBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    wishBtn: {
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.3)',
        alignItems: 'center', justifyContent: 'center',
    },
    productImageBox: { height: 110, alignItems: 'center', justifyContent: 'center' },
    productEmoji: { fontSize: 48 },
    productInfo: { padding: 10, gap: 3 },
    productName: { fontSize: 12, fontWeight: '600' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    reviewCount: { fontSize: 10 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    price: { fontSize: 14, fontWeight: '800' },
    discountBadge: { borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    discountText: { fontSize: 9, fontWeight: '700' },
    originalPrice: { fontSize: 10, textDecorationLine: 'line-through' },
    addBtn: { borderTopWidth: 1 },
    addBtnGradient: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 4, paddingVertical: 9,
    },
    addBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

    // Sort modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sortSheet: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        paddingTop: 12,
    },
    sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12, letterSpacing: -0.3 },
    sortOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 16, borderBottomWidth: 1,
    },
    sortOptionText: { fontSize: 15 },

    // Empty state
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 40, gap: 8,
    },
    emptyEmoji: { fontSize: 60, marginBottom: 8 },
    emptyTitle: { fontSize: 18, fontWeight: '700' },
    emptyQuery: { fontSize: 18, fontWeight: '800' },
    emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 4 },
});

export default ExploreScreen;