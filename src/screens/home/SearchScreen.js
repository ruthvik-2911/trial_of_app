// ─── SearchScreen.js ─────────────────────────────────────────────────────────
// GoodKart — real API data via productService

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Modal,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Animated,
    Image,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/SafeLinearGradient';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import productService from '../../services/api/productService';

const { width } = Dimensions.get('window');
const PAGE_SIZE = 10;
const DEBOUNCE_MS = 400; // wait 400 ms after user stops typing before searching

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

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
        <Animated.View style={[styles.productCard, { backgroundColor: colors.card, opacity: pulse, borderColor: colors.border }]}>
            <View style={[styles.productImage, { backgroundColor: colors.border }]} />
            <View style={styles.productInfo}>
                <View style={[styles.skeletonLine, { width: '85%', backgroundColor: colors.border }]} />
                <View style={[styles.skeletonLine, { width: '50%', backgroundColor: colors.border, marginTop: 6 }]} />
                <View style={[styles.skeletonLine, { width: '65%', backgroundColor: colors.border, marginTop: 6 }]} />
            </View>
        </Animated.View>
    );
};

// ─── Product Card ─────────────────────────────────────────────────────────────
const ProductCard = React.memo(({ item, colors, gradients, onToggleWishlist, inWishlist, onAddToCart, onPress }) => {
    const discountPercent = item.discountPercent || 0;
    const displayPrice = item.discountPrice || item.price;
    const inStock = (item.stock ?? item.inStock) > 0 || item.inStock === true;

    return (
        <TouchableOpacity
            style={[styles.productCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={onPress}
            activeOpacity={0.85}
        >
            {discountPercent > 0 && inStock && (
                <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.textInverse }]}>{discountPercent}% OFF</Text>
                </View>
            )}
            
            <TouchableOpacity 
                style={styles.wishlistButton} 
                onPress={() => onToggleWishlist(item)}
                activeOpacity={0.7}
            >
                <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={20} color={inWishlist ? "#FF4444" : colors.textSecondary} />
            </TouchableOpacity>

            <View style={[styles.productImageWrapper, { backgroundColor: colors.cardAlt }]}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                    <Text style={styles.productEmoji}>📦</Text>
                )}
                {!inStock && (
                    <View style={styles.outOfStockOverlay}>
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                )}
            </View>

            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title || item.name}
                </Text>
                
                <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={13} color="#FFD700" />
                    <Text style={[styles.rating, { color: colors.textSecondary }]}>
                        {Number(item.rating || 0).toFixed(1)}
                    </Text>
                    <Text style={[styles.reviews, { color: colors.textMuted }]}>
                        ({item.reviewCount || 0})
                    </Text>
                </View>

                <View style={styles.priceContainer}>
                    <Text style={[styles.price, { color: colors.accent }]}>
                        {formatPrice(displayPrice)}
                    </Text>
                    {discountPercent > 0 && (
                        <Text style={[styles.originalPrice, { color: colors.textMuted }]}>
                            {formatPrice(item.price)}
                        </Text>
                    )}
                </View>

                <TouchableOpacity 
                    style={styles.addToCartBtn} 
                    onPress={() => onAddToCart(item)}
                    activeOpacity={0.8}
                >
                    <LinearGradient 
                        colors={gradients.button} 
                        style={styles.cartGradient}
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="add" size={16} color="#FFF" />
                        <Text style={styles.cartBtnText}>Add</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
const SearchScreen = ({ navigation, route }) => {
    const { colors, gradients, isDark } = useTheme();
    const { isLoggedIn } = useAuth();
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // ── Search state ──────────────────────────────────────────────────────────
    const [searchQuery, setSearchQuery] = useState(route?.params?.query || '');
    const [recentSearches, setRecentSearches] = useState(['Smartphone', 'Laptop', 'Sneakers', 'Watch']);
    const [popularSearches] = useState(['iPhone 15 Pro', 'MacBook Air', 'Nike Air Max', 'Samsung Galaxy', 'Sony Headphones', 'Apple Watch']);

    // ── Filter & sort state ───────────────────────────────────────────────────
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [showSortModal, setShowSortModal] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [priceRange, setPriceRange] = useState([0, 100000]);
    const [selectedCondition, setSelectedCondition] = useState('All');
    const [selectedRating, setSelectedRating] = useState(0);
    const [sortBy, setSortBy] = useState('Relevance');

    const categories = ['All', 'Fashion (Men)', 'Fashion (Women)', 'Electronics', 'Home & Living', 'Handicrafts', 'Artworks', 'Beauty & Personal Care', 'Sports & Fitness', 'Books & Stationery', 'Food & Beverages'];
    const conditions = ['All', 'New', 'Like New', 'Good', 'Fair'];
    const sortOptions = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Newest', 'Popular', 'Rating'];

    // ── Result state ──────────────────────────────────────────────────────────
    const [allResults, setAllResults] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);

    const debounceTimer = useRef(null);
    const lastQuery = useRef('');

    // ── Execute search against API ────────────────────────────────────────────
    const executeSearch = useCallback(async (query, pageNum = 1, replace = true) => {
        if (!query.trim()) return;

        try {
            if (replace) setLoading(true);
            else setLoadingMore(true);

            const filters = {
                page: pageNum,
                limit: PAGE_SIZE,
                ...(selectedCategory !== 'All' && { category: selectedCategory }),
            };

            const res = await productService.searchProducts(query.trim(), filters);
            const fetched = res.products || [];

            setAllResults(prev => replace ? fetched : [...prev, ...fetched]);
            setHasMore(fetched.length === PAGE_SIZE);
            setPage(pageNum);
            setHasSearched(true);
            setError(null);

            // Save to recent searches
            setRecentSearches(prev => {
                const cleaned = prev.filter(s => s.toLowerCase() !== query.toLowerCase());
                return [query.trim(), ...cleaned].slice(0, 5);
            });
        } catch (e) {
            console.error('SearchScreen executeSearch:', e);
            setError('Search failed. Please try again.');
            setHasSearched(true);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedCategory]);

    // ── Debounced auto-search as user types ───────────────────────────────────
    useEffect(() => {
        if (!searchQuery.trim()) return;

        clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            if (searchQuery.trim() !== lastQuery.current) {
                lastQuery.current = searchQuery.trim();
                executeSearch(searchQuery, 1, true);
            }
        }, DEBOUNCE_MS);

        return () => clearTimeout(debounceTimer.current);
    }, [searchQuery, executeSearch]);

    // ── Re-run search when category filter changes (API-level filter) ─────────
    useEffect(() => {
        if (hasSearched && searchQuery.trim()) {
            executeSearch(searchQuery, 1, true);
        }
    }, [selectedCategory]);

    // ── Client-side filter + sort on top of API results ───────────────────────
    useEffect(() => {
        let filtered = [...allResults];

        if (selectedCondition !== 'All') {
            filtered = filtered.filter(p => (p.condition || 'New') === selectedCondition);
        }
        if (selectedRating > 0) {
            filtered = filtered.filter(p => (p.rating || 0) >= selectedRating);
        }
        filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

        switch (sortBy) {
            case 'Price: Low to High': filtered.sort((a, b) => a.price - b.price); break;
            case 'Price: High to Low': filtered.sort((a, b) => b.price - a.price); break;
            case 'Rating': filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
            case 'Popular': filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); break;
            default: break;
        }

        setSearchResults(filtered);
    }, [allResults, selectedCondition, selectedRating, priceRange, sortBy]);

    const handleSearch = (query) => {
        if (!query.trim()) return;
        clearTimeout(debounceTimer.current);
        lastQuery.current = query.trim();
        executeSearch(query, 1, true);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setAllResults([]);
        setSearchResults([]);
        setHasSearched(false);
        lastQuery.current = '';
    };

    const clearAllFilters = () => {
        setSelectedCategory('All');
        setPriceRange([0, 100000]);
        setSelectedCondition('All');
        setSelectedRating(0);
        setSortBy('Relevance');
    };

    const getActiveFiltersCount = () => {
        let count = 0;
        if (selectedCategory !== 'All') count++;
        if (selectedCondition !== 'All') count++;
        if (selectedRating > 0) count++;
        if (priceRange[0] > 0 || priceRange[1] < 100000) count++;
        return count;
    };

    const loadNextPage = () => {
        if (!loadingMore && hasMore && !loading && searchQuery.trim()) {
            executeSearch(searchQuery, page + 1, false);
        }
    };

    const handleAddToCart = (item) => {
        if (!isLoggedIn) {
            navigation.navigate('Auth', { screen: 'Login' });
            return;
        }
        addToCart(item, 1);
        Alert.alert('✅ Added!', `${item.title || item.name} added to your bag`);
    };

    const handleToggleWishlist = (item) => {
        if (!isLoggedIn) {
            navigation.navigate('Auth', { screen: 'Login' });
            return;
        }
        toggleWishlist(item);
    };

    // ── Render helpers ────────────────────────────────────────────────────────
    const renderProductCard = ({ item }) => (
        <ProductCard
            item={item}
            colors={colors}
            gradients={gradients}
            inWishlist={isInWishlist(item.id)}
            onToggleWishlist={handleToggleWishlist}
            onAddToCart={handleAddToCart}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id, product: item })}
        />
    );

    const renderFooter = () => {
        if (!loadingMore) return null;
        return (
            <View style={{ paddingVertical: 20 }}>
                <ActivityIndicator size="small" color={colors.accent} />
            </View>
        );
    };

    // ── Filter Modal ──────────────────────────────────────────────────────────
    const renderFilterModal = () => (
        <Modal visible={showFilterModal} animationType="slide" transparent onRequestClose={() => setShowFilterModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
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
                        {/* Category */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Category</Text>
                            <View style={styles.filterOptions}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[styles.filterChip, { backgroundColor: selectedCategory === cat ? colors.accent : colors.card, borderColor: colors.border }]}
                                        onPress={() => setSelectedCategory(cat)}
                                    >
                                        <Text style={[styles.filterChipText, { color: selectedCategory === cat ? '#FFF' : colors.textSecondary }]}>{cat}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Price Range */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Price Range</Text>
                            <View style={styles.priceRangeContainer}>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Min</Text>
                                    <View style={[styles.priceInputBox, { backgroundColor: colors.card }]}>
                                        <Text style={[styles.rupeeSymbol, { color: colors.textPrimary }]}>₹</Text>
                                        <TextInput
                                            style={[styles.priceInput, { color: colors.textPrimary }]}
                                            placeholder="0"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={priceRange[0].toString()}
                                            onChangeText={t => setPriceRange([parseInt(t) || 0, priceRange[1]])}
                                        />
                                    </View>
                                </View>
                                <Text style={[styles.priceSeparator, { color: colors.textSecondary }]}>—</Text>
                                <View style={styles.priceInputWrapper}>
                                    <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Max</Text>
                                    <View style={[styles.priceInputBox, { backgroundColor: colors.card }]}>
                                        <Text style={[styles.rupeeSymbol, { color: colors.textPrimary }]}>₹</Text>
                                        <TextInput
                                            style={[styles.priceInput, { color: colors.textPrimary }]}
                                            placeholder="100000"
                                            placeholderTextColor={colors.textMuted}
                                            keyboardType="numeric"
                                            value={priceRange[1].toString()}
                                            onChangeText={t => setPriceRange([priceRange[0], parseInt(t) || 100000])}
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Condition */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Condition</Text>
                            <View style={styles.filterOptions}>
                                {conditions.map(c => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.filterChip, { backgroundColor: selectedCondition === c ? colors.accent : colors.card, borderColor: colors.border }]}
                                        onPress={() => setSelectedCondition(c)}
                                    >
                                        <Text style={[styles.filterChipText, { color: selectedCondition === c ? '#FFF' : colors.textSecondary }]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Rating */}
                        <View style={styles.filterSection}>
                            <Text style={[styles.filterTitle, { color: colors.textPrimary }]}>Minimum Rating</Text>
                            <View style={styles.ratingFilter}>
                                {[0, 3, 4, 4.5].map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={[styles.ratingOption, { backgroundColor: selectedRating === r ? colors.accent : colors.card, borderColor: colors.border }]}
                                        onPress={() => setSelectedRating(r)}
                                    >
                                        <Ionicons name="star" size={16} color={selectedRating === r ? '#FFF' : '#FFD700'} />
                                        <Text style={[styles.ratingOptionText, { color: selectedRating === r ? '#FFF' : colors.textSecondary }]}>
                                            {r === 0 ? 'All' : `${r}+`}
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
                        <Text style={styles.applyButtonText}>Show {searchResults.length} Results</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // ── Sort Modal ────────────────────────────────────────────────────────────
    const renderSortModal = () => (
        <Modal visible={showSortModal} animationType="slide" transparent onRequestClose={() => setShowSortModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.sortModalContent, { backgroundColor: colors.surface }]}>
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
                            <Text style={[styles.sortOptionText, { color: sortBy === option ? colors.accent : colors.textPrimary, fontWeight: sortBy === option ? '600' : '400' }]}>
                                {option}
                            </Text>
                            {sortBy === option && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </Modal>
    );

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* Header */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
                <LinearGradient 
                    colors={isDark ? ['#4910BC', '#120430'] : ['#4910BC', '#BEA1F7']} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }}
                    style={[styles.headerGradient]}
                >
                    <View style={[styles.header, { borderBottomWidth: 0 }]}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color="#FFF" />
                        </TouchableOpacity>
                        <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)' }]}>
                            <Ionicons name="search" size={20} color="rgba(255,255,255,0.8)" />
                            <TextInput
                                style={[styles.searchInput, { color: '#FFF' }]}
                                placeholder="Search products..."
                                placeholderTextColor="rgba(255,255,255,0.6)"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={() => handleSearch(searchQuery)}
                                returnKeyType="search"
                                autoFocus
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={clearSearch}>
                                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.8)" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </LinearGradient>
            </SafeAreaView>

            {/* Filter & Sort Bar (shown only after first search) */}
            {hasSearched && (
                <View style={[styles.filterBar, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
                        <Text style={[styles.filterButtonText, { color: colors.textPrimary }]}>Filters</Text>
                        {getActiveFiltersCount() > 0 && (
                            <View style={[styles.filterBadge, { backgroundColor: colors.accent }]}>
                                <Text style={styles.filterBadgeText}>{getActiveFiltersCount()}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.sortButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowSortModal(true)}
                    >
                        <Ionicons name="swap-vertical-outline" size={18} color={colors.textPrimary} />
                        <Text style={[styles.sortButtonText, { color: colors.textPrimary }]}>{sortBy}</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Content */}
            {!hasSearched ? (
                // Discovery state — recent + popular
                <ScrollView style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
                    {recentSearches.length > 0 && (
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Searches</Text>
                            {recentSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.searchItem, { borderBottomColor: colors.border }]}
                                    onPress={() => { setSearchQuery(item); handleSearch(item); }}
                                >
                                    <Ionicons name="time-outline" size={20} color={colors.textMuted} />
                                    <Text style={[styles.searchItemText, { color: colors.textPrimary }]}>{item}</Text>
                                    <TouchableOpacity onPress={() => setRecentSearches(recentSearches.filter((_, i) => i !== index))}>
                                        <Ionicons name="close" size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Popular Searches</Text>
                        <View style={styles.popularChips}>
                            {popularSearches.map((item, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.popularChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => { setSearchQuery(item); handleSearch(item); }}
                                >
                                    <Text style={[styles.popularChipText, { color: colors.textPrimary }]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </ScrollView>

            ) : loading ? (
                // Skeleton loading state
                <FlatList
                    data={Array.from({ length: 6 })}
                    keyExtractor={(_, i) => String(i)}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.gridContent}
                    renderItem={() => <SkeletonCard colors={colors} />}
                    scrollEnabled={false}
                />

            ) : error ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>⚠️</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Something went wrong</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
                    <TouchableOpacity
                        style={[styles.clearFiltersButton, { backgroundColor: colors.accent }]}
                        onPress={() => executeSearch(searchQuery, 1, true)}
                    >
                        <Text style={[styles.clearFiltersButtonText, { color: colors.textInverse }]}>Retry</Text>
                    </TouchableOpacity>
                </View>

            ) : searchResults.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No Results Found</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        We couldn't find any products matching "{searchQuery}"
                    </Text>
                    <TouchableOpacity
                        style={[styles.clearFiltersButton, { backgroundColor: colors.accent }]}
                        onPress={clearAllFilters}
                    >
                        <Text style={[styles.clearFiltersButtonText, { color: colors.textInverse }]}>Clear Filters</Text>
                    </TouchableOpacity>
                </View>

            ) : (
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                        {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                    </Text>
                    <FlatList
                        data={searchResults}
                        renderItem={renderProductCard}
                        keyExtractor={item => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.gridContent}
                        showsVerticalScrollIndicator={false}
                        onEndReached={loadNextPage}
                        onEndReachedThreshold={0.4}
                        ListFooterComponent={renderFooter}
                    />
                </View>
            )}

            {renderFilterModal()}
            {renderSortModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    headerGradient: { paddingBottom: 16 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, gap: 12 },
    backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, gap: 8, borderWidth: 1 },
    searchInput: { flex: 1, fontSize: 16 },
    filterBar: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    filterButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1 },
    filterButtonText: { fontSize: 14, fontWeight: '500' },
    filterBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
    filterBadgeText: { fontSize: 10, fontWeight: '600' },
    sortButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1 },
    sortButtonText: { fontSize: 14, fontWeight: '500' },
    content: { flex: 1, paddingHorizontal: 16 },
    section: { marginTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
    searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
    searchItemText: { flex: 1, fontSize: 15 },
    popularChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    popularChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    popularChipText: { fontSize: 14 },
    resultsContainer: { flex: 1 },
    resultsCount: { fontSize: 13, paddingHorizontal: 16, paddingVertical: 10 },
    row: { justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },
    gridContent: { paddingBottom: 100 },
    productCard: { width: (width - 44) / 2, borderRadius: 20, padding: 8, marginBottom: 16, borderWidth: 1, overflow: 'hidden' },
    skeletonLine: { height: 12, borderRadius: 6 },
    badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, zIndex: 5 },
    badgeText: { fontSize: 10, fontWeight: '800' },
    wishlistButton: { position: 'absolute', top: 8, right: 8, zIndex: 5, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
    productImageWrapper: { width: '100%', height: 140, borderRadius: 16, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
    productImage: { width: '100%', height: '100%' },
    productEmoji: { fontSize: 60 },
    outOfStockOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    outOfStockText: { color: '#FFF', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    productInfo: { paddingHorizontal: 4, paddingTop: 10, gap: 4 },
    productName: { fontSize: 14, fontWeight: '700', lineHeight: 18, height: 36 },
    ratingContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { fontSize: 12, fontWeight: '600' },
    reviews: { fontSize: 11 },
    priceContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 2 },
    price: { fontSize: 16, fontWeight: '800' },
    originalPrice: { fontSize: 12, textDecorationLine: 'line-through' },
    addToCartBtn: { marginTop: 8, borderRadius: 10, overflow: 'hidden' },
    cartGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 4 },
    cartBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    emptyIcon: { fontSize: 80, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
    clearFiltersButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    clearFiltersButtonText: { fontSize: 14, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
    sortModalContent: { maxHeight: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 20 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    clearButton: { fontSize: 14, fontWeight: '600' },
    modalTitle: { fontSize: 18, fontWeight: '700' },
    modalBody: { flex: 1, paddingHorizontal: 20 },
    filterSection: { marginTop: 24 },
    filterTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontSize: 14, fontWeight: '500' },
    priceRangeContainer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    priceInputWrapper: { flex: 1 },
    priceLabel: { fontSize: 12, marginBottom: 6 },
    priceInputBox: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10 },
    rupeeSymbol: { fontSize: 14, fontWeight: '500', marginRight: 4 },
    priceInput: { flex: 1, fontSize: 14 },
    priceSeparator: { fontSize: 14 },
    ratingFilter: { flexDirection: 'row', gap: 8 },
    ratingOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1, gap: 4 },
    ratingOptionText: { fontSize: 14, fontWeight: '500' },
    applyButton: { marginHorizontal: 20, marginTop: 12, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    applyButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    sortOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
    sortOptionText: { fontSize: 15 },
});

export default SearchScreen;