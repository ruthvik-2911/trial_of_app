// ─── src/screens/auth/LoginScreen.js ───────────────────────────────────────
//
// Connected to the central AuthContext.
// After a successful login the context automatically:
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
    signInWithEmailAndPassword,
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
    console.log('ℹ️ [LoginScreen] GoogleSignin module not found (Expo Go)');
}


// Configure Native Google Sign-In safely
try {
    if (GoogleSignin) {
        GoogleSignin.configure({
            webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        });
    }
} catch (e) {
    console.log('ℹ️ [LoginScreen] Error configuring GoogleSignin:', e.message);
}


WebBrowser.maybeCompleteAuthSession();

// Firebase is initialised once for the whole app; guard against double-init.
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

const LoginScreen = ({ navigation }) => {
    const { colors, gradients } = useTheme();

    // ── Pull login action from the central context ──────────────────────────
    const { login } = useAuth();

    // ─────────────────────────────────────────────────────────────────────────
    // Google Configuration is now handled natively via GoogleSignin.configure()

    // ── Local UI state ──────────────────────────────────────────────────────
    const [authMethod, setAuthMethod] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [otpStep, setOtpStep] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const recaptchaVerifierRef = useRef(null);

    // Native Google Sign-In does not require AuthSession redirect hooks.

    // ── Helpers ─────────────────────────────────────────────────────────────
    const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    const firebaseErrorMap = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/invalid-verification-code': 'Invalid OTP. Please try again.',
        'auth/code-expired': 'OTP has expired. Please resend.',
        'auth/invalid-phone-number': 'Invalid phone number.',
    };

    const getFriendlyError = (code, fallback) =>
        firebaseErrorMap[code] || fallback || 'Something went wrong.';

    // ── Core: Firebase → backend → AuthContext ──────────────────────────────
    /**
     * After Firebase auth succeeds, hand the idToken off to AuthContext.login().
     * AuthContext handles storing uid / user / token everywhere automatically.
     */
    const handleBackendLogin = async (userCredential, extraPayload = {}) => {
        const firebaseUser = userCredential.user;
        console.log('✅ [LoginScreen] Firebase auth OK — UID:', firebaseUser.uid);

        const idToken = await firebaseUser.getIdToken();

        const payload = {
            idToken,
            isTest: false,
            email: firebaseUser.email || extraPayload.email || null,
            phone: firebaseUser.phoneNumber || extraPayload.phone || null,
        };

        const result = await login(payload);

        console.log('📥 [LoginScreen] AuthContext.login() result:', JSON.stringify(result));
        return result;
    };

    const navigateAfterLogin = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.getParent()?.replace('Main') ?? navigation.replace('Main');
        }
    };

    // ── 1. Email + Password ─────────────────────────────────────────────────
    const handleEmailLogin = async () => {
        if (!email || !password) return Alert.alert('Error', 'Please fill in all fields');
        if (!validateEmail(email)) return Alert.alert('Error', 'Please enter a valid email address');
        if (password.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters');

        setIsLoading(true);
        try {
            const auth = getAuth();
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const result = await handleBackendLogin(userCredential, { email });
            setIsLoading(false);
            if (result.success) navigateAfterLogin();
            else Alert.alert('Error', result.error || 'Invalid email or password');
        } catch (err) {
            setIsLoading(false);
            console.error('❌ [LoginScreen] [EMAIL]', err.code, err.message);
            Alert.alert('Login Failed', getFriendlyError(err.code, err.message));
        }
    };

    // ── 2. Phone — Send OTP ─────────────────────────────────────────────────
    const handleSendOTP = async () => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length !== 10) return Alert.alert('Error', 'Please enter a valid 10-digit phone number');

        setIsLoading(true);
        try {
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
            console.error('❌ [LoginScreen] [PHONE] Send OTP:', err);
            Alert.alert('Error', getFriendlyError(err.code, err.message));
        }
    };

    // ── 3. Phone — Verify OTP ───────────────────────────────────────────────
    const handleVerifyOTP = async () => {
        if (otp.length !== 6) return Alert.alert('Error', 'Please enter the 6-digit OTP');
        if (!confirmationResult) return Alert.alert('Error', 'Please resend OTP first');

        setIsLoading(true);
        try {
            const credential = PhoneAuthProvider.credential(confirmationResult.verificationId, otp);
            const userCredential = await signInWithCredential(getAuth(), credential);
            
            const result = await handleBackendLogin(userCredential, { phone: `+91${phone}` });
            setIsLoading(false);
            if (result.success) navigateAfterLogin();
            else Alert.alert('Error', result.error || 'Login failed');
        } catch (err) {
            setIsLoading(false);
            console.error('❌ [LoginScreen] [PHONE] Verify OTP:', err.code, err.message);
            Alert.alert('Error', getFriendlyError(err.code, err.message));
        }
    };

    // ── 4. Google — exchange OAuth token with Firebase, then backend ────────
    const handleGoogleLogin = async () => {
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

            const result = await handleBackendLogin(userCredential);
            setIsLoading(false);

            if (result.success) navigateAfterLogin();
            else Alert.alert('Error', result.error || 'Google login failed');
        } catch (error) {
            setIsLoading(false);
            if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log('ℹ️ [LoginScreen] [GOOGLE] Cancelled');
            } else if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
            console.log('ℹ️ [LoginScreen] [GOOGLE] In progress');
            } else if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Play services not available or outdated');
            } else {
                console.error('❌ [LoginScreen] [GOOGLE] Error:', error);
                Alert.alert('Google Login Failed', error.message || 'Could not open Google Sign-in.');
            }
        }
    };

    // ── 5. Apple (iOS only) ─────────────────────────────────────────────────
    const handleAppleLogin = async () => {
        setIsLoading(true);
        try {
            const appleCredential = await Apple.signInAsync({
                requestedScopes: [
                    Apple.AppleAuthenticationScope.FULL_NAME,
                    Apple.AppleAuthenticationScope.EMAIL,
                ],
            });

            const { identityToken, nonce } = appleCredential;
            if (!identityToken) throw new Error('No identity token from Apple');

            const auth = getAuth();
            const provider = new OAuthProvider('apple.com');
            const credential = provider.credential({ idToken: identityToken, rawNonce: nonce });
            const userCredential = await signInWithCredential(auth, credential);

            const result = await handleBackendLogin(userCredential);
            setIsLoading(false);
            if (result.success) navigateAfterLogin();
            else Alert.alert('Error', result.error || 'Apple login failed');
        } catch (err) {
            setIsLoading(false);
            if (err.code === 'ERR_CANCELED') {
                return;
            }
            console.error('❌ [LoginScreen] [APPLE]', err.code, err.message);
            Alert.alert('Apple Login Failed', getFriendlyError(err.code, err.message));
        }
    };

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={gradients.background} style={styles.gradient}>
                <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                            {/* ── Logo ── */}
                            <View style={styles.logoContainer}>
                                <Image 
                                    source={require('../../assets/icons/2 (3).png')} 
                                    style={{ width: 80, height: 80, marginBottom: 12 }} 
                                    resizeMode="contain" 
                                />
                                <Text style={[styles.brandName, { color: colors.textPrimary }]}>
                                    Good<Text style={{ color: colors.accent }}>Kart</Text>
                                </Text>
                                <Text style={[styles.tagline, { color: colors.textSecondary }]}>Your Trusted Marketplace</Text>
                            </View>

                            {/* ── Welcome ── */}
                            <View style={styles.welcomeContainer}>
                                <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>Welcome Back!</Text>
                                <Text style={[styles.welcomeSubtext, { color: colors.textSecondary }]}>Login to continue shopping</Text>
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

                            {/* ── Email Form ── */}
                            {authMethod === 'email' && (
                                <View style={styles.formContainer}>
                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="mail-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Email Address"
                                            placeholderTextColor={colors.textMuted}
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                    </View>

                                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                                        <TextInput
                                            style={[styles.input, { color: colors.textPrimary }]}
                                            placeholder="Password"
                                            placeholderTextColor={colors.textMuted}
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                        />
                                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                                            <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity style={styles.forgotPasswordContainer}>
                                        <Text style={[styles.forgotPasswordText, { color: colors.accent }]}>Forgot Password?</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin} disabled={isLoading}>
                                        <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginButtonGradient}>
                                            {isLoading
                                                ? <ActivityIndicator color={colors.background} />
                                                : <Text style={[styles.loginButtonText, { color: '#0D0B1E' }]}>Login</Text>
                                            }
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            )}

                            {/* ── Phone Form ── */}
                            {authMethod === 'phone' && (
                                <View style={styles.formContainer}>
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
                                                    value={phone}
                                                    onChangeText={(val) => setPhone(val.replace(/\D/g, '').slice(0, 10))}
                                                    keyboardType="phone-pad"
                                                />
                                            </View>

                                            <TouchableOpacity
                                                style={[styles.loginButton, phone.length < 10 && { opacity: 0.5 }]}
                                                onPress={handleSendOTP}
                                                disabled={isLoading || phone.length < 10}
                                            >
                                                <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginButtonGradient}>
                                                    {isLoading
                                                        ? <ActivityIndicator color={colors.background} />
                                                        : <Text style={[styles.loginButtonText, { color: '#0D0B1E' }]}>Get OTP</Text>
                                                    }
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <>
                                            <Text style={[styles.otpHint, { color: colors.textSecondary }]}>
                                                Enter the 6-digit OTP sent to +91{phone}
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
                                                style={[styles.loginButton, otp.length < 6 && { opacity: 0.5 }]}
                                                onPress={handleVerifyOTP}
                                                disabled={isLoading || otp.length < 6}
                                            >
                                                <LinearGradient colors={gradients.accentButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginButtonGradient}>
                                                    {isLoading
                                                        ? <ActivityIndicator color={colors.background} />
                                                        : <Text style={[styles.loginButtonText, { color: '#0D0B1E' }]}>Verify & Login</Text>
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
                                onPress={handleGoogleLogin}
                                disabled={isLoading}
                            >
                                <Ionicons name="logo-google" size={20} color="#EA4335" />
                                <Text style={[styles.socialFullButtonText, { color: colors.textPrimary }]}>Continue with Google</Text>
                            </TouchableOpacity>

                            {/* ── Apple (iOS only) ── */}
                            {Platform.OS === 'ios' && (
                                <TouchableOpacity
                                    style={[styles.socialFullButton, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 12 }]}
                                    onPress={handleAppleLogin}
                                    disabled={isLoading}
                                >
                                    <Ionicons name="logo-apple" size={20} color={colors.textPrimary} />
                                    <Text style={[styles.socialFullButtonText, { color: colors.textPrimary }]}>Continue with Apple</Text>
                                </TouchableOpacity>
                            )}

                            {/* ── Sign Up Link ── */}
                            <View style={styles.signupContainer}>
                                <Text style={[styles.signupText, { color: colors.textSecondary }]}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={[styles.signupLink, { color: colors.accent }]}>Sign Up</Text>
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
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 },

    logoContainer: { alignItems: 'center', marginTop: 20, marginBottom: 32 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    logoText: { fontSize: 40, fontWeight: 'bold' },
    brandName: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
    tagline: { fontSize: 14 },

    welcomeContainer: { marginBottom: 24 },
    welcomeText: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    welcomeSubtext: { fontSize: 16 },

    toggleContainer: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, marginBottom: 24 },
    toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
    toggleText: { fontSize: 14, fontWeight: '600' },

    formContainer: { marginBottom: 4 },

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

    forgotPasswordContainer: { alignSelf: 'flex-end', marginBottom: 24 },
    forgotPasswordText: { fontSize: 14, fontWeight: '600' },

    loginButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 8 },
    loginButtonGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
    loginButtonText: { fontSize: 18, fontWeight: 'bold' },

    dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { paddingHorizontal: 16, fontSize: 14 },

    socialFullButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, height: 54, borderRadius: 12, borderWidth: 1 },
    socialFullButtonText: { fontSize: 15, fontWeight: '600' },

    signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
    signupText: { fontSize: 16 },
    signupLink: { fontSize: 16, fontWeight: 'bold' },
});

export default LoginScreen;