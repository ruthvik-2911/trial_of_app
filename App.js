/**
 * GudKart – HomeScreen.js
 * Lumina Noir Design System · Dark E-commerce · React Native
 *
 * ── Logo setup ──────────────────────────────────────────────────────────────
 * 1. Copy your logo PNG into:   YourProject/assets/gudkart-logo.png
 * 2. The Image tag uses tintColor:'#00E5FF' to recolor it neon cyan.
 *    If you want the original blue colour instead, just remove the tintColor prop.
 *
 * ── Dependencies ────────────────────────────────────────────────────────────
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
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

// ─── Colour tokens ────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0E13',
  surface: '#111827',
  surfaceAlt: '#141C26',
  surfaceBrd: '#1E2D3D',
  accent: '#00E5FF',
  accentDim: '#00B8CC',
  accentGlow: 'rgba(0,229,255,0.18)',
  textPrimary: '#FFFFFF',
  textSec: '#94A3B8',
  textMuted: '#4B5563',
  badge: '#7C3AED',
  danger: '#FF4757',
  success: '#10B981',
  overlay: 'rgba(10,14,19,0.92)',
  cardBrd: 'rgba(255,255,255,0.06)',
};

const { width: W } = Dimensions.get('window');

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Visible in the top scroll row (first 5 + All)
const MAIN_CATS = [
  'All', 'Fashion (Men)', 'Fashion (Women)', 'Kids & Baby', 'Electronics', 'Home & Living',
];
// Hidden under "More"
const MORE_CATS = [
  'Handicrafts', 'Artworks', 'Beauty & Personal Care', 'Sports & Fitness',
  'Books & Stationery', 'Food & Beverages', 'Gifts & Customization',
  'Jewelry & Accessories', 'Fabrics & Tailoring', 'Local Sellers',
  'Services', 'Pet Supplies', 'Automotive & Accessories',
  'Travel & Utility', 'Sustainability & Eco', 'Others',
];
const SUB_FILTERS = ['Today\'s Deals', 'New Arrivals', 'Trending'];

const TRENDING = [
  { id: '1', name: 'Nova Smart Watch', price: 199, original: 249, discount: 20, placeholder: '1' },
  { id: '2', name: 'Apex Speed Pro', price: 145, original: null, discount: null, placeholder: '2' },
];

const NEW_ARRIVALS_SMALL = [
  { id: '4', name: 'Flux Runners', price: 120, emoji: '👟' },
  { id: '5', name: 'Urban Shell', price: 85, emoji: '🎒' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function ScalePress({ children, style, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
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

        {/* Hamburger + Logo grouped together — no gap */}
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.hamburger}>
            <View style={[styles.hLine, { width: 22 }]} />
            <View style={[styles.hLine, { width: 16 }]} />
            <View style={[styles.hLine, { width: 19 }]} />
          </TouchableOpacity>
          <View style={styles.logoWrapper}>
            {/* Crop to just the bag icon, hide the text part of the PNG */}
            <View style={styles.logoIconCrop}>
              <Image
                source={require('./assets/gudkart-logo.png')}
                style={styles.logoImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.logoText}>GudKart</Text>
          </View>
        </View>

        {/* Notification + Cart */}
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 16 }}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={{ fontSize: 16 }}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>2</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={{ color: C.textSec, fontSize: 15 }}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search premium tech..."
          placeholderTextColor={C.textSec}
          selectionColor={C.accent}
        />
      </View>
    </View>
  );
}

// ─── B. Category Tabs ─────────────────────────────────────────────────────────
function CategoryTabs() {
  const [active, setActive] = useState(0);
  const [activeSub, setActiveSub] = useState(-1);
  const [showMore, setShowMore] = useState(false);
  const allCats = [...MAIN_CATS];

  return (
    <View>
      {/* ── Row 1: Category chips + More button ── */}
      <View style={styles.tabsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={styles.tabsScroll} contentContainerStyle={styles.tabsContent}>
          {MAIN_CATS.map((cat, i) => {
            const on = i === active;
            return (
              <ScalePress key={cat} onPress={() => setActive(i)}>
                <View style={[styles.tab, on && styles.tabActive]}>
                  {on && <View style={styles.tabGlow} />}
                  <Text style={[styles.tabText, on && styles.tabTextActive]}>{cat}</Text>
                </View>
              </ScalePress>
            );
          })}
        </ScrollView>

        {/* More button */}
        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowMore(true)}>
          <Text style={styles.moreBtnText}>More </Text>
          <Text style={styles.moreBtnChevron}>▾</Text>
        </TouchableOpacity>
      </View>

      {/* ── Row 2: Sub-filters ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.subFilterScroll} contentContainerStyle={styles.subFilterContent}>
        {SUB_FILTERS.map((f, i) => {
          const on = i === activeSub;
          return (
            <TouchableOpacity key={f} style={[styles.subPill, on && styles.subPillActive]}
              onPress={() => setActiveSub(on ? -1 : i)}>
              <Text style={[styles.subPillText, on && styles.subPillTextActive]}>{f}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── More Categories Modal ── */}
      <Modal visible={showMore} transparent animationType="slide" onRequestClose={() => setShowMore(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowMore(false)} />
        <View style={styles.moreSheet}>
          <View style={styles.moreSheetHandle} />
          <Text style={styles.moreSheetTitle}>All Categories</Text>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moreGrid}>
            {MORE_CATS.map((cat) => (
              <TouchableOpacity key={cat} style={styles.moreCatItem}
                onPress={() => {
                  setActive(-1);
                  setShowMore(false);
                }}>
                <Text style={styles.moreCatText}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.moreCloseBtn} onPress={() => setShowMore(false)}>
            <Text style={styles.moreCloseBtnText}>Close ▴</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// ─── C. Hero Banner ───────────────────────────────────────────────────────────
function HeroCarousel() {
  const [h, m, s] = useCountdown();
  return (
    <View style={styles.heroWrapper}>
      <LinearGradient
        colors={['#1A40CC', '#5B21B6', '#7C3AED', '#0EA5E9']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
        <View style={styles.heroInner}>
          <View style={styles.heroLeft}>
            <View style={styles.flashBadge}>
              <Text style={styles.flashBadgeText}>FLASH DROP</Text>
            </View>
            <Text style={styles.heroTitle}>{'Next-Gen\nTech Deals'}</Text>
            <View style={styles.countdown}>
              {[h, m, s].map((u, i) => (
                <React.Fragment key={i}>
                  <View style={styles.countUnit}><Text style={styles.countNum}>{u}</Text></View>
                  {i < 2 && <Text style={styles.countSep}>:</Text>}
                </React.Fragment>
              ))}
            </View>
          </View>
          <ScalePress onPress={() => { }} style={styles.shopNowBtn}>
            <Text style={styles.shopNowText}>SHOP NOW</Text>
          </ScalePress>
        </View>
      </LinearGradient>
      <View style={styles.dots}>
        {[0, 1, 2].map(i => <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />)}
      </View>
    </View>
  );
}

// ─── D. Featured Product ──────────────────────────────────────────────────────
function FeaturedProduct() {
  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Arrival</Text>
        <Text style={styles.sectionTag}>LIMITED EDITION</Text>
      </View>
      <View style={styles.featuredCard}>
        <View style={styles.featuredGlowOrb} />
        <View style={styles.featuredImageArea}>
          <View style={styles.headphonesPlaceholder}>
            <View style={styles.hpArc} />
            <View style={styles.hpLeft} />
            <View style={styles.hpRight} />
          </View>
          <ScalePress onPress={() => { }} style={styles.boltFab}>
            <LinearGradient colors={[C.accent, C.accentDim]} style={styles.boltFabGrad}>
              <Text style={{ color: C.bg, fontSize: 16 }}>⚡</Text>
            </LinearGradient>
          </ScalePress>
        </View>
        <Text style={styles.featuredName}>Sony WH-1000XM5</Text>
        <View style={styles.featuredPriceRow}>
          <Text style={styles.featuredPrice}>$349</Text>
          <Text style={styles.featuredOrigPrice}>$449</Text>
        </View>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(n => <Text key={n} style={styles.star}>★</Text>)}
          <Text style={styles.ratingCount}> (1.2k)</Text>
        </View>
        <View style={styles.stockBadge}>
          <View style={styles.stockDot} />
          <Text style={styles.stockText}>In Stock</Text>
        </View>
        <Text style={styles.featuredDesc}>
          Experience industry-leading noise cancellation with the new V1 integrated processor.
        </Text>
        <ScalePress onPress={() => { }} style={{ marginTop: 14 }}>
          <LinearGradient colors={[C.accent, '#0284C7']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.addToCartBtn}>
            <Text style={styles.addToCartText}>ADD TO CART</Text>
          </LinearGradient>
        </ScalePress>
      </View>
    </View>
  );
}

// ─── E. Product Card ──────────────────────────────────────────────────────────
function ProductCard({ item }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, speed: 50 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start()}
    >
      <Animated.View style={[styles.productCard, { transform: [{ scale }] }]}>
        {item.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{item.discount}%</Text>
          </View>
        )}
        <View style={styles.productImgArea}>
          <Text style={styles.productPlaceholderNum}>{item.placeholder}</Text>
          <Text style={styles.productPlaceholderLabel}>SAFE FOR WORK</Text>
        </View>
        <TouchableOpacity style={styles.productCartFab}>
          <Text style={{ color: C.textPrimary, fontSize: 13 }}>🛒</Text>
        </TouchableOpacity>
        <Text style={styles.productName}>{item.name}</Text>
        <View style={styles.productPriceRow}>
          <Text style={styles.productPrice}>${item.price}</Text>
          {item.original && <Text style={styles.productOrig}>${item.original}</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function TrendingNow() {
  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <TouchableOpacity><Text style={styles.viewAll}>VIEW ALL</Text></TouchableOpacity>
      </View>
      <View style={styles.productRow}>
        {TRENDING.map(item => <ProductCard key={item.id} item={item} />)}
      </View>
    </View>
  );
}

function NewArrivals() {
  return (
    <View style={styles.sectionWrapper}>
      <Text style={styles.sectionTitle}>New Arrivals</Text>
      <View style={styles.newArrivalsGrid}>
        <View style={[styles.naCard, styles.naWide]}>
          <View style={styles.naImageArea}><View style={styles.retrocamPlaceholder} /></View>
          <View style={styles.naWideInfo}>
            <Text style={styles.naCategoryLabel}>TECH</Text>
            <Text style={styles.naName}>Retro Cam v2</Text>
          </View>
        </View>
        <View style={styles.naSmallCol}>
          {NEW_ARRIVALS_SMALL.map(item => (
            <View key={item.id} style={[styles.naCard, styles.naSmall]}>
              <View style={styles.naSmallImg}><Text style={{ fontSize: 22 }}>{item.emoji}</Text></View>
              <View>
                <Text style={styles.naName}>{item.name}</Text>
                <Text style={styles.naPrice}>${item.price}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function WomensCollection() {
  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Women's Collection</Text>
        <TouchableOpacity><Text style={styles.viewAll}>EXPLORE</Text></TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
        <View style={styles.womenCard}>
          <LinearGradient colors={['#1E293B', '#0F172A']} style={StyleSheet.absoluteFill} />
          <View style={styles.womenImgArea}><Text style={{ fontSize: 60 }}>👩</Text></View>
          <View style={styles.womenInfo}>
            <Text style={styles.womenSeason}>NEW SEASON</Text>
            <Text style={styles.womenTitle}>Cyber-Street Edit</Text>
            <ScalePress onPress={() => { }} style={styles.womenShopBtn}>
              <Text style={styles.womenShopText}>SHOP NOW</Text>
            </ScalePress>
          </View>
          <ScalePress onPress={() => { }} style={styles.boltFab2}>
            <LinearGradient colors={[C.accent, C.accentDim]} style={styles.boltFabGrad}>
              <Text style={{ color: C.bg, fontSize: 16 }}>⚡</Text>
            </LinearGradient>
          </ScalePress>
        </View>
        <View style={[styles.womenCard, { opacity: 0.7 }]}>
          <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={StyleSheet.absoluteFill} />
          <View style={styles.womenInfo2}>
            <Text style={[styles.womenSeason, { color: C.textMuted }]}>LUXURY</Text>
            <Text style={[styles.womenTitle, { color: C.bg }]}>Midnight…</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── F. Bottom Nav ────────────────────────────────────────────────────────────
const NAV = [
  { label: 'HOME', icon: '⌂' },
  { label: 'CATEGORIES', icon: '⊞' },
  { label: 'ORDERS', icon: '📋' },
  { label: 'CART', icon: '🛒' },
  { label: 'PROFILE', icon: '◯' },
];

function BottomNav({ active = 0, onPress }) {
  return (
    <View style={styles.bottomNav}>
      <View style={styles.navTopBorder} />
      {NAV.map((item, i) => {
        const on = i === active;
        return (
          <TouchableOpacity key={item.label} style={styles.navItem} onPress={() => onPress?.(i)}>
            {on && <View style={styles.navActiveGlow} />}
            <Text style={{ fontSize: 20, color: on ? C.accent : C.textSec }}>{item.icon}</Text>
            <Text style={[styles.navLabel, on && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [navIdx, setNavIdx] = useState(0);
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <Header />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}>
        <CategoryTabs />
        <HeroCarousel />
        <FeaturedProduct />
        <TrendingNow />
        <NewArrivals />
        <WomensCollection />
      </ScrollView>
      <BottomNav active={navIdx} onPress={setNavIdx} />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: 20, paddingBottom: 12,
    backgroundColor: C.overlay,
    borderBottomWidth: 1, borderBottomColor: C.cardBrd,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12, marginTop: 6,
  },
  // Hamburger + logo side-by-side, no gap between them
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  hamburger: { gap: 5, justifyContent: 'center' },
  hLine: { height: 2, backgroundColor: C.textPrimary, borderRadius: 2 },

  // ── Logo ──────────────────────────────────────────────────────────────────
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Clip the bottom text portion of the PNG, show only the bag icon
  logoIconCrop: {
    width: 36,
    height: 36,
    overflow: 'hidden',
    borderRadius: 6,
  },
  logoImage: {
    width: 36,
    height: 58,   // taller than container so text portion is hidden below
    marginTop: -2,
  },
  logoText: {
    fontSize: 21,
    fontWeight: '800',
    color: C.accent,
    letterSpacing: 0.5,
  },

  headerIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.cardBrd,
  },
  cartBadge: {
    position: 'absolute', top: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.badge,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceAlt,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: C.cardBrd, gap: 10,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 14, padding: 0 },

  // Tabs row (scroll + More button)
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  tabsScroll: { flex: 1 },
  tabsContent: { paddingLeft: 20, paddingRight: 8, gap: 10 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 30,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.cardBrd, overflow: 'hidden',
  },
  tabActive: { backgroundColor: 'rgba(0,229,255,0.12)', borderColor: C.accent },
  tabGlow: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,229,255,0.06)' },
  tabText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: C.accent },

  // More button
  moreBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8,
    marginRight: 12, marginLeft: 4,
    backgroundColor: C.surfaceAlt,
    borderRadius: 30, borderWidth: 1, borderColor: C.accent,
  },
  moreBtnText: { color: C.accent, fontSize: 12, fontWeight: '700' },
  moreBtnChevron: { color: C.accent, fontSize: 14 },

  // Sub-filter pills row
  subFilterScroll: { marginTop: 10 },
  subFilterContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 2 },
  subPill: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1, borderColor: C.cardBrd,
    backgroundColor: 'transparent',
  },
  subPillActive: { borderColor: C.accent, backgroundColor: 'rgba(0,229,255,0.10)' },
  subPillText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  subPillTextActive: { color: C.accent },

  // Modal backdrop
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // Bottom sheet
  moreSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingBottom: 30, maxHeight: '70%',
    borderTopWidth: 1, borderColor: C.cardBrd,
  },
  moreSheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: C.surfaceBrd, alignSelf: 'center', marginBottom: 16,
  },
  moreSheetTitle: {
    color: C.textPrimary, fontSize: 16, fontWeight: '800',
    paddingHorizontal: 20, marginBottom: 14,
  },
  moreGrid: {
    paddingHorizontal: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  moreCatItem: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1, borderColor: C.cardBrd,
    backgroundColor: C.surfaceAlt,
  },
  moreCatText: { color: C.textSec, fontSize: 12, fontWeight: '600' },
  moreCloseBtn: {
    marginTop: 16, alignSelf: 'center',
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: C.accent,
  },
  moreCloseBtnText: { color: C.accent, fontWeight: '700', fontSize: 13 },

  // Hero
  heroWrapper: { paddingHorizontal: 20, marginTop: 20 },
  heroCard: { borderRadius: 20, padding: 22, overflow: 'hidden', minHeight: 160 },
  heroCircle1: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40 },
  heroCircle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 60 },
  heroInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLeft: { flex: 1 },
  flashBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 30, paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  flashBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: '#FFF', fontSize: 26, fontWeight: '900', lineHeight: 30, marginBottom: 14 },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countUnit: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, minWidth: 32, alignItems: 'center' },
  countNum: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  countSep: { color: '#FFF', fontSize: 14, fontWeight: '800', marginTop: -3 },
  shopNowBtn: { backgroundColor: '#FFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginLeft: 14 },
  shopNowText: { color: C.bg, fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.surfaceBrd },
  dotActive: { width: 20, height: 6, borderRadius: 3, backgroundColor: C.accent },

  // Sections
  sectionWrapper: { paddingHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
  sectionTag: { color: C.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  viewAll: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },

  // Featured
  featuredCard: { backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.cardBrd, overflow: 'hidden' },
  featuredGlowOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,229,255,0.05)', top: -60, right: -60 },
  featuredImageArea: { alignItems: 'center', justifyContent: 'center', height: 180, marginBottom: 12 },
  headphonesPlaceholder: { width: 160, height: 140, alignItems: 'center', justifyContent: 'center' },
  hpArc: { width: 120, height: 60, borderTopLeftRadius: 60, borderTopRightRadius: 60, borderWidth: 12, borderColor: '#1E293B', borderBottomWidth: 0, position: 'absolute', top: 10 },
  hpLeft: { width: 28, height: 44, backgroundColor: '#1E293B', borderRadius: 10, position: 'absolute', bottom: 10, left: 14 },
  hpRight: { width: 28, height: 44, backgroundColor: '#1E293B', borderRadius: 10, position: 'absolute', bottom: 10, right: 14 },
  boltFab: { position: 'absolute', bottom: 0, right: 0, width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  boltFabGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  featuredName: { color: C.textPrimary, fontSize: 18, fontWeight: '800' },
  featuredPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  featuredPrice: { color: C.accent, fontSize: 22, fontWeight: '900' },
  featuredOrigPrice: { color: C.textSec, fontSize: 14, textDecorationLine: 'line-through' },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  star: { color: '#FBBF24', fontSize: 13 },
  ratingCount: { color: C.textSec, fontSize: 12 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  stockDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  stockText: { color: C.success, fontSize: 12, fontWeight: '600' },
  featuredDesc: { color: C.textSec, fontSize: 13, lineHeight: 20, marginTop: 12 },
  addToCartBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: C.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  addToCartText: { color: C.bg, fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },

  // Product cards
  productRow: { flexDirection: 'row', gap: 14 },
  productCard: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: C.cardBrd },
  discountBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: C.danger, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, zIndex: 2 },
  discountText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  productImgArea: { height: 130, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: C.surfaceAlt, marginBottom: 10 },
  productPlaceholderNum: { color: C.textSec, fontSize: 48, fontWeight: '900', opacity: 0.4 },
  productPlaceholderLabel: { color: C.textMuted, fontSize: 8, letterSpacing: 1 },
  productCartFab: { position: 'absolute', bottom: 50, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceBrd, alignItems: 'center', justifyContent: 'center' },
  productName: { color: C.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productPrice: { color: C.textPrimary, fontSize: 15, fontWeight: '900' },
  productOrig: { color: C.textSec, fontSize: 12, textDecorationLine: 'line-through' },

  // New Arrivals
  newArrivalsGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
  naCard: { backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: C.cardBrd },
  naWide: { flex: 1.3, minHeight: 200 },
  naSmallCol: { flex: 1, gap: 12 },
  naSmall: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, flex: 1 },
  naImageArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  retrocamPlaceholder: { width: '80%', height: 90, backgroundColor: '#94A3B8', borderRadius: 8, opacity: 0.3 },
  naWideInfo: { padding: 12, borderTopWidth: 1, borderTopColor: C.cardBrd },
  naCategoryLabel: { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  naName: { color: C.textPrimary, fontSize: 13, fontWeight: '700' },
  naPrice: { color: C.accent, fontSize: 13, fontWeight: '800', marginTop: 2 },
  naSmallImg: { width: 44, height: 44, borderRadius: 10, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },

  // Women's Collection
  womenCard: { width: W * 0.6, height: 240, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.cardBrd },
  womenImgArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  womenInfo: { padding: 14, borderTopWidth: 1, borderTopColor: C.cardBrd },
  womenInfo2: { position: 'absolute', bottom: 14, left: 14 },
  womenSeason: { color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, marginBottom: 4 },
  womenTitle: { color: C.textPrimary, fontSize: 16, fontWeight: '800', marginBottom: 8 },
  womenShopBtn: { alignSelf: 'flex-start', backgroundColor: C.textPrimary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  womenShopText: { color: C.bg, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  boltFab2: { position: 'absolute', bottom: 14, right: 14, width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },

  // Bottom Nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(10,14,19,0.97)',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  navTopBorder: { position: 'absolute', top: 0, left: 60, right: 60, height: 1.5, backgroundColor: C.accent, opacity: 0.3, borderRadius: 1 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navActiveGlow: { position: 'absolute', top: -6, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,229,255,0.18)' },
  navLabel: { color: C.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  navLabelActive: { color: C.accent },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <HomeScreen />
    </SafeAreaProvider>
  );
}