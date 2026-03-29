/**
 * SellSathi – app/(tabs)/home.jsx
 * Lumina Noir Design System · Dark theme
 *
 * Dependencies:
 *   npx expo install expo-linear-gradient react-native-safe-area-context
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  Dimensions,
  Animated,
  StatusBar,
  FlatList,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C } from '../../constants/colors';

const { width: W } = Dimensions.get('window');

// ─── Mock Data (replace with real API later) ──────────────────────────────────
const CATEGORIES = [
  { id: '1', label: 'All',        emoji: '🛍' },
  { id: '2', label: 'Fashion',    emoji: '👗' },
  { id: '3', label: 'Electronics',emoji: '📱' },
  { id: '4', label: 'Home',       emoji: '🏠' },
  { id: '5', label: 'Beauty',     emoji: '💄' },
  { id: '6', label: 'Sports',     emoji: '🏋' },
];

const MORE_CATS = [
  'Handicrafts', 'Artworks', 'Books & Stationery',
  'Food & Beverages', 'Gifts', 'Jewelry',
  'Fabrics', 'Pet Supplies', 'Automotive', 'Others',
];

const BANNERS = [
  { id: '1', title: 'Flash Sale\nLive Now!',   sub: 'Up to 70% off on fashion',    colors: ['#1A40CC', '#7C3AED'] },
  { id: '2', title: 'New Arrivals\nThis Week', sub: 'Fresh drops every Monday',     colors: ['#0F766E', '#0284C7'] },
  { id: '3', title: 'Electronics\nMegaDeal',   sub: 'Best prices on top brands',    colors: ['#7C3AED', '#DB2777'] },
];

const TRENDING = [
  { id: '1', name: 'Nova Smart Watch',  price: 1999,  original: 4999,  discount: 60, emoji: '⌚' },
  { id: '2', name: 'Apex Speed Shoes',  price: 1299,  original: 2999,  discount: 57, emoji: '👟' },
  { id: '3', name: 'Leather Handbag',   price: 899,   original: 1800,  discount: 50, emoji: '👜' },
  { id: '4', name: 'Cotton Kurta Set',  price: 549,   original: 1100,  discount: 50, emoji: '👕' },
];

const NEW_ARRIVALS = [
  { id: '5', name: 'Wireless Buds',    price: 1499, emoji: '🎧' },
  { id: '6', name: 'Silk Saree',       price: 2199, emoji: '🥻' },
  { id: '7', name: 'Gaming Mouse',     price: 799,  emoji: '🖱' },
  { id: '8', name: 'Yoga Mat Pro',     price: 599,  emoji: '🧘' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ScalePress({ children, style, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function useCountdown(init = 9912) {
  const [sec, setSec] = useState(init);
  useEffect(() => {
    const id = setInterval(() => setSec(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return [h, m, s].map(n => String(n).padStart(2, '0'));
}

// ─── A. Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {/* Logo */}
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={[C.accent, '#0284C7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.headerLogo}
          >
            <Text style={{ fontSize: 16 }}>🛍</Text>
          </LinearGradient>
          <Text style={styles.headerBrand}>
            Sell<Text style={{ color: C.accent }}>Sathi</Text>
          </Text>
        </View>

        {/* Icons */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(tabs)/cart')}
          >
            <Text style={{ fontSize: 16 }}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/product/listing')}
        activeOpacity={0.8}
      >
        <Text style={{ color: C.textSec, fontSize: 15, marginRight: 8 }}>⌕</Text>
        <Text style={styles.searchPlaceholder}>Search products, brands...</Text>
      </TouchableOpacity>

      {/* Delivery location */}
      <View style={styles.locationRow}>
        <Text style={styles.locationIcon}>📍</Text>
        <Text style={styles.locationText}>
          Deliver to <Text style={{ color: C.accent, fontWeight: '700' }}>Bengaluru 560001</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── B. Category Tabs ─────────────────────────────────────────────────────────
function CategoryTabs() {
  const [active, setActive]     = useState(0);
  const [showMore, setShowMore] = useState(false);

  return (
    <View>
      <View style={styles.tabsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {CATEGORIES.map((cat, i) => {
            const on = i === active;
            return (
              <ScalePress key={cat.id} onPress={() => setActive(i)}>
                <View style={[styles.catTab, on && styles.catTabActive]}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, on && styles.catLabelActive]}>
                    {cat.label}
                  </Text>
                </View>
              </ScalePress>
            );
          })}
        </ScrollView>

        {/* More button */}
        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setShowMore(true)}
        >
          <Text style={styles.moreBtnText}>More ▾</Text>
        </TouchableOpacity>
      </View>

      {/* More categories bottom sheet */}
      <Modal
        visible={showMore}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMore(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowMore(false)}
        />
        <View style={styles.moreSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>All Categories</Text>
          <View style={styles.moreGrid}>
            {MORE_CATS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.moreCatItem}
                onPress={() => setShowMore(false)}
              >
                <Text style={styles.moreCatText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.sheetCloseBtn}
            onPress={() => setShowMore(false)}
          >
            <Text style={styles.sheetCloseBtnText}>Close ▴</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── C. Hero Banner Carousel ──────────────────────────────────────────────────
function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [h, m, s] = useCountdown();
  const scrollRef = useRef(null);

  // Auto scroll every 3 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % BANNERS.length;
        scrollRef.current?.scrollTo({ x: next * (W - 32), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={styles.heroWrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (W - 32));
          setActive(idx);
        }}
      >
        {BANNERS.map((b) => (
          <LinearGradient
            key={b.id}
            colors={b.colors}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroCircle1} />
            <View style={styles.heroCircle2} />
            <View style={styles.heroInner}>
              <View style={styles.heroLeft}>
                <View style={styles.flashBadge}>
                  <Text style={styles.flashBadgeText}>FLASH SALE</Text>
                </View>
                <Text style={styles.heroTitle}>{b.title}</Text>
                <Text style={styles.heroSub}>{b.sub}</Text>
                {/* Countdown */}
                <View style={styles.countdown}>
                  {[h, m, s].map((u, i) => (
                    <React.Fragment key={i}>
                      <View style={styles.countUnit}>
                        <Text style={styles.countNum}>{u}</Text>
                      </View>
                      {i < 2 && <Text style={styles.countSep}>:</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </View>
              <ScalePress
                onPress={() => router.push('/product/listing')}
                style={styles.shopNowBtn}
              >
                <Text style={styles.shopNowText}>SHOP{'\n'}NOW</Text>
              </ScalePress>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dots}>
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === active && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── D. Section Header ────────────────────────────────────────────────────────
function SectionHeader({ title, tag, onViewAll }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {tag && <Text style={styles.sectionTag}>{tag}</Text>}
      </View>
      {onViewAll && (
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>VIEW ALL →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── E. Product Card ──────────────────────────────────────────────────────────
function ProductCard({ item, width }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() =>
        Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start()
      }
      onPressOut={() =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()
      }
      onPress={() => router.push(`/product/${item.id}`)}
    >
      <Animated.View style={[styles.productCard, { width }, { transform: [{ scale }] }]}>
        {/* Discount badge */}
        {item.discount && (
          <View style={styles.discBadge}>
            <Text style={styles.discBadgeText}>-{item.discount}%</Text>
          </View>
        )}

        {/* Product image area */}
        <View style={styles.productImgArea}>
          <Text style={styles.productEmoji}>{item.emoji}</Text>
        </View>

        {/* Add to cart fab */}
        <TouchableOpacity style={styles.cartFab}>
          <Text style={{ fontSize: 13 }}>🛒</Text>
        </TouchableOpacity>

        {/* Info */}
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>₹{item.price.toLocaleString()}</Text>
          {item.original && (
            <Text style={styles.productOrig}>₹{item.original.toLocaleString()}</Text>
          )}
        </View>
        <View style={styles.starsRow}>
          <Text style={styles.stars}>★★★★</Text>
          <Text style={styles.ratingCount}> (120+)</Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── F. Trending Section ──────────────────────────────────────────────────────
function TrendingSection() {
  const cardW = (W - 48) / 2;
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Trending Now"
        tag="HOT THIS WEEK"
        onViewAll={() => router.push('/product/listing')}
      />
      <View style={styles.productGrid}>
        {TRENDING.map(item => (
          <ProductCard key={item.id} item={item} width={cardW} />
        ))}
      </View>
    </View>
  );
}

// ─── G. New Arrivals Section ──────────────────────────────────────────────────
function NewArrivalsSection() {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="New Arrivals"
        tag="JUST DROPPED"
        onViewAll={() => router.push('/product/listing')}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingRight: 20 }}
      >
        {NEW_ARRIVALS.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.newArrivalCard}
            onPress={() => router.push(`/product/${item.id}`)}
          >
            <View style={styles.newArrivalImg}>
              <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            </View>
            <Text style={styles.newArrivalName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.newArrivalPrice}>₹{item.price.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── H. Promo Banner Strip ────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#1E293B', '#0F172A']}
        style={styles.promoBanner}
      >
        <View style={styles.promoBannerLeft}>
          <Text style={styles.promoTag}>FREE DELIVERY</Text>
          <Text style={styles.promoTitle}>On orders above ₹499</Text>
          <Text style={styles.promoSub}>Use code: FREEDEL</Text>
        </View>
        <Text style={{ fontSize: 48 }}>🚚</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Root HomeScreen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Header />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <CategoryTabs />
        <HeroCarousel />
        <TrendingSection />
        <NewArrivalsSection />
        <PromoBanner />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: C.overlay,
    borderBottomWidth: 1, borderBottomColor: C.cardBrd,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10, marginTop: 6,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerLogo:  { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerBrand: { fontSize: 20, fontWeight: '900', color: C.textPrimary },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.cardBrd,
  },
  cartBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.badge,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: C.cardBrd, marginBottom: 8,
  },
  searchPlaceholder: { color: C.textMuted, fontSize: 14 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationIcon: { fontSize: 12 },
  locationText: { fontSize: 12, color: C.textSec },

  // Category tabs
  tabsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12,
  },
  tabsContent: { paddingLeft: 16, gap: 10 },
  catTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.cardBrd,
  },
  catTabActive: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderColor: C.accent,
  },
  catEmoji: { fontSize: 14 },
  catLabel: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  catLabelActive: { color: C.accent },

  // More button
  moreBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 12, marginLeft: 4,
    backgroundColor: C.surfaceAlt,
    borderRadius: 30, borderWidth: 1, borderColor: C.accent,
  },
  moreBtnText: { color: C.accent, fontSize: 12, fontWeight: '700' },

  // More modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  moreSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 30,
    borderTopWidth: 1, borderColor: C.cardBrd,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.surfaceBrd, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    color: C.textPrimary, fontSize: 16, fontWeight: '800',
    paddingHorizontal: 20, marginBottom: 14,
  },
  moreGrid: {
    paddingHorizontal: 20, flexDirection: 'row',
    flexWrap: 'wrap', gap: 10,
  },
  moreCatItem: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: C.cardBrd,
    backgroundColor: C.surfaceAlt,
  },
  moreCatText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  sheetCloseBtn: {
    marginTop: 16, alignSelf: 'center',
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: C.accent,
  },
  sheetCloseBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  // Hero carousel
  heroWrapper: { paddingHorizontal: 16, marginTop: 4 },
  heroCard: {
    width: W - 32, borderRadius: 20,
    padding: 20, overflow: 'hidden', minHeight: 160,
    marginRight: 0,
  },
  heroCircle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  heroCircle2: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 60,
  },
  heroInner: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: { flex: 1 },
  flashBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30, paddingHorizontal: 10, paddingVertical: 3,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  flashBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: {
    color: '#FFF', fontSize: 22, fontWeight: '900',
    lineHeight: 26, marginBottom: 4,
  },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 12 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countUnit: {
    backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    minWidth: 32, alignItems: 'center',
  },
  countNum:  { color: '#FFF', fontSize: 14, fontWeight: '800' },
  countSep:  { color: '#FFF', fontSize: 14, fontWeight: '800' },
  shopNowBtn: {
    backgroundColor: '#FFF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, marginLeft: 14,
    alignItems: 'center',
  },
  shopNowText: { color: C.bg, fontWeight: '900', fontSize: 12, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.surfaceBrd },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: C.accent },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 14,
  },
  sectionTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
  sectionTag:   { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  viewAll:      { color: C.accent, fontSize: 12, fontWeight: '700' },

  // Product card
  productGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  productCard: {
    backgroundColor: C.surface, borderRadius: 16,
    padding: 12, borderWidth: 1, borderColor: C.cardBrd,
  },
  discBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: C.danger, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3, zIndex: 2,
  },
  discBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  productImgArea: {
    height: 110, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, backgroundColor: C.surfaceAlt, marginBottom: 10,
  },
  productEmoji: { fontSize: 42 },
  cartFab: {
    position: 'absolute', bottom: 54, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.surfaceBrd,
    alignItems: 'center', justifyContent: 'center',
  },
  productName:  { color: C.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  priceRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: { color: C.accent, fontSize: 14, fontWeight: '900' },
  productOrig:  { color: C.textSec, fontSize: 11, textDecorationLine: 'line-through' },
  starsRow:     { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  stars:        { color: '#FBBF24', fontSize: 11 },
  ratingCount:  { color: C.textSec, fontSize: 11 },

  // New arrivals
  newArrivalCard: {
    width: 120, backgroundColor: C.surface,
    borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: C.cardBrd,
    alignItems: 'center',
  },
  newArrivalImg: {
    width: 70, height: 70, borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  newArrivalName:  { color: C.textPrimary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  newArrivalPrice: { color: C.accent, fontSize: 13, fontWeight: '800', marginTop: 4 },

  // Promo banner
  promoBanner: {
    borderRadius: 16, padding: 20,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1, borderColor: C.cardBrd,
  },
  promoBannerLeft: { flex: 1 },
  promoTag:   { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  promoTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 2 },
  promoSub:   { color: C.textSec, fontSize: 12 },
});