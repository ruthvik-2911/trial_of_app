/**
 * SellSathi – Home.jsx
 * Dark theme · Real product images · Meesho/Flipkart style
 */

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  Pressable,
  StyleSheet,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: W } = Dimensions.get("window");

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0A0E13",
  surface: "#111827",
  surfaceAlt: "#141C26",
  surfaceBrd: "#1E2D3D",
  accent: "#00E5FF",
  textPrimary: "#FFFFFF",
  textSec: "#94A3B8",
  textMuted: "#4B5563",
  danger: "#FF4757",
  success: "#10B981",
  badge: "#7C3AED",
  cardBrd: "rgba(255,255,255,0.07)",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "1", name: "Fashion", icon: "👗", bg: "#2D1B4E" },
  { id: "2", name: "Electronics", icon: "📱", bg: "#1A2744" },
  { id: "3", name: "Home", icon: "🏠", bg: "#1A3A2A" },
  { id: "4", name: "Beauty", icon: "💄", bg: "#3D1A2A" },
  { id: "5", name: "Books", icon: "📚", bg: "#2D2A1A" },
  { id: "6", name: "Sports", icon: "🏋", bg: "#1A2A3A" },
  { id: "7", name: "Toys", icon: "🧸", bg: "#3D1A1A" },
];

const BANNERS = [
  {
    id: "1",
    title: "Flash Sale\nLive Now!",
    sub: "Up to 70% off on fashion",
    badge: "⚡ FLASH SALE",
    colors: ["#1A40CC", "#7C3AED"],
    emoji: "👗",
  },
  {
    id: "2",
    title: "Electronics\nMega Deal",
    sub: "Best prices guaranteed",
    badge: "🔥 HOT DEAL",
    colors: ["#0F766E", "#0284C7"],
    emoji: "📱",
  },
  {
    id: "3",
    title: "New Arrivals\nThis Week",
    sub: "Fresh drops every Monday",
    badge: "✨ NEW",
    colors: ["#7C3AED", "#DB2777"],
    emoji: "🛍",
  },
];

// Real product images from Unsplash (free, no key needed)
const PRODUCTS = [
  {
    id: "1",
    name: "Nike Running Shoes",
    price: 1299,
    original: 2999,
    discount: 57,
    rating: 4.5,
    reviews: 1240,
    freeDelivery: true,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
  },
  {
    id: "2",
    name: "Leather Handbag",
    price: 999,
    original: 2200,
    discount: 55,
    rating: 4.2,
    reviews: 890,
    freeDelivery: false,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
  },
  {
    id: "3",
    name: "Smart Watch Pro",
    price: 2499,
    original: 5999,
    discount: 58,
    rating: 4.4,
    reviews: 2340,
    freeDelivery: true,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
  },
  {
    id: "4",
    name: "Cotton Kurta Set",
    price: 549,
    original: 1100,
    discount: 50,
    rating: 4.3,
    reviews: 3200,
    freeDelivery: true,
    image:
      "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=400&q=80",
  },
  {
    id: "5",
    name: "Wireless Earbuds",
    price: 1499,
    original: 3499,
    discount: 57,
    rating: 4.6,
    reviews: 5600,
    freeDelivery: true,
    image:
      "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80",
  },
  {
    id: "6",
    name: "Face Moisturizer",
    price: 349,
    original: 799,
    discount: 56,
    rating: 4.1,
    reviews: 780,
    freeDelivery: false,
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&q=80",
  },
];

const NEW_ARRIVALS = [
  {
    id: "n1",
    name: "Denim Jacket",
    price: 1299,
    tag: "NEW",
    image:
      "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=300&q=80",
  },
  {
    id: "n2",
    name: "Yoga Mat",
    price: 599,
    tag: "HOT",
    image:
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=300&q=80",
  },
  {
    id: "n3",
    name: "Sunglasses",
    price: 799,
    tag: "TOP",
    image:
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300&q=80",
  },
  {
    id: "n4",
    name: "Backpack",
    price: 1099,
    tag: "NEW",
    image:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&q=80",
  },
  {
    id: "n5",
    name: "Sneakers",
    price: 1899,
    tag: "HOT",
    image:
      "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=300&q=80",
  },
];

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(init = 7200) {
  const [sec, setSec] = useState(init);
  useEffect(() => {
    const id = setInterval(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0"));
}

// ─── Scale press ──────────────────────────────────────────────────────────────
function ScalePress({ children, onPress, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
          speed: 50,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
        }).start()
      }
      onPress={onPress}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── A. Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <View style={s.header}>
      {/* Row 1: Brand + Icons */}
      <View style={s.headerRow}>
        <View style={s.headerLeft}>
          <View style={s.headerLogo}>
            <Text style={{ fontSize: 18 }}>🛍</Text>
          </View>
          <View>
            <Text style={s.headerBrand}>
              Sell<Text style={{ color: C.accent }}>Sathi</Text>
            </Text>
            <View style={s.locationRow}>
              <Text style={s.locationIcon}>📍</Text>
              <Text style={s.locationText}>
                Bengaluru <Text style={{ color: C.accent }}>560001 ▾</Text>
              </Text>
            </View>
          </View>
        </View>
        <View style={s.headerIcons}>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn}>
            <Text style={{ fontSize: 16 }}>🛒</Text>
            <View style={s.cartBadge}>
              <Text style={s.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Row 2: Search */}
      <View style={s.searchBar}>
        <Text style={{ fontSize: 15, color: C.textMuted, marginRight: 8 }}>
          🔍
        </Text>
        <TextInput
          placeholder="Search products, brands..."
          placeholderTextColor={C.textMuted}
          style={s.searchInput}
          selectionColor={C.accent}
        />
        <View style={s.searchDivider} />
        <TouchableOpacity style={s.searchMic}>
          <Text style={{ fontSize: 14 }}>🎤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── B. Banner Carousel ───────────────────────────────────────────────────────
function BannerCarousel() {
  const [active, setActive] = useState(0);
  const [h, m, sec] = useCountdown();
  const scrollRef = useRef(null);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (W - 32), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={s.bannerWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 32));
          setActive(idx);
        }}
      >
        {BANNERS.map((b, i) => (
          <View key={b.id} style={[s.bannerCard, { width: W - 32 }]}>
            {/* gradient bg */}
            <View style={[s.bannerGradBg, { backgroundColor: b.colors[0] }]} />
            <View style={[s.bannerGradBg2, { backgroundColor: b.colors[1] }]} />

            <View style={s.bannerInner}>
              <View style={{ flex: 1 }}>
                <View style={s.bannerBadge}>
                  <Text style={s.bannerBadgeText}>{b.badge}</Text>
                </View>
                <Text style={s.bannerTitle}>{b.title}</Text>
                <Text style={s.bannerSub}>{b.sub}</Text>
                {/* Countdown only on first banner */}
                {i === 0 && (
                  <View style={s.countdown}>
                    {[h, m, sec].map((u, idx) => (
                      <React.Fragment key={idx}>
                        <View style={s.countBox}>
                          <Text style={s.countNum}>{u}</Text>
                        </View>
                        {idx < 2 && <Text style={s.countSep}>:</Text>}
                      </React.Fragment>
                    ))}
                  </View>
                )}
              </View>
              <View style={s.bannerRight}>
                <Text style={s.bannerEmoji}>{b.emoji}</Text>
                <TouchableOpacity style={s.shopNowBtn}>
                  <Text style={s.shopNowText}>SHOP{"\n"}NOW</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      {/* Dots */}
      <View style={s.dots}>
        {BANNERS.map((_, i) => (
          <View key={i} style={[s.dot, i === active && s.dotActive]} />
        ))}
      </View>
    </View>
  );
}

// ─── C. Category Circles ─────────────────────────────────────────────────────
function CategoryCircles() {
  const [active, setActive] = useState(0);
  return (
    <View style={s.catSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Shop by Category</Text>
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catList}
        renderItem={({ item, index }) => {
          const on = index === active;
          return (
            <ScalePress onPress={() => setActive(index)}>
              <View style={s.catItem}>
                <View
                  style={[
                    s.catCircle,
                    { backgroundColor: item.bg },
                    on && s.catCircleActive,
                  ]}
                >
                  <Text style={s.catIcon}>{item.icon}</Text>
                </View>
                <Text style={[s.catName, on && { color: C.accent }]}>
                  {item.name}
                </Text>
              </View>
            </ScalePress>
          );
        }}
      />
    </View>
  );
}

// ─── D. Product Card ──────────────────────────────────────────────────────────
function ProductCard({ item }) {
  const cardW = (W - 44) / 2;
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <ScalePress onPress={() => {}}>
      <View style={[s.prodCard, { width: cardW }]}>
        {/* Discount badge */}
        <View style={s.discBadge}>
          <Text style={s.discBadgeText}>{item.discount}% off</Text>
        </View>

        {/* Wishlist */}
        <TouchableOpacity
          style={s.wishBtn}
          onPress={() => setWishlisted(!wishlisted)}
        >
          <Text
            style={{ fontSize: 16, color: wishlisted ? C.danger : C.textMuted }}
          >
            {wishlisted ? "❤" : "♡"}
          </Text>
        </TouchableOpacity>

        {/* Product Image — real Unsplash image */}
        <Image
          source={{ uri: item.image }}
          style={s.prodImage}
          resizeMode="cover"
        />

        {/* Info */}
        <View style={s.prodInfo}>
          <Text style={s.prodName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.prodPrice}>
              ₹{item.price.toLocaleString("en-IN")}
            </Text>
            <Text style={s.prodOrig}>
              ₹{item.original.toLocaleString("en-IN")}
            </Text>
          </View>

          {/* Rating */}
          <View style={s.ratingRow}>
            <View style={s.ratingBadge}>
              <Text style={s.ratingText}>{item.rating} ★</Text>
            </View>
            <Text style={s.reviewText}>({item.reviews.toLocaleString()})</Text>
          </View>

          {/* Free delivery */}
          {item.freeDelivery && (
            <Text style={s.freeDelText}>🚚 Free delivery</Text>
          )}

          {/* Add to cart */}
          <TouchableOpacity style={s.addCartBtn}>
            <Text style={s.addCartText}>ADD TO CART</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScalePress>
  );
}

// ─── E. New Arrivals ──────────────────────────────────────────────────────────
function NewArrivals() {
  return (
    <View style={s.naSection}>
      <View style={s.sectionHeader}>
        <View>
          <Text style={s.sectionTitle}>New Arrivals</Text>
          <Text style={s.sectionTag}>✨ JUST DROPPED</Text>
        </View>
        <TouchableOpacity>
          <Text style={s.viewAll}>VIEW ALL →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        horizontal
        data={NEW_ARRIVALS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.naList}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.naCard}>
            {/* Tag */}
            <View
              style={[
                s.naTag,
                {
                  backgroundColor:
                    item.tag === "HOT"
                      ? C.danger
                      : item.tag === "TOP"
                        ? C.badge
                        : C.success,
                },
              ]}
            >
              <Text style={s.naTagText}>{item.tag}</Text>
            </View>

            {/* Image */}
            <Image
              source={{ uri: item.image }}
              style={s.naImage}
              resizeMode="cover"
            />

            <Text style={s.naName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={s.naPrice}>₹{item.price.toLocaleString("en-IN")}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ─── F. Promo Strip ───────────────────────────────────────────────────────────
function PromoStrip() {
  return (
    <View style={s.promoStrip}>
      {[
        { icon: "🚚", text: "Free Delivery\nabove ₹499" },
        { icon: "↩", text: "Easy Returns\n7 days" },
        { icon: "🔒", text: "Secure\nPayments" },
        { icon: "✅", text: "100% Genuine\nProducts" },
      ].map((item, i) => (
        <View key={i} style={s.promoItem}>
          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
          <Text style={s.promoText}>{item.text}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <SafeAreaView style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Header />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <BannerCarousel />
        <PromoStrip />
        <CategoryCircles />

        {/* Trending Products */}
        <View style={s.trendSection}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={s.sectionTitle}>Trending Products</Text>
              <Text style={s.sectionTag}>🔥 HOT THIS WEEK</Text>
            </View>
            <TouchableOpacity>
              <Text style={s.viewAll}>VIEW ALL →</Text>
            </TouchableOpacity>
          </View>

          {/* 2 column product grid */}
          <View style={s.productGrid}>
            {PRODUCTS.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))}
          </View>
        </View>

        <NewArrivals />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // Header
  header: {
    backgroundColor: C.overlay,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBrd,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#1A2744",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.accent,
  },
  headerBrand: { fontSize: 20, fontWeight: "900", color: C.textPrimary },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 1 },
  locationIcon: { fontSize: 10, marginRight: 2 },
  locationText: { fontSize: 11, color: C.textSec },
  headerIcons: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.cardBrd,
  },
  cartBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.badge,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: "#FFF", fontSize: 9, fontWeight: "700" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.cardBrd,
  },
  searchInput: {
    flex: 1,
    color: C.textPrimary,
    fontSize: 13,
    paddingVertical: 4,
  },
  searchDivider: {
    width: 1,
    height: 20,
    backgroundColor: C.cardBrd,
    marginHorizontal: 8,
  },
  searchMic: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.surfaceBrd,
    alignItems: "center",
    justifyContent: "center",
  },

  // Banner
  bannerWrapper: { paddingHorizontal: 16, marginTop: 14 },
  bannerCard: {
    borderRadius: 18,
    overflow: "hidden",
    minHeight: 165,
    padding: 18,
  },
  bannerGradBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: "50%",
    bottom: 0,
    opacity: 0.9,
  },
  bannerGradBg2: {
    position: "absolute",
    top: 0,
    left: "30%",
    right: 0,
    bottom: 0,
    opacity: 0.7,
  },
  bannerInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  bannerBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  bannerTitle: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 26,
    marginBottom: 4,
  },
  bannerSub: { color: "rgba(255,255,255,0.8)", fontSize: 11, marginBottom: 10 },
  bannerRight: { alignItems: "center", gap: 10 },
  bannerEmoji: { fontSize: 44 },
  shopNowBtn: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: "center",
  },
  shopNowText: {
    color: C.bg,
    fontWeight: "900",
    fontSize: 11,
    textAlign: "center",
  },
  countdown: { flexDirection: "row", alignItems: "center", gap: 4 },
  countBox: {
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  countNum: { color: "#FFF", fontSize: 13, fontWeight: "800" },
  countSep: { color: "#FFF", fontSize: 14, fontWeight: "800" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.surfaceBrd },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
  },

  // Promo strip
  promoStrip: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.cardBrd,
  },
  promoItem: { flex: 1, alignItems: "center", gap: 4 },
  promoText: {
    color: C.textSec,
    fontSize: 9,
    textAlign: "center",
    lineHeight: 13,
  },

  // Categories
  catSection: { marginTop: 20 },
  catList: { paddingHorizontal: 16, gap: 16 },
  catItem: { alignItems: "center", gap: 6 },
  catCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  catCircleActive: { borderColor: C.accent },
  catIcon: { fontSize: 24 },
  catName: {
    color: C.textSec,
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sectionTitle: { color: C.textPrimary, fontSize: 16, fontWeight: "800" },
  sectionTag: {
    color: C.accent,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  viewAll: { color: C.accent, fontSize: 12, fontWeight: "700", marginTop: 4 },

  // Trending products
  trendSection: { paddingHorizontal: 16, marginTop: 22 },
  productGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  // Product card
  prodCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBrd,
    marginBottom: 0,
  },
  discBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: C.danger,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },
  wishBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  prodImage: { width: "100%", height: 150 },
  prodInfo: { padding: 10 },
  prodName: {
    color: C.textPrimary,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  prodPrice: { color: C.textPrimary, fontSize: 14, fontWeight: "900" },
  prodOrig: {
    color: C.textMuted,
    fontSize: 11,
    textDecorationLine: "line-through",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  ratingBadge: {
    backgroundColor: C.success,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  reviewText: { color: C.textMuted, fontSize: 10 },
  freeDelText: {
    color: C.success,
    fontSize: 10,
    fontWeight: "600",
    marginBottom: 8,
  },
  addCartBtn: {
    backgroundColor: "rgba(0,229,255,0.1)",
    borderRadius: 6,
    paddingVertical: 7,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.accent,
    marginTop: 4,
  },
  addCartText: { color: C.accent, fontSize: 11, fontWeight: "800" },

  // New arrivals
  naSection: { paddingHorizontal: 16, marginTop: 24 },
  naList: { gap: 12, paddingRight: 4 },
  naCard: {
    width: 130,
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBrd,
  },
  naTag: {
    paddingVertical: 3,
    alignItems: "center",
  },
  naTagText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  naImage: { width: "100%", height: 110, resizeMode: "cover" },
  naName: {
    color: C.textPrimary,
    fontSize: 11,
    fontWeight: "600",
    padding: 8,
    paddingBottom: 2,
  },
  naPrice: {
    color: C.accent,
    fontSize: 12,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
});
