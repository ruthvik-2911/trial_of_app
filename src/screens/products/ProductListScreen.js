import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    ActivityIndicator,
    Animated,
    TextInput,
    Modal,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_WIDTH = (width - 48) / COLUMN_COUNT;

const ProductListScreen = ({ navigation, route }) => {
    const { title = 'Trending Now', query = '', layout = 'grid' } = route.params || {};
    const { colors, gradients, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const scrollY = useRef(new Animated.Value(0)).current;

    // State
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(query);
    
    // UI State
    const [showSortModal, setShowSortModal] = useState(false);
    const [sortBy, setSortBy] = useState('Newest');

    // Mock data
    const MOCK_PRODUCTS = [
        { id: '1', name: 'Elite Chrono Watch', price: 12900, originalPrice: 18000, rating: 4.8, reviews: 124, image: '⌚', category: 'Luxury', badge: 'HOT' },
        { id: '2', name: 'Aero Pro Headphones', price: 15400, originalPrice: 22000, rating: 4.9, reviews: 89, image: '🎧', category: 'Audio', badge: 'NEW' },
        { id: '3', name: 'Titanium X Smartphone', price: 98000, originalPrice: 110000, rating: 4.7, reviews: 256, image: '📱', category: 'Tech', badge: null },
        { id: '4', name: 'Luxe Cotton Hoodie', price: 3200, originalPrice: 5500, rating: 4.5, reviews: 432, image: '🧥', category: 'Fashion', badge: 'SALE' },
        { id: '5', name: 'Swift Runner Z', price: 6500, originalPrice: 9000, rating: 4.6, reviews: 167, image: '👟', category: 'Sports', badge: null },
        { id: '6', name: 'Ambiance Smart Lamp', price: 2800, originalPrice: 4200, rating: 4.4, reviews: 78, image: '💡', category: 'Home', badge: 'POPULAR' },
        { id: '7', name: 'Velvet Soft Cushion', price: 1200, originalPrice: 1800, rating: 4.3, reviews: 45, image: '🛋️', category: 'Home', badge: null },
        { id: '8', name: 'Precision Coffee Maker', price: 18500, originalPrice: 25000, rating: 4.9, reviews: 112, image: '☕', category: 'Kitchen', badge: 'TOP RATED' },
    ];

    useEffect(() => {
        // Simulate initial load
        setTimeout(() => {
            setProducts(MOCK_PRODUCTS);
            setFilteredProducts(MOCK_PRODUCTS);
            setLoading(false);
        }, 800);
    }, []);

    useEffect(() => {
        // Filter products based on search query
        const filtered = products.filter(p => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    }, [searchQuery, products]);

    const handleSort = (option) => {
        setSortBy(option);
        setShowSortModal(false);
        let sorted = [...filteredProducts];
        if (option === 'Price: Low to High') sorted.sort((a, b) => a.price - b.price);
        if (option === 'Price: High to Low') sorted.sort((a, b) => b.price - a.price);
        if (option === 'Rating') sorted.sort((a, b) => b.rating - a.rating);
        setFilteredProducts(sorted);
    };

    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [0, 1],
        extrapolate: 'clamp',
    });

    const headerTranslate = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: [10, 0],
        extrapolate: 'clamp',
    });

    const renderHorizontalProduct = ({ item }) => (
        <TouchableOpacity 
            style={[styles.wideVerticalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            {/* Top Area: Image */}
            <View style={[styles.wideImageContainer, { backgroundColor: colors.cardAlt }]}>
                <View style={styles.wideActionIcons}>
                    <TouchableOpacity style={styles.wideActionBtn}>
                        <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.wideActionBtn}>
                        <Ionicons name="eye-outline" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.wideEmoji}>{item.image}</Text>
            </View>

            {/* Bottom Area: Info */}
            <View style={styles.wideInfoArea}>
                <Text style={[styles.detailedCategory, { color: colors.textMuted }]}>
                    {item.detailedCategory || item.category.toUpperCase()}
                </Text>
                
                <Text style={[styles.horizontalName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.name}
                </Text>
                
                <View style={styles.horizontalRating}>
                    {[1,2,3,4,5].map(s => (
                        <Ionicons 
                            key={s} 
                            name={s <= Math.floor(item.rating) ? "star" : "star-outline"} 
                            size={12} 
                            color="#F5C842" 
                        />
                    ))}
                    <Text style={[styles.noReviewsText, { color: colors.textMuted }]}>No reviews yet</Text>
                </View>

                <View style={styles.wideFooter}>
                    <View style={styles.horizontalPriceRow}>
                        <Text style={[styles.horizontalPrice, { color: colors.textPrimary }]}>
                            ₹{item.price.toLocaleString()}*
                        </Text>
                        {item.originalPrice && (
                            <View style={styles.horizontalPriceMeta}>
                                <Text style={[styles.horizontalOldPrice, { color: colors.textMuted }]}>
                                    ₹{item.originalPrice.toLocaleString()}
                                </Text>
                                <View style={[styles.discountBadge, { backgroundColor: '#FFEDED' }]}>
                                    <Text style={styles.discountText}>{Math.round(((item.originalPrice-item.price)/item.originalPrice)*100)}%</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {item.isOutOfStock ? (
                        <View style={styles.wideCartAction}>
                            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
                            <View style={[styles.cartBtnSmall, { backgroundColor: '#CBD5E0' }]} />
                        </View>
                    ) : (
                        <TouchableOpacity style={[styles.cartBtnSmall, { backgroundColor: '#3457D5' }]}>
                            <Ionicons name="cart" size={16} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderProduct = ({ item, index }) => (
        <TouchableOpacity 
            style={[styles.productCard, { backgroundColor: colors.surface }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
        >
            {/* Image Area */}
            <View style={[styles.imageContainer, { backgroundColor: colors.cardAlt }]}>
                {item.badge && (
                    <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                )}
                <Text style={styles.emoji}>{item.image}</Text>
                <TouchableOpacity style={styles.wishlistBtn}>
                    <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Info Area */}
            <View style={styles.infoArea}>
                <Text style={[styles.categoryText, { color: colors.accent }]} numberOfLines={1}>
                    {item.category}
                </Text>
                <Text style={[styles.productName, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.name}
                </Text>
                
                <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#F5C842" />
                    <Text style={[styles.ratingText, { color: colors.textSecondary }]}>{item.rating}</Text>
                    <Text style={[styles.reviewsCount, { color: colors.textMuted }]}>({item.reviews})</Text>
                </View>

                <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: colors.textPrimary }]}>₹{item.price.toLocaleString()}</Text>
                    <Text style={[styles.oldPrice, { color: colors.textMuted }]}>₹{item.originalPrice.toLocaleString()}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header Sticky BG */}
            <Animated.View style={[
                styles.stickyHeader, 
                { 
                    backgroundColor: colors.surface, 
                    opacity: headerOpacity,
                    borderBottomColor: colors.border,
                    paddingTop: insets.top,
                }
            ]} />

            {/* Header Content */}
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    
                    <Animated.View style={[
                        styles.headerTitleContainer,
                        { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] }
                    ]}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
                    </Animated.View>

                    <TouchableOpacity style={styles.iconBtn}>
                        <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Search & Filter Bar */}
                <View style={styles.searchFilterRow}>
                    <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Ionicons name="search" size={20} color={colors.textMuted} />
                        <TextInput
                            placeholder="Search in results..."
                            placeholderTextColor={colors.textMuted}
                            style={[styles.searchInput, { color: colors.textPrimary }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    <TouchableOpacity 
                        style={[styles.filterBtn, { backgroundColor: colors.accent }]}
                        onPress={() => setShowSortModal(true)}
                    >
                        <Ionicons name="options-outline" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.accent} />
                </View>
            ) : (
                <Animated.FlatList
                    data={filteredProducts}
                    keyExtractor={item => item.id}
                    renderItem={layout === 'grid' ? renderProduct : renderHorizontalProduct}
                    numColumns={layout === 'grid' ? COLUMN_COUNT : 1}
                    key={layout} // Force re-render when layout changes
                    contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                    showsVerticalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                        { useNativeDriver: false }
                    )}
                    ListHeaderComponent={
                        <View style={styles.resultsHeader}>
                            <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>{title}</Text>
                            <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                                {filteredProducts.length} items found
                            </Text>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No products found matching "{searchQuery}"</Text>
                        </View>
                    }
                />
            )}

            {/* Sort Modal */}
            <Modal
                visible={showSortModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSortModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.modalBlur} onPress={() => setShowSortModal(false)} />
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sort By</Text>
                        
                        {['Newest', 'Popular', 'Price: Low to High', 'Price: High to Low', 'Rating'].map((option) => (
                            <TouchableOpacity 
                                key={option} 
                                style={styles.sortOption}
                                onPress={() => handleSort(option)}
                            >
                                <Text style={[
                                    styles.sortOptionText, 
                                    { color: sortBy === option ? colors.accent : colors.textPrimary }
                                ]}>
                                    {option}
                                </Text>
                                {sortBy === option && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    stickyHeader: {
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 120, zIndex: 10, borderBottomWidth: 1,
    },
    header: { zIndex: 20, paddingHorizontal: 16 },
    headerRow: { 
        flexDirection: 'row', alignItems: 'center', 
        justifyContent: 'space-between', height: 60 
    },
    headerTitleContainer: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800' },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    
    searchFilterRow: { 
        flexDirection: 'row', alignItems: 'center', gap: 12, 
        marginTop: 8, paddingBottom: 12 
    },
    searchBar: {
        flex: 1, height: 48, borderRadius: 14,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '500' },
    filterBtn: { 
        width: 48, height: 48, borderRadius: 14, 
        alignItems: 'center', justifyContent: 'center',
    },

    listContent: { paddingHorizontal: 16, paddingTop: 10 },
    resultsHeader: { marginBottom: 20, marginTop: 10 },
    mainTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    resultCount: { fontSize: 14, marginTop: 4, fontWeight: '500' },

    productCard: {
        width: ITEM_WIDTH,
        marginBottom: 16,
        marginRight: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    imageContainer: {
        width: '100%',
        height: ITEM_WIDTH * 1.1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    emoji: { fontSize: 50 },
    badge: {
        position: 'absolute', top: 12, left: 12,
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: 6, zIndex: 2,
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    wishlistBtn: {
        position: 'absolute', top: 12, right: 12,
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center', justifyContent: 'center',
    },

    infoArea: { padding: 12 },
    categoryText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 4 },
    productName: { fontSize: 14, fontWeight: '700', lineHeight: 18, marginBottom: 8 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
    ratingText: { fontSize: 12, fontWeight: '700' },
    reviewsCount: { fontSize: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
    price: { fontSize: 16, fontWeight: '800' },
    oldPrice: { fontSize: 12, textDecorationLine: 'line-through' },

    loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
    emptyText: { fontSize: 16, textAlign: 'center', marginTop: 20, paddingHorizontal: 40 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: 'flex-end' },
    modalBlur: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: {
        borderTopLeftRadius: 30, borderTopRightRadius: 30,
        padding: 24, paddingBottom: 40,
    },
    modalHandle: {
        width: 40, height: 5, borderRadius: 3,
        alignSelf: 'center', marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    sortOption: {
        flexDirection: 'row', alignItems: 'center', 
        justifyContent: 'space-between', paddingVertical: 16,
    },
    sortOptionText: { fontSize: 16, fontWeight: '600' },

    // Wide Vertical Card Styles (New Request)
    wideVerticalCard: {
        width: '100%',
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    wideImageContainer: {
        width: '100%',
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    wideActionIcons: {
        position: 'absolute',
        top: 10,
        right: 10,
        gap: 8,
    },
    wideActionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    wideEmoji: {
        fontSize: 100,
    },
    wideInfoArea: {
        padding: 16,
        gap: 6,
    },
    detailedCategory: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 2,
    },
    horizontalName: {
        fontSize: 15,
        fontWeight: '700',
        lineHeight: 20,
    },
    horizontalRating: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginTop: 4,
    },
    noReviewsText: {
        fontSize: 11,
        marginLeft: 6,
    },
    wideFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    horizontalPriceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    horizontalPrice: {
        fontSize: 18,
        fontWeight: '800',
    },
    horizontalPriceMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    horizontalOldPrice: {
        fontSize: 12,
        textDecorationLine: 'line-through',
    },
    discountBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    discountText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#E53E3E',
    },
    wideCartAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    outOfStockText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#E53E3E',
    },
    cartBtnSmall: {
        width: 36,
        height: 30,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default ProductListScreen;
