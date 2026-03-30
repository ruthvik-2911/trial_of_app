import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CAROUSEL_DATA = [
  {
    id: '1',
    title: 'Premium Electronics',
    subtitle: 'Experience cutting-edge technology with our premium electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80', // Headphones
  },
  {
    id: '2',
    title: 'Autumn Fashion',
    subtitle: 'Step into the new season with our latest collection',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80', // Fashion
  },
];

const HeroCarousel = () => {
  const renderItem = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✨ Featured</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Shop Collection →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Explore Brands</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={CAROUSEL_DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        snapToAlignment="center"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 24,
  },
  carouselItem: {
    width: width - 32,
    height: 220,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    padding: 20,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#e0e7ff',
    fontSize: 10,
    fontWeight: '600',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    marginBottom: 16,
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  primaryButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  secondaryButtonText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default HeroCarousel;
