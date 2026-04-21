// ─── ProductDetailScreen.js ────────────────────────────────────────────────
// Fetches product from backend. Falls back to route.params.product if passed.
// Supports: image carousel (real URLs), color selector, size selector,
// out-of-stock handling, add to cart, wishlist, review submit.
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    FlatList,
    StatusBar,
    Animated,
    Platform,
    Alert,
    Image,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import productService, { normaliseProduct } from '../../services/api/productService';
import reviewService from '../../services/api/reviewService';

const { width, height } = Dimensions.get('window');
const IMAGE_HEIGHT = height * 0.4;

// ─── Helpers ───────────────────────────────────────────────────────────────
const formatPrice = (p) => `₹${Number(p).toLocaleString('en-IN')}`;

// ─── Star Rating ───────────────────────────────────────────────────────────
const StarRating = ({ rating, size = 13, color }) => (
    <View style={{ flexDirection: 'row', gap: 2 }}>
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

// ─── Image Carousel (real URLs) ────────────────────────────────────────────
const ImageCarousel = ({ images, colors }) => {
    const [activeIndex, setActiveIndex] = useState(0);

    const onScroll = useCallback((e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        setActiveIndex(idx);
    }, []);

    // Fallback if no images
    if (!images || images.length === 0) {
        return (
            <View style={[styles.imageSlide, { width, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="image-outline" size={64} color={colors.textMuted} />
            </View>
        );
    }

    return (
        <View style={{ height: IMAGE_HEIGHT }}>
            <FlatList
                data={images}
                keyExtractor={(url, i) => `img-${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScroll}
                renderItem={({ item: url }) => (
                    <View style={[styles.imageSlide, { width, backgroundColor: colors.card }]}>
                        <Image
                            source={{ uri: url }}
                            style={{ width, height: IMAGE_HEIGHT }}
                            resizeMode="contain"
                        />
                    </View>
                )}
            />
            {/* Dot indicators */}
            {images.length > 1 && (
                <View style={styles.dotsRow}>
                    {images.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.imgDot,
                                { backgroundColor: i === activeIndex ? colors.accent : colors.border, width: i === activeIndex ? 20 : 6 },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

// ─── Color name → hex lookup (backend sends color names, not hex values) ─────
const COLOR_HEX_MAP = {
    black: '#1a1a1a', white: '#f5f5f5', red: '#e53935', blue: '#1e88e5',
    navy: '#1a237e', green: '#43a047', olive: '#827717', yellow: '#fdd835',
    orange: '#fb8c00', pink: '#e91e63', purple: '#8e24aa', violet: '#7b1fa2',
    brown: '#6d4c41', beige: '#d7ccc8', grey: '#9e9e9e', gray: '#9e9e9e',
    silver: '#bdbdbd', gold: '#ffd700', cream: '#fff8e1', maroon: '#880e4f',
    teal: '#00897b', cyan: '#00acc1', indigo: '#3949ab', coral: '#ff7043',
    lavender: '#ce93d8', mint: '#a5d6a7', peach: '#ffccbc', khaki: '#c5b358',
    charcoal: '#37474f', offwhite: '#fafafa', multicolor: '#888888',
};
const colorNameToHex = (name = '') =>
    COLOR_HEX_MAP[name.toLowerCase().replace(/\s+/g, '')] || '#888888';

// ─── Color Selector ────────────────────────────────────────────────────────
// Expects productColors as normalised [{id, name, hex}] — normalised in initProduct
const ColorSelector = ({ colors: productColors, selectedId, onSelect, themeColors }) => (
    <View style={styles.colorRow}>
        {productColors.map((c) => {
            const isSelected = selectedId === c.id;
            return (
                <TouchableOpacity
                    key={c.id}
                    onPress={() => onSelect(c.id)}
                    activeOpacity={0.8}
                    style={[
                        styles.colorSwatch,
                        {
                            backgroundColor: c.hex,
                            borderColor: isSelected ? themeColors.textPrimary : 'transparent',
                            borderWidth: isSelected ? 2.5 : 2,
                            shadowColor: c.hex,
                        },
                    ]}
                />
            );
        })}
    </View>
);

// ─── Size Selector ─────────────────────────────────────────────────────────
const SizeSelector = ({ sizes, sizePrices, pricingType, selectedSize, onSelect, themeColors }) => (
    <View style={styles.sizeRow}>
        {sizes.map((size) => {
            const isSelected = selectedSize === size;
            return (
                <TouchableOpacity
                    key={size}
                    onPress={() => onSelect(size)}
                    style={[
                        styles.sizeChip,
                        {
                            borderColor: isSelected ? themeColors.accent : themeColors.border,
                            backgroundColor: isSelected ? themeColors.accent + '20' : 'transparent',
                        },
                    ]}
                >
                    <Text style={[styles.sizeChipText, { color: isSelected ? themeColors.accent : themeColors.textPrimary }]}>
                        {size}
                    </Text>
                    {pricingType === 'varied' && sizePrices?.[size] && (
                        <Text style={[styles.sizePriceText, { color: themeColors.textMuted }]}>
                            ₹{sizePrices[size]}
                        </Text>
                    )}
                </TouchableOpacity>
            );
        })}
    </View>
);

// ─── Review Card ───────────────────────────────────────────────────────────
const ReviewCard = ({ review, colors }) => {
    const name = review.customerName || review.userName || review.user || 'Anonymous';

    // Format the date if it's a Firestore Timestamp or string
    let dateStr = review.date || '';
    if (!dateStr && review.createdAt) {
        if (typeof review.createdAt === 'string') {
            dateStr = new Date(review.createdAt).toLocaleDateString();
        } else if (review.createdAt._seconds) {
            dateStr = new Date(review.createdAt._seconds * 1000).toLocaleDateString();
        }
    }

    return (
        <View style={[styles.reviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.reviewHeader}>
                <View style={[styles.reviewAvatar, { backgroundColor: colors.accent + '30' }]}>
                    <Text style={[styles.reviewAvatarText, { color: colors.accent }]}>
                        {name[0].toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.reviewUser, { color: colors.textPrimary }]}>
                        {name} {review.verified ? <Ionicons name="checkmark-circle" size={12} color="#4CAF50" /> : null}
                    </Text>
                    <View style={styles.reviewMeta}>
                        <StarRating rating={review.rating} size={11} color="#FFD700" />
                        {dateStr ? <Text style={[styles.reviewDate, { color: colors.textMuted }]}>{dateStr}</Text> : null}
                    </View>
                </View>
            </View>
            {review.title ? (
                <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>{review.title}</Text>
            ) : null}
            {review.body || review.comment ? (
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>{review.body || review.comment}</Text>
            ) : null}
        </View>
    );
};

// ─── Section Title ─────────────────────────────────────────────────────────
const SectionTitle = ({ title, colors }) => (
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
);

// ─── Spec Row ──────────────────────────────────────────────────────────────
const SpecRow = ({ label, value, colors, isLast }) => (
    <View style={[styles.specRow, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : 1 }]}>
        <Text style={[styles.specLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.specValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
);

// ─── Main Screen ───────────────────────────────────────────────────────────
const ProductDetailScreen = ({ navigation, route }) => {
    const { productId, product: routeProduct } = route?.params || {};
    const { colors, gradients } = useTheme();
    const { isLoggedIn } = useAuth();
    const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
    const insets = useSafeAreaInsets();

    // Product data state
    const [product, setProduct] = useState(routeProduct || null);
    const [loading, setLoading] = useState(!routeProduct);
    const [error, setError] = useState(null);

    // Selection state
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedSize, setSelectedSize] = useState(null);
    const { isInWishlist, toggleWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product?.id);
    const [carouselImages, setCarouselImages] = useState([]);
    const [showFullDesc, setShowFullDesc] = useState(false);

    // Reviews state
    const [reviews, setReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);

    // ─── Derive cart state from global CartContext ─────────────────────────
    // This ensures ProductDetailScreen always reflects the real cart state,
    // even when the item was added from HomeScreen or any other screen.
    const cartItem = React.useMemo(() => {
        if (!product) return null;
        // Match by both id and _id to handle backend shape differences
        return cartItems.find(
            (ci) => ci.id === product.id || ci.id === product._id
        ) || null;
    }, [cartItems, product]);

    // Local flag — set immediately on tap so UI switches without waiting for
    // the CartContext state to propagate through the re-render cycle.
    const [localCartAdded, setLocalCartAdded] = React.useState(false);

    // Keep localCartAdded in sync with the real CartContext value
    React.useEffect(() => {
        setLocalCartAdded(!!cartItem);
    }, [cartItem]);

    const cartAdded = localCartAdded || !!cartItem;
    const quantity = cartItem?.quantity || 1;

    const wishScale = useRef(new Animated.Value(1)).current;

    // ─── Fetch product if not passed via route ─────────────────────────────

    const fetchReviews = async (id, silent = false) => {
        try {
            if (!silent) setReviewsLoading(true);
            const res = await reviewService.getProductReviews(id);
            if (res.success) {
                setReviews(res.reviews || []);
            }
        } catch (e) {
            console.error('[ProductDetailScreen] fetchReviews err:', e);
        } finally {
            if (!silent) setReviewsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (product && product.id) {
                fetchReviews(product.id, true);
            }
        }, [product?.id])
    );

    useEffect(() => {
        if (routeProduct && !productId) {
            // Already have full data from list screen
            initProduct(routeProduct);
            fetchReviews(routeProduct.id);
            return;
        }
        const idToFetch = productId || routeProduct?.id;
        if (!idToFetch) {
            setError('No product ID provided.');
            setLoading(false);
            return;
        }
        (async () => {
            try {
                setLoading(true);
                const result = await productService.getProductById(idToFetch);
                const p = result.product || normaliseProduct(result);
                initProduct(p);
                fetchReviews(idToFetch);
            } catch (err) {
                console.error('[ProductDetailScreen] fetch error:', err.message);
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        })();
    }, [productId]);

    // Set defaults once product is loaded
    function initProduct(p) {
        // ── Normalise colors ────────────────────────────────────────────────
        // Backend shape: colors: ["Brown","Blue"], variantImages: {"Brown":[urls]}
        // Target shape:  colors: [{id:"Brown", name:"Brown", hex:"#6d4c41", images:[urls]}]
        let normColors = [];
        if (Array.isArray(p.colors)) {
            if (typeof p.colors[0] === 'string') {
                // String-array from backend → convert
                normColors = p.colors.map((name) => ({
                    id: name,                                    // use name as stable id
                    name,
                    hex: colorNameToHex(name),
                    images: p.variantImages?.[name] || [],       // pull from variantImages
                }));
            } else {
                // Already object array — just ensure hex fallback
                normColors = p.colors.map((c, i) => ({
                    id: c.id ?? c._id ?? `color-${i}`,
                    name: c.name || c.id || `Color ${i + 1}`,
                    hex: c.hex || colorNameToHex(c.name || ''),
                    images: c.images || [],
                }));
            }
        }

        // ── Normalise inStock — matches HomeScreen ProductCard logic ──────────
        // HomeScreen: (item.stock ?? item.inStock) > 0 || item.inStock === true
        const stockValue = p.stock ?? p.inStock;
        const normInStock =
            typeof stockValue === 'number' ? stockValue > 0 : stockValue === true;

        const normProduct = { ...p, colors: normColors, inStock: normInStock };
        setProduct(normProduct);
        setSelectedColor(normColors[0]?.id || null);
        setSelectedSize(p.sizes?.[0] || null);

        // Initial carousel: first color's images → product images → single image
        const firstColorImages = normColors[0]?.images || [];
        const fallbackImages = p.images?.length ? p.images : p.image ? [p.image] : [];
        setCarouselImages(firstColorImages.length ? firstColorImages : fallbackImages);
    }

    // When user picks a color → swap carousel to that color's variant images
    const handleColorSelect = useCallback((colorId) => {
        setSelectedColor(colorId);
        const colorObj = product?.colors?.find((c) => c.id === colorId);
        // colorObj.images is already normalised (array) from initProduct
        const colorImages = colorObj?.images?.length ? colorObj.images : null;
        const fallbackImages = product?.images?.length
            ? product.images
            : product?.image ? [product.image] : [];
        setCarouselImages(colorImages || fallbackImages);
    }, [product]);

    // Computed price (accounts for size-based pricing)
    const effectivePrice = React.useMemo(() => {
        if (!product) return 0;
        if (product.pricingType === 'varied' && selectedSize && product.sizePrices?.[selectedSize]) {
            return Number(product.sizePrices[selectedSize]);
        }
        return product.discountPrice || product.price;
    }, [product, selectedSize]);

    const discountPercent = product?.price && product?.discountPrice
        ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
        : 0;

    // ─── Actions ──────────────────────────────────────────────────────────
    const handleWishlist = () => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }

        // Context handle
        toggleWishlist(product);

        // Visual feedback
        Animated.sequence([
            Animated.spring(wishScale, { toValue: 1.35, useNativeDriver: true }),
            Animated.spring(wishScale, { toValue: 1, useNativeDriver: true }),
        ]).start();
    };

    const handleAddToCart = () => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
        if (!product.inStock) { Alert.alert('Out of Stock', 'This product is currently unavailable.'); return; }

        const colorName = product.colors?.find((c) => c.id === selectedColor)?.name || null;
        // Set local flag immediately so the UI switches to "Go to Cart" right away
        setLocalCartAdded(true);
        addToCart(product, 1, colorName, selectedSize);
    };

    const handleQuantityChange = (delta) => {
        if (!cartItem) return;
        const next = cartItem.quantity + delta;
        if (next < 1) {
            // Remove from cart when quantity reaches 0
            removeFromCart(product.id, cartItem.color || null);
        } else if (next > 10) {
            Alert.alert('Limit Reached', 'Maximum 10 items per product.');
        } else {
            updateQuantity(product.id, next, cartItem.color || null);
        }
    };

    const handleBuyNow = () => {
        if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }

        // Build a single-item cart payload for checkout
        const colorName = product.colors?.find((c) => c.id === selectedColor)?.name || null;
        const qty = cartItem?.quantity || 1;
        const price = effectivePrice;
        const originalPrice = product.price || price;

        const buyNowItem = {
            ...product,
            id: product.id,
            title: product.title || product.name,
            price,
            originalPrice,
            quantity: qty,
            color: colorName,
            size: selectedSize,
        };

        navigation.navigate('Checkout', {
            cartTotal: price * qty,
            cartItems: [buyNowItem],
            itemCount: 1,
            savings: Math.max(0, (originalPrice - price) * qty),
        });
    };

    // ─── Loading / Error ─────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading product...</Text>
            </View>
        );
    }

    if (error || !product) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error || 'Product not found.'}</Text>
                <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.accent }]} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryBtnText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Build spec rows from product fields
    const specs = [
        product.category && { label: 'Category', value: product.category },
        product.subCategory && { label: 'Sub-category', value: product.subCategory },
        product.pricingType && { label: 'Pricing', value: product.pricingType === 'varied' ? 'Varies by size' : 'Fixed' },
        product.gstPercent > 0 && { label: 'GST', value: `${product.gstPercent}%` },
        product.stock !== null && { label: 'Stock', value: product.stock > 0 ? `${product.stock} available` : 'Out of stock' },
        product.sellerId && { label: 'Seller ID', value: product.sellerId.slice(0, 12) + '…' },
    ].filter(Boolean);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* ── Floating Header ───────────────────────────────────────────── */}
            <SafeAreaView edges={['top']} style={styles.floatingHeader}>
                <TouchableOpacity
                    style={[styles.headerBtn, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}
                    onPress={() => navigation?.goBack()}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={[styles.headerBtn, { backgroundColor: colors.card + 'CC', borderColor: colors.border }]}>
                        <Ionicons name="share-social-outline" size={20} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <Animated.View style={{ transform: [{ scale: wishScale }] }}>
                        <TouchableOpacity
                            style={[
                                styles.headerBtn,
                                { backgroundColor: colors.card + 'CC', borderColor: colors.border },
                                isWishlisted && { backgroundColor: '#E53935' + '33' },
                            ]}
                            onPress={handleWishlist}
                        >
                            <Ionicons
                                name={isWishlisted ? 'heart' : 'heart-outline'}
                                size={20}
                                color={isWishlisted ? '#E53935' : colors.textPrimary}
                            />
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </SafeAreaView>

            {/* ── Scrollable Content ─────────────────────────────────────── */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingTop: insets.top,
                    paddingBottom: 12 + 44 + 12 + insets.bottom + 8
                }}
            >
                {/* Image Carousel */}
                <ImageCarousel images={carouselImages} colors={colors} />

                {/* Main Info */}
                <View style={styles.infoContainer}>
                    {/* Stock badge */}
                    <View style={styles.badgeRow}>
                        <View style={[styles.inStockBadge, { backgroundColor: product.inStock ? '#4CAF50' + '20' : '#E5393520', borderColor: product.inStock ? '#4CAF50' : '#E53935' }]}>
                            <Text style={{ color: product.inStock ? '#4CAF50' : '#E53935', fontSize: 11, fontWeight: '700' }}>
                                {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                            </Text>
                        </View>
                        {product.subCategory && (
                            <View style={[styles.categoryBadge, { borderColor: colors.border }]}>
                                <Text style={{ color: colors.textMuted, fontSize: 11 }}>{product.subCategory}</Text>
                            </View>
                        )}
                    </View>

                    {/* Name */}
                    <Text style={[styles.productTitle, { color: colors.textPrimary }]}>
                        {product.title || product.name}
                    </Text>

                    {/* Rating placeholder (backend doesn't send reviews yet) */}
                    {product.rating && (
                        <View style={styles.ratingRow}>
                            <StarRating rating={product.rating} size={14} color="#FFD700" />
                            <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                                ({product.reviewCount} reviews)
                            </Text>
                        </View>
                    )}

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.textPrimary }]}>{formatPrice(effectivePrice)}</Text>
                        {product.discountPrice && product.pricingType !== 'varied' && (
                            <>
                                <Text style={[styles.originalPrice, { color: colors.textMuted }]}>{formatPrice(product.price)}</Text>
                                <View style={[styles.discountTag, { borderColor: '#4CAF50' + '60' }]}>
                                    <Text style={[styles.discountText, { color: '#4CAF50' }]}>{discountPercent}% off</Text>
                                </View>
                            </>
                        )}
                    </View>
                    {product.discountPrice && (
                        <Text style={[styles.savingsText, { color: '#4CAF50' }]}>
                            You save {formatPrice(product.price - product.discountPrice)}
                        </Text>
                    )}

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Color Selector */}
                    {product.colors?.length > 0 && (
                        <>
                            <SectionTitle
                                title={`Color — ${product.colors.find((c) => c.id === selectedColor)?.name || ''}`}
                                colors={colors}
                            />
                            <ColorSelector
                                colors={product.colors}
                                selectedId={selectedColor}
                                onSelect={handleColorSelect}
                                themeColors={colors}
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </>
                    )}

                    {/* Size Selector */}
                    {product.sizes?.length > 0 && (
                        <>
                            <SectionTitle title={`Size — ${selectedSize || ''}`} colors={colors} />
                            <SizeSelector
                                sizes={product.sizes}
                                sizePrices={product.sizePrices}
                                pricingType={product.pricingType}
                                selectedSize={selectedSize}
                                onSelect={setSelectedSize}
                                themeColors={colors}
                            />
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </>
                    )}

                    {/* Description */}
                    {product.description ? (
                        <>
                            <SectionTitle title="Description" colors={colors} />
                            <Text
                                style={[styles.description, { color: colors.textSecondary }]}
                                numberOfLines={showFullDesc ? undefined : 3}
                            >
                                {product.description}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowFullDesc(v => !v)}
                                activeOpacity={0.7}
                                style={styles.viewMoreBtn}
                            >
                                <Text style={[styles.viewMoreText, { color: colors.accent }]}>
                                    {showFullDesc ? 'View less ↑' : 'View more ↓'}
                                </Text>
                            </TouchableOpacity>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </>
                    ) : null}

                    {/* Specs */}
                    {specs.length > 0 && (
                        <>
                            <SectionTitle title="Details" colors={colors} />
                            <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                {specs.map((s, i) => (
                                    <SpecRow key={s.label} {...s} colors={colors} isLast={i === specs.length - 1} />
                                ))}
                            </View>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        </>
                    )}

                    {/* Reviews placeholder */}
                    <View style={styles.reviewsHeader}>
                        <SectionTitle title="Reviews" colors={colors} />
                        <TouchableOpacity
                            onPress={() => {
                                if (!isLoggedIn) { navigation.navigate('Auth', { screen: 'Login' }); return; }
                                navigation.navigate('AddReview', { product: { id: product.id, name: product.title || product.name } });
                            }}
                        >
                            <Text style={[styles.seeAll, { color: colors.accent }]}>+ Write Review</Text>
                        </TouchableOpacity>
                    </View>

                    {reviewsLoading ? (
                        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 10, alignSelf: 'flex-start' }} />
                    ) : reviews.length > 0 ? (
                        reviews.map((r, i) => <ReviewCard key={r.id || i} review={r} colors={colors} />)
                    ) : (
                        <Text style={[styles.reviewPlaceholder, { color: colors.textMuted }]}>
                            No reviews yet. Be the first!
                        </Text>
                    )}
                </View>
            </ScrollView>

            {/* ── Sticky Bottom Bar ─────────────────────────────────────── */}
            <SafeAreaView
                edges={['bottom']}
                style={[styles.stickyBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}
            >
                {product.inStock ? (
                    cartAdded ? (
                        /* ── Quantity Selector + Go to Cart + Buy Now ── */
                        <View style={styles.cartAddedRow}>
                            {/* Qty control */}
                            <View style={[styles.qtyControl, { borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => handleQuantityChange(-1)}
                                >
                                    <Ionicons
                                        name={quantity === 1 ? 'trash-outline' : 'remove'}
                                        size={16}
                                        color={quantity === 1 ? '#E53935' : colors.textPrimary}
                                    />
                                </TouchableOpacity>
                                <Text style={[styles.qtyValue, { color: colors.textPrimary }]}>{quantity}</Text>
                                <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => handleQuantityChange(1)}
                                >
                                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {/* Go to Cart */}
                            <TouchableOpacity
                                style={styles.goToCartBtn}
                                onPress={() => navigation.navigate('Main', { screen: 'Cart' })}
                            >
                                <LinearGradient
                                    colors={gradients.accentButton || ['#FFD700', '#FFA000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.cartBtnGradient}
                                >
                                    <Ionicons name="cart" size={18} color="#0D0B1E" />
                                    <Text style={styles.cartBtnText}>Go to Cart</Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Buy Now */}
                            <TouchableOpacity
                                style={[styles.buyNowBtn, { borderColor: colors.accent }]}
                                onPress={handleBuyNow}
                            >
                                <Text style={[styles.buyNowText, { color: colors.accent }]}>Buy Now</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* ── Initial: full-width Add to Cart + Buy Now ── */
                        <>
                            <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart}>
                                <LinearGradient
                                    colors={gradients.accentButton || ['#FFD700', '#FFA000']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.cartBtnGradient}
                                >
                                    <Ionicons name="cart-outline" size={18} color="#0D0B1E" />
                                    <Text style={styles.cartBtnText}>Add to Cart</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.buyNowBtn, { borderColor: colors.accent }]}
                                onPress={handleBuyNow}
                            >
                                <Text style={[styles.buyNowText, { color: colors.accent }]}>Buy Now</Text>
                            </TouchableOpacity>
                        </>
                    )
                ) : (
                    /* ── Out of Stock: disabled full-width button ── */
                    <View style={[styles.cartBtnFull, styles.outOfStockBtn]}>
                        <Ionicons name="close-circle-outline" size={18} color="#9E9E9E" />
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
};

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    loadingText: { marginTop: 12, fontSize: 15 },
    errorText: { fontSize: 15, textAlign: 'center', marginTop: 16, marginBottom: 24 },
    retryBtn: { paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12 },
    retryBtnText: { color: '#0D0B1E', fontWeight: '800', fontSize: 15 },

    // Header
    floatingHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
    headerBtn: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    headerActions: { flexDirection: 'row', gap: 8 },

    // Carousel
    imageSlide: { overflow: 'hidden' },
    dotsRow: { position: 'absolute', bottom: 12, flexDirection: 'row', gap: 6, alignSelf: 'center', alignItems: 'center' },
    imgDot: { height: 6, borderRadius: 3 },

    // Info
    infoContainer: { padding: 20 },
    badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    inStockBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    productTitle: { fontSize: 20, fontWeight: '800', lineHeight: 26, marginBottom: 10 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
    ratingCount: { fontSize: 12 },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
    price: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5 },
    originalPrice: { fontSize: 16, textDecorationLine: 'line-through' },
    discountTag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    discountText: { fontSize: 12, fontWeight: '700' },
    savingsText: { fontSize: 12, marginBottom: 4 },
    divider: { height: 1, marginVertical: 18 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    description: { fontSize: 14, lineHeight: 22 },
    viewMoreBtn: { marginTop: 6, marginBottom: 2, alignSelf: 'flex-start' },
    viewMoreText: { fontSize: 13, fontWeight: '700' },

    // Color selector
    colorRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    colorSwatch: { width: 32, height: 32, borderRadius: 16, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 4 },

    // Size selector
    sizeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    sizeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
    sizeChipText: { fontSize: 14, fontWeight: '700' },
    sizePriceText: { fontSize: 10, marginTop: 2 },

    // Specs
    specsCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
    specLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
    specValue: { fontSize: 13, fontWeight: '600', flex: 2, textAlign: 'right' },

    // Reviews
    reviewsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    seeAll: { fontSize: 13, fontWeight: '600' },
    reviewPlaceholder: { fontSize: 13, fontStyle: 'italic' },
    reviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    reviewAvatarText: { fontSize: 15, fontWeight: '700' },
    reviewUser: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
    reviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    reviewDate: { fontSize: 11 },
    reviewComment: { fontSize: 13, lineHeight: 19 },

    // Sticky bar
    stickyBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
        gap: 10, borderTopWidth: 1,
    },
    // Row wrapper for cart-added state (qty + Go to Cart + Buy Now)
    cartAddedRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    goToCartBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', height: 44 },
    qtyControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
    qtyBtn: { width: 34, height: 44, alignItems: 'center', justifyContent: 'center' },
    qtyValue: { fontSize: 14, fontWeight: '700', minWidth: 24, textAlign: 'center' },
    // Flex cart button (used when qty control is visible)
    cartBtn: { flex: 1, borderRadius: 12, overflow: 'hidden', height: 44 },
    // Full-width cart button (initial state & out-of-stock)
    cartBtnFull: { flex: 1, borderRadius: 12, overflow: 'hidden', height: 44 },
    cartBtnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
    cartBtnText: { fontSize: 14, fontWeight: '800', color: '#0D0B1E' },
    buyNowBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    buyNowText: { fontSize: 14, fontWeight: '700' },
    outOfStockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#9E9E9E22', borderRadius: 12 },
    outOfStockText: { fontSize: 14, fontWeight: '700', color: '#9E9E9E' },
});

export default ProductDetailScreen;