// ─── GoodKart Splash Screen ────────────────────────────────────────────────────
//
// Animation sequence:
//
//   1. Big bag logo drops from top
//   2. 12 product items fly from edges BEHIND the bag:
//      STAGE 1: Fly to the mouth of the bag.
//      STAGE 2: Drop into the belly of the bag.
//   3. Bag "gulps" as each item enters the mouth.
//   4. All absorbed → bag jiggles.
//   5. Bag shrinks away + All 12 Items vanish (force hide).
//   6. Logo pops in + Brand name + Tagline cascade.
//
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Image,
    Text,
    Animated,
    StyleSheet,
    StatusBar,
    Easing,
    Dimensions,
} from 'react-native';
import { LinearGradient } from '../../components/SafeLinearGradient';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const VIOLET_LIGHT = '#BEA1F7'; // Light Violet from logo
const VIOLET_DEEP = '#4910BC';  // Deep Grape from logo

const BAG_START_SIZE = 220;
const ITEM_SIZE = 68;
const ITEM_STAGGER = 120; // Tightened stagger for 12 items
const LOGO_SIZE = 100;

const BAG_IMAGE = require('../../assets/icons/2 (3).png');
const LOGO_IMAGE = require('../../assets/icons/2 (3).png');

// Varied product emojis for Fashion, Electronics, Home, and more
const ITEM_EMOJIS = [
    '📱', '👟', '👕', '⌚', '🎧', '🧴', // Original 6
    '🍳', '👔', '👜', '🚲', '💄', '🎮'  // New 6 (Home, Fashion, Accessories, Sports, Beauty, Gamer)
];

// Expanded 12 edge entry points (Corners, Sides, Top, Bottom)
const ITEM_STARTS = [
    // Top Row
    { x: -SCREEN_WIDTH * 0.70, y: -SCREEN_HEIGHT * 0.48 }, // Top-Left
    { x: 0, y: -SCREEN_HEIGHT * 0.58 },                   // Top-Center
    { x: SCREEN_WIDTH * 0.70, y: -SCREEN_HEIGHT * 0.48 },  // Top-Right
    // Middle-Top
    { x: -SCREEN_WIDTH * 0.68, y: -SCREEN_HEIGHT * 0.15 },
    { x: SCREEN_WIDTH * 0.68, y: -SCREEN_HEIGHT * 0.15 },
    // Middle Row
    { x: -SCREEN_WIDTH * 0.75, y: SCREEN_HEIGHT * 0.05 },  // Mid-Left
    { x: SCREEN_WIDTH * 0.75, y: SCREEN_HEIGHT * 0.05 },   // Mid-Right
    // Middle-Bottom
    { x: -SCREEN_WIDTH * 0.68, y: SCREEN_HEIGHT * 0.25 },
    { x: SCREEN_WIDTH * 0.68, y: SCREEN_HEIGHT * 0.25 },
    // Bottom Row
    { x: -SCREEN_WIDTH * 0.50, y: SCREEN_HEIGHT * 0.48 },  // Bottom-Left
    { x: 0, y: SCREEN_HEIGHT * 0.55 },                    // Bottom-Center
    { x: SCREEN_WIDTH * 0.50, y: SCREEN_HEIGHT * 0.48 },   // Bottom-Right
];

const GOOD_LETTERS = ['G', 'o', 'o', 'd'];
const KART_LETTERS = ['K', 'a', 'r', 't'];

const makeLetter = () => ({
    opacity: new Animated.Value(0),
    y: new Animated.Value(24),
});

const SplashScreen = ({ navigation }) => {

    const bagY = useRef(new Animated.Value(-SCREEN_HEIGHT * 0.6)).current;
    const bagOpacity = useRef(new Animated.Value(0)).current;
    const bagScale = useRef(new Animated.Value(0.7)).current;
    const bagRotate = useRef(new Animated.Value(0)).current;
    const bagGulp = useRef(new Animated.Value(1)).current;

    const logoOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.6)).current;

    const itemAnims = useRef(
        ITEM_STARTS.map((start) => ({
            x: new Animated.Value(start.x),
            y: new Animated.Value(start.y),
            scale: new Animated.Value(1),
            opacity: new Animated.Value(0),
            rotate: new Animated.Value(0),
        }))
    ).current;

    const goodAnims = useRef(GOOD_LETTERS.map(makeLetter)).current;
    const kartAnims = useRef(KART_LETTERS.map(makeLetter)).current;

    const taglineOpacity = useRef(new Animated.Value(0)).current;
    const taglineY = useRef(new Animated.Value(12)).current;

    const screenOpacity = useRef(new Animated.Value(1)).current;

    const BAG_MOUTH_Y = -40;
    const BAG_BELLY_Y = 15;

    const triggerLetter = (anim) =>
        Animated.parallel([
            Animated.timing(anim.opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.timing(anim.y, { toValue: 0, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ]);

    const triggerBagGulp = (delay) =>
        Animated.sequence([
            Animated.delay(delay + 380), // Tightened sync with faster flight
            Animated.timing(bagGulp, { toValue: 1.08, duration: 100, useNativeDriver: true }),
            Animated.timing(bagGulp, { toValue: 1, duration: 200, easing: Easing.out(Easing.back(2.5)), useNativeDriver: true }),
        ]);

    const flyItem = (item, delay, index) => {
        // Diversified settle positions for 12 items inside the bag belly
        const settleX = (index % 4 - 1.5) * 14;
        const settleY = BAG_BELLY_Y + (Math.floor(index / 4) * 12);

        return Animated.sequence([
            Animated.delay(delay),
            // STAGE 1: Fly to bag mouth
            Animated.parallel([
                Animated.timing(item.opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
                Animated.timing(item.x, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(item.y, { toValue: BAG_MOUTH_Y, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(item.scale, { toValue: 1, duration: 420, useNativeDriver: true }),
            ]),
            // STAGE 2: Drop into belly
            Animated.parallel([
                Animated.timing(item.x, { toValue: settleX, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                Animated.timing(item.y, { toValue: settleY, duration: 280, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                Animated.timing(item.scale, { toValue: 0.45, duration: 280, useNativeDriver: true }),
                Animated.timing(item.rotate, { toValue: 1, duration: 280, useNativeDriver: true }),
            ]),
        ]);
    };

    useEffect(() => {
        Animated.sequence([
            // 1. Bag Drop
            Animated.parallel([
                Animated.timing(bagOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(bagY, { toValue: 0, duration: 700, easing: Easing.out(Easing.bounce), useNativeDriver: true }),
                Animated.timing(bagScale, { toValue: 1, duration: 700, useNativeDriver: true }),
            ]),

            Animated.delay(200),

            // 2. 12 Items Fly In
            Animated.parallel([
                ...itemAnims.map((item, i) => flyItem(item, i * ITEM_STAGGER, i)),
                ...itemAnims.map((_, i) => triggerBagGulp(i * ITEM_STAGGER)),
            ]),

            Animated.delay(100),

            // 3. Jiggle
            Animated.sequence([
                Animated.timing(bagRotate, { toValue: 1, duration: 70, useNativeDriver: true }),
                Animated.timing(bagRotate, { toValue: -1, duration: 80, useNativeDriver: true }),
                Animated.timing(bagRotate, { toValue: 0, duration: 70, useNativeDriver: true }),
            ]),

            Animated.delay(200),

            // 4. Transform & Reveal (Bag and items shrink together)
            Animated.parallel([
                // Bag shrinks
                Animated.timing(bagScale, { toValue: 0, duration: 450, easing: Easing.in(Easing.back(1.5)), useNativeDriver: true }),
                Animated.timing(bagOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),

                // ROBUST CLEANUP: Force hide and SHRINK all items (prevents "stopping/stalling" look)
                ...itemAnims.map(item => Animated.parallel([
                    Animated.timing(item.opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
                    Animated.timing(item.scale, { toValue: 0, duration: 400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
                ])),

                Animated.sequence([
                    Animated.delay(300),
                    Animated.parallel([
                        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                        Animated.timing(logoScale, { toValue: 1, duration: 400, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
                    ]),
                ]),
            ]),

            // 5. Text Cascade
            Animated.stagger(55, [
                ...goodAnims.map(a => triggerLetter(a)),
                ...kartAnims.map(a => triggerLetter(a)),
            ]),

            Animated.parallel([
                Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.timing(taglineY, { toValue: 0, duration: 450, useNativeDriver: true }),
            ]),

            // 6. Total Fade Out
            Animated.timing(screenOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start(async () => {
            try {
                const hasLaunched = await AsyncStorage.getItem('hasLaunched');
                navigation?.replace(hasLaunched ? 'Main' : 'Auth');
                if (!hasLaunched) await AsyncStorage.setItem('hasLaunched', 'true');
            } catch (_) {
                navigation?.replace('Auth');
            }
        });
    }, []);

    const bagRotation = bagRotate.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-10deg', '0deg', '10deg'] });

    return (
        <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <LinearGradient colors={['#080612', '#0F0C1F', '#080612']} style={StyleSheet.absoluteFill} />

            <View style={styles.ambientGlow} />

            <View style={styles.center}>
                {/* 1. Products (Back Layer) */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    {itemAnims.map((item, i) => (
                        <Animated.View key={i} style={[styles.itemWrap, { opacity: item.opacity, transform: [{ translateX: item.x }, { translateY: item.y }, { scale: item.scale }, { rotate: item.rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }] }]}>
                            <Text style={styles.emoji}>{ITEM_EMOJIS[i]}</Text>
                        </Animated.View>
                    ))}
                </View>

                {/* 2. Bag (Middle Layer) */}
                <Animated.View style={[styles.bagBox, { opacity: bagOpacity, transform: [{ translateY: bagY }, { scale: Animated.multiply(bagScale, bagGulp) }, { rotate: bagRotation }] }]}>
                    <Image source={BAG_IMAGE} style={styles.fullImage} resizeMode="contain" />
                </Animated.View>

                {/* 3. Logo & Brand (Front Layer) */}
                <View style={styles.frontGroup} pointerEvents="none">
                    <Animated.Image source={LOGO_IMAGE} style={[styles.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]} resizeMode="contain" />
                    <View style={styles.row}>
                        {GOOD_LETTERS.map((l, i) => (
                            <Animated.Text key={i} style={[styles.letter, { color: VIOLET_LIGHT }, { opacity: goodAnims[i].opacity, transform: [{ translateY: goodAnims[i].y }] }]}>{l}</Animated.Text>
                        ))}
                        {KART_LETTERS.map((l, i) => (
                            <Animated.Text key={i} style={[styles.letter, { color: VIOLET_DEEP }, { opacity: kartAnims[i].opacity, transform: [{ translateY: kartAnims[i].y }] }]}>{l}</Animated.Text>
                        ))}
                    </View>
                    <Animated.Text style={[styles.tag, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}>Good Deals. Good Life</Animated.Text>
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080612' },
    ambientGlow: { position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: VIOLET_DEEP, opacity: 0.12, top: '35%', alignSelf: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    bagBox: { width: BAG_START_SIZE, height: BAG_START_SIZE, justifyContent: 'center', alignItems: 'center' },
    fullImage: { width: '100%', height: '100%' },
    itemWrap: { position: 'absolute', width: ITEM_SIZE, height: ITEM_SIZE, top: '50%', left: '50%', marginTop: -ITEM_SIZE / 2, marginLeft: -ITEM_SIZE / 2, justifyContent: 'center', alignItems: 'center' },
    emoji: { position: 'absolute', fontSize: 32 },
    frontGroup: { position: 'absolute', alignItems: 'center' },
    logo: { width: LOGO_SIZE, height: LOGO_SIZE },
    row: { flexDirection: 'row', marginTop: 15 },
    letter: { fontSize: 44, fontWeight: '900' },
    tag: { fontSize: 13, color: '#BEA1F7', marginTop: 6, letterSpacing: 1, opacity: 0.7 },
});

export default SplashScreen;