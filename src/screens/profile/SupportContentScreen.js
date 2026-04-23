import React from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { POLICIES } from '../../data/supportContent';

const SupportContentScreen = ({ navigation, route }) => {
    const { title } = route.params;
    const { colors, isDark } = useTheme();
    
    const policy = POLICIES[title];

    if (!policy) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.textPrimary }}>Content not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20 }}>
                    <Text style={{ color: colors.primary }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={[styles.dateBadge, { backgroundColor: colors.primary + '15' }]}>
                            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                            <Text style={[styles.dateText, { color: colors.primary }]}>Effective: {policy.effectiveDate}</Text>
                        </View>
                        <Text style={[styles.intro, { color: colors.textSecondary }]}>{policy.intro}</Text>
                    </View>

                    {policy.sections.map((section, index) => (
                        <View key={index} style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                            {section.content && (
                                <Text style={[styles.sectionText, { color: colors.textSecondary }]}>
                                    {Array.isArray(section.content) ? section.content.join('\n\n') : section.content}
                                </Text>
                            )}
                            {section.bulletPoints && (
                                <View style={styles.bullets}>
                                    {section.bulletPoints.map((bullet, idx) => (
                                        <View key={idx} style={styles.bulletRow}>
                                            <View style={[styles.bulletDot, { backgroundColor: colors.accent }]} />
                                            <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{bullet}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    ))}

                    <View style={styles.footer}>
                        <Ionicons name="shield-checkmark" size={40} color={colors.success + '80'} />
                        <Text style={[styles.footerText, { color: colors.textMuted }]}>
                            Your privacy and security are our top priorities at GoodKart.
                        </Text>
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
    title: { fontSize: 20, fontWeight: '800', flex: 1, textAlign: 'center' },

    scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
    infoCard: { padding: 20, borderRadius: 20, borderWidth: 1, marginBottom: 24, gap: 12 },
    dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
    dateText: { fontSize: 12, fontWeight: '700' },
    intro: { fontSize: 15, lineHeight: 22, fontWeight: '500' },

    section: { marginBottom: 28 },
    sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 },
    sectionText: { fontSize: 14, lineHeight: 22 },
    
    bullets: { marginTop: 8, gap: 10 },
    bulletRow: { flexDirection: 'row', gap: 12 },
    bulletDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
    bulletText: { flex: 1, fontSize: 14, lineHeight: 22 },

    footer: { alignItems: 'center', marginTop: 20, gap: 12, paddingBottom: 20 },
    footerText: { fontSize: 12, textAlign: 'center', maxWidth: '75%', fontStyle: 'italic' },
});

export default SupportContentScreen;
