import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const ProductCard = ({ product }) => {
  return (
    <TouchableOpacity style={styles.card}>
      {/* Product Image & Badges */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={styles.image} />
        
        {/* Top Right Actions (Wishlist/View) */}
        <View style={styles.actionColumn}>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>♡</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionIcon}>👁</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.categoryText}>{product.category}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        {/* Ratings placeholder */}
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>☆☆☆☆☆</Text>
          <Text style={styles.reviewsText}>No reviews yet</Text>
        </View>

        {/* Pricing & Cart Row */}
        <View style={styles.bottomRow}>
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.currentPrice}>₹{product.price}</Text>
              {product.originalPrice && (
                <Text style={styles.originalPrice}>₹{product.originalPrice}</Text>
              )}
            </View>
            {product.discount && (
               <View style={styles.discountBadge}>
                 <Text style={styles.discountText}>{product.discount}% OFF</Text>
               </View>
            )}
          </View>
          
          <TouchableOpacity style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  imageContainer: {
    width: '100%',
    height: 160,
    backgroundColor: '#0f172a',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  actionColumn: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  infoContainer: {
    padding: 12,
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    marginBottom: 6,
    height: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stars: {
    color: '#fbbf24',
    fontSize: 10,
    marginRight: 4,
  },
  reviewsText: {
    color: '#64748b',
    fontSize: 9,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  currentPrice: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 'bold',
  },
  originalPrice: {
    color: '#64748b',
    fontSize: 10,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  cartBtn: {
    backgroundColor: '#38bdf8',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartIcon: {
    color: '#0f172a',
    fontSize: 16,
  },
});

export default ProductCard;
