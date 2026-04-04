import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

const { width } = Dimensions.get('window');

const CONTENT_DATA = {
    'Cancellation & Returns': {
        icon: 'return-up-back-outline',
        color: '#FF6B6B',
        text: `At GudKart, we want you to be completely satisfied with your purchase. 

• Cancellations: You can cancel your order any time before it has been shipped by the seller. Once shipped, the cancellation option will be disabled.

• Returns: Due to the handmade nature of many products, return policies are set by individual sellers. Generally, returns are accepted within 7 days of delivery only if the product is damaged or significantly different from the description.

• Process: To initiate a return, go to "My Orders", select the item, and click "Request Return". Provide photos and a reason for the request.`,
    },
    'Terms of Use': {
        icon: 'document-text-outline',
        color: '#7B5EEA',
        text: `Effective Date: 27 March 2026 | Last Updated: 27 March 2026

These Terms of Use ("Terms") constitute a legally binding agreement between GudKart, a company incorporated under the laws of India, having its registered office at Bangalore ("GudKart", "Company", "we", "us", "our") and any person who accesses, browses, registers on, or otherwise uses the Platform ("you", "your", "User").

1.1 Definitions
"Customer": means a User purchasing or seeking to purchase products.
"Seller": means an independent third-party seller, artisan, or creator.
"Product(s)": means goods listed by Sellers.

1.2 Platform Nature
GudKart operates solely as a technology and marketplace intermediary platform. GudKart does not manufacture, stock, or own inventory of Products, unless explicitly stated.

1.3 Eligibility
You must be at least 18 years of age and competent to contract under the Indian Contract Act, 1872.

1.4 Payments (Razorpay)
Payments are processed through trusted third-party gateways like Razorpay. GudKart does not store sensitive card data.

1.5 Logistics (Shiprocket)
Delivery is facilitated through partners like Shiprocket. Timelines are estimates.

Full details available at: sumanhp31@gmail.com`,
    },
    'Security': {
        icon: 'shield-checkmark-outline',
        color: '#4ADE80',
        text: `Effective Date: 27 March 2026

GudKart uses commercially reasonable security practices designed to protect Platform integrity and User data.

1.1 Measures We Implement
• HTTPS/TLS encryption for data in transit
• Secure authentication and session controls
• Encryption of sensitive data at rest
• Least-privilege access and role-based controls
• Monitoring, logging, and anomaly detection

1.2 User Responsibilities
• Maintain confidentiality of passwords and OTPs
• Use strong, unique passwords
• Notify GudKart promptly of suspicious activity

1.3 Disclaimer
While we take reasonable measures, no system is entirely secure. GudKart shall not be liable for security incidents caused by user negligence (including credential/OTP sharing), compromised devices, or sophisticated attacks beyond our reasonable control.`,
    },
    'Privacy': {
        icon: 'lock-closed-outline',
        color: '#F472B6',
        text: `Effective Date: 27 March 2026

This Privacy Policy explains how GudKart collects, uses, shares, and protects personal data when you use the Platform.

1.1 Data We Collect
• Identity & Contact: Name, Email, Phone.
• Address Data: Shipping/Billing address.
• Transaction Data: Order details and payment status.
• Device & Usage Data: IP address, device identifiers, logs.

1.2 Purposes of Processing
• Provide services and process Orders.
• Coordinate shipping and delivery.
• Communicate about updates and support.
• Detect and prevent fraud.

1.3 Data Sharing
We share necessary data with Razorpay (Payments), Shiprocket (Logistics), and Sellers (Fulfillment). We do not sell personal data.

1.4 Cookies
We use cookies for session management, authentication, and analytics.

1.5 Your Rights
You may request access, correction, or deletion of your data by contacting: sumanhp31@gmail.com

© 2026 GudKart. All rights reserved.`,
    },
};

const SupportContentScreen = ({ route, navigation }) => {
    const { title } = route.params || { title: 'Privacy' };
    const { colors, isDark } = useTheme();
    const data = CONTENT_DATA[title] || CONTENT_DATA['Privacy'];

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
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{title}</Text>
                    <View style={{ width: 40 }} />
                </View>
            </SafeAreaView>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.iconHero, { backgroundColor: data.color + '15' }]}>
                    <Ionicons name={data.icon} size={64} color={data.color} />
                </View>

                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
                        {data.text}
                    </Text>
                </View>

                <View style={styles.helpBox}>
                    <Text style={[styles.helpTitle, { color: colors.textPrimary }]}>Still need help?</Text>
                    <TouchableOpacity 
                        style={[styles.contactBtn, { backgroundColor: colors.accent }]}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="chatbubbles" size={20} color="#0D0B1E" />
                        <Text style={styles.contactText}>Chat with Support</Text>
                    </TouchableOpacity>
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    iconHero: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 32,
        marginTop: 16,
    },
    card: {
        padding: 24,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 32,
    },
    bodyText: {
        fontSize: 15,
        lineHeight: 26,
        fontWeight: '400',
    },
    helpBox: {
        alignItems: 'center',
        gap: 16,
    },
    helpTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    contactBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 16,
        gap: 10,
    },
    contactText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0D0B1E',
    },
});

export default SupportContentScreen;
