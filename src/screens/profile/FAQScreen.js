import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import useTheme from '../../hooks/useTheme';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const FAQ_DATA = {
    customer: [
        {
            q: 'What is GudKart?',
            a: 'GudKart is an online marketplace where home artists and creators can sell their handmade products, and customers can discover unique handcrafted items.',
        },
        {
            q: 'Are the products handmade?',
            a: 'Yes. Most products on GudKart are handmade or created by independent home artists and small creators.',
        },
        {
            q: 'How do I place an order?',
            a: '1. Browse products\n2. Add items to cart\n3. Proceed to checkout\n4. Enter delivery address\n5. Complete payment',
        },
        {
            q: 'How can I track my order?',
            a: 'Once your order is shipped, you will receive a tracking ID and can track your delivery from the "My Orders" section.',
        },
        {
            q: 'What payment methods are available?',
            a: 'We support:\n• UPI\n• Debit / Credit Cards\n• Net Banking\n• Cash on Delivery (if available)',
        },
        {
            q: 'How long will delivery take?',
            a: 'Delivery usually takes 3-7 business days, depending on your location and the seller\'s location.',
        },
        {
            q: 'Can I cancel my order?',
            a: 'Yes, orders can be cancelled before the seller ships the product.',
        },
        {
            q: 'What if the product arrives damaged?',
            a: 'Please contact support within 48 hours with photos, and we will assist with replacement or refund.',
        },
        {
            q: 'Can I return handmade products?',
            a: 'Return policies may vary depending on the seller and product category.',
        },
    ],
    seller: [
        {
            q: 'Who can sell on GudKart?',
            a: 'Anyone who creates handmade products, crafts, or artistic items from home can register as a seller.',
        },
        {
            q: 'How do I become a seller?',
            a: 'Click "Become a Seller", fill in your details, upload required verification documents, and wait for admin approval.',
        },
        {
            q: 'Is there any registration fee?',
            a: 'Currently, seller registration is free.',
        },
        {
            q: 'How do I list my products?',
            a: 'After approval:\n1. Login to Seller Dashboard\n2. Click Add Product\n3. Upload images\n4. Add description and price',
        },
        {
            q: 'How will I receive orders?',
            a: 'When a customer places an order, you will receive a notification in your seller dashboard.',
        },
        {
            q: 'How does shipping work?',
            a: 'Once you mark the item "Ready for Pickup", our logistics partner will handle shipping.',
        },
        {
            q: 'How do I receive payments?',
            a: 'Payments are transferred to your registered bank account after the order is delivered.',
        },
        {
            q: 'Can I manage my products?',
            a: 'Yes, sellers can:\n• Add products\n• Edit products\n• Update stock\n• View orders',
        },
    ],
};

const AccordionItem = ({ question, answer, isOpen, onToggle, colors }) => {
    return (
        <View style={[styles.accordionContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
                style={styles.accordionHeader} 
                onPress={onToggle} 
                activeOpacity={0.7}
            >
                <Text style={[styles.questionText, { color: colors.textPrimary }]}>{question}</Text>
                <Ionicons 
                    name={isOpen ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.accent} 
                />
            </TouchableOpacity>
            {isOpen && (
                <View style={[styles.accordionContent, { borderTopColor: colors.divider }]}>
                    <Text style={[styles.answerText, { color: colors.textSecondary }]}>{answer}</Text>
                </View>
            )}
        </View>
    );
};

const FAQScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('customer');
    const [openIndex, setOpenIndex] = useState(null);

    const toggleAccordion = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
            
            <SafeAreaView edges={['top']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: colors.card }]}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>FAQs</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <View style={styles.tabContainer}>
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        activeTab === 'customer' && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
                    ]}
                    onPress={() => { setActiveTab('customer'); setOpenIndex(null); }}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'customer' ? colors.accent : colors.textMuted }
                    ]}>Customer</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[
                        styles.tab, 
                        activeTab === 'seller' && { backgroundColor: colors.accent + '20', borderColor: colors.accent }
                    ]}
                    onPress={() => { setActiveTab('seller'); setOpenIndex(null); }}
                >
                    <Text style={[
                        styles.tabText, 
                        { color: activeTab === 'seller' ? colors.accent : colors.textMuted }
                    ]}>Seller</Text>
                </TouchableOpacity>
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>
                    {activeTab === 'customer' ? 'CUSTOMER FAQs' : 'SELLER FAQs'}
                </Text>
                
                {FAQ_DATA[activeTab].map((item, index) => (
                    <AccordionItem 
                        key={index}
                        question={item.q}
                        answer={item.a}
                        isOpen={openIndex === index}
                        onToggle={() => toggleAccordion(index)}
                        colors={colors}
                    />
                ))}

                <View style={[styles.footerInfo, { backgroundColor: colors.card + '50' }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                        GudKart Help Center - For support, visit our website or contact us through the app.
                    </Text>
                    <Text style={[styles.copyright, { color: colors.textMuted }]}>
                        © 2025 GudKart. All rights reserved.
                    </Text>
                </View>
                
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 16, paddingBottom: 12 },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    sectionHeading: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 16,
        paddingLeft: 4,
    },
    accordionContainer: {
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: 'hidden',
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    questionText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 10,
        lineHeight: 20,
    },
    accordionContent: {
        padding: 16,
        borderTopWidth: 1,
    },
    answerText: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '400',
    },
    footerInfo: {
        marginTop: 24,
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        gap: 12,
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
        fontWeight: '500',
    },
    copyright: {
        fontSize: 11,
        fontWeight: '400',
    },
});

export default FAQScreen;
