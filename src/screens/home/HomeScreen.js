// ─── HomeScreen.js ────────────────────────────────────────────────────────────
// Horizontal-scroll category sections: Fashion Men, Fashion Women, Latest, etc.
// Each section shows up to 6 products + "View all →" link to CategoryScreen.

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    Dimensions, FlatList, StatusBar, Animated, Platform,
    Image, RefreshControl, Modal, ImageBackground, InteractionManager, Linking,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import productService from '../../services/api/productService';
import NotificationBadge from '../../components/NotificationBadge';
import { CATEGORIES, TOP_CATEGORIES } from '../../data/categories';

// ─── Build sections config dynamically from ALL categories ────────────────────
// Fashion (Men) + Fashion (Women) are placed first, then every other category.
// Sections are shown only if they have ≥1 product (handled in fetchAllSections).
const buildSectionsConfig = () => {
    const PRIORITY_IDS = ['Fashion (Men)', 'Fashion (Women)'];
    const priority = CATEGORIES.filter(c => PRIORITY_IDS.includes(c.id));
    const rest = CATEGORIES.filter(c => !PRIORITY_IDS.includes(c.id));
    return [...priority, ...rest].map(cat => ({
        key: cat.id,
        title: cat.name,
        categoryId: cat.id,
        navCategory: cat.id,
        accentColor: cat.color,
    }));
};
const SECTIONS_CONFIG_ALL = buildSectionsConfig();

const { width } = Dimensions.get('window');
const DEAL_WIDTH = width - 32;
const H_CARD_WIDTH = width * 0.44;   // horizontal-scroll product card
const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

// "All" chip
const ALL_CHIP = { id: 'All', name: 'All', icon: 'apps-outline', color: '#BEA1F7' };

// ─── Flash Deals ───────────────────────────────────────────────────────────────
const FLASH_DEALS = [
    {
        id: 'deal1',
        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1000',
        badge: 'Flash Sale', title: 'Fashion Week',
        subtitle: 'Up to 70% off on top brands',
        cta: 'Shop Now', secondaryCta: 'View All', categoryId: 'Fashion (Men)',
    },
    {
        id: 'deal2',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000',
        badge: 'Limited Time', title: 'Tech Bonanza',
        subtitle: 'Best deals on electronics & gadgets',
        cta: 'Shop Now', secondaryCta: 'View All', categoryId: 'Electronics',
    },
    {
        id: 'deal3',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=1000',
        badge: 'New Arrivals', title: 'Home & Living',
        subtitle: 'Refresh your space this season',
        cta: 'Discover', secondaryCta: 'View All', categoryId: 'Home & Living',
    },
];

// ─── Skeleton (horizontal card) ────────────────────────────────────────────────
const SkeletonHCard = ({ colors }) => {
    const pulse = useRef(new Animated.Value(0.4)).current;
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
            ])
        ).start();
    }, []);
    return (
        <Animated.View style={[styles.hCard, { backgroundColor: colors.card, borderColor: colors.border, opacity: pulse }]}>
            <View style={[styles.hCardImage, { backgroundColor: colors.border }]} />
            <View style={styles.hCardBody}>
                <View style={[styles.skeletonLine, { width: '80%', backgroundColor: colors.border, marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: '55%', backgroundColor: colors.border, marginBottom: 6 }]} />
                <View style={[styles.skeletonLine, { width: '40%', backgroundColor: colors.border }]} />
            </View>
        </Animated.View>
    );
};

// ─── Flash Deal Card ───────────────────────────────────────────────────────────
const FlashDealCard = React.memo(({ item, navigation }) => (
    <TouchableOpacity activeOpacity={0.95}>
        <ImageBackground source={{ uri: item.image }} style={styles.dealCard} imageStyle={{ borderRadius: 24 }}>
            <View style={styles.dealOverlay}>
                <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.85)']} style={StyleSheet.absoluteFillObject} />
                <View style={styles.dealContent}>
                    <View style={styles.dealBadge}>
                        <Ionicons name="sparkles" size={10} color="#fff" style={{ marginRight: 4 }} />
                        <Text style={styles.dealBadgeText}>{item.badge}</Text>
                    </View>
                    <Text style={styles.dealTitle}>{item.title}</Text>
                    <Text style={styles.dealSubtitle}>{item.subtitle}</Text>
                    <View style={styles.dealButtonRow}>
                        <TouchableOpacity
                            style={styles.dealPrimaryBtn} activeOpacity={0.8}
                            onPress={() => navigation.navigate('CategoryScreen', { category: item.categoryId })}
                        >
                            <Text style={styles.dealPrimaryBtnText}>{item.cta}  →</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.dealSecondaryBtn} activeOpacity={0.8}
                            onPress={() => navigation.navigate('CategoryScreen', { category: item.categoryId })}
                        >
                            <Text style={styles.dealSecondaryBtnText}>{item.secondaryCta}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </ImageBackground>
    </TouchableOpacity>
));

// ─── Horizontal Product Card ───────────────────────────────────────────────────
const HProductCard = ({ item, colors, cartCount, onPress, onAddToCart, onUpdateQty, onRemoveFromCart, onToggleWishlist, inWishlist }) => {
    const inStock = typeof item.stock === 'number' ? item.stock > 0 : item.inStock === true;
    const basePrice = item.price;
    const discountPrice = item.discountPrice;
    const discountPct = discountPrice && basePrice ? Math.round(((basePrice - discountPrice) / basePrice) * 100) : 0;
    const displayPrice = discountPrice || basePrice;
    const inCart = cartCount > 0;

    return (
        <TouchableOpacity
            style={[styles.hCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.92}
            onPress={onPress}
        >
            <View style={[styles.hCardImage, { backgroundColor: colors.cardAlt || colors.border + '40' }]}>
                {item.image
                    ? <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    : <Text style={styles.fallbackEmoji}>📦</Text>
                }
                {!inStock && (
                    <View style={styles.oosBg}><Text style={styles.oosText}>OUT OF STOCK</Text></View>
                )}
                {discountPct > 0 && inStock && (
                    <View style={styles.discBadge}><Text style={styles.discBadgeText}>{discountPct}% OFF</Text></View>
                )}
                {inCart && (
                    <View style={[styles.cartPill, { backgroundColor: colors.accent }]}>
                        <Ionicons name="cart" size={9} color="#fff" />
                        <Text style={styles.cartPillText}>{cartCount}</Text>
                    </View>
                )}
                {/* Wishlist */}
                <TouchableOpacity
                    style={styles.wishlistBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => onToggleWishlist && onToggleWishlist(item)}
                >
                    <Ionicons
                        name={inWishlist ? 'heart' : 'heart-outline'}
                        size={14}
                        color={inWishlist ? '#F472B6' : '#888'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.hCardBody}>
                {(item.subCategory || item.category) ? (
                    <Text style={[styles.hCardCat, { color: colors.textMuted }]} numberOfLines={1}>
                        {(item.subCategory || item.category || '').toUpperCase()}
                    </Text>
                ) : null}
                <Text style={[styles.hCardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                    {item.title || item.name}
                </Text>
                {/* Rating */}
                <View style={styles.hCardRating}>
                    {[1, 2, 3, 4, 5].map(s => (
                        <Ionicons key={s} name="star" size={10} color={s <= Math.round(item.rating || 0) ? '#FFB800' : colors.border} />
                    ))}
                    <Text style={[styles.hCardReviews, { color: colors.textMuted }]}>
                        {item.reviewCount ? `(${item.reviewCount})` : 'No reviews yet'}
                    </Text>
                </View>
                {/* Price */}
                <View style={styles.hCardPriceRow}>
                    <Text style={[styles.hCardPrice, { color: colors.textPrimary }]}>{formatPrice(displayPrice)}*</Text>
                    {discountPct > 0 && (
                        <>
                            <Text style={[styles.hCardOriginal, { color: colors.textMuted }]}>{formatPrice(basePrice)}</Text>
                            <View style={styles.hCardDiscPill}>
                                <Text style={styles.hCardDiscText}>{discountPct}%</Text>
                            </View>
                        </>
                    )}
                </View>
            </View>

            {/* Add to Cart */}
            {inCart && inStock ? (
                <View style={[styles.hCardQtyRow, { borderTopColor: colors.border }]}>
                    <TouchableOpacity
                        style={[styles.hCardQtyBtn, { backgroundColor: colors.background }]}
                        onPress={() => cartCount === 1 ? onRemoveFromCart(item) : onUpdateQty(item, cartCount - 1)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name={cartCount === 1 ? 'trash-outline' : 'remove'} size={13} color={cartCount === 1 ? '#E53935' : colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.hCardQtyVal, { color: colors.textPrimary }]}>{cartCount}</Text>
                    <TouchableOpacity
                        style={[styles.hCardQtyBtn, { backgroundColor: colors.background }]}
                        onPress={() => { if (cartCount < 10) onUpdateQty(item, cartCount + 1); }}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Ionicons name="add" size={13} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={[styles.hCardBtn, { borderTopColor: colors.border, opacity: inStock ? 1 : 0.4 }]}
                    onPress={() => onAddToCart(item)}
                    disabled={!inStock}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={inStock ? [colors.primary, colors.primaryDark] : ['#9E9E9E', '#757575']}
                        style={styles.hCardBtnGradient}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="cart-outline" size={11} color="#fff" />
                        <Text style={styles.hCardBtnText}>{!inStock ? 'Unavailable' : 'Add to Cart'}</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};
// Memoize: only re-render when this card's own data changes
const HProductCardMemo = React.memo(HProductCard, (prev, next) =>
    prev.cartCount === next.cartCount &&
    prev.inWishlist === next.inWishlist &&
    prev.item.id === next.item.id &&
    prev.colors === next.colors
);

// ─── Category chip ─────────────────────────────────────────────────────────────
const CategoryChip = ({ item, selected, onPress, colors }) => (
    <TouchableOpacity
        onPress={onPress} activeOpacity={0.75}
        style={[styles.chip, { backgroundColor: selected ? item.color : colors.card, borderColor: selected ? item.color : colors.border }]}
    >
        <Ionicons name={item.icon} size={14} color={selected ? '#fff' : item.color} />
        <Text style={[styles.chipText, { color: selected ? '#fff' : colors.textSecondary }]}>{item.name}</Text>
    </TouchableOpacity>
);

// ─── Category Picker Modal ─────────────────────────────────────────────────────
const CategoryPickerModal = ({ visible, onClose, onSelect, colors }) => (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <View style={styles.pickerOverlay}>
            <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={onClose} />
            <View style={[styles.pickerSheet, { backgroundColor: colors.background }]}>
                <View style={[styles.pickerHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.pickerTitle, { color: colors.textPrimary }]}>All Categories</Text>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.pickerGrid}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.pickerItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                            onPress={() => { onClose(); onSelect(cat); }}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.pickerIconBubble, { backgroundColor: cat.color + '25' }]}>
                                <Text style={styles.pickerEmoji}>{cat.emoji}</Text>
                            </View>
                            <Text style={[styles.pickerItemText, { color: colors.textPrimary }]} numberOfLines={2}>{cat.name}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

// ─── Product Section Row ──────────────────────────────────────────────────────
const ProductSectionRow = ({ title, products, loading, colors, cartCountMap, navigation, onAddToCart, onUpdateQty, onRemoveFromCart, onViewAll, accentColor, onToggleWishlist, isInWishlist }) => {
    const SKELETON_COUNT = 4;
    if (!loading && products.length === 0) return null;
    const accent = accentColor || colors.accent;

    return (
        <View style={styles.sectionBlock}>
            {/* Header row */}
            <View style={styles.sectionHeaderRow}>
                <View style={[styles.sectionAccentBar, { backgroundColor: accent }]} />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
                {!loading && products.length > 0 && (
                    <TouchableOpacity onPress={onViewAll} activeOpacity={0.7} style={styles.viewAllBtn}>
                        <Text style={[styles.viewAllText, { color: accent }]}>View all →</Text>
                    </TouchableOpacity>
                )}
            </View>
            {/* Scroll */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
                {loading
                    ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonHCard key={i} colors={colors} />)
                    : products.map(item => (
                        <HProductCardMemo
                            key={item.id} item={item} colors={colors}
                            cartCount={cartCountMap[item.id] || 0}
                            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                            onAddToCart={onAddToCart}
                            onUpdateQty={onUpdateQty}
                            onRemoveFromCart={onRemoveFromCart}
                            onToggleWishlist={onToggleWishlist}
                            inWishlist={isInWishlist ? isInWishlist(item.id) : false}
                        />
                    ))
                }
            </ScrollView>
        </View>
    );
};

// ─── Latest Releases Block ─────────────────────────────────────────────────────
// One sub-row per active category, sorted newest-first within each.
// Fully dynamic — reuses the already-fetched sections data, zero extra API calls.
const LatestReleasesBlock = ({
    sections, loading,
    colors, isDark, cartCountMap,
    navigation, onAddToCart, onUpdateQty, onRemoveFromCart,
    onToggleWishlist, isInWishlist,
}) => {
    if (!loading && sections.length === 0) return null;

    const SubRow = ({ section }) => {
        const accent = section.accentColor || colors.accent;
        const sorted = [...(section.products || [])].sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        if (!section.loading && sorted.length === 0) return null;
        return (
            <View style={[styles.latestSubRow, { borderTopColor: colors.border }]}>
                <View style={styles.latestSubHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.latestSubDot, { backgroundColor: accent }]} />
                        <Text style={[styles.latestSubTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                    </View>
                    {!section.loading && sorted.length > 0 && (
                        <TouchableOpacity
                            onPress={() => navigation.navigate('CategoryScreen', { category: section.navCategory })}
                            activeOpacity={0.7}
                            style={[styles.latestViewAllBtn, { borderColor: accent + '50', backgroundColor: accent + '12' }]}
                        >
                            <Text style={[styles.viewAllText, { color: accent, fontSize: 11 }]}>View all →</Text>
                        </TouchableOpacity>
                    )}
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollContent}>
                    {section.loading
                        ? Array.from({ length: 4 }).map((_, i) => <SkeletonHCard key={i} colors={colors} />)
                        : sorted.map(item => (
                            <HProductCardMemo
                                key={item.id} item={item} colors={colors}
                                cartCount={cartCountMap[item.id] || 0}
                                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
                                onAddToCart={onAddToCart} onUpdateQty={onUpdateQty} onRemoveFromCart={onRemoveFromCart}
                                onToggleWishlist={onToggleWishlist}
                                inWishlist={isInWishlist ? isInWishlist(item.id) : false}
                            />
                        ))
                    }
                </ScrollView>
            </View>
        );
    };

    return (
        <View style={[styles.latestBlock, { borderColor: colors.border }]}>
            {/* ── Gradient heading banner ── */}
            <LinearGradient
                colors={isDark ? ['#4910BC', '#120430'] : ['#F5F3FF', '#EDE9FE']}
                style={styles.latestBlockHeader}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
                <View style={styles.latestTitleRow}>
                    <View style={[styles.latestIconBox, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={styles.latestEmoji}>🆕</Text>
                    </View>
                    <View>
                        <Text style={[styles.latestBlockTitle, { color: colors.textPrimary }]}>Latest Releases</Text>
                        <Text style={[styles.latestBlockSub, { color: colors.textMuted }]}>Newest arrivals by category</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* ── One sub-row per active category ── */}
            {loading
                ? <SubRow section={{ key: 'skeleton', title: 'Loading…', products: [], loading: true, accentColor: colors.accent }} />
                : sections.map(section => <SubRow key={section.key} section={section} />)
            }
        </View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { isLoggedIn, user } = useAuth();
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    // ── Per-section product state ──────────────────────────────────────────────
    // Derived dynamically from ALL categories; only sections with ≥1 product are
    // rendered.  Adding a product to any new category auto-surfaces it here.
    const [sections, setSections] = useState([]);
    // latestLoading: true while sections are being fetched (shared with LatestReleasesBlock)
    const [latestLoading, setLatestLoading] = useState(true);

    const [refreshing, setRefreshing] = useState(false);
    const [showPickerModal, setShowPickerModal] = useState(false);
    // Native-thread animated scroll position for deal banner dots
    const dealScrollX = useRef(new Animated.Value(0)).current;

    const scrollY = useRef(new Animated.Value(0)).current;
    const [headerHeight, setHeaderHeight] = useState(0);

    // Animation for "Go to Seller" button
    const sellerScale = useRef(new Animated.Value(1)).current;
    const handleSellerPressIn = () => {
        Animated.spring(sellerScale, { toValue: 0.96, useNativeDriver: true }).start();
    };
    const handleSellerPressOut = () => {
        Animated.spring(sellerScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    };

    const cartCountMap = useMemo(() =>
        cartItems.reduce((acc, item) => {
            acc[item.id] = (acc[item.id] || 0) + (item.quantity || 1);
            return acc;
        }, {}),
        [cartItems]);

    // ── Fetch all sections ─────────────────────────────────────────────────────
    const fetchAllSections = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);

        // Show loading skeletons for every category while fetching
        setSections(SECTIONS_CONFIG_ALL.map(s => ({ ...s, products: [], loading: true })));
        setLatestLoading(true);

        const fetchOneCategory = async (cfg) => {
            try {
                const res = await productService.getProductsByCategory(cfg.categoryId, { limit: 6 });
                const list = res.products || res.data || (Array.isArray(res) ? res : []);
                return { ...cfg, products: list.slice(0, 6), loading: false };
            } catch {
                return { ...cfg, products: [], loading: false };
            }
        };

        const sectionResults = await Promise.allSettled(
            SECTIONS_CONFIG_ALL.map(cfg => fetchOneCategory(cfg))
        );

        // Only keep categories that returned ≥1 product
        const liveSections = sectionResults
            .filter(r => r.status === 'fulfilled' && r.value.products.length > 0)
            .map(r => r.value);

        setSections(liveSections);
        // LatestReleasesBlock reuses liveSections — no extra API call needed
        setLatestLoading(false);

        if (isRefresh) setRefreshing(false);
    }, []);

    useEffect(() => {
        // Defer API fetch until after navigation animation completes —
        // prevents JS thread from being blocked during the slide-in.
        const task = InteractionManager.runAfterInteractions(() => {
            fetchAllSections();
        });
        return () => task.cancel();
    }, [fetchAllSections]);

    // ── Navigation ─────────────────────────────────────────────────────────────
    const handleCategoryPress = useCallback((cat) => {
        navigation.navigate('CategoryScreen', { category: cat.id });
    }, [navigation]);

    // ── Cart actions ───────────────────────────────────────────────────────────
    const handleAddToCart = useCallback((item) => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        const inStock = typeof item.stock === 'number' ? item.stock > 0 : item.inStock === true;
        if (!inStock) return;
        addToCart(item, 1);
    }, [isLoggedIn, navigation, addToCart]);

    const handleUpdateQty = useCallback((item, newQty) => {
        if (!isLoggedIn) return;
        updateQuantity(item.id, newQty, item.color || null);
    }, [isLoggedIn, updateQuantity]);

    const handleRemoveFromCart = useCallback((item) => {
        if (!isLoggedIn) return;
        removeFromCart(item.id, item.color || null);
    }, [isLoggedIn, removeFromCart]);

    const handleToggleWishlist = useCallback((item) => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        toggleWishlist(item);
    }, [isLoggedIn, navigation, toggleWishlist]);

    const headerBg = scrollY.interpolate({
        inputRange: [0, 60],
        outputRange: ['transparent', colors.surface || colors.card],
        extrapolate: 'clamp',
    });

    const firstName = user?.fullName?.split(' ')[0] || user?.displayName?.split(' ')[0] || user?.name?.split(' ')[0] || 'there';
    const totalCartItems = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);

    // sections already contains only live (non-empty) entries after fetch;
    // during the initial load phase any still-loading entries are shown as skeletons.
    const visibleSections = sections.filter(s => s.loading || s.products.length > 0);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />

            {/* ── Fixed Header ─────────────────────────────────────────────────── */}
            <Animated.View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: headerBg }}>
                <LinearGradient
                    colors={isDark ? ['#120430', '#1A0640'] : ['#FFFFFF', '#F5F3FF']}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                />
                <SafeAreaView edges={['top']} onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}>
                    <View style={{ paddingBottom: 8 }}>
                        {/* Brand row */}
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <Image 
                                        source={isDark ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo-light.png')} 
                                        style={{ width: 56, height: 56 }} 
                                        resizeMode="contain" 
                                    />
                                    <View>
                                        <Text style={[styles.brandName, { color: colors.accent, fontSize: 22, lineHeight: 24, fontWeight: '900' }]}>GoodKart</Text>
                                        <Text style={[styles.headerSub, { color: colors.textSecondary, marginTop: 0 }]}>
                                            {isLoggedIn ? `Hey ${firstName} 👋` : 'Welcome!'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={[styles.headerRight, { gap: 12 }]}>
                                <Animated.View style={{ transform: [{ scale: sellerScale }] }}>
                                    <TouchableOpacity
                                        style={[styles.sellerBtn, { backgroundColor: colors.accent + '12', borderColor: colors.accent + '40' }]}
                                        onPress={() => Linking.openURL('https://sellsathifrontend.onrender.com/#/seller')}
                                        onPressIn={handleSellerPressIn}
                                        onPressOut={handleSellerPressOut}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="storefront-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
                                        <Text style={[styles.sellerBtnText, { color: colors.accent }]}>Go to Seller</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                                <NotificationBadge iconSize={22} iconColor={colors.textSecondary} />
                            </View>
                        </View>

                        {/* Search bar */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 4 }]}
                            onPress={() => navigation.navigate('Search', { query: '' })}
                        >
                            <Ionicons name="search-outline" size={17} color={colors.textMuted} />
                            <Text style={[styles.searchPlaceholder, { color: colors.textMuted }]}>Search products…</Text>
                            <View style={[styles.searchFilter, { backgroundColor: colors.accent + '20' }]}>
                                <Ionicons name="options-outline" size={15} color={colors.accent} />
                            </View>
                        </TouchableOpacity>

                        {/* Quick filter pills — Today's Deals / New Arrivals / Trending */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFiltersRow}>
                            {[
                                { label: "Today's Deals", emoji: '🔥', backendSortBy: 'discountPrice', backendOrder: 'desc', color: '#E53935' },
                                { label: 'New Arrivals', emoji: '✨', backendSortBy: 'createdAt', backendOrder: 'desc', color: '#BEA1F7' },
                                { label: 'Trending', emoji: '📈', backendSortBy: 'rating', backendOrder: 'desc', color: '#FF9800' },
                            ].map(({ label, emoji, backendSortBy, backendOrder, color }) => (
                                <TouchableOpacity
                                    key={label}
                                    activeOpacity={0.75}
                                    style={[styles.quickFilterChip, { borderColor: color + '70', backgroundColor: color + '12' }]}
                                    onPress={() => {
                                        const displayMode = label === "Today's Deals" ? 'deals' : label === 'New Arrivals' ? 'new' : 'trending';
                                        navigation.navigate('CategoryScreen', {
                                            category: 'All',
                                            backendSortBy,
                                            backendOrder,
                                            label: `${emoji} ${label}`,
                                            displayMode
                                        });
                                    }}
                                >
                                    <Text style={styles.quickFilterEmoji}>{emoji}</Text>
                                    <Text style={[styles.quickFilterText, { color }]}>{label}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Category chips */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
                            <CategoryChip item={ALL_CHIP} selected={false} colors={colors} onPress={() => fetchAllSections(true)} />
                            {TOP_CATEGORIES.map(cat => (
                                <CategoryChip
                                    key={cat.id} item={cat} selected={false} colors={colors}
                                    onPress={() => handleCategoryPress(cat)}
                                />
                            ))}
                            <TouchableOpacity
                                onPress={() => setShowPickerModal(true)} activeOpacity={0.75}
                                style={[styles.chip, styles.moreChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                            >
                                <Ionicons name="grid-outline" size={14} color={colors.accent} />
                                <Text style={[styles.chipText, { color: colors.accent }]}>More</Text>
                                <Ionicons name="chevron-forward" size={12} color={colors.accent} />
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Animated.View>

            {/* ── Main Scroll ─────────────────────────────────────────────────── */}
            <Animated.ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingTop: headerHeight || 80 }]}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchAllSections(true)}
                        tintColor={colors.accent}
                        colors={[colors.accent]}
                        progressViewOffset={headerHeight}
                    />
                }
            >
                {/* ── Flash Deals Banner ────────────────────────────────────── */}
                <Animated.ScrollView
                    horizontal
                    pagingEnabled={false}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={DEAL_WIDTH + 12}
                    snapToAlignment="start"
                    decelerationRate="fast"
                    disableIntervalMomentum={true}
                    scrollEventThrottle={16}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: dealScrollX } } }],
                        { useNativeDriver: true }
                    )}
                    contentContainerStyle={styles.dealsContainer}
                >
                    {FLASH_DEALS.map(item => (
                        <FlashDealCard key={item.id} item={item} navigation={navigation} />
                    ))}
                </Animated.ScrollView>

                {/* Pagination dots — 100% native thread.
                    `width` is NOT supported by useNativeDriver, so we use:
                    - scaleX on a fixed 16-wide pill  →  shrinks inactive dots to 6/16 = 0.375
                    - opacity                          →  fades inactive dots
                    Both are native-thread safe and silky smooth. */}
                <View style={styles.paginationDots}>
                    {FLASH_DEALS.map((_, i) => {
                        const STEP = DEAL_WIDTH + 12;
                        const scaleX = dealScrollX.interpolate({
                            inputRange: [(i - 1) * STEP, i * STEP, (i + 1) * STEP],
                            outputRange: [0.375, 1, 0.375], // 6px / 16px = 0.375
                            extrapolate: 'clamp',
                        });
                        const opacity = dealScrollX.interpolate({
                            inputRange: [(i - 1) * STEP, i * STEP, (i + 1) * STEP],
                            outputRange: [0.35, 1, 0.35],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.dot,
                                    {
                                        backgroundColor: colors.accent,
                                        opacity,
                                        transform: [{ scaleX }],
                                    },
                                ]}
                            />
                        );
                    })}
                </View>

                {/* ── Category Sections (dynamic — only categories with products) ── */}
                {visibleSections.map(section => (
                    <ProductSectionRow
                        key={section.key}
                        title={section.title}
                        products={section.products}
                        loading={section.loading}
                        colors={colors}
                        cartCountMap={cartCountMap}
                        navigation={navigation}
                        onAddToCart={handleAddToCart}
                        onUpdateQty={handleUpdateQty}
                        onRemoveFromCart={handleRemoveFromCart}
                        onViewAll={() => navigation.navigate('CategoryScreen', { category: section.navCategory })}
                        accentColor={section.accentColor}
                        onToggleWishlist={handleToggleWishlist}
                        isInWishlist={isInWishlist}
                    />
                ))}

                {/* ── Latest Releases (one sub-row per active category, newest-first) ── */}
                <LatestReleasesBlock
                    sections={sections}
                    loading={latestLoading}
                    colors={colors}
                    isDark={isDark}
                    cartCountMap={cartCountMap}
                    navigation={navigation}
                    onAddToCart={handleAddToCart}
                    onUpdateQty={handleUpdateQty}
                    onRemoveFromCart={handleRemoveFromCart}
                    onToggleWishlist={handleToggleWishlist}
                    isInWishlist={isInWishlist}
                />

                <View style={{ height: 100 }} />
            </Animated.ScrollView>

            {/* ── Category Picker Modal ──────────────────────────────────────── */}
            <CategoryPickerModal
                visible={showPickerModal}
                onClose={() => setShowPickerModal(false)}
                onSelect={handleCategoryPress}
                colors={colors}
                isDark={isDark}
            />
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },

    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    headerLeft: { flex: 1 },
    brandName: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    headerSub: { fontSize: 12, marginTop: 1 },
    headerRight: { flexDirection: 'row', gap: 10, alignItems: 'center' },
    headerBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    sellerBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.2 },
    sellerBtnText: { fontSize: 12, fontWeight: '700' },
    headerBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
    headerBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

    scrollContent: { paddingBottom: 20 },

    searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 16, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10, borderRadius: 14, borderWidth: 1, gap: 10 },
    searchPlaceholder: { flex: 1, fontSize: 14 },
    searchFilter: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

    chipsRow: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
    moreChip: { gap: 4 },
    chipText: { fontSize: 12, fontWeight: '600' },

    // Flash Deals
    dealsContainer: { paddingHorizontal: 16, gap: 12, marginTop: 16 },
    dealCard: { width: DEAL_WIDTH, height: 200, borderRadius: 24, overflow: 'hidden', marginRight: 12 },
    dealOverlay: { flex: 1, padding: 20, justifyContent: 'flex-end' },
    dealContent: { zIndex: 2 },
    dealBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.1)' },
    dealBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
    dealTitle: { fontSize: 24, fontWeight: '900', color: '#FFFFFF', lineHeight: 28, marginBottom: 4, letterSpacing: -0.5 },
    dealSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 16, maxWidth: '85%' },
    dealButtonRow: { flexDirection: 'row', gap: 10 },
    dealPrimaryBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dealPrimaryBtnText: { fontSize: 13, fontWeight: '700', color: '#000' },
    dealSecondaryBtn: { borderWidth: 1.5, borderColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    dealSecondaryBtnText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
    paginationDots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, marginBottom: 8 },
    dot: { width: 16, height: 6, borderRadius: 3 },

    // Section
    sectionBlock: { marginBottom: 4, paddingTop: 20 },
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
    sectionAccentBar: { width: 4, height: 20, borderRadius: 2 },
    sectionTitle: { flex: 1, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    viewAllBtn: { paddingVertical: 2 },
    viewAllText: { fontSize: 13, fontWeight: '700' },
    sectionDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16, marginBottom: 12 },
    hScrollContent: { paddingHorizontal: 16, gap: 12, paddingBottom: 8 },

    // Quick filter chips (Today's Deals / New Arrivals / Trending)
    quickFiltersRow: { paddingHorizontal: 16, gap: 10, paddingBottom: 10, paddingTop: 4 },
    quickFilterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
    quickFilterEmoji: { fontSize: 13 },
    quickFilterText: { fontSize: 12, fontWeight: '700' },

    // Latest Releases Block
    latestBlock: { marginHorizontal: 14, marginTop: 24, marginBottom: 12, borderRadius: 24, borderWidth: 1, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10 },
    latestBlockHeader: { paddingHorizontal: 18, paddingVertical: 18 },
    latestTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    latestIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    latestEmoji: { fontSize: 22 },
    latestBlockTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
    latestBlockSub: { fontSize: 12, fontWeight: '500', marginTop: 2 },
    latestSubRow: { borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: 16 },
    latestSubHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    latestSubDot: { width: 8, height: 8, borderRadius: 4 },
    latestSubTitle: { fontSize: 14, fontWeight: '700' },
    latestViewAllBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },

    // Horizontal Product Card
    hCard: { width: H_CARD_WIDTH, borderRadius: 16, borderWidth: 1, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 3 },
    hCardImage: { height: 150, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
    fallbackEmoji: { fontSize: 48 },
    oosBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)', alignItems: 'center', justifyContent: 'center' },
    oosText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 1, textAlign: 'center', paddingHorizontal: 6, paddingVertical: 3, borderWidth: 1.5, borderColor: '#fff', borderRadius: 5 },
    discBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#E53935', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    discBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
    cartPill: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 10 },
    cartPillText: { color: '#fff', fontSize: 10, fontWeight: '800' },
    wishlistBtn: { position: 'absolute', bottom: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' },

    hCardBody: { padding: 9, gap: 2 },
    hCardCat: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
    hCardTitle: { fontSize: 12, fontWeight: '700', lineHeight: 16 },
    hCardRating: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
    hCardReviews: { fontSize: 9, fontWeight: '500', marginLeft: 2 },
    hCardPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, flexWrap: 'wrap' },
    hCardPrice: { fontSize: 13, fontWeight: '900' },
    hCardOriginal: { fontSize: 10, textDecorationLine: 'line-through' },
    hCardDiscPill: { backgroundColor: '#FFF3CC', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 },
    hCardDiscText: { fontSize: 9, fontWeight: '800', color: '#B8860B' },

    hCardBtn: { borderTopWidth: 1, overflow: 'hidden', borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
    hCardBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
    hCardBtnText: { fontSize: 10, fontWeight: '800', color: '#fff' },

    hCardQtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingVertical: 7, paddingHorizontal: 9, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
    hCardQtyBtn: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    hCardQtyVal: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '800' },

    skeletonLine: { borderRadius: 6, height: 10 },

    // Category Picker Modal
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    pickerSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 32, maxHeight: '80%' },
    pickerHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
    pickerTitle: { fontSize: 18, fontWeight: '800', paddingHorizontal: 20, paddingVertical: 14 },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 10, paddingBottom: 16 },
    pickerItem: { width: (width - 64) / 3, alignItems: 'center', borderRadius: 16, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 8, gap: 8 },
    pickerIconBubble: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    pickerEmoji: { fontSize: 24 },
    pickerItemText: { fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 15 },
});

export default HomeScreen;