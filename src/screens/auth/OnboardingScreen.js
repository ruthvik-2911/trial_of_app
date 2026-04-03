// ─── OnboardingScreen.js ───────────────────────────────────────────────────
// Gudkart — Expo Go compatible
//
// 3 slides — full-screen horizontal swiper using FlatList + pagingEnabled
//
// Slide 1 — "Discover Luxury"
//   Deep purple bg, floating product emojis orbiting a central glow
//
// Slide 2 — "Exclusive Deals"
//   Navy bg, animated gold price-drop cards floating in
//
// Slide 3 — "Fast Delivery"
//   Dark teal bg, delivery route illustration with moving parcel
//
// Each slide:
//   • Full-bleed gradient background
//   • Large animated illustration area (top 55%)
//   • Title + subtitle + feature pills (bottom 45%)
//
// Controls:
//   • Dot indicators (animated width)
//   • Skip button (top-right)
//   • Next / Get Started CTA (bottom)
//   • Swipe gesture (FlatList pagingEnabled)
//
// On finish → navigates to Auth (Login)
// ──────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Dimensions,
    StatusBar,
    Animated,
    Platform,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import useTheme from '../../hooks/useTheme';

const { width, height } = Dimensions.get('window');
const SLIDE_HEIGHT = height;

// ─── Slide Data ────────────────────────────────────────────────────────────
const SLIDES = [
    {
        id: 's1',
        gradient: ['#0D0B1E', '#1A1040', '#0D0B1E'],
        accentColor: '#F5C842',
        title: 'Discover\nLuxury',
        subtitle: 'Explore thousands of premium products curated just for you — from fashion to fine jewellery.',
        pills: ['👗 Fashion', '💎 Jewels', '⌚ Watches'],
        illustration: 'luxury',
    },
    {
        id: 's2',
        gradient: ['#0A1628', '#0D2040', '#0A1628'],
        accentColor: '#7B5EEA',
        title: 'Exclusive\nDeals Daily',
        subtitle: 'Flash drops, price crashes and member-only offers — save up to 70% every single day.',
        pills: ['⚡ Flash Deals', '🏷️ Up to 70% OFF', '🎁 Members Only'],
        illustration: 'deals',
    },
    {
        id: 's3',
        gradient: ['#051612', '#0A2820', '#051612'],
        accentColor: '#4ADE80',
        title: 'Lightning\nFast Delivery',
        subtitle: 'Same-day delivery in 100+ cities. Real-time tracking so you always know where your order is.',
        pills: ['🚀 Same Day', '📍 Live Tracking', '🆓 Free Delivery'],
        illustration: 'delivery',
    },
];

// ─── Floating Particle ─────────────────────────────────────────────────────
const FloatingParticle = ({ x, y, size, color, delay, duration }) => {
    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
                Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
            ]),
        ).start();
    }, []);

    const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
    const opacity = anim.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.8, 0.8, 0] });

    return (
        <Animated.View
            style={{
                position: 'absolute', left: x, top: y,
                width: size, height: size, borderRadius: size / 2,
                backgroundColor: color,
                opacity, transform: [{ translateY }],
            }}
        />
    );
};

// ─── Slide 1 Illustration — Luxury ─────────────────────────────────────────
const LuxuryIllustration = ({ accent }) => {
    const rotate = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.85)).current;
    const glow = useRef(new Animated.Value(0.6)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.loop(
                Animated.timing(rotate, { toValue: 1, duration: 12000, useNativeDriver: true }),
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
                    Animated.timing(scale, { toValue: 0.85, duration: 2000, useNativeDriver: true }),
                ]),
            ),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(glow, { toValue: 1, duration: 1800, useNativeDriver: true }),
                    Animated.timing(glow, { toValue: 0.6, duration: 1800, useNativeDriver: true }),
                ]),
            ),
        ]).start();
    }, []);

    const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    // Orbiting product emojis
    const ORBIT_ITEMS = [
        { image: 'https://tse4.mm.bing.net/th/id/OIP.VjdNWbB7EZk9uQ2Ob_A_KwHaEv?pid=ImgDet&w=474&h=303&rs=1&o=7&rm=3', angle: 0 },
        { image: 'https://watchcollectors.co.uk/cdn/shop/files/Rolex_Seadweller_02.jpg?v=1716635008', angle: 60 },
        { image: 'https://th.bing.com/th/id/OIP.DvPaIGGgRFBCN1Vvku0-0gHaEc?w=304&h=182&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', angle: 120 },
        { image: 'https://i.pinimg.com/originals/d1/a0/c1/d1a0c17aeff9754c070ce0f773529fee.jpg', angle: 180 },
        { image: 'https://images.unsplash.com/photo-1539109136881-3be0610cac48?auto=format&fit=crop&q=80&w=600', angle: 240 },
        { image: 'https://th.bing.com/th/id/OIP.UZ3ydmCqrstP9nNL4Tu6vQHaHa?w=208&h=208&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3', angle: 300 },
    ];

    const ORBIT_R = 110;

    return (
        <View style={styles.illustrationContainer}>
            {/* Glow blob */}
            <Animated.View style={[styles.glowBlob, { backgroundColor: accent, opacity: glow, transform: [{ scale }] }]} />

            {/* Orbiting ring */}
            <Animated.View style={[styles.orbitRing, { borderColor: accent + '30', transform: [{ rotate: spin }] }]} />
            <Animated.View style={[styles.orbitRingInner, { borderColor: accent + '20' }]} />

            {/* Orbiting emojis */}
            {ORBIT_ITEMS.map((item, i) => {
                const rad = (item.angle * Math.PI) / 180;
                const x = Math.cos(rad) * ORBIT_R;
                const y = Math.sin(rad) * ORBIT_R;
                return (
                    <Animated.View
                        key={i}
                        style={[
                            styles.orbitItem,
                            { transform: [{ rotate: spin }, { translateX: x }, { translateY: y }, { rotate: rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }] },
                        ]}
                    >
                        <Image
                            source={{ uri: item.image }}
                            style={styles.orbitImage}
                            resizeMode="cover"
                        />
                    </Animated.View>
                );
            })}

            {/* Centre logo */}
            <Animated.View style={[styles.centreCircle, { borderColor: accent + '60', transform: [{ scale }] }]}>
                <LinearGradient colors={['#231F42', '#16132E']} style={styles.centreGradient}>
                    <Text style={[styles.centreG, { color: accent }]}>G</Text>
                </LinearGradient>
            </Animated.View>

            {/* Floating particles */}
            {[
                { x: 40, y: 40, size: 5, color: accent, delay: 0, duration: 2400 },
                { x: 260, y: 60, size: 4, color: '#9B82F3', delay: 600, duration: 2800 },
                { x: 60, y: 240, size: 6, color: accent, delay: 1200, duration: 2200 },
                { x: 270, y: 220, size: 4, color: '#9B82F3', delay: 300, duration: 3000 },
                { x: 150, y: 20, size: 5, color: accent, delay: 900, duration: 2600 },
            ].map((p, i) => <FloatingParticle key={i} {...p} />)}
        </View>
    );
};

// ─── Slide 2 Illustration — Deals ──────────────────────────────────────────
const DealsIllustration = ({ accent }) => {
    const card1Y = useRef(new Animated.Value(30)).current;
    const card1Op = useRef(new Animated.Value(0)).current;
    const card2Y = useRef(new Animated.Value(30)).current;
    const card2Op = useRef(new Animated.Value(0)).current;
    const card3Y = useRef(new Animated.Value(30)).current;
    const card3Op = useRef(new Animated.Value(0)).current;
    const tagScale = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                // Stagger cards in
                Animated.parallel([
                    Animated.timing(card1Y, { toValue: 0, duration: 500, useNativeDriver: true }),
                    Animated.timing(card1Op, { toValue: 1, duration: 500, useNativeDriver: true }),
                ]),
                Animated.delay(100),
                Animated.parallel([
                    Animated.timing(card2Y, { toValue: 0, duration: 500, useNativeDriver: true }),
                    Animated.timing(card2Op, { toValue: 1, duration: 500, useNativeDriver: true }),
                ]),
                Animated.delay(100),
                Animated.parallel([
                    Animated.timing(card3Y, { toValue: 0, duration: 500, useNativeDriver: true }),
                    Animated.timing(card3Op, { toValue: 1, duration: 500, useNativeDriver: true }),
                ]),
                // Tag pulse
                Animated.spring(tagScale, { toValue: 1.15, tension: 60, friction: 5, useNativeDriver: true }),
                Animated.spring(tagScale, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
                Animated.delay(1800),
                // Reset
                Animated.parallel([
                    Animated.timing(card1Op, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(card2Op, { toValue: 0, duration: 300, useNativeDriver: true }),
                    Animated.timing(card3Op, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(card1Y, { toValue: 30, duration: 0, useNativeDriver: true }),
                    Animated.timing(card2Y, { toValue: 30, duration: 0, useNativeDriver: true }),
                    Animated.timing(card3Y, { toValue: 30, duration: 0, useNativeDriver: true }),
                ]),
                Animated.delay(400),
            ]),
        ).start();
    }, []);

    const DEAL_CARDS = [
        { emoji: '⌚', name: 'Gold Watch Pro', was: '₹14,000', now: '₹8,999', off: '36%', color: '#F5C842' },
        { emoji: '🎧', name: 'Sony XM5', was: '₹29,990', now: '₹18,999', off: '37%', color: '#7B5EEA' },
        { emoji: '📱', name: 'Pixel 9 Ultra', was: '₹85,000', now: '₹72,000', off: '15%', color: '#60A5FA' },
    ];

    const anims = [
        { y: card1Y, op: card1Op },
        { y: card2Y, op: card2Op },
        { y: card3Y, op: card3Op },
    ];

    return (
        <View style={styles.illustrationContainer}>
            {/* Glow */}
            <View style={[styles.glowBlob, { backgroundColor: accent, opacity: 0.12 }]} />

            {/* Tag icon */}
            <Animated.View style={[styles.dealTagIcon, { transform: [{ scale: tagScale }] }]}>
                <Ionicons name="pricetag" size={40} color={accent} />
            </Animated.View>

            {/* Deal cards */}
            <View style={styles.dealCardsStack}>
                {DEAL_CARDS.map((card, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.dealCardMini,
                            { opacity: anims[i].op, transform: [{ translateY: anims[i].y }] },
                        ]}
                    >
                        <View style={[styles.dealCardMiniInner, { backgroundColor: '#1E1A38', borderColor: '#2E2850' }]}>
                            <Text style={{ fontSize: 22 }}>{card.emoji}</Text>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }} numberOfLines={1}>{card.name}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                    <Text style={{ color: card.color, fontSize: 13, fontWeight: '800' }}>{card.now}</Text>
                                    <Text style={{ color: '#6B6490', fontSize: 10, textDecorationLine: 'line-through' }}>{card.was}</Text>
                                </View>
                            </View>
                            <View style={[styles.offBadge, { backgroundColor: card.color + '25', borderColor: card.color + '50' }]}>
                                <Text style={{ color: card.color, fontSize: 10, fontWeight: '800' }}>{card.off}</Text>
                            </View>
                        </View>
                    </Animated.View>
                ))}
            </View>
        </View>
    );
};

// ─── Slide 3 Illustration — Delivery ───────────────────────────────────────
const DeliveryIllustration = ({ accent }) => {
    const truckX = useRef(new Animated.Value(-80)).current;
    const parcelBounce = useRef(new Animated.Value(0)).current;
    const checkScale = useRef(new Animated.Value(0)).current;
    const dotPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                // Truck drives in
                Animated.timing(truckX, { toValue: 80, duration: 1400, useNativeDriver: true }),
                // Parcel bounces
                Animated.spring(parcelBounce, { toValue: -20, tension: 80, friction: 5, useNativeDriver: true }),
                Animated.spring(parcelBounce, { toValue: 0, tension: 80, friction: 5, useNativeDriver: true }),
                // Check appears
                Animated.spring(checkScale, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
                // Dot pulse
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(dotPulse, { toValue: 1.4, duration: 500, useNativeDriver: true }),
                        Animated.timing(dotPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
                    ]),
                    { iterations: 3 },
                ),
                Animated.delay(600),
                // Reset
                Animated.parallel([
                    Animated.timing(truckX, { toValue: -80, duration: 0, useNativeDriver: true }),
                    Animated.timing(checkScale, { toValue: 0, duration: 200, useNativeDriver: true }),
                ]),
                Animated.delay(400),
            ]),
        ).start();
    }, []);

    return (
        <View style={styles.illustrationContainer}>
            {/* Glow */}
            <View style={[styles.glowBlob, { backgroundColor: accent, opacity: 0.12 }]} />

            {/* Road track */}
            <View style={styles.road}>
                <View style={[styles.roadLine, { backgroundColor: accent + '40' }]} />
                {[0, 1, 2, 3].map((i) => (
                    <View
                        key={i}
                        style={[styles.roadDash, { backgroundColor: accent + '30', left: 40 + i * 70 }]}
                    />
                ))}
            </View>

            {/* Truck */}
            <Animated.View style={[styles.truck, { transform: [{ translateX: truckX }] }]}>
                <Text style={{ fontSize: 52 }}>🚚</Text>
            </Animated.View>

            {/* Parcel at destination */}
            <Animated.View style={[styles.parcel, { transform: [{ translateY: parcelBounce }] }]}>
                <Text style={{ fontSize: 38 }}>📦</Text>
            </Animated.View>

            {/* Check badge */}
            <Animated.View style={[styles.checkBadge, { backgroundColor: accent + '25', borderColor: accent, transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark-circle" size={28} color={accent} />
                <Text style={[styles.checkText, { color: accent }]}>Delivered!</Text>
            </Animated.View>

            {/* Location dots */}
            <View style={styles.locationDots}>
                {['🏪', '📍'].map((icon, i) => (
                    <Animated.View
                        key={i}
                        style={[
                            styles.locationDot,
                            { backgroundColor: '#1E1A38', borderColor: accent + '50' },
                            i === 1 && { transform: [{ scale: dotPulse }] },
                        ]}
                    >
                        <Text style={{ fontSize: 16 }}>{icon}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
                {[
                    { label: '100+', sub: 'Cities' },
                    { label: 'Same', sub: 'Day' },
                    { label: 'Live', sub: 'Tracking' },
                ].map((s, i) => (
                    <View key={i} style={[styles.statChip, { backgroundColor: '#1E1A38', borderColor: '#2E2850' }]}>
                        <Text style={[styles.statValue, { color: accent }]}>{s.label}</Text>
                        <Text style={styles.statSub}>{s.sub}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// ─── Slide Component ───────────────────────────────────────────────────────
const Slide = ({ item, index, scrollX }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    const titleX = scrollX.interpolate({ inputRange, outputRange: [width * 0.4, 0, -width * 0.4], extrapolate: 'clamp' });
    const titleOp = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
    const subOp = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });

    return (
        <View style={[styles.slide, { width }]}>
            <LinearGradient colors={item.gradient} style={StyleSheet.absoluteFillObject} />

            {/* Illustration top half */}
            <View style={styles.illustrationArea}>
                {item.illustration === 'luxury' && <LuxuryIllustration accent={item.accentColor} />}
                {item.illustration === 'deals' && <DealsIllustration accent={item.accentColor} />}
                {item.illustration === 'delivery' && <DeliveryIllustration accent={item.accentColor} />}
            </View>

            {/* Text bottom half */}
            <View style={styles.textArea}>
                <Animated.Text
                    style={[styles.slideTitle, { color: '#FFFFFF', opacity: titleOp, transform: [{ translateX: titleX }] }]}
                >
                    {item.title}
                </Animated.Text>
                <Animated.Text style={[styles.slideSubtitle, { color: '#B8B0D8', opacity: subOp }]}>
                    {item.subtitle}
                </Animated.Text>

                {/* Feature pills */}
                <Animated.View style={[styles.pillsRow, { opacity: subOp }]}>
                    {item.pills.map((pill, i) => (
                        <View
                            key={i}
                            style={[styles.pill, { backgroundColor: item.accentColor + '20', borderColor: item.accentColor + '50' }]}
                        >
                            <Text style={[styles.pillText, { color: item.accentColor }]}>{pill}</Text>
                        </View>
                    ))}
                </Animated.View>
            </View>
        </View>
    );
};

// ─── Main Screen ───────────────────────────────────────────────────────────
const OnboardingScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const flatListRef = useRef(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        // Navigate to Auth stack — Login screen
        navigation?.replace('Main');
    };

    const handleSkip = () => handleFinish();

    const onMomentumScrollEnd = (e) => {
        const idx = Math.round(e.nativeEvent.contentOffset.x / width);
        setCurrentIndex(idx);
    };

    const isLast = currentIndex === SLIDES.length - 1;
    const accent = SLIDES[currentIndex]?.accentColor ?? '#F5C842';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Skip button */}
            <SafeAreaView edges={['top']} style={styles.skipWrapper}>
                {!isLast && (
                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
                        <Text style={[styles.skipText, { color: accent + 'CC' }]}>Skip</Text>
                        <Ionicons name="chevron-forward" size={14} color={accent + 'CC'} />
                    </TouchableOpacity>
                )}
            </SafeAreaView>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                keyExtractor={(s) => s.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
                scrollEventThrottle={16}
                onMomentumScrollEnd={onMomentumScrollEnd}
                renderItem={({ item, index }) => (
                    <Slide item={item} index={index} scrollX={scrollX} />
                )}
            />

            {/* Bottom controls */}
            <SafeAreaView edges={['bottom']} style={styles.bottomControls}>
                {/* Dot indicators */}
                <View style={styles.dotsRow}>
                    {SLIDES.map((_, i) => {
                        const dotWidth = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: [6, 24, 6],
                            extrapolate: 'clamp',
                        });
                        const dotColor = scrollX.interpolate({
                            inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                            outputRange: ['#2E2850', accent, '#2E2850'],
                            extrapolate: 'clamp',
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
                            />
                        );
                    })}
                </View>

                {/* Next / Get Started */}
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                    <LinearGradient
                        colors={isLast ? [accent, accent + 'CC'] : ['#7B5EEA', '#5A3EC8']}
                        style={styles.nextBtnGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        {isLast ? (
                            <>
                                <Text style={[styles.nextBtnText, { color: '#0D0B1E' }]}>Get Started</Text>
                                <Ionicons name="arrow-forward" size={18} color="#0D0B1E" />
                            </>
                        ) : (
                            <>
                                <Text style={styles.nextBtnText}>Next</Text>
                                <Ionicons name="arrow-forward" size={18} color="#fff" />
                            </>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Sign in link */}
                <TouchableOpacity onPress={handleFinish} style={styles.signinRow} activeOpacity={0.7}>
                    <Text style={[styles.signinText, { color: '#6B6490' }]}>Already have an account? </Text>
                    <Text style={[styles.signinLink, { color: accent }]}>Sign In</Text>
                </TouchableOpacity>
            </SafeAreaView>
        </View>
    );
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0B1E' },

    skipWrapper: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        zIndex: 10,
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'android' ? 12 : 0,
    },
    skipBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8 },
    skipText: { fontSize: 14, fontWeight: '600' },

    // Slide
    slide: { height: SLIDE_HEIGHT },
    illustrationArea: {
        height: SLIDE_HEIGHT * 0.52,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    textArea: {
        flex: 1,
        paddingHorizontal: 28,
        paddingTop: 12,
        justifyContent: 'flex-start',
    },
    slideTitle: {
        fontSize: 40,
        fontWeight: '900',
        lineHeight: 46,
        letterSpacing: -1.5,
        marginBottom: 14,
    },
    slideSubtitle: {
        fontSize: 15,
        lineHeight: 22,
        fontWeight: '400',
        marginBottom: 20,
    },
    pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    pillText: { fontSize: 12, fontWeight: '600' },

    // Illustration shared
    illustrationContainer: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    glowBlob: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: 130,
    },

    // Luxury illustration
    orbitRing: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        borderWidth: 1,
        borderStyle: 'dashed',
    },
    orbitRingInner: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 1,
    },
    orbitItem: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(123,94,234,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    orbitImage: {
        width: '100%',
        height: '100%',
    },
    centreCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        overflow: 'hidden',
        position: 'absolute',
    },
    centreGradient: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    centreG: { fontSize: 40, fontWeight: '900' },

    // Deals illustration
    dealTagIcon: { marginBottom: 16 },
    dealCardsStack: { gap: 10, width: width * 0.82 },
    dealCardMini: { width: '100%' },
    dealCardMiniInner: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
    },
    offBadge: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    // Delivery illustration
    road: {
        position: 'absolute',
        bottom: '30%',
        left: 0,
        right: 0,
        height: 40,
        justifyContent: 'center',
    },
    roadLine: { height: 2, width: '100%' },
    roadDash: {
        position: 'absolute',
        width: 30,
        height: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        top: '50%',
    },
    truck: { position: 'absolute', bottom: '32%', left: '15%' },
    parcel: { position: 'absolute', bottom: '34%', right: '20%' },
    checkBadge: {
        position: 'absolute',
        top: '15%',
        right: '15%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    checkText: { fontSize: 13, fontWeight: '700' },
    locationDots: { position: 'absolute', bottom: '20%', flexDirection: 'row', gap: 20, alignItems: 'center' },
    locationDot: {
        width: 42, height: 42, borderRadius: 21,
        borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    },
    statsRow: { position: 'absolute', bottom: '5%', flexDirection: 'row', gap: 12 },
    statChip: {
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    statValue: { fontSize: 14, fontWeight: '800' },
    statSub: { fontSize: 10, color: '#6B6490', marginTop: 1 },

    // Bottom controls
    bottomControls: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        paddingHorizontal: 28,
        paddingBottom: Platform.OS === 'ios' ? 0 : 16,
        gap: 16,
        alignItems: 'center',
    },
    dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { height: 6, borderRadius: 3 },
    nextBtn: { width: '100%', borderRadius: 16, overflow: 'hidden' },
    nextBtnGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
    },
    nextBtnText: { fontSize: 17, fontWeight: '800', color: '#fff' },
    signinRow: { flexDirection: 'row', alignItems: 'center', paddingBottom: 8 },
    signinText: { fontSize: 14 },
    signinLink: { fontSize: 14, fontWeight: '700' },
});

export default OnboardingScreen;