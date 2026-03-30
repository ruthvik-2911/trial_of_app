import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';

const CATEGORIES = [
  { id: '1', name: 'Fashion (Men)', image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=200&q=80' },
  { id: '2', name: 'Fashion (Women)', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80' },
  { id: '3', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80' },
  { id: '4', name: 'Home & Living', image: 'https://images.unsplash.com/photo-1583847268964-b28ba8f51f92?w=200&q=80' },
  { id: '5', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=200&q=80' },
  { id: '6', name: 'Sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80' },
];

const CategoryShowcase = () => {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryItem}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: cat.image }} style={styles.image} />
            </View>
            <Text style={styles.name} numberOfLines={2}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    width: 68,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e293b',
    borderWidth: 2,
    borderColor: '#38bdf8',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  name: {
    color: '#cbd5e1',
    fontSize: 10,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

export default CategoryShowcase;
