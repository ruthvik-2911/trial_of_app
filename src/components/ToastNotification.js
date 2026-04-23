import React, { useRef, useCallback, useState, createContext, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from './SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../hooks/useTheme';

const { width } = Dimensions.get('window');

// ─── Toast Context ──────────────────────────────────────────────────────────
const ToastContext = createContext(null);

// ─── Toast config per type ─────────────────────────────────────────────────
const TOAST_CONFIG = {
    success: {
        icon: 'checkmark-circle',
        gradientColors: ['#BEA1F7', '#9061F9'],
        glow: '#BEA1F7',
        label: 'Success',
    },
    error: {
        icon: 'close-circle',
        gradientColors: ['#FF4757', '#FF6B81'],
        glow: '#FF4757',
        label: 'Error',
    },
    info: {
        icon: 'information-circle',
        gradientColors: ['#3A86FF', '#00D9FF'],
        glow: '#3A86FF',
        label: 'Info',
    },
    warning: {
        icon: 'warning',
        gradientColors: ['#FF9F43', '#FFCC02'],
        glow: '#FF9F43',
        label: 'Warning',
    },
    cart: {
        icon: 'bag-check',
        gradientColors: ['#BEA1F7', '#9061F9'],
        glow: '#BEA1F7',
        label: 'Cart',
    },
    confirm: {
        icon: 'help-circle',
        gradientColors: ['#4910BC', '#2E0A78'],
        glow: '#4910BC',
        label: 'Confirm',
    },
};

// ─── Single Toast ──────────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
    const { colors, isDark } = useTheme();
    const config = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

    const translateY = useRef(new Animated.Value(-120)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.92)).current;

    React.useEffect(() => {
        // Slide in
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
            Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 10 }),
        ]).start();
    }, []);

    const dismiss = useCallback(() => {
        Animated.parallel([
            Animated.timing(translateY, { toValue: -120, duration: 250, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDismiss());
    }, [onDismiss]);

    const handleConfirm = () => { dismiss(); toast.onConfirm?.(); };
    const handleCancel = () => { dismiss(); toast.onCancel?.(); };

    return (
        <Animated.View
            style={[
                toastStyles.wrapper,
                { transform: [{ translateY }, { scale }], opacity },
            ]}
        >
            <View style={[toastStyles.glowHalo, { backgroundColor: config.glow + '30', shadowColor: config.glow }]} />
            <View style={[
                toastStyles.card,
                {
                    backgroundColor: isDark ? 'rgba(20,12,40,0.97)' : 'rgba(255,255,255,0.97)',
                    borderColor: config.glow + '40',
                    shadowColor: config.glow,
                }
            ]}>
                <LinearGradient
                    colors={config.gradientColors}
                    style={toastStyles.topBar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                />
                <View style={toastStyles.body}>
                    <View style={[toastStyles.iconRing, { borderColor: config.glow + '50', shadowColor: config.glow }]}>
                        <LinearGradient
                            colors={config.gradientColors}
                            style={toastStyles.iconGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name={config.icon} size={22} color={config.label === 'Confirm' ? '#FFFFFF' : '#1A0444'} />
                        </LinearGradient>
                    </View>
                    <View style={toastStyles.textBlock}>
                        <Text style={[toastStyles.title, { color: colors.textPrimary }]}>
                            {toast.title}
                        </Text>
                        {toast.message ? (
                            <Text style={[toastStyles.message, { color: colors.textSecondary }]} numberOfLines={2}>
                                {toast.message}
                            </Text>
                        ) : null}
                    </View>
                    <TouchableOpacity onPress={dismiss} style={toastStyles.closeBtn} activeOpacity={0.7}>
                        <Ionicons name="close" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
                {toast.type === 'confirm' && (
                    <View style={[toastStyles.actionRow, { borderTopColor: colors.border }]}>
                        <TouchableOpacity style={toastStyles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                            <Text style={[toastStyles.cancelBtnText, { color: colors.textSecondary }]}>
                                {toast.cancelLabel || 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={toastStyles.confirmBtnWrap} onPress={handleConfirm} activeOpacity={0.85}>
                            <LinearGradient
                                colors={config.gradientColors}
                                style={toastStyles.confirmBtn}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={toastStyles.confirmBtnText}>
                                    {toast.confirmLabel || 'Confirm'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </Animated.View>
    );
};

// ─── ToastProvider ──────────────────────────────────────────────────────────
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback(({
        type = 'info',
        title,
        message,
        duration = 3000,
        confirmLabel,
        cancelLabel,
        onConfirm,
        onCancel,
    }) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, type, title, message, duration, confirmLabel, cancelLabel, onConfirm, onCancel }]);

        if (type !== 'confirm') {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, duration);
        }
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <View style={toastStyles.container} pointerEvents="box-none">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        toast={toast}
                        onDismiss={() => dismissToast(toast.id)}
                    />
                ))}
            </View>
        </ToastContext.Provider>
    );
};

// ─── useToast hook ──────────────────────────────────────────────────────────
export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};

const toastStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        alignItems: 'center',
        paddingTop: 56,
        gap: 10,
        pointerEvents: 'box-none',
    },
    wrapper: {
        width: width - 28,
        alignItems: 'center',
    },
    glowHalo: {
        position: 'absolute',
        width: width - 36,
        height: 60,
        borderRadius: 30,
        top: 10,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    card: {
        width: '100%',
        borderRadius: 20,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 16,
    },
    topBar: { height: 3, width: '100%' },
    body: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    iconRing: {
        width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
        overflow: 'hidden', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5, shadowRadius: 8, elevation: 6, flexShrink: 0,
    },
    iconGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    textBlock: { flex: 1, gap: 3 },
    title: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
    message: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
    closeBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, flexShrink: 0 },
    actionRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
    cancelBtnText: { fontSize: 14, fontWeight: '600' },
    confirmBtnWrap: { flex: 1, borderRadius: 10, overflow: 'hidden' },
    confirmBtn: { alignItems: 'center', paddingVertical: 10 },
    confirmBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export default ToastProvider;
