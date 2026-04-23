// ─── NotificationsScreen.js ──────────────────────────────────────────────────
// GoodKart — Expo Go compatible
//
// Features:
//   • Real-time updates via NotificationContext
//   • Standardized theme (Light/Dark)
//   • Premium card animations & pull-to-refresh
// ──────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    RefreshControl,
    StatusBar,
    Platform,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotifications } from '../../context/NotificationContext';
import useTheme from '../../hooks/useTheme';

const NotificationsScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();
    const { 
        notifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        clearAll, 
        getUnreadCount 
    } = useNotifications();
    
    const [refreshing, setRefreshing] = useState(false);
    const unreadCount = getUnreadCount();

    const onRefresh = () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1200);
    };

    const handleAction = (item) => {
        markAsRead(item.id);
        if (item.type === 'order') {
            navigation.navigate('Orders');
        } else if (item.action === 'Shop Now') {
            navigation.navigate('Main', { screen: 'Home' });
        } else {
            Alert.alert(item.title, item.message);
        }
    };

    const NotificationCard = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.card,
                { backgroundColor: colors.card, borderColor: item.isRead ? colors.border : colors.accent + '40' },
                !item.isRead && { borderLeftWidth: 4, borderLeftColor: colors.accent }
            ]}
            onPress={() => handleAction(item)}
            activeOpacity={0.8}
        >
            <View style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: (item.iconColor || colors.primary) + '20' }]}>
                    <Ionicons name={item.icon || 'notifications'} size={22} color={item.iconColor || colors.primary} />
                </View>
                
                <View style={styles.textDetails}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.title}
                        </Text>
                        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
                    </View>
                    <Text style={[styles.cardMessage, { color: colors.textSecondary }]} numberOfLines={2}>
                        {item.message}
                    </Text>
                    <Text style={[styles.cardTime, { color: colors.textMuted }]}>{item.timestamp}</Text>
                </View>

                <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => deleteNotification(item.id)}
                >
                    <Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor="transparent" translucent />
            
            {/* Header */}
            <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.headerTitleBox}>
                        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
                        {unreadCount > 0 && (
                            <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                                <Text style={[styles.badgeText, { color: colors.textInverse }]}>{unreadCount}</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity onPress={() => Alert.alert('Settings', 'Notification preferences coming soon.')}>
                        <Ionicons name="options-outline" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>

            {notifications.length > 0 ? (
                <View style={{ flex: 1 }}>
                    <View style={styles.actionBar}>
                        <TouchableOpacity style={styles.actionLink} onPress={markAllAsRead}>
                            <Ionicons name="checkmark-done" size={16} color={colors.accent} />
                            <Text style={[styles.actionText, { color: colors.accent }]}>Mark all read</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionLink} onPress={clearAll}>
                            <Ionicons name="trash-outline" size={16} color={colors.error || '#F87171'} />
                            <Text style={[styles.actionText, { color: colors.error || '#F87171' }]}>Clear all</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollList}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
                        }
                    >
                        {notifications.map((item) => (
                            <NotificationCard key={item.id} item={item} />
                        ))}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            ) : (
                <View style={styles.emptyBox}>
                    <View style={[styles.emptyIconCircle, { backgroundColor: colors.card }]}>
                        <Ionicons name="notifications-off-outline" size={60} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up!</Text>
                    <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                        No new notifications at the moment.
                    </Text>
                    <TouchableOpacity 
                        style={styles.shopBtn} 
                        onPress={() => navigation.navigate('Main', { screen: 'Home' })}
                    >
                        <LinearGradient colors={gradients.button} style={styles.shopGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.shopText}>Start Shopping</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: Platform.OS === 'android' ? 12 : 0,
        borderBottomWidth: 1,
    },
    backBtn: { padding: 4 },
    headerTitleBox: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
    badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
    badgeText: { fontSize: 12, fontWeight: '800' },

    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    actionLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    actionText: { fontSize: 13, fontWeight: '700' },

    scrollList: { paddingHorizontal: 16, paddingTop: 4 },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    cardContent: { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    textDetails: { flex: 1 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
    cardTitle: { fontSize: 15, fontWeight: '700' },
    unreadDot: { width: 6, height: 6, borderRadius: 3 },
    cardMessage: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
    cardTime: { fontSize: 11 },
    deleteBtn: { padding: 4 },

    emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    emptyIconCircle: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
    shopBtn: { width: '100%', borderRadius: 12, overflow: 'hidden' },
    shopGradient: { paddingVertical: 16, alignItems: 'center' },
    shopText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default NotificationsScreen;