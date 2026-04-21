import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import addressService from '../../services/api/addressService.js';

// ─── Field MUST stay outside the screen component ─────────────────────────────
// If defined inside, React creates a new component type on every keystroke
// (re-render), unmounts the TextInput, and dismisses the keyboard.
const Field = ({
    label, field, placeholder,
    keyboardType = 'default', maxLength,
    form, errors, onUpdate, styles, colors,
    autoCapitalize = 'sentences',
}) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
            style={[styles.input, errors[field] && styles.inputError]}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={form[field]}
            onChangeText={val => onUpdate(field, val)}
            keyboardType={keyboardType}
            maxLength={maxLength}
            autoCorrect={false}
            autoCapitalize={autoCapitalize}
            returnKeyType="next"
        />
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
);

// ─── Map a backend address object back into form state (for Edit mode) ─────────
const backendToForm = (addr) => ({
    firstName: addr.firstName || '',
    lastName: addr.lastName || '',
    phone: addr.phone || '',
    addressLine: addr.addressLine || '',
    landmark: addr.landmark || '',
    city: addr.city || '',
    state: addr.state || '',
    pincode: addr.pincode || '',
    isDefault: addr.isDefault ?? false,
    id: addr.id || addr._id || undefined,
});

const EMPTY_FORM = {
    firstName: '', lastName: '', phone: '',
    addressLine: '', landmark: '',
    city: '', state: '', pincode: '',
    isDefault: false,
};

const AddAddressScreen = ({ navigation, route }) => {
    const { colors, gradients, isDark } = useTheme();
    const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
    const { user } = useAuth();
    const { addressToEdit, returnScreen } = route.params || {};

    const scrollRef = useRef(null);

    const [form, setForm] = useState(
        addressToEdit ? backendToForm(addressToEdit) : { ...EMPTY_FORM }
    );
    const [errors, setErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const e = {};
        if (!form.firstName.trim()) e.firstName = 'First name is required';
        if (!form.lastName.trim()) e.lastName = 'Last name is required';
        if (!form.phone.trim() || form.phone.length < 10)
            e.phone = 'Valid 10-digit number required';
        if (!form.addressLine.trim()) e.addressLine = 'Address line is required';
        if (!form.city.trim()) e.city = 'City is required';
        if (!form.state.trim()) e.state = 'State is required';
        if (!form.pincode.trim() || form.pincode.length !== 6)
            e.pincode = 'Valid 6-digit pincode required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!user?.uid) {
            Alert.alert('Error', 'You must be logged in to save an address.');
            return;
        }

        setIsSaving(true);
        try {
            // Exact payload the backend requires
            const payload = {
                firstName: form.firstName.trim(),    // Required
                lastName: form.lastName.trim(),     // Required
                addressLine: form.addressLine.trim(),  // Required
                city: form.city.trim(),         // Required
                state: form.state.trim(),        // Required
                pincode: form.pincode.trim(),      // Required
                phone: form.phone.trim(),        // Optional
                landmark: form.landmark.trim(),     // Optional
                isDefault: form.isDefault,           // Optional
                type: 'shipping',               // Optional, default 'shipping'
                ...(form.id ? { id: form.id } : {}),  // Only when editing
            };

            console.log('[AddAddressScreen] payload →', JSON.stringify(payload, null, 2));

            const response = await addressService.addAddress(user.uid, payload);

            // Signal back to CheckoutScreen using a timestamp param (no function refs!)
            if (returnScreen) {
                navigation.navigate(returnScreen, { addressRefresh: Date.now() });
            } else {
                navigation.goBack();
            }
        } catch (error) {
            console.error('Failed to save address:', error);
            const message =
                error?.response?.data?.message ||
                error?.message ||
                'Could not save address. Please try again.';
            Alert.alert('Save Failed', message);
        } finally {
            setIsSaving(false);
        }
    };

    const fieldProps = { form, errors, onUpdate: update, styles, colors };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1A0B2E' : colors.background }]}>
            <LinearGradient
                colors={isDark ? ['#1A0B2E', '#2E1A47'] : [colors.background, colors.surface]}
                style={styles.gradient}
            >
                {/* ── Header ──────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {addressToEdit ? 'Edit Address' : 'Add New Address'}
                    </Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* ── KeyboardAvoidingView pushes content above keyboard ── */}
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
                >
                    <ScrollView
                        ref={scrollRef}
                        contentContainerStyle={styles.formContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        bounces={true}
                    >
                        {/* ── First Name + Last Name ───────────────────── */}
                        <View style={styles.row}>
                            <View style={styles.halfLeft}>
                                <Field
                                    label="First Name *"
                                    field="firstName"
                                    placeholder="Rahul"
                                    autoCapitalize="words"
                                    {...fieldProps}
                                />
                            </View>
                            <View style={styles.halfRight}>
                                <Field
                                    label="Last Name *"
                                    field="lastName"
                                    placeholder="Kumar"
                                    autoCapitalize="words"
                                    {...fieldProps}
                                />
                            </View>
                        </View>

                        {/* ── Phone ────────────────────────────────────── */}
                        <Field
                            label="Phone Number *"
                            field="phone"
                            placeholder="10-digit mobile number"
                            keyboardType="phone-pad"
                            maxLength={10}
                            autoCapitalize="none"
                            {...fieldProps}
                        />

                        {/* ── Address Line ─────────────────────────────── */}
                        <Field
                            label="Address Line *"
                            field="addressLine"
                            placeholder="Flat / House no, Building, Street"
                            {...fieldProps}
                        />

                        {/* ── Landmark ─────────────────────────────────── */}
                        <Field
                            label="Landmark (optional)"
                            field="landmark"
                            placeholder="Near landmark"
                            {...fieldProps}
                        />

                        {/* ── City + Pincode ───────────────────────────── */}
                        <View style={styles.row}>
                            <View style={styles.halfLeft}>
                                <Field
                                    label="City *"
                                    field="city"
                                    placeholder="City"
                                    autoCapitalize="words"
                                    {...fieldProps}
                                />
                            </View>
                            <View style={styles.halfRight}>
                                <Field
                                    label="Pincode *"
                                    field="pincode"
                                    placeholder="6-digit PIN"
                                    keyboardType="numeric"
                                    maxLength={6}
                                    autoCapitalize="none"
                                    {...fieldProps}
                                />
                            </View>
                        </View>

                        {/* ── State ────────────────────────────────────── */}
                        <Field
                            label="State *"
                            field="state"
                            placeholder="e.g. Karnataka"
                            autoCapitalize="words"
                            {...fieldProps}
                        />

                        {/* ── Default toggle ───────────────────────────── */}
                        <TouchableOpacity
                            style={styles.defaultToggle}
                            onPress={() => update('isDefault', !form.isDefault)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkboxBox, form.isDefault && styles.checkboxChecked]}>
                                {form.isDefault && (
                                    <Ionicons name="checkmark" size={14} color={isDark ? '#1A0B2E' : '#fff'} />
                                )}
                            </View>
                            <Text style={[styles.defaultToggleText, { color: colors.textPrimary }]}>
                                Set as default address
                            </Text>
                        </TouchableOpacity>

                        {/* ── Save button ──────────────────────────────── */}
                        <TouchableOpacity
                            style={[styles.saveButton, isSaving && { opacity: 0.6 }]}
                            onPress={handleSave}
                            activeOpacity={0.85}
                            disabled={isSaving}
                        >
                            <LinearGradient
                                colors={gradients.button}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.saveGradient}
                            >
                                <Text style={[styles.saveText, { color: isDark ? '#1A0B2E' : '#fff' }]}>
                                    {isSaving ? 'Saving…' : 'Save Address'}
                                </Text>
                                {!isSaving && (
                                    <Ionicons
                                        name="checkmark-circle-outline"
                                        size={20}
                                        color={isDark ? '#1A0B2E' : '#fff'}
                                    />
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Extra bottom padding so the save button clears the keyboard */}
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
            </LinearGradient>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    gradient: { flex: 1 },
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
    formContainer: { padding: 20, paddingBottom: 24 },
    row: { flexDirection: 'row' },
    halfLeft: { flex: 1, marginRight: 8 },
    halfRight: { flex: 1, marginLeft: 8 },
    fieldContainer: { marginBottom: 18 },
    fieldLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary, marginBottom: 8 },
    input: {
        backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border,
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13,
        fontSize: 15, color: colors.textPrimary,
    },
    inputError: { borderColor: '#FF4757' },
    errorText: { fontSize: 12, color: '#FF4757', marginTop: 4 },
    defaultToggle: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, marginTop: 4 },
    checkboxBox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        borderColor: colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
    defaultToggleText: { fontSize: 15, fontWeight: '500' },
    saveButton: { borderRadius: 14, overflow: 'hidden' },
    saveGradient: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 16, gap: 8,
    },
    saveText: { fontSize: 16, fontWeight: 'bold' },
});

export default AddAddressScreen;