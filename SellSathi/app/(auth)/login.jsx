/**
 * SellSathi – app/(auth)/login.jsx
 * Lumina Noir Design System · Dark theme
 *
 * Dependencies:
 *   npx expo install expo-linear-gradient react-native-safe-area-context
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { C } from '../../constants/colors';

const { width: W } = Dimensions.get('window');

// ─── Scale press animation helper ────────────────────────────────────────────
function ScalePress({ children, style, onPress, disabled }) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 50 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 50 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} disabled={disabled}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();

  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab]           = useState('email'); // 'email' | 'phone'
  const [email, setEmail]       = useState('');
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // ── Tab slide indicator ────────────────────────────────────────────────────
  const tabSlide = useRef(new Animated.Value(0)).current;
  const slideToTab = (t) => {
    setTab(t);
    setError('');
    Animated.spring(tabSlide, {
      toValue: t === 'email' ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const tabIndicatorX = tabSlide.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, (W - 48) / 2],
  });

  // ── OTP box refs for auto-focus ────────────────────────────────────────────
  const otpRefs = useRef([...Array(6)].map(() => React.createRef()));

  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1].current?.focus();
    if (!val && idx > 0) otpRefs.current[idx - 1].current?.focus();
  };

  // ── Send OTP ───────────────────────────────────────────────────────────────
  const handleSendOtp = () => {
    if (!phone || phone.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    // TODO: replace with real OTP API call
    // import { sendOtp } from '../../services/api';
    // await sendOtp({ phone });
    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setError('');
    }, 1500);
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = () => {
    setError('');

    // Validation
    if (tab === 'email') {
      if (!email)    { setError('Please enter your email'); return; }
      if (!password) { setError('Please enter your password'); return; }
    } else {
      if (!otpSent)               { setError('Please send OTP first'); return; }
      if (otp.join('').length < 6) { setError('Enter the 6-digit OTP'); return; }
    }

    setLoading(true);

    // TODO: replace with real login API call
    // import { login } from '../../services/api';
    // import { useAuthStore } from '../../store/useAuthStore';
    // const { login: storeLogin } = useAuthStore();
    // const res = await login({ email, password });
    // storeLogin(res.data.user, res.data.token);

    setTimeout(() => {
      setLoading(false);
      // Navigate to home tabs after login
      router.replace('/(tabs)/home');
    }, 1800);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Background glow orbs */}
        <View style={styles.orb1} />
        <View style={styles.orb2} />

        {/* ── Logo area ── */}
        <View style={styles.logoArea}>
          <LinearGradient
            colors={[C.accent, '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Text style={styles.iconEmoji}>🛍</Text>
          </LinearGradient>
          <Text style={styles.brand}>
            Sell<Text style={{ color: C.accent }}>Sathi</Text>
          </Text>
          <Text style={styles.subtitle}>Welcome back! Sign in to continue</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>

          {/* Tab switcher — Email / Phone */}
          <View style={styles.tabSwitcher}>
            <Animated.View
              style={[
                styles.tabIndicator,
                { transform: [{ translateX: tabIndicatorX }] },
              ]}
            >
              <LinearGradient
                colors={[C.accent, '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <TouchableOpacity style={styles.tabBtn} onPress={() => slideToTab('email')}>
              <Text style={[styles.tabBtnText, tab === 'email' && styles.tabBtnTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tabBtn} onPress={() => slideToTab('phone')}>
              <Text style={[styles.tabBtnText, tab === 'phone' && styles.tabBtnTextActive]}>
                Phone / OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Email form ── */}
          {tab === 'email' && (
            <View style={styles.formArea}>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email address</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={C.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    selectionColor={C.accent}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={C.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPass}
                    selectionColor={C.accent}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPass(!showPass)}
                    style={styles.eyeBtn}
                  >
                    <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot password */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </TouchableOpacity>

            </View>
          )}

          {/* ── Phone / OTP form ── */}
          {tab === 'phone' && (
            <View style={styles.formArea}>

              {/* Phone number */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mobile number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+91</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { paddingLeft: 0 }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={C.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    selectionColor={C.accent}
                  />
                  {!otpSent && (
                    <TouchableOpacity
                      style={styles.sendOtpBtn}
                      onPress={handleSendOtp}
                      disabled={loading}
                    >
                      <Text style={styles.sendOtpText}>
                        {loading ? '...' : 'Send OTP'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* OTP boxes — shown after OTP is sent */}
              {otpSent && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Enter OTP sent to +91 {phone}
                  </Text>
                  <View style={styles.otpRow}>
                    {otp.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={otpRefs.current[idx]}
                        style={[styles.otpBox, digit && styles.otpBoxFilled]}
                        value={digit}
                        onChangeText={(val) => handleOtpChange(val.slice(-1), idx)}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectionColor={C.accent}
                        textAlign="center"
                      />
                    ))}
                  </View>
                  <TouchableOpacity style={{ marginTop: 8 }}>
                    <Text style={styles.resendText}>
                      Resend OTP in{' '}
                      <Text style={{ color: C.accent }}>30s</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            </View>
          )}

          {/* Error message */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          )}

          {/* Sign in button */}
          <ScalePress
            onPress={handleLogin}
            disabled={loading}
            style={{ marginTop: 16 }}
          >
            <LinearGradient
              colors={loading
                ? [C.surfaceBrd, C.surfaceBrd]
                : [C.accent, '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginBtn}
            >
              <Text style={styles.loginBtnText}>
                {loading
                  ? 'Signing in...'
                  : tab === 'phone' && otpSent
                  ? 'Verify & Sign In'
                  : 'Sign In'}
              </Text>
            </LinearGradient>
          </ScalePress>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social buttons */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialIcon}>G</Text>
              <Text style={styles.socialText}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialBtn}>
              <Text style={styles.socialIcon}>f</Text>
              <Text style={styles.socialText}>Facebook</Text>
            </TouchableOpacity>
          </View>

        </View>

        {/* Register link */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Create Account</Text>
          </TouchableOpacity>
        </View>

        {/* Seller login link */}
        <TouchableOpacity style={styles.sellerLink}>
          <Text style={styles.sellerLinkText}>
            Are you a seller?{' '}
            <Text style={{ color: C.accent }}>Login as Seller →</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  // Glow orbs
  orb1: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(0,229,255,0.05)', top: -60, right: -80,
  },
  orb2: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(124,58,237,0.07)', top: 200, left: -60,
  },

  // Logo
  logoArea: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  iconEmoji: { fontSize: 30 },
  brand: { fontSize: 28, fontWeight: '900', color: C.textPrimary },
  subtitle: { fontSize: 13, color: C.textSec, marginTop: 6 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: C.cardBrd,
  },

  // Tab switcher
  tabSwitcher: {
    flexDirection: 'row', position: 'relative',
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    marginBottom: 24, overflow: 'hidden',
    borderWidth: 1, borderColor: C.cardBrd,
  },
  tabIndicator: {
    position: 'absolute', top: 0, bottom: 0,
    width: '50%', borderRadius: 11, overflow: 'hidden',
  },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', zIndex: 1 },
  tabBtnText: { fontSize: 13, fontWeight: '600', color: C.textSec },
  tabBtnTextActive: { color: C.bg, fontWeight: '800' },

  // Form
  formArea: { gap: 16 },
  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: 12, color: C.textSec,
    fontWeight: '600', letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surfaceAlt, borderRadius: 12,
    borderWidth: 1, borderColor: C.cardBrd,
    paddingHorizontal: 14, minHeight: 50,
  },
  inputIcon: { fontSize: 15, marginRight: 10, color: C.textSec },
  input: {
    flex: 1, color: C.textPrimary,
    fontSize: 14, paddingVertical: 12,
  },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 15 },

  // Country code
  countryCode: {
    paddingRight: 12, marginRight: 8,
    borderRightWidth: 1, borderRightColor: C.cardBrd,
  },
  countryCodeText: { color: C.textSec, fontSize: 14, fontWeight: '600' },

  // Send OTP button
  sendOtpBtn: {
    backgroundColor: 'rgba(0,229,255,0.12)',
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: C.accent,
  },
  sendOtpText: { color: C.accent, fontSize: 12, fontWeight: '700' },

  // OTP boxes
  otpRow: {
    flexDirection: 'row', gap: 8,
    justifyContent: 'space-between',
  },
  otpBox: {
    flex: 1, height: 50, borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.cardBrd,
    color: C.textPrimary, fontSize: 20, fontWeight: '800',
  },
  otpBoxFilled: {
    borderColor: C.accent,
    backgroundColor: 'rgba(0,229,255,0.08)',
  },
  resendText: { fontSize: 12, color: C.textSec },

  // Forgot password
  forgotBtn: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { color: C.accent, fontSize: 12, fontWeight: '600' },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,71,87,0.12)',
    borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(255,71,87,0.3)',
    marginTop: 8,
  },
  errorText: { color: C.danger, fontSize: 13 },

  // Login button
  loginBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  loginBtnText: {
    color: C.bg, fontWeight: '900', fontSize: 15, letterSpacing: 1,
  },

  // Divider
  divider: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.cardBrd },
  dividerText: { color: C.textMuted, fontSize: 12 },

  // Social buttons
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 13, borderRadius: 12,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1, borderColor: C.cardBrd,
  },
  socialIcon: { fontSize: 15, fontWeight: '900', color: C.textPrimary },
  socialText: { color: C.textSec, fontSize: 13, fontWeight: '600' },

  // Register link
  registerRow: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', marginTop: 24,
  },
  registerText: { color: C.textSec, fontSize: 13 },
  registerLink: { color: C.accent, fontSize: 13, fontWeight: '700' },

  // Seller link
  sellerLink: { alignItems: 'center', marginTop: 14 },
  sellerLinkText: { color: C.textMuted, fontSize: 12 },
});