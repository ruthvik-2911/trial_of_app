import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/SafeLinearGradient';
import useTheme from '../../hooks/useTheme';
import { WALLET_TRANSACTIONS } from '../../data/mockData';

const { width } = Dimensions.get('window');

const WalletScreen = ({ navigation }) => {
    const { colors, isDark, gradients } = useTheme();

    const renderTransaction = (item) => (
        <View key={item.id} style={[styles.transactionItem, { borderBottomColor: colors.divider }]}>
            <View style={[styles.iconBox, { backgroundColor: item.type === 'credit' ? colors.success + '15' : colors.error + '15' }]}>
                <Ionicons 
                    name={item.type === 'credit' ? 'arrow-down' : 'arrow-up'} 
                    size={20} 
                    color={item.type === 'credit' ? colors.success : colors.error} 
                />
            </View>
            <View style={styles.transactionInfo}>
                <Text style={[styles.transactionLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                <Text style={[styles.transactionDesc, { color: colors.textMuted }]}>{item.desc}</Text>
            </View>
            <View style={styles.transactionAmountBox}>
                <Text style={[
                    styles.transactionAmount, 
                    { color: item.type === 'credit' ? colors.success : colors.error }
                ]}>
                    {item.type === 'credit' ? '+' : '-'} ₹{item.amount}
                </Text>
                <Text style={[styles.transactionDate, { color: colors.textMuted }]}>{item.date}</Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <SafeAreaView edges={['top']} style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>GoodKart Wallet</Text>
                <View style={{ width: 40 }} />
            </SafeAreaView>

            <ScrollView 
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
            >
                {/* Balance Card */}
                <LinearGradient
                    colors={['#FFD700', '#B8860B', '#8B6508']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.balanceCard}
                >
                    <View style={styles.cardGlass} />
                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>CURRENT BALANCE</Text>
                            <Ionicons name="sparkles" size={20} color="rgba(255,255,255,0.8)" />
                        </View>
                        <Text style={styles.balanceAmount}>₹2,840.50</Text>
                        <View style={styles.cardFooter}>
                            <View>
                                <Text style={styles.cardSubTitle}>GoodKart Coins</Text>
                                <Text style={styles.cardValue}>1,420 GC</Text>
                            </View>
                            <TouchableOpacity style={styles.addMoneyBtn}>
                                <Text style={styles.addMoneyText}>Add Money</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Earned Today</Text>
                        <Text style={[styles.statValue, { color: colors.success }]}>+ ₹150</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>Month Saved</Text>
                        <Text style={[styles.statValue, { color: colors.accent }]}>₹1,240</Text>
                    </View>
                </View>

                {/* Referral Card */}
                <TouchableOpacity style={styles.referralCard}>
                    <LinearGradient
                        colors={[colors.primary, colors.accent]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.referralGradient}
                    >
                        <View style={styles.referralTextContainer}>
                            <Text style={styles.referralTitle}>Invite & Earn ₹500</Text>
                            <Text style={styles.referralSub}>Share GoodKart with your friends</Text>
                        </View>
                        <View style={styles.referralIconBox}>
                            <Ionicons name="gift" size={32} color="#FFF" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Transaction History */}
                <View style={styles.historySection}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
                    <View style={[styles.historyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {WALLET_TRANSACTIONS.map(renderTransaction)}
                        <TouchableOpacity style={styles.viewAllBtn}>
                            <Text style={[styles.viewAllText, { color: colors.accent }]}>View All Transactions</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
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
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    balanceCard: {
        width: '100%',
        height: 190,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 24,
    },
    cardGlass: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    cardContent: {
        padding: 24,
        flex: 1,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },
    balanceAmount: {
        color: '#FFF',
        fontSize: 36,
        fontWeight: '800',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    cardSubTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 11,
        fontWeight: '600',
    },
    cardValue: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
        marginTop: 2,
    },
    addMoneyBtn: {
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    addMoneyText: {
        color: '#B8860B',
        fontSize: 13,
        fontWeight: '700',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statBox: {
        flex: 1,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    referralCard: {
        marginBottom: 32,
    },
    referralGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 24,
        borderRadius: 24,
        justifyContent: 'space-between',
    },
    referralTextContainer: {
        flex: 1,
    },
    referralTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    referralSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    referralIconBox: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    historySection: {
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 16,
    },
    historyContainer: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 8,
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionLabel: {
        fontSize: 14,
        fontWeight: '700',
    },
    transactionDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    transactionAmountBox: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontSize: 14,
        fontWeight: '800',
    },
    transactionDate: {
        fontSize: 10,
        marginTop: 4,
    },
    viewAllBtn: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    viewAllText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

export default WalletScreen;
