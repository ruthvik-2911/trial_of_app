import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Alert, ActivityIndicator,
    TextInput, NativeModules, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ToastNotification';
import orderService from '../../services/api/orderService';
import addressService from '../../services/api/addressService.js';
import paymentService from '../../services/api/paymentService'; // New service
import RazorpayCheckout from 'react-native-razorpay';

const CheckoutScreen = ({ navigation, route }) => {
    const { colors, gradients, isDark } = useTheme();
    const insets = useSafeAreaInsets();
    const styles = React.useMemo(
        () => getStyles(colors, isDark, insets),
        [colors, isDark, insets]
    );
    const { clearCart } = useCart();
    const { user, isLoggedIn } = useAuth();
    const { showToast } = useToast();

    // ── Auth Guard ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!isLoggedIn) {
            navigation.navigate('Auth', { screen: 'Login' });
        }
    }, [isLoggedIn, navigation]);

    // ── Data from CartScreen or Buy Now ────────────────────────────────────
    const {
        cartTotal = 0,
        cartItems = [],
        savings = 0,
    } = route.params || {};

    // itemCount: total quantity across all cart items (not just distinct products)
    const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

    // ── State ───────────────────────────────────────────────────────────────
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState('cod');
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);

    // ── GST & Billing States ────────────────────────────────────────────────
    const [useForBilling, setUseForBilling] = useState(true);
    const [saveShipping, setSaveShipping] = useState(true);
    const [isGSTEnabled, setIsGSTEnabled] = useState(false);
    const [gstNumber, setGstNumber] = useState('');
    const [companyName, setCompanyName] = useState('');

    const paymentMethods = [
        { id: 'cod', name: 'Cash on Delivery', icon: 'cash-outline', subtitle: 'Pay when you receive' },
        { id: 'upi', name: 'Pay Online', icon: 'phone-portrait-outline', subtitle: 'Cards, UPI, Netbanking, Wallets' },

    ];

    // ── Platform Fee Breakdown (percentages of cartTotal) ──────────────────
    const [showPlatformDetails, setShowPlatformDetails] = useState(false);
    const pf = {
        digitalSecurityFee: parseFloat((cartTotal * 1.2 / 100).toFixed(2)),
        merchantVerification: parseFloat((cartTotal * 1.0 / 100).toFixed(2)),
        transitCare: parseFloat((cartTotal * 0.8 / 100).toFixed(2)),
        platformMaintenance: parseFloat((cartTotal * 0.5 / 100).toFixed(2)),
        qualityHandling: parseFloat((cartTotal * 0.0 / 100).toFixed(2)),
    };
    const subPlatformFee = parseFloat(Object.values(pf).reduce((s, v) => s + v, 0).toFixed(2));
    const platformGST = parseFloat((subPlatformFee * 0.18).toFixed(2));
    const totalPlatformFee = parseFloat((subPlatformFee + platformGST).toFixed(2));
    const deliveryFee = cartTotal > 5000 ? 0 : 49;
    const total = parseFloat((cartTotal + deliveryFee + totalPlatformFee).toFixed(2));
    const originalPrice = cartTotal + savings; // before discount

    const togglePlatformDetails = () => {
        if (Platform.OS === 'android') UIManager.setLayoutAnimationEnabledExperimental?.(true);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowPlatformDetails(v => !v);
    };

    // ── Load addresses from backend on mount ────────────────────────────────
    useEffect(() => {
        fetchAddresses();
    }, []);

    // ── Re-fetch addresses when returning from AddAddress screen ─────────────
    useEffect(() => {
        const refreshTimestamp = route.params?.addressRefresh;
        if (refreshTimestamp) {
            fetchAddresses();
        }
    }, [route.params?.addressRefresh]);

    const fetchAddresses = async () => {
        if (!user?.uid) return;
        setIsLoadingAddresses(true);
        try {
            const data = await addressService.getAddresses(user.uid);
            const list = data?.addresses || data || [];
            setAddresses(list);
            // Auto-select the default address, or the first one
            const defaultAddr = list.find(a => a.isDefault) || list[0];
            if (defaultAddr) {
                setSelectedAddress(defaultAddr.id || defaultAddr._id);
            }
        } catch (error) {
            console.error('Failed to load addresses:', error);
            Alert.alert('Error', 'Could not load your saved addresses. You can add a new one.');
        } finally {
            setIsLoadingAddresses(false);
        }
    };

    // ── Place Order — calls orderService ────────────────────────────────────
    const handlePlaceOrder = () => {
        if (!selectedAddress) {
            Alert.alert('Address Required', 'Please select a delivery address');
            return;
        }
        if (!selectedPayment) {
            Alert.alert('Payment Required', 'Please select a payment method');
            return;
        }

        if (selectedPayment === 'upi') {
            // Razorpay: skip confirmation dialog and open payment sheet immediately
            placeOrderOnServer();
        } else {
            // COD: show confirmation before placing
            Alert.alert(
                'Confirm Order',
                'Are you sure you want to place this order?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Place Order', onPress: placeOrderOnServer },
                ]
            );
        }
    };

    const placeOrderOnServer = async () => {
        setIsPlacingOrder(true);
        try {
            // Find the full address object
            const address = addresses.find(
                a => (a.id || a._id) === selectedAddress
            );

            // 1. Prepare Customer & Order Info
            const customerInfo = {
                firstName: address?.firstName || '',
                lastName: address?.lastName || '',
                email: user?.email || '',
                phone: address?.phone || '',
                gstNumber: isGSTEnabled ? gstNumber.trim() : null,
                shippingAddress: {
                    name: [address?.firstName, address?.lastName].filter(Boolean).join(' ') || address?.name || '',
                    addressLine: address?.addressLine || address?.address || '',
                    landmark: address?.landmark || '',
                    city: address?.city || '',
                    state: address?.state || '',
                    pincode: address?.pincode || '',
                    phone: address?.phone || '',
                },
                billingAddress: useForBilling ? {
                    name: [address?.firstName, address?.lastName].filter(Boolean).join(' ') || address?.name || '',
                    addressLine: address?.addressLine || address?.address || '',
                    landmark: address?.landmark || '',
                    city: address?.city || '',
                    state: address?.state || '',
                    pincode: address?.pincode || '',
                    phone: address?.phone || '',
                } : null
            };

            const platformFeeBreakdown = {
                digitalSecurityFee: 1.2,
                merchantVerification: 1.0,
                transitCare: 0.8,
                platformMaintenance: 0.5,
                qualityHandling: 0.0
            };

            const mappedCartItems = cartItems.map(item => ({
                productId: item.id,
                name: item.title || item.name,
                price: item.price,
                quantity: item.quantity,
                variant: item.color || item.size || null,
                size: item.size || null,
                image: item.image || null,
                sellerId: item.sellerId || null,
            }));

            // 2. Handle specific payment flows
            if (selectedPayment === 'cod') {
                const response = await paymentService.placeCODOrder({
                    uid: user.uid,
                    cartItems: mappedCartItems,
                    customerInfo,
                    amount: total,
                    platformFeeBreakdown,
                    couponDiscount: savings || 0,
                });
                handleOrderSuccess(response);
            } else if (selectedPayment === 'upi') {
                // START RAZORPAY FLOW
                try {
                    // Robust check: detect if native module exists in NativeModules, as 
                    // the JS wrapper might bypass simple null checks in some environments
                    const isModuleAvailable = !!NativeModules.RazorpayCheckout || (!!RazorpayCheckout && typeof RazorpayCheckout.open === 'function');

                    if (!isModuleAvailable) {
                        throw new Error("Razorpay native module not found. Native payments are not supported in Expo Go. Please use a Development Client build (npx expo run:android).");
                    }

                    const orderResp = await paymentService.createRazorpayOrder(total, mappedCartItems, customerInfo);

                    if (!orderResp.success) throw new Error("Failed to initialize payment");

                    const options = {
                        description: 'Order Payment',
                        image: 'https://GoodKart.com/logo.png', // Fallback logo
                        currency: orderResp.order.currency,
                        key: orderResp.key_id,
                        amount: orderResp.order.amount,
                        name: 'GoodKart',
                        order_id: orderResp.order.id,
                        prefill: {
                            email: user.email,
                            contact: address?.phone || '',
                            name: `${address?.firstName || ''} ${address?.lastName || ''}`.trim()
                        },
                        theme: { color: colors.accent || '#7B5EEA' }
                    };

                    RazorpayCheckout.open(options).then(async (data) => {
                        // Payment successful, now verify on backend
                        try {
                            const verifyResp = await paymentService.verifyPayment({
                                razorpay_payment_id: data.razorpay_payment_id,
                                razorpay_order_id: data.razorpay_order_id,
                                razorpay_signature: data.razorpay_signature,
                                cartItems: mappedCartItems,
                                customerInfo,
                                amount: total,
                                uid: user.uid,
                                platformFeeBreakdown,
                                couponDiscount: savings || 0
                            });
                            handleOrderSuccess(verifyResp);
                        } catch (err) {
                            console.error('Payment Verification Error:', err);
                            Alert.alert("Verification Failed", "Payment was successful but verification failed. Please contact support.");
                            setIsPlacingOrder(false);
                        }
                    }).catch((error) => {
                        // Payment failed or cancelled
                        console.error('Razorpay SDK Error:', error);
                        const errorCode = error?.code || 'CANCELLED';
                        const errorDesc = error?.description || error?.message || 'Payment process was interrupted.';

                        console.log(`Error: ${errorCode} | ${errorDesc}`);
                        Alert.alert('Payment Cancelled', errorDesc);
                        setIsPlacingOrder(false);
                    });
                } catch (razorInitError) {
                    console.error('Razorpay Init Error:', razorInitError);
                    Alert.alert('Payment Error', razorInitError.message);
                    setIsPlacingOrder(false);
                }
            }
        } catch (error) {
            console.error('Order placement failed:', error);
            const message = error?.response?.data?.message || error?.message || 'Something went wrong. Please try again.';
            Alert.alert('Order Failed', message);
            setIsPlacingOrder(false);
        }
    };

    const handleOrderSuccess = (response) => {
        clearCart();
        setIsPlacingOrder(false);

        showToast({
            type: 'success',
            title: 'Order Placed!',
            message: 'Your order has been confirmed successfully.',
        });

        navigation.replace('OrderSuccess', {
            orderId: response?.orderId || '#ORD' + Date.now().toString().slice(-8),
            total: total.toLocaleString(),
            items: itemCount,
        });
    };

    // ── Add / Edit address via backend ──────────────────────────────────────
    const handleAddAddress = () => {
        // Pass a callback key so AddAddressScreen can signal back via setParams
        navigation.navigate('AddAddress', {
            returnScreen: 'Checkout',
        });
    };

    const handleEditAddress = (address) => {
        navigation.navigate('AddAddress', {
            addressToEdit: address,
            returnScreen: 'Checkout',
        });
    };

    // ── Address Card ────────────────────────────────────────────────────────
    const AddressCard = ({ address }) => {
        const addrId = address.id || address._id;
        const isSelected = selectedAddress === addrId;
        return (
            <TouchableOpacity
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() => setSelectedAddress(addrId)}
                activeOpacity={0.85}
            >
                <View style={styles.addressHeader}>
                    <View style={[styles.radioOuter, isSelected && { borderColor: colors.accent }]}>
                        {isSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={styles.addressInfo}>
                        <View style={styles.addressNameRow}>
                            <Text style={styles.addressName}>
                                {[address.firstName, address.lastName].filter(Boolean).join(' ') || address.name || ''}
                            </Text>
                            {address.isDefault && (
                                <View style={styles.defaultBadge}>
                                    <Text style={styles.defaultText}>Default</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.addressPhone}>{address.phone}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditAddress(address)}
                    >
                        <Ionicons name="pencil-outline" size={18} color={colors.accent} />
                    </TouchableOpacity>
                </View>
                <View style={styles.addressBody}>
                    <Text style={styles.addressText}>
                        {address.addressLine || address.address || ''}
                        {address.landmark ? `, ${address.landmark}` : ''}
                    </Text>
                    <Text style={styles.addressText}>
                        {address.city}, {address.state} — {address.pincode}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    // ── Payment Method Card ─────────────────────────────────────────────────
    const PaymentMethodCard = ({ method }) => {
        const isSelected = selectedPayment === method.id;
        return (
            <TouchableOpacity
                style={[styles.paymentCard, isSelected && styles.paymentCardSelected]}
                onPress={() => setSelectedPayment(method.id)}
                activeOpacity={0.85}
            >
                <View style={[styles.radioOuter, isSelected && { borderColor: colors.accent }]}>
                    {isSelected && <View style={styles.radioInner} />}
                </View>
                <View style={styles.paymentIcon}>
                    <Ionicons name={method.icon} size={24} color={colors.accent} />
                </View>
                <View style={styles.paymentInfo}>
                    <Text style={styles.paymentName}>{method.name}</Text>
                    <Text style={styles.paymentSubtitle}>{method.subtitle}</Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={22} color={colors.success || '#00D97E'} />}
            </TouchableOpacity>
        );
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: isDark ? '#1A0B2E' : colors.background }]}
            edges={['top', 'bottom']}
        >
            <LinearGradient colors={isDark ? ['#1A0B2E', '#2E1A47'] : [colors.background, colors.surface]} style={styles.gradient}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Scrollable Content */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >

                    {/* ── Section: Delivery Address ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="location" size={22} color={colors.accent} />
                                <Text style={styles.sectionTitle}>Delivery Address</Text>
                            </View>
                            <TouchableOpacity style={styles.addButton} onPress={handleAddAddress}>
                                <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                                <Text style={styles.addButtonText}>Add New</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoadingAddresses ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={colors.accent} />
                                <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading addresses…</Text>
                            </View>
                        ) : addresses.length === 0 ? (
                            <TouchableOpacity style={styles.emptyAddressCard} onPress={handleAddAddress}>
                                <Ionicons name="add-circle-outline" size={32} color={colors.accent} />
                                <Text style={[styles.emptyAddressText, { color: colors.textSecondary }]}>
                                    No saved addresses. Tap to add one.
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            addresses.map(addr => (
                                <AddressCard key={addr.id || addr._id} address={addr} />
                            ))
                        )}

                        {/* ── Additional Address Toggles ── */}
                        <View style={styles.addressToggles}>
                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setUseForBilling(!useForBilling)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={useForBilling ? "checkbox" : "square-outline"}
                                    size={22}
                                    color={useForBilling ? colors.success : colors.textMuted}
                                />
                                <View style={styles.toggleTextContainer}>
                                    <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Use this address for billing too</Text>
                                    <Text style={[styles.toggleSublabel, { color: colors.textMuted }]}>(Uncheck to add a different billing address)</Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toggleRow}
                                onPress={() => setSaveShipping(!saveShipping)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={saveShipping ? "checkbox" : "square-outline"}
                                    size={22}
                                    color={saveShipping ? colors.success : colors.textMuted}
                                />
                                <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Save this shipping address for future orders</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ── GST Section ── */}
                        <View style={[styles.gstCard, { backgroundColor: isDark ? 'rgba(96, 165, 250, 0.05)' : '#F3F8FF', borderColor: '#BFDBFE' }]}>
                            <TouchableOpacity
                                style={styles.gstHeader}
                                onPress={() => setIsGSTEnabled(!isGSTEnabled)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.gstIconContainer}>
                                    <Ionicons name="document-text" size={24} color="#3B82F6" />
                                </View>
                                <View style={styles.gstTitleRow}>
                                    <Ionicons
                                        name={isGSTEnabled ? "checkbox" : "square-outline"}
                                        size={22}
                                        color={isGSTEnabled ? "#3B82F6" : colors.textMuted}
                                    />
                                    <View style={{ flex: 1, marginLeft: 8 }}>
                                        <Text style={[styles.gstTitle, { color: colors.textPrimary }]}>I have a GST Number</Text>
                                        <Text style={[styles.gstSub, { color: colors.textMuted }]}>Ensure GST details match your billing address</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {isGSTEnabled && (
                                <View style={styles.gstInputContainer}>
                                    {/* GST Number */}
                                    <Text style={[styles.gstFieldLabel, { color: colors.textSecondary }]}>GST Number</Text>
                                    <TextInput
                                        style={[styles.gstInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                                        placeholder="Enter GST Number (e.g., 29ABCDE1234F1Z5)"
                                        placeholderTextColor={colors.textMuted}
                                        value={gstNumber}
                                        onChangeText={setGstNumber}
                                        autoCapitalize="characters"
                                        maxLength={15}
                                    />

                                    {/* Business / Company Name */}
                                    <Text style={[styles.gstFieldLabel, { color: colors.textSecondary, marginTop: 14 }]}>Business / Company Name</Text>
                                    <TextInput
                                        style={[styles.gstInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.textPrimary }]}
                                        placeholder="Enter your business or company name"
                                        placeholderTextColor={colors.textMuted}
                                        value={companyName}
                                        onChangeText={setCompanyName}
                                        autoCapitalize="words"
                                    />

                                    <View style={[styles.gstHintContainer, { backgroundColor: isDark ? 'rgba(30,64,175,0.15)' : '#E0F2FE' }]}>
                                        <Text style={styles.gstHintText}>
                                            <Text style={{ fontWeight: 'bold', color: '#cbd4f1ff' }}>Format: </Text>
                                            <Text style={{ color: '#cbd4f1ff' }}>2 digits (state code) + 5 letters (PAN) + 4 digits + 1 letter + 1 letter/digit + Z + 1 letter/digit</Text>
                                        </Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* ── Section: Payment Method ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="wallet" size={22} color={colors.accent} />
                                <Text style={styles.sectionTitle}>Payment Method</Text>
                            </View>
                        </View>
                        {paymentMethods.map(method => <PaymentMethodCard key={method.id} method={method} />)}
                    </View>

                    {/* ── Section: Order Summary ── */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleContainer}>
                                <Ionicons name="receipt" size={22} color={colors.accent} />
                                <Text style={styles.sectionTitle}>Order Summary</Text>
                            </View>
                        </View>

                        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>

                            {/* Product Pricing row — original strikethrough + discounted */}
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Product Pricing *</Text>
                                <View style={styles.priceStack}>
                                    {savings > 0 && (
                                        <Text style={styles.origPrice}>₹{originalPrice.toLocaleString('en-IN')}</Text>
                                    )}
                                    <Text style={styles.discPrice}>₹{cartTotal.toLocaleString('en-IN')}</Text>
                                </View>
                            </View>

                            <View style={styles.thinDivider} />

                            {/* Platform Fee row — tappable dropdown */}
                            <TouchableOpacity
                                style={styles.summaryRow}
                                onPress={togglePlatformDetails}
                                activeOpacity={0.7}
                            >
                                <View style={styles.pfLabelRow}>
                                    <Text style={styles.summaryLabel}>Platform Fee & Service GST</Text>
                                    <Ionicons
                                        name={showPlatformDetails ? 'chevron-up' : 'chevron-down'}
                                        size={14}
                                        color={colors.textMuted}
                                        style={{ marginLeft: 4, marginTop: 1 }}
                                    />
                                </View>
                                <Text style={styles.summaryValue}>₹{totalPlatformFee.toLocaleString('en-IN')}</Text>
                            </TouchableOpacity>

                            {/* Collapsible breakdown */}
                            {showPlatformDetails && (
                                <View style={[styles.pfBreakdownBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FB', borderColor: colors.border }]}>
                                    <Text style={[styles.pfBreakdownHeader, { color: colors.textMuted }]}>SERVICE BREAKDOWN</Text>
                                    {[
                                        { label: 'Digital Security Fee', value: pf.digitalSecurityFee },
                                        { label: 'Merchant Verification', value: pf.merchantVerification },
                                        { label: 'Transit Care', value: pf.transitCare },
                                        { label: 'Platform Maintenance', value: pf.platformMaintenance },
                                        { label: 'Quality & Handling', value: pf.qualityHandling },
                                    ].map(({ label, value }) => (
                                        <View key={label} style={styles.pfRow}>
                                            <Text style={[styles.pfLabel, { color: colors.textSecondary }]}>{label}</Text>
                                            <Text style={[styles.pfValue, { color: colors.textPrimary }]}>₹{value.toLocaleString('en-IN')}</Text>
                                        </View>
                                    ))}
                                    <View style={styles.thinDivider} />
                                    <View style={styles.pfRow}>
                                        <Text style={[styles.pfLabel, styles.pfGstLabel, { color: colors.textSecondary }]}>GST (18% on Platform Fee)</Text>
                                        <Text style={[styles.pfValue, { color: colors.textPrimary }]}>₹{platformGST.toLocaleString('en-IN')}</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.thinDivider} />

                            {/* Shipping */}
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Shipping Fee</Text>
                                {deliveryFee === 0
                                    ? <Text style={styles.freeDelivery}>FREE</Text>
                                    : <Text style={styles.summaryValue}>₹{deliveryFee}</Text>}
                            </View>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            {/* Total Amount */}
                            <View style={styles.summaryRow}>
                                <Text style={styles.totalLabel}>Total Amount</Text>
                                <Text style={[styles.totalValue, { color: '#1D72E8' }]}>₹{total.toLocaleString('en-IN')}</Text>
                            </View>

                            {/* Save with GoodKart Premium */}
                            <TouchableOpacity activeOpacity={0.8} style={styles.premiumBadge}>
                                <Text style={styles.premiumText}>SAVE WITH GOODKART PREMIUM</Text>
                            </TouchableOpacity>
                        </View>

                        {/* GST note */}
                        <View style={[styles.noteCard, { backgroundColor: isDark ? 'rgba(29,114,232,0.10)' : '#EBF3FF', borderColor: '#1D72E8' + '30' }]}>
                            <Text style={[styles.noteText, { color: isDark ? '#7EB6FF' : '#1D72E8' }]}>
                                <Text style={{ fontWeight: '700' }}>* Product Pricing</Text> includes GST on products
                            </Text>
                        </View>

                        {/* Guaranteed Safety card */}
                        <View style={[styles.safetyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <View style={[styles.safetyIcon, { backgroundColor: isDark ? 'rgba(29,114,232,0.15)' : '#EBF3FF' }]}>
                                <Ionicons name="shield-checkmark-outline" size={22} color="#1D72E8" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.safetyTitle, { color: colors.textPrimary }]}>Guaranteed Safety</Text>
                                <Text style={[styles.safetySub, { color: colors.textMuted }]}>100% Secure Transaction</Text>
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* ─── Bottom Bar: Place Order ───────────────────────────────── */}
                <View style={styles.bottomBar}>
                    <LinearGradient
                        colors={isDark ? ['rgba(26,11,46,0.97)', '#1A0B2E'] : ['rgba(255,255,255,0.97)', '#fff']}
                        style={styles.bottomGradient}
                    >
                        <View style={styles.bottomContent}>
                            <View>
                                <Text style={styles.bottomLabel}>Total Payable</Text>
                                <Text style={styles.bottomTotal}>₹{total.toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.placeOrderButton, isPlacingOrder && { opacity: 0.6 }]}
                                onPress={handlePlaceOrder}
                                activeOpacity={0.85}
                                disabled={isPlacingOrder}
                            >
                                <LinearGradient colors={(gradients?.button || []).every(Boolean) ? gradients.button : ['#7B5EEA', '#5A3EC8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.placeOrderGradient}>
                                    {isPlacingOrder ? (
                                        <ActivityIndicator size="small" color={isDark ? '#1A0B2E' : '#fff'} />
                                    ) : (
                                        <>
                                            <Text style={styles.placeOrderText}>Place Order</Text>
                                            <Ionicons name="checkmark-circle-outline" size={20} color={isDark ? '#1A0B2E' : '#fff'} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>

            </LinearGradient>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark, insets) => StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },

    // ScrollView content — clears the absolute bottom bar on every device
    // bottomBar = paddingTop(16) + btn(52) + paddingBottom(dynamic) = ~68 + insets.bottom
    scrollContent: { paddingBottom: 84 + (insets?.bottom || 0) },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

    section: { marginBottom: 24 },
    sectionHeader: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, marginTop: 20, marginBottom: 12,
    },
    sectionTitleContainer: { flexDirection: 'row', alignItems: 'center' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginLeft: 8 },
    addButton: { flexDirection: 'row', alignItems: 'center' },
    addButtonText: { fontSize: 14, color: colors.accent, marginLeft: 4, fontWeight: '600' },

    // Loading & empty states for addresses
    loadingContainer: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 24,
    },
    loadingText: { marginLeft: 8, fontSize: 14 },
    emptyAddressCard: {
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.surface, marginHorizontal: 16,
        borderRadius: 12, padding: 24, borderWidth: 2,
        borderColor: colors.border, borderStyle: 'dashed',
    },
    emptyAddressText: { marginTop: 8, fontSize: 14, textAlign: 'center' },

    // Address
    addressCard: {
        backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12,
        borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.border,
    },
    addressCardSelected: { borderColor: colors.accent },
    addressHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
    radioOuter: {
        width: 22, height: 22, borderRadius: 11, borderWidth: 2,
        borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    radioInner: { width: 11, height: 11, borderRadius: 6, backgroundColor: colors.accent },
    addressInfo: { flex: 1 },
    addressNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    addressName: { fontSize: 16, fontWeight: 'bold', color: colors.textPrimary, marginRight: 8 },
    defaultBadge: { backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    defaultText: { fontSize: 11, fontWeight: 'bold', color: isDark ? '#1A0B2E' : '#fff' },
    addressPhone: { fontSize: 14, color: colors.textSecondary },
    editButton: { padding: 4 },
    addressBody: { paddingLeft: 34 },
    addressText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },

    // Payment
    paymentCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.surface, marginHorizontal: 16, marginBottom: 12,
        borderRadius: 12, padding: 16, borderWidth: 2, borderColor: colors.border,
    },
    paymentCardSelected: { borderColor: colors.accent },
    paymentIcon: {
        width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cardAlt,
        justifyContent: 'center', alignItems: 'center', marginHorizontal: 12,
    },
    paymentInfo: { flex: 1 },
    paymentName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 3 },
    paymentSubtitle: { fontSize: 13, color: colors.textMuted },

    // Summary
    summaryCard: {
        marginHorizontal: 16, borderRadius: 16, padding: 18,
        borderWidth: 1, marginBottom: 10,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    summaryLabel: { fontSize: 15, color: colors.textSecondary },
    summaryValue: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
    freeDelivery: { color: '#00D97E', fontWeight: '800', fontSize: 15 },
    thinDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: 14 },
    divider: { height: 1, marginVertical: 6 },
    totalLabel: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
    totalValue: { fontSize: 22, fontWeight: '900' },
    savingsInfo: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(0,217,126,0.1)', padding: 10, borderRadius: 8, marginTop: 8,
    },
    savingsText: { fontSize: 13, color: '#00D97E', marginLeft: 6, fontWeight: '600' },

    // Product Pricing
    priceStack: { alignItems: 'flex-end', gap: 2 },
    origPrice: { fontSize: 13, color: colors.textMuted, textDecorationLine: 'line-through' },
    discPrice: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },

    // Platform Fee row
    pfLabelRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
    pfBreakdownBox: { borderRadius: 10, borderWidth: 1, padding: 14, marginBottom: 14 },
    pfBreakdownHeader: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
    pfRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    pfLabel: { fontSize: 14 },
    pfGstLabel: { fontStyle: 'italic' },
    pfValue: { fontSize: 14, fontWeight: '600' },

    // Premium Badge
    premiumBadge: { alignSelf: 'flex-start', marginTop: 4 },
    premiumText: { fontSize: 11, fontWeight: '800', color: '#00D97E', letterSpacing: 0.5 },

    // Note & Safety cards
    noteCard: { marginHorizontal: 16, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10 },
    noteText: { fontSize: 13, lineHeight: 18 },
    safetyCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    safetyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    safetyTitle: { fontSize: 15, fontWeight: '700' },
    safetySub: { fontSize: 12, marginTop: 2 },

    // Bottom Bar — position:absolute so it always overlays the scroll content
    bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0 },
    bottomGradient: {
        paddingTop: 10,
        // Dynamic bottom padding: SafeAreaView edges=['top','bottom'] handles the top notch
        // but the bottom bar is position:absolute INSIDE the SafeAreaView, so we add
        // insets.bottom manually here to clear gesture nav / home indicator
        paddingBottom: 34,
        paddingHorizontal: 16,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        borderTopWidth: 1, borderColor: colors.border,
    },
    bottomContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    bottomLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
    bottomTotal: { fontSize: 24, fontWeight: 'bold', color: colors.accent },
    placeOrderButton: { borderRadius: 12, overflow: 'hidden', flex: 1, marginLeft: 16 },
    placeOrderGradient: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 16, gap: 8,
    },
    placeOrderText: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#1A0B2E' : '#fff' },

    // GST & Address Toggles
    addressToggles: { marginHorizontal: 16, marginTop: 8, gap: 12 },
    toggleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    toggleTextContainer: { flex: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '500' },
    toggleSublabel: { fontSize: 12, marginTop: 2 },

    gstCard: {
        marginHorizontal: 16, marginTop: 20, borderRadius: 16,
        padding: 16, borderWidth: 1,
    },
    gstHeader: { flexDirection: 'row', alignItems: 'center' },
    gstIconContainer: {
        width: 32, height: 32, borderRadius: 8, backgroundColor: '#DBEAFE',
        justifyContent: 'center', alignItems: 'center', marginRight: 12,
    },
    gstTitleRow: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    gstTitle: { fontSize: 16, fontWeight: 'bold' },
    gstSub: { fontSize: 13, marginTop: 2 },

    gstInputContainer: { marginTop: 16 },
    gstFieldLabel: { fontSize: 13, fontWeight: '700', marginBottom: 8 },
    gstInput: {
        height: 54, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16,
        fontSize: 16, fontWeight: '500', marginBottom: 12,
    },
    gstHintContainer: { padding: 12, borderRadius: 10 },
    gstHintText: { fontSize: 12, lineHeight: 18 },
});

export default CheckoutScreen;