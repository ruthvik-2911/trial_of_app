// ─── CategoryScreen.js ───────────────────────────────────────────────────────
// Uses centralized categories.js data.
// Fashion: gender tabs + vertical subcategory sidebar (kept as-is).
// Others: horizontal subcategory chips.
// Filter modal: Price Range (0–200,000), Availability, Sort By.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    FlatList, ScrollView, Modal, Dimensions,
    ActivityIndicator, TextInput, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import productService from '../../services/api/productService';
import { getCategoryById } from '../../data/categories';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 44) / 2;
const PAGE_SIZE = 10;

const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

const normalizeHex = (hex) => {
    if (!hex) return '#000000';
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    return '#' + h;
};

// Fallback meta for unknown categories
const DEFAULT_META = { emoji: '📦', color: '#888', hasGender: false, subcategories: ['All'] };

// ─── Skeleton Card ────────────────────────────────────────────────────────────
const SkeletonCard = ({ colors }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[styles.productCard, { backgroundColor: colors.card, opacity: pulse, width: CARD_WIDTH }]}>
            <View style={[styles.productImageBox, { backgroundColor: colors.border }]} />
            <View style={styles.productInfo}>
                <View style={[styles.skeletonLine, { width: '85%', backgroundColor: colors.border }]} />
                <View style={[styles.skeletonLine, { width: '50%', backgroundColor: colors.border, marginTop: 6 }]} />
                <View style={[styles.skeletonLine, { width: '65%', backgroundColor: colors.border, marginTop: 6 }]} />
            </View>
        </Animated.View>
    );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ item, colors, onPress, displayMode, index, onToggleWishlist, inWishlist }) => {
    const price = item.price || 0;
    const discountPrice = item.discountPrice;

    // Calculate discount percent if not provided
    const calculatedDiscount = (price && discountPrice && price > discountPrice)
        ? Math.round(((price - discountPrice) / price) * 100)
        : 0;

    const discountPercent = item.discountPercent || calculatedDiscount;
    const displayPrice = discountPrice || price;
    const inStock = typeof item.stock === 'number' ? item.stock > 0 : item.inStock !== false;

    // Special Section Badges
    const renderSpecialBadge = () => {
        if (!displayMode) return null;

        if (displayMode === 'deals') {
            return (
                <View style={[styles.specialBadge, { backgroundColor: '#9061F9' }]}>
                    <Text style={styles.specialBadgeText}>{discountPercent}% OFF</Text>
                </View>
            );
        }
        if (displayMode === 'new') {
            return (
                <View style={[styles.specialBadge, { backgroundColor: '#BEA1F7' }]}>
                    <Text style={[styles.specialBadgeText, { color: '#1A0444' }]}>NEW</Text>
                </View>
            );
        }
        if (displayMode === 'trending') {
            return (
                <View style={styles.trendingOverlay}>
                    <Text style={styles.trendingNumber}>#{index + 1}</Text>
                </View>
            );
        }
        return null;
    };

    return (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.82}
        >
            {renderSpecialBadge()}
            {!displayMode && discountPercent > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{discountPercent}% OFF</Text>
                </View>
            )}
            <TouchableOpacity
                style={styles.wishlistButton}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => onToggleWishlist && onToggleWishlist(item)}
            >
                <Ionicons
                    name={inWishlist ? 'heart' : 'heart-outline'}
                    size={18}
                    color={inWishlist ? '#F472B6' : colors.textMuted}
                />
            </TouchableOpacity>
            <View style={[styles.productImageBox, { backgroundColor: colors.cardAlt || colors.border + '30' }]}>
                {item.image
                    ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Text style={styles.productEmoji}>📦</Text>
                }
                {!inStock && (
                    <View style={styles.oosOverlay}>
                        <Text style={styles.oosText}>OUT OF STOCK</Text>
                    </View>
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title || item.name}
                </Text>
                {item.rating != null && (
                    <View style={styles.ratingRow}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{Number(item.rating).toFixed(1)}</Text>
                        <Text style={[styles.reviewText, { color: colors.textMuted }]}>({item.reviewCount || 0})</Text>
                    </View>
                )}
                <View style={styles.priceRow}>
                    <Text style={[styles.priceText, { color: colors.accent }]}>{formatPrice(displayPrice)}</Text>
                    {discountPercent > 0 && (
                        <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{formatPrice(item.price)}</Text>
                    )}
                </View>
                <View style={[styles.stockStrip, { backgroundColor: inStock ? '#4CAF5015' : '#F8717115' }]}>
                    <View style={[styles.stockDot, { backgroundColor: inStock ? '#4CAF50' : '#F87171' }]} />
                    <Text style={[styles.stockLabel, { color: inStock ? '#4CAF50' : '#F87171' }]}>
                        {inStock ? (typeof item.stock === 'number' ? `${item.stock} left` : 'In Stock') : 'Out of Stock'}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const CategoryScreen = ({ navigation, route }) => {
    const { category, sortBy: initialSortBy, backendSortBy, backendOrder, label: routeLabel, displayMode } = route.params;
    const { colors, isDark } = useTheme();
    const { isLoggedIn } = useAuth();
    const insets = useSafeAreaInsets();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const handleToggleWishlist = useCallback((item) => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        toggleWishlist(item);
    }, [isLoggedIn, navigation, toggleWishlist]);

    // Get meta from centralized data; fall back to DEFAULT_META
    const isAllCategory = !category || category === 'All';
    const meta = isAllCategory ? DEFAULT_META : (getCategoryById(category) || DEFAULT_META);
    const isFashion = !isAllCategory && meta.hasGender === true;

    // ── Gender (Fashion only) ──────────────────────────────────────────────────
    const [selectedGender, setSelectedGender] = useState('Men');

    const getSubcategories = useCallback(() => {
        if (isFashion) return meta.genders[selectedGender].subcategories;
        return meta.subcategories || ['All'];
    }, [isFashion, selectedGender, meta]);

    // ── Subcategory ────────────────────────────────────────────────────────────
    const [selectedSubCategory, setSelectedSubCategory] = useState(null);

    useEffect(() => { setSelectedSubCategory(null); }, [selectedGender]);

    // ── Filter & Sort state ────────────────────────────────────────────────────
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);

    // Price range 0 – 200,000
    const [priceMin, setPriceMin] = useState('0');
    const [priceMax, setPriceMax] = useState('200000');

    // Availability: 'All' | 'In Stock' | 'Out of Stock'
    const [availability, setAvailability] = useState('All');
    const availabilityOptions = ['All', 'In Stock', 'Out of Stock'];

    // Sort: matches existing logic — pre-apply if coming from HomeScreen quick filters
    const mapIncomingSortBy = (s) => {
        if (s === 'discountPrice') return 'Discount';
        if (s === 'createdAt') return 'Newest First';
        if (s === 'rating') return 'Rating';
        return 'Popular';
    };
    const [sortBy, setSortBy] = useState(
        backendSortBy ? mapIncomingSortBy(backendSortBy)
            : initialSortBy ? mapIncomingSortBy(initialSortBy)
                : 'Popular'
    );
    const sortOptions = ['Popular', 'Newest First', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Discount'];

    // ── Data ───────────────────────────────────────────────────────────────────
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // ── Fetch ──────────────────────────────────────────────────────────────────
    const fetchProducts = useCallback(async (pageNum = 1, replace = true) => {
        try {
            if (replace) setLoading(true);
            else setLoadingMore(true);

            let fetched = [];
            if (isAllCategory) {
                // "All" — fetch with backend sort params if provided (Today's Deals, New Arrivals, Trending)
                const apiParams = {
                    page: pageNum,
                    limit: displayMode ? 12 : PAGE_SIZE
                };
                if (backendSortBy) apiParams.sortBy = backendSortBy;
                if (backendOrder) apiParams.order = backendOrder;
                const res = await productService.getAllProducts(apiParams);
                fetched = res.products || res.data || (Array.isArray(res) ? res : []);
                if (displayMode) fetched = fetched.slice(0, 12);
            } else {
                const apiCategory = isFashion ? meta.genders[selectedGender].label : category;
                const res = await productService.getProductsByCategory(apiCategory, { page: pageNum, limit: PAGE_SIZE });
                fetched = res.products || res.data || (Array.isArray(res) ? res : []);
            }

            setAllProducts(prev => replace ? fetched : [...prev, ...fetched]);
            setHasMore(fetched.length === PAGE_SIZE);
            setPage(pageNum);
            setError(null);
        } catch (e) {
            console.error('CategoryScreen fetch:', e);
            setError('Could not load products. Tap to retry.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [category, isAllCategory, isFashion, selectedGender, backendSortBy, backendOrder]);

    useEffect(() => { fetchProducts(1, true); }, [fetchProducts]);

    // ── Client-side filter + sort ──────────────────────────────────────────────
    useEffect(() => {
        let result = [...allProducts];
        const min = parseInt(priceMin) || 0;
        const max = parseInt(priceMax) || 200000;

        // Subcategory
        if (selectedSubCategory && selectedSubCategory !== 'All') {
            result = result.filter(p =>
                p.subCategory?.toLowerCase() === selectedSubCategory.toLowerCase()
            );
        }

        // Price
        result = result.filter(p => p.price >= min && p.price <= max);

        // Availability
        if (availability === 'In Stock') {
            result = result.filter(p => (typeof p.stock === 'number' ? p.stock > 0 : p.inStock !== false));
        } else if (availability === 'Out of Stock') {
            result = result.filter(p => (typeof p.stock === 'number' ? p.stock <= 0 : p.inStock === false));
        }

        // Sort
        switch (sortBy) {
            case 'Price: Low to High': result.sort((a, b) => a.price - b.price); break;
            case 'Price: High to Low': result.sort((a, b) => b.price - a.price); break;
            case 'Rating': result.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'Discount': result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0)); break;
            case 'Newest First': result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); break;
            default: result.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
        }

        setFilteredProducts(result);
    }, [allProducts, priceMin, priceMax, availability, sortBy, selectedSubCategory]);

    const loadNextPage = () => {
        if (displayMode) return; // Special sections are limited to 12
        if (!loadingMore && hasMore && !loading) fetchProducts(page + 1, false);
    };

    const clearAllFilters = () => {
        setPriceMin('0');
        setPriceMax('200000');
        setAvailability('All');
        setSelectedSubCategory(null);
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (availability !== 'All') count++;
        if (parseInt(priceMin) > 0 || parseInt(priceMax) < 200000) count++;
        return count;
    };

    const renderProductCard = ({ item, index }) => (
        <ProductCard
            item={item}
            index={index}
            colors={colors}
            displayMode={displayMode}
            onToggleWishlist={handleToggleWishlist}
            inWishlist={isInWishlist(item.id)}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
        />
    );

    const renderFooter = () => loadingMore
        ? <View style={{ paddingVertical: 20 }}><ActivityIndicator size="small" color={colors.accent} /></View>
        : null;

    // ── Filter Modal ───────────────────────────────────────────────────────────
    const renderFilterModal = () => (
        <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <TouchableOpacity onPress={clearAllFilters}>
                            <Text style={[styles.clearButton, { color: colors.accent }]}>Clear All</Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Filters</Text>
                        <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>

                        {/* ── Price Range ── */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Price Range</Text>
                            <Text style={[styles.filterSubtitle, { color: colors.textMuted }]}>
                                ₹{parseInt(priceMin || 0).toLocaleString()} — ₹{parseInt(priceMax || 200000).toLocaleString()}
                            </Text>
                            <View style={styles.priceRangeContainer}>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Min</Text>
                                    <View style={[styles.priceInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Text style={[styles.rupeeSymbol, { color: colors.textPrimary }]}>₹</Text>
                                        <TextInput
                                            style={[styles.priceInput, { color: colors.textPrimary }]}
                                            placeholder="0"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={priceMin}
                                            onChangeText={setPriceMin}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.priceSeparator, { color: colors.textMuted }]}>—</Text>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Max</Text>
                                    <View style={[styles.priceInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Text style={[styles.rupeeSymbol, { color: colors.textPrimary }]}>₹</Text>
                                        <TextInput
                                            style={[styles.priceInput, { color: colors.textPrimary }]}
                                            placeholder="200000"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={priceMax}
                                            onChangeText={setPriceMax}
                                        />
                                    </View>
                                </View>
                            </View>
                            {/* Quick price presets */}
                            <View style={[styles.filterOptions, { marginTop: 10 }]}>
                                {[['Under ₹500', 0, 500], ['₹500–₹2K', 500, 2000], ['₹2K–₹10K', 2000, 10000], ['₹10K+', 10000, 200000]].map(([label, min, max]) => (
                                    <TouchableOpacity
                                        key={label}
                                        style={[styles.filterChip, {
                                            backgroundColor: parseInt(priceMin) === min && parseInt(priceMax) === max ? colors.accent : colors.card,
                                            borderColor: parseInt(priceMin) === min && parseInt(priceMax) === max ? colors.accent : colors.border,
                                        }]}
                                        onPress={() => { setPriceMin(String(min)); setPriceMax(String(max)); }}
                                    >
                                        <Text style={[styles.filterChipText, {
                                            color: parseInt(priceMin) === min && parseInt(priceMax) === max ? '#FFF' : colors.textSecondary,
                                        }]}>{label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* ── Availability ── */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Availability</Text>
                            <View style={styles.filterOptions}>
                                {availabilityOptions.map(opt => (
                                    <TouchableOpacity
                                        key={opt}
                                        style={[styles.filterChip, {
                                            backgroundColor: availability === opt ? colors.accent : colors.card,
                                            borderColor: availability === opt ? colors.accent : colors.border,
                                        }]}
                                        onPress={() => setAvailability(opt)}
                                    >
                                        <Text style={[styles.filterChipText, { color: availability === opt ? '#FFF' : colors.textSecondary }]}>
                                            {opt}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.applyButton, { backgroundColor: colors.accent }]}
                        onPress={() => setShowFilterModal(false)}
                    >
                        <Text style={styles.applyButtonText}>Show {filteredProducts.length} Products</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ── Sort Modal ─────────────────────────────────────────────────────────────
    const renderSortModal = () => (
        <Modal visible={showSortModal} animationType="slide" transparent onRequestClose={() => setShowSortModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.sortModalContent, { backgroundColor: colors.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sort By</Text>
                        <TouchableOpacity onPress={() => setShowSortModal(false)}>
                            <Ionicons name="close" size={24} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                    {sortOptions.map(option => (
                        <TouchableOpacity
                            key={option}
                            style={[styles.sortOption, { borderBottomColor: colors.border }]}
                            onPress={() => { setSortBy(option); setShowSortModal(false); }}
                        >
                            <Text style={[styles.sortOptionText, {
                                color: sortBy === option ? colors.accent : colors.textPrimary,
                                fontWeight: sortBy === option ? '700' : '400',
                            }]}>
                                {option}
                            </Text>
                            {sortBy === option && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    // ── Header title ───────────────────────────────────────────────────────────
    const headerTitle = routeLabel || (isFashion ? meta.genders?.[selectedGender]?.label : (meta.name || category)) || category;

    // ── Shared product grid render ─────────────────────────────────────────────
    const renderGrid = (columnWrapper) => {
        if (loading) {
            return (
                <FlatList
                    data={Array.from({ length: 4 })}
                    keyExtractor={(_, i) => String(i)}
                    numColumns={2}
                    columnWrapperStyle={columnWrapper}
                    contentContainerStyle={styles.gridContent}
                    renderItem={() => <SkeletonCard colors={colors} />}
                    scrollEnabled={false}
                />
            );
        }
        if (error) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Oops!</Text>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{error}</Text>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={() => fetchProducts(1, true)}>
                        <Text style={styles.actionBtnText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        if (filteredProducts.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Products Found</Text>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Try adjusting your filters</Text>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.accent }]} onPress={clearAllFilters}>
                        <Text style={styles.actionBtnText}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return (
            <FlatList
                data={filteredProducts}
                renderItem={(info) => renderProductCard(info)}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={columnWrapper}
                contentContainerStyle={styles.gridContent}
                showsVerticalScrollIndicator={false}
                onEndReached={loadNextPage}
                onEndReachedThreshold={0.4}
                ListFooterComponent={renderFooter}
            />
        );
    };

    // ── Filter / Sort bar (reused in both layouts) ─────────────────────────────
    const renderFilterBar = (compact = false) => (
        <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
            <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: colors.card }]}
                onPress={() => setShowFilterModal(true)}
            >
                <Ionicons name="options-outline" size={compact ? 15 : 18} color={colors.textPrimary} />
                <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>Filter</Text>
                {getActiveFiltersCount() > 0 && (
                    <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                    </View>
                )}
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.filterButton, { backgroundColor: colors.card }]}
                onPress={() => setShowSortModal(true)}
            >
                <Ionicons name="swap-vertical-outline" size={compact ? 15 : 18} color={colors.textPrimary} />
                <Text style={[styles.filterButtonText, { color: colors.textPrimary }]} numberOfLines={1}>{sortBy}</Text>
            </TouchableOpacity>
        </View>
    );

    // ── Main render ────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Gradient header */}
            <LinearGradient
                colors={[normalizeHex(meta.color || '#888') + (isDark ? '44' : '66'), normalizeHex(meta.color || '#888') + '22', colors.background]}
                style={[styles.header, { paddingTop: insets.top + 5 }]}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.headerCircleBtn, { backgroundColor: colors.card + '80' }]}>
                        <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Search', { query: category })}
                        style={[styles.headerCircleBtn, { backgroundColor: colors.card + '80' }]}
                    >
                        <Ionicons name="search" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                <View style={styles.headerContent}>
                    <View style={[styles.iconBubble, { backgroundColor: normalizeHex(meta.color || '#888') + '30' }]}>
                        <Text style={styles.categoryIcon}>{meta.emoji || '📦'}</Text>
                    </View>
                    <View style={styles.titleInfo}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>{headerTitle}</Text>
                        <Text style={[styles.productCount, { color: colors.textMuted }]}>
                            {loading ? 'Loading…' : `${filteredProducts.length} Products`}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Gender tabs (Fashion only) */}
            {isFashion && (
                <View style={[styles.genderTabsRow, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    {Object.keys(meta.genders).map(gender => {
                        const active = selectedGender === gender;
                        return (
                            <TouchableOpacity
                                key={gender}
                                style={[styles.genderTab, active && { borderBottomColor: meta.color, borderBottomWidth: 3 }]}
                                onPress={() => setSelectedGender(gender)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.genderTabText, {
                                    color: active ? meta.color : colors.textMuted,
                                    fontWeight: active ? '700' : '500',
                                }]}>
                                    {gender === 'Men' ? '♂ Men' : '♀ Women'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Subcategory Row (Horizontal Scroll Tabs) */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.background }]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
                    {getSubcategories().map(sub => {
                        const active = (selectedSubCategory ?? 'All') === sub;
                        return (
                            <TouchableOpacity
                                key={sub}
                                style={[styles.tab, {
                                    backgroundColor: active ? colors.accent : (isDark ? colors.card : '#F9FAFB'),
                                    borderColor: active ? colors.accent : colors.border,
                                    // Elevation/shadow for selected tab
                                    elevation: active ? 3 : 0,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: active ? 0.1 : 0,
                                    shadowRadius: 4,
                                }]}
                                onPress={() => setSelectedSubCategory(sub === 'All' ? null : sub)}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.tabText, {
                                    color: active ? '#1A0444' : colors.textSecondary,
                                    fontWeight: active ? '800' : '600',
                                }]}>
                                    {sub}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Filter & Sort Bar */}
            {renderFilterBar(false)}

            {/* Product Grid */}
            {renderGrid(styles.row)}

            {renderFilterModal()}
            {renderSortModal()}
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    header: { paddingBottom: 12, paddingHorizontal: 16 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    headerCircleBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

    headerContent: { flexDirection: 'row', alignItems: 'center', gap: 15, marginTop: 4 },
    iconBubble: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    categoryIcon: { fontSize: 32 },
    titleInfo: { flex: 1 },
    categoryName: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    productCount: { fontSize: 13, fontWeight: '500', marginTop: 1 },

    genderTabsRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(0,0,0,0.03)', marginBottom: 8 },
    genderTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    genderTabText: { fontSize: 14 },


    tabsContainer: { paddingVertical: 12, borderBottomWidth: 0 },
    tabs: { paddingHorizontal: 16, gap: 10 },
    tab: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 25, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
    tabText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },

    filterBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 6, gap: 8, borderBottomWidth: 1 },
    filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, gap: 6 },
    filterButtonText: { fontSize: 12, fontWeight: '600', flexShrink: 1 },
    filterBadge: { width: 16, height: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    filterBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },

    row: { justifyContent: 'space-between', paddingHorizontal: 12, gap: 10 },
    gridRow: { justifyContent: 'space-between', paddingHorizontal: 8, gap: 8 },
    gridContent: { paddingBottom: 30, paddingTop: 6 },

    productCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 10, width: CARD_WIDTH, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6 },
    badge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E53935', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, zIndex: 1 },
    badgeText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
    wishlistButton: { position: 'absolute', top: 8, right: 8, zIndex: 1, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },
    productImageBox: { width: '100%', height: 130, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    productEmoji: { fontSize: 48 },
    oosOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
    oosText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5, borderWidth: 1.5, borderColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    productInfo: { padding: 10, gap: 4 },
    productName: { fontSize: 12, fontWeight: '700', lineHeight: 17, minHeight: 34 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    ratingText: { fontSize: 11, fontWeight: '700' },
    reviewText: { fontSize: 10 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginTop: 2 },
    priceText: { fontSize: 15, fontWeight: '900' },
    originalPrice: { fontSize: 11, textDecorationLine: 'line-through' },
    stockStrip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4, marginTop: 4 },
    stockDot: { width: 5, height: 5, borderRadius: 3 },
    stockLabel: { fontSize: 9, fontWeight: '800' },

    skeletonLine: { height: 11, borderRadius: 5 },

    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 50 },
    emptyIcon: { fontSize: 60, marginBottom: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
    emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
    actionBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    actionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 24 },
    sortModalContent: { maxHeight: '60%', borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingBottom: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
    clearButton: { fontSize: 14, fontWeight: '700' },
    modalTitle: { fontSize: 18, fontWeight: '800' },
    modalBody: { flex: 1, paddingHorizontal: 24 },
    filterSection: { marginTop: 24 },
    filterTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
    filterSubtitle: { fontSize: 13, marginBottom: 12 },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },
    filterChipText: { fontSize: 13, fontWeight: '600' },
    priceRangeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceInputWrapper: { flex: 1 },
    priceLabel: { fontSize: 12, marginBottom: 8, fontWeight: '600' },
    priceInputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
    rupeeSymbol: { fontSize: 14, fontWeight: '700', marginRight: 4 },
    priceInput: { flex: 1, fontSize: 15, fontWeight: '600' },
    priceSeparator: { fontSize: 16, fontWeight: '800' },
    applyButton: { marginHorizontal: 24, marginTop: 16, paddingVertical: 16, borderRadius: 16, alignItems: 'center', elevation: 2 },
    applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderBottomWidth: 1 },
    sortOptionText: { fontSize: 15, fontWeight: '500' },

    // Special Badges
    specialBadge: {
        position: 'absolute',
        top: 10,
        left: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    specialBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    trendingOverlay: {
        position: 'absolute',
        top: 5,
        left: 10,
        zIndex: 10,
    },
    trendingNumber: {
        fontSize: 48,
        fontWeight: '900',
        color: 'rgba(0,0,0,0.18)', // Darkened from 0.06 to 0.18
        fontStyle: 'italic',
        lineHeight: 52,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
    },
});

export default CategoryScreen;