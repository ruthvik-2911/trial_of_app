import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, StatusBar, 
  Platform, SafeAreaView, TextInput, TouchableOpacity, Image, Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: '1', name: 'Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80' },
  { id: '2', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80' },
  { id: '3', name: 'Home', image: 'https://images.unsplash.com/photo-1583847268964-b28ba8f51f92?w=200&q=80' },
  { id: '4', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=200&q=80' },
  { id: '5', name: 'Books', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&q=80' },
  { id: 'other', name: 'Other', image: 'https://images.unsplash.com/photo-1505330622279-bf7d7fc918f4?w=200&q=80' },
];

const TRENDING_PRODUCTS = [
  {
    id: 'p1',
    name: 'Nike Running Shoes',
    price: '₹1,299',
    original: '₹2,999',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
  },
  {
    id: 'p2',
    name: 'Leather Handbag',
    price: '₹999',
    original: '₹2,200',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80',
  },
  {
    id: 'p3',
    name: 'Smart Watch Pro',
    price: '₹2,499',
    original: '₹5,999',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  },
  {
    id: 'p4',
    name: 'Wireless Earbuds',
    price: '₹1,499',
    original: '₹3,499',
    image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400&q=80',
  },
];

const HomeScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* HEADER SECTION (Matches Layout Structure exactly, but Dark Theme) */}
      <View style={styles.headerArea}>
        {/* Top Right Logo text "GudKart" */}
        <View style={styles.topRightLogoContainer}>
          <Image 
             source={{ uri: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&q=80' }} 
             style={{ width: 18, height: 18, borderRadius: 4, marginRight: 6 }} 
          />
          <Text style={styles.logoText}>GudKart</Text>
        </View>

        <View style={styles.headerMainRow}>
          {/* Location Info (Left) */}
          <View style={styles.locationContainer}>
             <Text style={styles.pinIcon}>📍</Text>
             <View>
                <Text style={styles.deliverText}>Deliver to</Text>
                <Text style={styles.locationCity} numberOfLines={1}>Bengaluru 560001</Text>
             </View>
          </View>

          {/* Search Box (Middle, styling like the white box in screenshot but integrated nicely) */}
          <View style={styles.searchBox}>
             <Text style={styles.searchIcon}>🔍</Text>
             <TextInput
               style={styles.searchInput}
               placeholder="Search products..."
               placeholderTextColor="#94a3b8"
             />
          </View>

          {/* Cart Icon (Right) */}
          <TouchableOpacity style={styles.cartIconWrapper}>
            <Text style={styles.cartIconText}>🛒</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollArea}>
        
        {/* SALE BANNER (Like the highlighted card, but #1e293b dark card) */}
        <View style={styles.bannerContainer}>
          <View style={styles.bannerWrapper}>
             <View style={styles.bannerInfo}>
                 <Text style={styles.bannerTitle}>Sale is LIVE!</Text>
                 <Text style={styles.bannerSub}>Up to 70% off on fashion</Text>
                 <TouchableOpacity style={styles.shopNowBtn}>
                     <Text style={styles.shopNowText}>Shop Now</Text>
                 </TouchableOpacity>
             </View>
             <View style={styles.bannerImageWrapper}>
                {/* Real Image instead of drawing/emoji, exact height and width ensures it renders */}
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200&q=80' }} 
                  style={{ width: 80, height: 100, borderRadius: 8, resizeMode: 'cover' }} 
                />
             </View>
          </View>
          {/* Dots below banner */}
          <View style={styles.dotsContainer}>
             <View style={[styles.dot, styles.dotActive]} />
             <View style={styles.dot} />
             <View style={styles.dot} />
          </View>
        </View>

        {/* SHOP BY CATEGORY */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity 
                key={cat.id} 
                style={styles.categoryItem}
                onPress={() => {
                  if (cat.id === 'other') navigation.navigate('Categories');
                }}
              >
                <View style={styles.categoryCircle}>
                  {/* Fixed numeric dimensions ensure Unsplash images load 100% of the time */}
                  <Image source={{ uri: cat.image }} style={{ width: 66, height: 66, resizeMode: 'cover' }} />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* TRENDING PRODUCTS (2 column style) */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trending Products</Text>
          <View style={styles.productGrid}>
             {TRENDING_PRODUCTS.map((prod) => (
               <View key={prod.id} style={styles.productCard}>
                 <Image source={{ uri: prod.image }} style={styles.productImg} />
                 <View style={styles.productInfo}>
                   <Text style={styles.productName} numberOfLines={1}>{prod.name}</Text>
                   <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>{prod.price}</Text>
                      <Text style={styles.productOriginal}>{prod.original}</Text>
                   </View>
                 </View>
               </View>
             ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerArea: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
  },
  topRightLogoContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '32%',
  },
  pinIcon: {
    fontSize: 16,
    marginRight: 4,
    color: '#f8fafc',
  },
  deliverText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  locationCity: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    height: 38,
    paddingHorizontal: 10,
    marginHorizontal: 12,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#94a3b8',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
  },
  cartIconWrapper: {
    position: 'relative',
    padding: 4,
  },
  cartIconText: {
    fontSize: 22,
    color: '#f8fafc',
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: -2,
    backgroundColor: '#eab308',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scrollArea: {
    paddingBottom: 40,
  },
  bannerContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  bannerWrapper: {
    width: width - 32,
    height: 140,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  bannerInfo: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 12,
  },
  shopNowBtn: {
    backgroundColor: '#38bdf8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  shopNowText: {
    color: '#0f172a',
    fontWeight: 'bold',
    fontSize: 12,
  },
  bannerImageWrapper: {
    width: 110,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#38bdf8',
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  categoryName: {
    fontSize: 12,
    color: '#f8fafc',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 40) / 2,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  productImg: {
    width: '100%',
    height: 120,
    resizeMode: 'contain',
    backgroundColor: '#0f172a',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    color: '#f8fafc',
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#38bdf8',
    marginRight: 6,
  },
  productOriginal: {
    fontSize: 11,
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
});

export default HomeScreen;
