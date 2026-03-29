/**
 * SellSathi – app/(auth)/splash.jsx
 * Lumina Noir Design System · Dark theme
 *
 * Dependencies:
 *   npx expo install expo-linear-gradient react-native-safe-area-context
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { C } from '../../constants/colors';

const { width: W } = Dimensions.get('window');

export default function SplashScreen() {
  // ── Animated values ──────────────────────────────────────────────────────
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.7)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const barWidth       = useRef(new Animated.Value(0)).current;
  const screenOpacity  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Logo fades + scales in
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1, duration: 700, useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1, friction: 5, useNativeDriver: true,
        }),
      ]),
      // 2. Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      // 3. Loading bar fills (cannot use nativeDriver for width)
      Animated.timing(barWidth, {
        toValue: W - 80, duration: 1400, useNativeDriver: false,
      }),
      // 4. Short pause then fade out
      Animated.delay(300),
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 500, useNativeDriver: true,
      }),
    ]).start(() => {
      // ── Navigate to login after splash finishes ──
      router.replace('/(auth)/login');
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Background glow orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Logo + brand + tagline */}
      <Animated.View
        style={[
          styles.logoArea,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        {/* Icon circle */}
        <LinearGradient
          colors={[C.accent, '#0284C7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Text style={styles.iconEmoji}>🛍</Text>
        </LinearGradient>

        {/* Brand name */}
        <Text style={styles.brand}>
          Sell<Text style={{ color: C.accent }}>Sathi</Text>
        </Text>

        {/* Tagline */}
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
          India ka apna marketplace
        </Animated.Text>
      </Animated.View>

      {/* Loading progress bar */}
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, { width: barWidth }]}>
          <LinearGradient
            colors={[C.accent, '#0284C7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background glow orbs
  orb1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,229,255,0.06)',
    top: -80,
    left: -80,
  },
  orb2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(124,58,237,0.08)',
    bottom: 60,
    right: -60,
  },

  // Logo area
  logoArea: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconEmoji: {
    fontSize: 42,
  },
  brand: {
    fontSize: 38,
    fontWeight: '900',
    color: C.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: C.textSec,
    marginTop: 8,
    letterSpacing: 0.5,
  },

  // Loading bar
  barTrack: {
    width: W - 80,
    height: 3,
    backgroundColor: C.surfaceBrd,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },

  // Version
  version: {
    position: 'absolute',
    bottom: 40,
    color: C.textMuted,
    fontSize: 11,
  },
});