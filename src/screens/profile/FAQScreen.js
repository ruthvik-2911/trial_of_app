import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from '../../components/SafeLinearGradient';
import useTheme from '../../hooks/useTheme';
import { FAQ_DATA } from '../../data/supportContent';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const FAQRow = ({ q, a, list, ordered, colors, isDark }) => {
    const [expanded, setExpanded] = useState(false);

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity onPress={toggle} style={styles.faqHeader} activeOpacity={0.7}>
                <Text style={[styles.faqQuestion, { color: colors.textPrimary }]}>{q}</Text>
                <Ionicons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textMuted}
                />
            </TouchableOpacity>
            {expanded && (
                <View style={styles.faqBody}>
                    {a && <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{a}</Text>}
                    {list && (
                        <View style={styles.listContainer}>
                            {list.map((item, index) => (
                                <View key={index} style={styles.listItem}>
                                    <Text style={[styles.listBullet, { color: colors.accent }]}>
                                        {ordered ? `${index + 1}.` : '•'}
                                    </Text>
                                    <Text style={[styles.listText, { color: colors.textSecondary }]}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            )}
        </View>
    );
};

const FAQScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('customer');

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>Help & FAQ</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Tabs */}
                <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('customer')}
                        style={[styles.tab, activeTab === 'customer' && { backgroundColor: isDark ? colors.primary + '30' : '#E0F2FE' }]}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'customer' ? colors.primary : colors.textMuted }]}>
                            Customer
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('seller')}
                        style={[styles.tab, activeTab === 'seller' && { backgroundColor: isDark ? colors.primary + '30' : '#E0F2FE' }]}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'seller' ? colors.primary : colors.textMuted }]}>
                            Seller
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.introBox}>
                        <Ionicons name="help-circle" size={40} color={colors.accent} />
                        <Text style={[styles.introTitle, { color: colors.textPrimary }]}>How can we help?</Text>
                        <Text style={[styles.introSub, { color: colors.textMuted }]}>
                            Find answers to common questions about GoodKart
                        </Text>
                    </View>

                    {FAQ_DATA[activeTab].map((faq, index) => (
                        <FAQRow key={index} {...faq} colors={colors} isDark={isDark} />
                    ))}

                    <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                            Still have questions?
                        </Text>
                        <TouchableOpacity
                            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
                            onPress={() => navigation.navigate('ContactUs')}
                        >
                            <Text style={styles.contactBtnText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800' },

    tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, padding: 4, borderRadius: 12, borderWidth: 1 },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabText: { fontSize: 14, fontWeight: '700' },

    scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
    introBox: { alignItems: 'center', marginBottom: 24, gap: 4 },
    introTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    introSub: { fontSize: 14, textAlign: 'center', maxWidth: '80%' },

    faqItem: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 18 },
    faqQuestion: { flex: 1, fontSize: 15, fontWeight: '700', marginRight: 12 },
    faqBody: { paddingHorizontal: 16, paddingBottom: 18, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
    faqAnswer: { fontSize: 14, lineHeight: 22, marginTop: 8 },

    listContainer: { marginTop: 12, gap: 8 },
    listItem: { flexDirection: 'row', gap: 10 },
    listBullet: { fontSize: 14, fontWeight: '800' },
    listText: { flex: 1, fontSize: 14, lineHeight: 22 },

    footer: { marginTop: 20, padding: 24, borderRadius: 20, borderWidth: 1, alignItems: 'center', gap: 12 },
    footerText: { fontSize: 15, fontWeight: '600' },
    contactBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    contactBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
});

export default FAQScreen;
