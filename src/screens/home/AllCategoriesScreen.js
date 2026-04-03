// ─── AllCategoriesScreen.js ────────────────────────────────────────────────
// Gudkart — Grid view of all categories

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useTheme from '../../hooks/useTheme';
import { CATEGORIES } from '../../data/mockData';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - 64) / COLUMN_COUNT;

const AllCategoriesScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();

    const renderCategory = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => navigation.navigate('CategoryScreen', { category: item.name })}
            activeOpacity={0.8}
        >
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15', borderColor: item.color + '40' }]}>
                <Ionicons name={item.icon} size={32} color={item.color} />
            </View>
            <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
            
            {/* Header */}
            <SafeAreaView edges={['top']} style={{ zIndex: 10 }}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity 
                            onPress={() => navigation.goBack()}
                            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                        >
                            <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                        <Text style={[styles.title, { color: colors.textPrimary }]}>All Categories</Text>
                    </View>
                    
                    {/* "Less" toggle as a button that goes back */}
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={[styles.lessBtn, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '30' }]}
                    >
                        <Text style={[styles.lessText, { color: colors.accent }]}>Less</Text>
                        <Ionicons name="chevron-up" size={14} color={colors.accent} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {/* Grid List */}
            <FlatList
                data={CATEGORIES}
                keyExtractor={(item) => item.id}
                numColumns={COLUMN_COUNT}
                renderItem={renderCategory}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={styles.columnWrapper}
            />

            {/* Decorative bottom gradient */}
            <LinearGradient
                colors={['transparent', colors.background]}
                style={styles.bottomBlur}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    lessBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    lessText: { fontSize: 13, fontWeight: '700' },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40,
    },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 24 },
    categoryCard: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        gap: 10,
    },
    iconContainer: {
        width: ITEM_WIDTH * 0.9,
        height: ITEM_WIDTH * 0.9,
        borderRadius: 24,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    bottomBlur: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
    },
});

export default AllCategoriesScreen;
