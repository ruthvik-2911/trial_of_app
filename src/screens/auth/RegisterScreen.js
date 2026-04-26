// ─── src/screens/auth/RegisterScreen.js ────────────────────────────────────
//
// Connected to the central AuthContext.
// After a successful registration the context automatically:
//   • stores uid / user / token in AsyncStorage
//   • updates Redux (authSlice)
//   • makes uid available app-wide via useAuth()
//
// No uid passing via route.params is required anywhere.
// ──────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';

// ── Central auth hook — the ONLY import needed for auth state ──────────────
import { useAuth } from '../../context/AuthContext';

// ─── Firebase Client SDK ────────────────────────────────────────────────────
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    getReactNativePersistence,
    createUserWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    GoogleAuthProvider,
    signInWithCredential,
    OAuthProvider,
    PhoneAuthProvider,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import * as Apple from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
// GoogleSignin is loaded dynamically below to prevent crashes in Expo Go
import ENV from '../../config/env';

let GoogleSignin = null;
let statusCodes = null;

try {
    const GoogleSigninModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleSigninModule.GoogleSignin;
    statusCodes = GoogleSigninModule.statusCodes;
} catch (e) {
    console.log('ℹ️ [RegisterScreen] GoogleSignin module not found (Expo Go)');
}


// Configure Native Google Sign-In safely
try {
    if (GoogleSignin) {
        GoogleSignin.configure({
            webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        });
    }
} catch (e) {
    console.log('ℹ️ [RegisterScreen] Error configuring GoogleSignin:', e.message);
}


WebBrowser.maybeCompleteAuthSession();

const firebaseConfig = {
    apiKey: 'AIzaSyAgz9OL6NYOxwxpzgz7e6Y1Zk6861Gpvt0',
    authDomain: 'sellsathi-94ede.firebaseapp.com',
    projectId: 'sellsathi-94ede',
    storageBucket: 'sellsathi-94ede.firebasestorage.app',
    messagingSenderId: '213392011043',
    appId: '1:213392011043:web:669298ae968e8af8a6a696',
    measurementId: 'G-TRNXGBX0HL',
};

if (!getApps().length) {
    const app = initializeApp(firebaseConfig);
    initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
}
// ────────────────────────────────────────────────────────────────────────────

const RegisterScreen = ({ navigation }) => {
    const { colors, gradients, isDark } = useTheme();

    // ── Pull register action from the central context ───────────────────────
    // uid, user, token are set automatically inside AuthContext.register()
    const { register } = useAuth();

    // ── Local UI state ──────────────────────────────────────────────────────
    const [authMethod, setAuthMethod] = useState('email');
    const [formData, setFormData] = useState({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaVerifierRef = useRef(null);

    // Native Google Sign-In does not require AuthSession redirect hooks.

    // ── Helpers ─────────────────────────────────────────────────────────────
    const updateFormData = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));
    const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const validatePhone = (val) => /^[6-9]\d{9}$/.test(val);

    const firebaseErrorMap = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-verification-code': 'Invalid OTP. Please try again.',
        'auth/code-expired': 'OTP has expired. Please resend.',
        'auth/invalid-phone-number': 'Invalid phone number.',
    };

    const getFriendlyError = (code, fallback) =>
        firebaseErrorMap[code] || fallback || 'Something went wrong.';

    const validateCommonFields = () => {
        const { fullName, email, phone, password, confirmPassword } = formData;
        if (!fullName || fullName.length < 2) { Alert.alert('Error', 'Please enter a valid full name'); return false; }
        if (authMethod === 'email') {
            if (!email) { Alert.alert('Error', 'Please enter your email'); return false; }
            if (!validateEmail(email)) { Alert.alert('Error', 'Please enter a valid email'); return false; }
            if (!password || password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return false; }
            if (password !== confirmPassword) { Alert.alert('Error', 'Passwords do not match'); return false; }
        }
        if (authMethod === 'phone') {
            if (!phone || !validatePhone(phone)) { Alert.alert('Error', 'Please enter a valid 10-digit phone number'); return false; }
            if (!email) { Alert.alert('Error', 'Please enter your email'); return false; }
        }
        if (!agreedToTerms) { Alert.alert('Error', 'Please agree to Terms & Conditions'); return false; }
        return true;
    };

    // ── Core: Firebase → backend → AuthContext ──────────────────────────────
    /**
     * After Firebase auth succeeds, hand the idToken off to AuthContext.register().
     * AuthContext handles storing uid / user / token everywhere automatically.
     */
    const handleBackendRegister = async (userCredential, extraPayload = {}) => {
        const firebaseUser = userCredential.user;
        console.log('✅ [RegisterScreen] Firebase auth OK — UID:', firebaseUser.uid);

        const idToken = await firebaseUser.getIdToken();

        const payload = {
            idToken,
            isTest: false,
            fullName: formData.fullName || extraPayload.fullName || '',
            email: firebaseUser.email || formData.email || extraPayload.email || null,
            phone: firebaseUser.phoneNumber || (formData.phone ? `+91${formData.phone}` : null) || extraPayload.phone || null,
            password: formData.password || null,
        };

        const result = await register(payload);

        return result;
    };

    const navigateAfterRegister = () => {
        Alert.alert('Success', 'Registration successful!', [{
            text: 'OK',
            onPress: () => {
                if (navigation.canGoBack()) navigation.goBack();
                else navigation.getParent()?.replace('Main') ?? navigation.replace('Main');
            },
        }]);
    };

    // ── 1. Email + Password ─────────────────────────────────────────────────
    const handleEmailRegister = async () => {
        if (!validateCommonFields()) return;

        setIsLoading(true);
        try {
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const result = await handleBackendRegister(userCredential);
            setIsLoading(false);
            if (result.success) navigateAfterRegister();
            else Alert.alert('Error', result.error || 'Registration failed');
        } catch (err) {
            setIsLoading(false);
            console.error('❌ [RegisterScreen] [EMAIL]', err.code, err.message);
            Alert.alert('Registration Failed', getFriendlyError(err.code, err.message));
        }
    };

    // ── 2. Phone — Send OTP ─────────────────────────────────────────────────
    const handleSendOTP = async () => {
        if (!validateCommonFields()) return;

        setIsLoading(true);
        try {
            const cleaned = formData.phone.replace(/\D/g, '');
            const auth = getAuth();
            const phoneProvider = new PhoneAuthProvider(auth);

            const verificationId = await phoneProvider.verifyPhoneNumber(
                `+91${cleaned}`,
                recaptchaVerifierRef.current
            );
            
            setConfirmationResult({ verificationId });
            setOtpStep(true);
            setIsLoading(false);
            Alert.alert('OTP Sent', `A 6-digit OTP has been sent to +91${cleaned}`);
        } catch (err) {
            setIsLoading(false);
            console.error('❌ [RegisterScreen] [PHONE] Send OTP:', err);
            Alert.alert('Error', getFriendlyError(err.code, err.message));
        }
    };

    // ── 3. Phone — Verify OTP & Register ───────────────────────────────────
    const handleVerifyOTPAndRegister = async () => {
        if (otp.length !== 6) return Alert.alert('Error', 'Please enter the 6-digit OTP');
        if (!confirmationResult) return Alert.alert('Error', 'Please resend OTP first');

        setIsLoading(true);
        try {
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
            const userCredential = await signInWithCredential(getAuth(), credential);
            
            const result = await handleBackendRegister(userCredential);
            setIsLoading(false);
            if (result.success) navigateAfterRegister();
            else Alert.alert('Error', result.error || 'Registration failed');
        } catch (err) {
            setIsLoading(false);
            console.error('❌ [RegisterScreen] [PHONE] Verify OTP:', err.code, err.message);
            Alert.alert('Error', getFriendlyError(err.code, err.message));
        }
    };

    // ── 4. Google — exchange OAuth token with Firebase, then backend ────────
    // ── 4. Google — exchange OAuth token with Firebase, then backend ────────
    const handleGoogleRegister = async () => {
        // Prevent multiple simultaneous calls
        if (isLoading) return;

        // Guard: native module not available (Expo Go)
        if (!GoogleSignin) {
            Alert.alert(
                'Not Available',
                'Google Sign-In requires a development build and cannot run in Expo Go. Please use a built APK.',
            );
            return;
        }

        setIsLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const userInfo = await GoogleSignin.signIn();

            // Support both v13+ and older object shapes
            const idToken = userInfo.data?.idToken || userInfo.idToken;

            if (!idToken) throw new Error('No ID token present');

            const auth = getAuth();
            const credential = GoogleAuthProvider.credential(idToken);
            const userCredential = await signInWithCredential(auth, credential);

            const result = await handleBackendRegister(userCredential);
            setIsLoading(false);

            if (result.success) navigateAfterRegister();
            else Alert.alert('Error', result.error || 'Google sign-up failed');
        } catch (error) {
            setIsLoading(false);
            if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('ℹ️ [RegisterScreen] [GOOGLE] Cancelled');
            } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
                console.log('ℹ️ [RegisterScreen] [GOOGLE] In progress');
            } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Play services not available or outdated');
            } else {
                console.error('❌ [RegisterScreen] [GOOGLE] Error:', error);
                Alert.alert('Google Sign-Up Failed', error.message || 'Could not open Google Sign-in.');
            }
        }
    };

    // ── 5. Apple Sign-Up (iOS only) ─────────────────────────────────────────
    const handleAppleRegister = async () => {
        setIsLoading(true);
        try {
            const appleCredential = await Apple.signInAsync({
                requestedScopes: [
                    Apple.AppleAuthenticationScope.FULL_NAME,
                    Apple.AppleAuthenticationScope.EMAIL,
                ],
            });

            const { identityToken, nonce, fullName } = appleCredential;
            if (!identityToken) throw new Error('No identity token from Apple');

            const auth = getAuth();
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
            const userCredential = await signInWithCredential(auth, credential);

            // Apple provides fullName only on the very first sign-in
            const appleFullName = fullName?.givenName && fullName?.familyName
                ? `${fullName.givenName} ${fullName.familyName}`
                : formData.fullName || '';

            const result = await handleBackendRegister(userCredential, { fullName: appleFullName });
            setIsLoading(false);
            if (result.success) navigateAfterRegister();
            else Alert.alert('Error', result.error || 'Apple sign-up failed');
        } catch (err) {
            setIsLoading(false);
            if (err.code === 'ERR_CANCELED') {
                return;
            }
            console.error('❌ [RegisterScreen] [APPLE]', err.code, err.message);
            Alert.alert('Apple Sign-Up Failed', getFriendlyError(err.code, err.message));
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={gradients.background} style={styles.gradient}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            {/* ── Header ── */}
                            <View style={styles.header}>
                                <TouchableOpacity
                                    style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                    onPress={() => navigation.goBack()}
                                >
                                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            {/* ── Logo ── */}
                            <View style={styles.logoContainer}>
                                <Image
                                    source={isDark ? require('../../assets/images/logo-dark.png') : require('../../assets/images/logo-light.png')}
                                    style={{ width: 240, height: 180, marginBottom: -20 }}
                                    resizeMode="contain"
                                />
                                <Text style={[styles.brandName, { color: colors.textPrimary }]}>
                                    Good<Text style={{ color: colors.accent }}>Kart</Text>
                                </Text>
                                <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Trusted Marketplace</Text>
                            </View>

                            {/* ── Welcome ── */}
                            <View style={styles.welcomeContainer}>
                                <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>Create Account</Text>
                                <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>Sign up to start shopping</Text>
                            </View>

                            {/* ── Auth Method Toggle ── */}
                            <View style={[styles.toggleContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, authMethod === 'email' && { backgroundColor: colors.accent }]}
                                    onPress={() => { setAuthMethod('email'); setOtpStep(false); }}
                                >
                                    <Ionicons name="mail-outline" size={16} color={authMethod === 'email' ? colors.background : colors.textSecondary} />
                                    <Text style={[styles.toggleText, { color: authMethod === 'email' ? colors.background : colors.textSecondary }]}>Email</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.toggleBtn, authMethod === 'phone' && { backgroundColor: colors.accent }]}
                                    onPress={() => { setAuthMethod('phone'); setOtpStep(false); }}
                                >
                                    <Ionicons name="phone-portrait-outline" size={16} color={authMethod === 'phone' ? colors.background : colors.textSecondary} />
                                    <Text style={[styles.toggleText, { color: authMethod === 'phone' ? colors.background : colors.textSecondary }]}>Phone OTP</Text>
                                </TouchableOpacity>
                            </View>

                            {/* ── Shared: Full Name ── */}
                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                <Ionicons name="person-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary }]}
                                    placeholder="Full Name"
                                    placeholderTextColor={colors.textMuted}
                                    value={formData.fullName}
                                    onChangeText={(val) => updateFormData('fullName', val)}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* ── Email Form ── */}
                            {authMethod === 'email' && (
                                <View>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Email Address"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.email}
                                            onChangeText={(val) => updateFormData('email', val)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="call-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Phone Number (optional)"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.phone}
                                            onChangeText={(val) => updateFormData('phone', val.replace(/\D/g, '').slice(0, 10))}
                                            keyboardType="phone-pad"
                                        />
                                    </View>

                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Password"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.password}
                                            onChangeText={(val) => updateFormData('password', val)}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Confirm Password"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.confirmPassword}
                                            onChangeText={(val) => updateFormData('confirmPassword', val)}
                                            secureTextEntry={!showConfirmPassword}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                                            <Ionicons name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Password strength hint */}
                                    <View style={styles.requirementsContainer}>
                                        <View style={styles.requirementRow}>
                                            <Ionicons
                                                name={formData.password.length >= 8 ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={16}
                                                color={formData.password.length >= 8 ? colors.success : colors.textMuted}
                                            />
                                            <Text style={[styles.requirementText, { color: colors.textMuted }]}>At least 8 characters</Text>
                                        </View>
                                    </View>

                                    {/* Terms */}
                                    <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                                        <View style={[styles.checkbox, { borderColor: colors.border }, agreedToTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                                            {agreedToTerms && <Ionicons name="checkmark" size={16} color={colors.background} />}
                                        </View>
                                        <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                                            I agree to{' '}
                                            <Text style={[styles.linkText, { color: colors.accent }]}>Terms & Conditions</Text>
                                            {' '}and{' '}
                                            <Text style={[styles.linkText, { color: colors.accent }]}>Privacy Policy</Text>
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.registerButton} onPress={handleEmailRegister} disabled={isLoading}>
                                        <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerButtonGradient}>
                                            {isLoading
                                                ? <ActivityIndicator color={colors.background} />
                                                : <Text style={[styles.registerButtonText, { color: '#0D0B1E' }]}>Sign Up</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* ── Phone Form ── */}
                            {authMethod === 'phone' && (
                                <View>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Email Address"
                                            placeholderTextColor={colors.textMuted}
                                            value={formData.email}
                                            onChangeText={(val) => updateFormData('email', val)}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    {!otpStep ? (
                                        <>
                                            <View style={[styles.phoneContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                                <View style={[styles.phonePrefix, { borderColor: colors.border }]}>
                                                    <Text style={[styles.phonePrefixText, { color: colors.accent }]}>+91</Text>
                                                </View>
                                                <TextInput
                                                    style={[styles.phoneInput, { color: colors.textPrimary }]}
                                                    placeholder="Mobile Number"
                                                    placeholderTextColor={colors.textMuted}
                                                    value={formData.phone}
                                                    onChangeText={(val) => updateFormData('phone', val.replace(/\D/g, '').slice(0, 10))}
                                                    keyboardType="phone-pad"
                                                />
                                            </View>

                                            {/* Terms */}
                                            <TouchableOpacity style={styles.checkboxContainer} onPress={() => setAgreedToTerms(!agreedToTerms)}>
                                                <View style={[styles.checkbox, { borderColor: colors.border }, agreedToTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
                                                    {agreedToTerms && <Ionicons name="checkmark" size={16} color={colors.background} />}
                                                </View>
                                                <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
                                                    I agree to{' '}
                                                    <Text style={[styles.linkText, { color: colors.accent }]}>Terms & Conditions</Text>
                                                    {' '}and{' '}
                                                    <Text style={[styles.linkText, { color: colors.accent }]}>Privacy Policy</Text>
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.registerButton, formData.phone.length < 10 && { opacity: 0.5 }]}
                                                onPress={handleSendOTP}
                                                disabled={isLoading || formData.phone.length < 10}
                                            >
                                                <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerButtonGradient}>
                                                    {isLoading
                                                        ? <ActivityIndicator color={colors.background} />
                                                        : <Text style={[styles.registerButtonText, { color: '#0D0B1E' }]}>Get OTP</Text>
                                                    }
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.otpHint, { color: colors.textSecondary }]}>
                                                Enter the 6-digit OTP sent to +91{formData.phone}
                                            </Text>

                                            <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                                <Ionicons name="keypad-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                                <TextInput
                                                    style={[styles.otpInput, { color: colors.textPrimary }]}
                                                    placeholder="0  0  0  0  0  0"
                                                    placeholderTextColor={colors.textMuted}
                                                    value={otp}
                                                    onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
                                                    keyboardType="number-pad"
                                                    maxLength={6}
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.registerButton, otp.length < 6 && { opacity: 0.5 }]}
                                                onPress={handleVerifyOTPAndRegister}
                                                disabled={isLoading || otp.length < 6}
                                            >
                                                <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.registerButtonGradient}>
                                                    {isLoading
                                                        ? <ActivityIndicator color={colors.background} />
                                                        : <Text style={[styles.registerButtonText, { color: '#0D0B1E' }]}>Verify & Register</Text>
                                                    }
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity onPress={() => { setOtpStep(false); setOtp(''); }} style={styles.backLink}>
                                                <Ionicons name="arrow-back-outline" size={16} color={colors.accent} />
                                                <Text style={[styles.backLinkText, { color: colors.accent }]}>Change Number</Text>
                                            </TouchableOpacity>
                                        </>
                                    )}
                                </View>
                            )}

                            {/* ── OR Divider ── */}
                            <View style={styles.dividerContainer}>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                                <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
                                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            </View>

                            {/* ── Google ── */}
                            <TouchableOpacity
                                style={[styles.socialFullButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                                onPress={handleGoogleRegister}
                                disabled={isLoading}
                            >
                                <Ionicons name="logo-google" size={20} color="#EA4335" />
                                <Text style={[styles.socialFullButtonText, { color: colors.textPrimary }]}>Sign Up with Google</Text>
                            </TouchableOpacity>

                            {/* ── Apple (iOS only) ── */}
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={[styles.socialFullButton, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}
                                    onPress={handleAppleRegister}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                                    <Text style={[styles.socialFullButtonText, { color: colors.textPrimary }]}>Sign Up with Apple</Text>
                                </TouchableOpacity>
                            )}

                            {/* ── Login Link ── */}
                            <View style={styles.loginContainer}>
                                <Text style={[styles.loginText, { color: colors.textSecondary }]}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                    <Text style={[styles.loginLink, { color: colors.accent }]}>Login</Text>
                                </TouchableOpacity>
                            </View>

                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </LinearGradient>

            {/* Phone auth recaptcha has been removed due to Firebase billing limitations */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    keyboardView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

    header: { paddingTop: 0, marginBottom: 4 },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },

    logoContainer: { alignItems: 'center', marginBottom: 12 },
    logoCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    logoText: { fontSize: 36, fontWeight: 'bold' },
    brandName: { fontSize: 28, fontWeight: 'bold' },
    tagline: { fontSize: 14 },

    welcomeContainer: { marginBottom: 20 },
    welcomeText: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
    welcomeSubtext: { fontSize: 16 },

    toggleContainer: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 20 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    toggleText: { fontSize: 14, fontWeight: '600' },

    inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, borderWidth: 1 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 56, fontSize: 16 },
    eyeIcon: { padding: 8 },

    phoneContainer: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
    phonePrefix: { paddingHorizontal: 14, justifyContent: 'center', borderRightWidth: 1 },
    phonePrefixText: { fontSize: 15, fontWeight: '700' },
    phoneInput: { flex: 1, height: 56, paddingHorizontal: 14, fontSize: 16, fontWeight: '700' },

    otpHint: { fontSize: 14, marginBottom: 16, textAlign: 'center' },
    otpInput: { flex: 1, height: 56, fontSize: 22, letterSpacing: 8, textAlign: 'center' },

    backLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
    backLinkText: { fontSize: 14, fontWeight: '600' },

    requirementsContainer: { marginBottom: 16, paddingHorizontal: 4 },
    requirementRow: { flexDirection: 'row', alignItems: 'center' },
    requirementText: { fontSize: 13, marginLeft: 8 },

    checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    checkboxText: { fontSize: 14, flex: 1 },
    linkText: { fontWeight: '600' },

    registerButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
    registerButtonGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    registerButtonText: { fontSize: 18, fontWeight: 'bold' },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { paddingHorizontal: 16, fontSize: 14 },

    socialFullButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54, borderRadius: 12, borderWidth: 1 },
    socialFullButtonText: { fontSize: 15, fontWeight: '600' },

    loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
    loginText: { fontSize: 16 },
    loginLink: { fontSize: 16, fontWeight: 'bold' },
});

export default RegisterScreen;