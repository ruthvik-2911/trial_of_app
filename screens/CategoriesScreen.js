import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, TextInput, FlatList, Image } from 'react-native';

const ALL_CATEGORIES = [
  { id: '1', name: 'Fashion', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&q=80' },
  { id: '2', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&q=80' },
  { id: '3', name: 'Home', image: 'https://images.unsplash.com/photo-1583847268964-b28ba8f51f92?w=200&q=80' },
  { id: '4', name: 'Beauty', image: 'https://images.unsplash.com/photo-1596462502278-27bf85033e5a?w=200&q=80' },
  { id: '5', name: 'Books', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&q=80' },
  { id: '6', name: 'Grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80' },
  { id: '7', name: 'Toys', image: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=200&q=80' },
  { id: '8', name: 'Sports', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&q=80' },
  { id: '9', name: 'Automotive', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&q=80' },
];

const CategoriesScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const filteredCategories = ALL_CATEGORIES.filter(cat => 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Categories</Text>
        <View style={{width: 60}} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category Grid */}
      <FlatList
        data={filteredCategories}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.categoryCard}>
            <Image source={{ uri: item.image }} style={styles.categoryImage} />
            <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 16,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryImage: {
    width: '100%',
    height: 100,
    resizeMode: 'cover',
  },
  categoryName: {
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CategoriesScreen;
