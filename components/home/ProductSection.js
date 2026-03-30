import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import ProductCard from './ProductCard';

const ProductSection = ({ title, subtitle, data, category }) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {title.split(' ')[0]} <Text style={styles.titleAccent}>{title.split(' ').slice(1).join(' ')}</Text>
          </Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {/* Sub-header / Category Link */}
      {category && (
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>{category}</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all {category} →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Horizontal Product List */}
      <FlatList
        data={data}
        renderItem={({ item }) => <ProductCard product={item} />}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: 'bold',
  },
  titleAccent: {
    color: '#38bdf8',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  viewAllText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 16,
  },
});

export default ProductSection;
