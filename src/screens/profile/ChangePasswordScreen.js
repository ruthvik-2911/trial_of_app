import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

import useTheme from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

// ─── Password strength checker ────────────────────────────────────────────────
const getStrength = pwd => {
    if (!pwd) return { score: 0, label: '', bars: 0 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { score, label: 'Weak', bars: 1 };
    if (score === 2) return { score, label: 'Fair', bars: 2 };
    if (score === 3) return { score, label: 'Good', bars: 3 };
    return { score, label: 'Strong', bars: 4 };
};

const strengthColor = (label, colors) => {
    if (label === 'Weak') return colors.error || '#FF6B6B';
    if (label === 'Fair') return colors.accent || '#F0A500';
    if (label === 'Good') return colors.success || '#00C896';
    if (label === 'Strong') return colors.success || '#00C896';
    return colors.border;
};
// ─────────────────────────────────────────────────────────────────────────────

const ChangePasswordScreen = ({ navigation }) => {
    const { colors, isDark } = useTheme();
    const { user } = useAuth();

    const [current, setCurrent] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleForgotCurrentPassword = async () => {
        const targetEmail = user?.email;
        if (!targetEmail) {
            Alert.alert('Forgot Password', 'Please enter your email address on the login screen to reset your password.');
            return;
        }
        try {
            setLoading(true);
            const auth = getAuth();
            await sendPasswordResetEmail(auth, targetEmail);
            Alert.alert('Password Reset Email Sent 📧', `A password reset link has been sent to ${targetEmail}. Please check your inbox.`);
        } catch (err) {
            Alert.alert('Reset Failed', err.message || 'Could not send password reset email.');
        } finally {
            setLoading(false);
        }
    };

    const strength = getStrength(newPwd);
    const strColor = strengthColor(strength.label, colors);
    const passwordsMatch = newPwd && confirm && newPwd === confirm;
    const mismatch = confirm.length > 0 && newPwd !== confirm;

    // ── Validation ──
    const validate = () => {
        if (!current.trim()) {
            Alert.alert('Validation', 'Please enter your current password.'); return false;
        }
        if (newPwd.length < 8) {
            Alert.alert('Validation', 'New password must be at least 8 characters.'); return false;
        }
        if (newPwd !== confirm) {
            Alert.alert('Validation', 'New passwords do not match.'); return false;
        }
        if (current === newPwd) {
            Alert.alert('Validation', 'New password must be different from current password.'); return false;
        }
        return true;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await new Promise(r => setTimeout(r, 1000)); // remove – demo only
            // await dispatch(changePassword({ currentPassword: current, newPassword: newPwd }));
            Alert.alert('✅ Password Changed', 'Your password has been updated successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
            ]);
        } catch {
            Alert.alert('Error', 'Could not change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const borderColor = field =>
        focusedField === field ? colors.primary : colors.border;

    return (
        <View style={[s.root, { backgroundColor: colors.background }]}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.background}
            />

            {/* ── Header ── */}
            <View style={[s.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                    style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={[s.backIcon, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[s.headerTitle, { color: colors.textPrimary }]}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
            >
                <ScrollView
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >

                    {/* ── Lock illustration ── */}
                    <View style={[s.iconCircle, { backgroundColor: colors.accent + '20' }]}>
                        <Text style={s.iconEmoji}>🔐</Text>
                    </View>
                    <Text style={[s.pageTitle, { color: colors.textPrimary }]}>
                        Set a New Password
                    </Text>
                    <Text style={[s.pageSubtitle, { color: colors.textSecondary }]}>
                        Your new password must be different from your previous password and at least 8 characters long.
                    </Text>

                    {/* ── Form card ── */}
                    <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

                        {/* Current Password */}
                        <PasswordField
                            label="Current Password"
                            value={current}
                            onChangeText={setCurrent}
                            placeholder="Enter current password"
                            show={showCurrent}
                            toggleShow={() => setShowCurrent(v => !v)}
                            onFocus={() => setFocusedField('current')}
                            onBlur={() => setFocusedField(null)}
                            borderColor={borderColor('current')}
                            colors={colors}
                            icon="🔑"
                        />

                        <View style={[s.divider, { backgroundColor: colors.border }]} />

                        {/* New Password */}
                        <PasswordField
                            label="New Password"
                            value={newPwd}
                            onChangeText={setNewPwd}
                            placeholder="Enter new password"
                            show={showNew}
                            toggleShow={() => setShowNew(v => !v)}
                            onFocus={() => setFocusedField('new')}
                            onBlur={() => setFocusedField(null)}
                            borderColor={borderColor('new')}
                            colors={colors}
                            icon="🔒"
                        />

                        {/* Strength Meter */}
                        {newPwd.length > 0 && (
                            <View style={s.strengthWrapper}>
                                <View style={s.strengthBars}>
                                    {[1, 2, 3, 4].map(i => (
                                        <View
                                            key={i}
                                            style={[
                                                s.strengthBar,
                                                {
                                                    backgroundColor:
                                                        i <= strength.bars ? strColor : colors.border,
                                                },
                                            ]}
                                        />
                                    ))}
                                </View>
                                <Text style={[s.strengthLabel, { color: strColor }]}>
                                    {strength.label}
                                </Text>
                            </View>
                        )}

                        {/* Password rules */}
                        {newPwd.length > 0 && (
                            <View style={s.rulesWrapper}>
                                <Rule ok={newPwd.length >= 8} label="At least 8 characters" colors={colors} />
                                <Rule ok={/[A-Z]/.test(newPwd)} label="One uppercase letter" colors={colors} />
                                <Rule ok={/[0-9]/.test(newPwd)} label="One number" colors={colors} />
                                <Rule ok={/[^A-Za-z0-9]/.test(newPwd)} label="One special character" colors={colors} />
                            </View>
                        )}

                        <View style={[s.divider, { backgroundColor: colors.border }]} />

                        {/* Confirm Password */}
                        <PasswordField
                            label="Confirm New Password"
                            value={confirm}
                            onChangeText={setConfirm}
                            placeholder="Re-enter new password"
                            show={showConfirm}
                            toggleShow={() => setShowConfirm(v => !v)}
                            onFocus={() => setFocusedField('confirm')}
                            onBlur={() => setFocusedField(null)}
                            borderColor={
                                mismatch
                                    ? colors.error
                                    : passwordsMatch
                                        ? colors.success
                                        : borderColor('confirm')
                            }
                            colors={colors}
                            icon="✅"
                        />

                        {/* Match / Mismatch feedback */}
                        {confirm.length > 0 && (
                            <Text
                                style={[
                                    s.matchText,
                                    { color: mismatch ? colors.error : colors.success },
                                ]}
                            >
                                {mismatch ? '✗ Passwords do not match' : '✓ Passwords match'}
                            </Text>
                        )}
                    </View>

                    {/* ── Security tip ── */}
                    <View style={[s.tipCard, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}>
                        <Text style={s.tipIcon}>💡</Text>
                        <Text style={[s.tipText, { color: colors.textSecondary }]}>
                            Use a mix of letters, numbers, and symbols. Avoid using your name or birthday.
                        </Text>
                    </View>

                    {/* ── Save Button ── */}
                    <TouchableOpacity
                        style={[
                            s.saveBtn,
                            {
                                backgroundColor:
                                    loading || !current || !newPwd || !confirm
                                        ? colors.border
                                        : colors.accent,
                            },
                        ]}
                        onPress={handleSave}
                        disabled={loading || !current || !newPwd || !confirm}
                        activeOpacity={0.85}
                    >
                        <Text
                            style={[
                                s.saveBtnText,
                                {
                                    color:
                                        loading || !current || !newPwd || !confirm
                                            ? colors.textMuted
                                            : colors.textInverse,
                                },
                            ]}
                        >
                            {loading ? 'Updating Password…' : '🔐  Update Password'}
                        </Text>
                    </TouchableOpacity>

                    {/* ── Forgot password link ── */}
                    <TouchableOpacity
                        style={s.forgotBtn}
                        onPress={handleForgotCurrentPassword}
                        activeOpacity={0.7}
                    >
                        <Text style={[s.forgotText, { color: colors.primary }]}>
                            Forgot current password?
                        </Text>
                    </TouchableOpacity>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PasswordField = ({
    label, value, onChangeText, placeholder,
    show, toggleShow, onFocus, onBlur,
    borderColor, colors, icon,
}) => (
    <View style={s.fieldWrapper}>
        <Text style={[s.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View
            style={[
                s.inputRow,
                { backgroundColor: colors.cardAlt, borderColor },
            ]}
        >
            <Text style={s.inputIcon}>{icon}</Text>
            <TextInput
                style={[s.input, { color: colors.textPrimary }]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!show}
                autoCapitalize="none"
                onFocus={onFocus}
                onBlur={onBlur}
            />
            <TouchableOpacity onPress={toggleShow} activeOpacity={0.7} style={s.eyeBtn}>
                <Text style={s.eyeIcon}>{show ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const Rule = ({ ok, label, colors }) => (
    <View style={s.ruleRow}>
        <Text style={[s.ruleDot, { color: ok ? colors.success : colors.textMuted }]}>
            {ok ? '✓' : '○'}
        </Text>
        <Text style={[s.ruleText, { color: ok ? colors.success : colors.textMuted }]}>
            {label}
        </Text>
    </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    root: { flex: 1 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 40, height: 40, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { fontSize: 20, fontWeight: '600' },
    headerTitle: { fontSize: 18, fontWeight: '700' },

    scroll: { paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' },

    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 16,
    },
    iconEmoji: { fontSize: 36 },
    pageTitle: {
        fontSize: 22, fontWeight: '800',
        textAlign: 'center', marginBottom: 10,
    },
    pageSubtitle: {
        fontSize: 14, textAlign: 'center',
        lineHeight: 21, marginBottom: 28,
        paddingHorizontal: 10,
    },

    card: {
        width: '100%', borderRadius: 18,
        borderWidth: 1, padding: 16, marginBottom: 16,
    },
    divider: { height: 1, marginVertical: 14 },

    fieldWrapper: { marginBottom: 4 },
    fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderRadius: 12, borderWidth: 1.5,
        paddingHorizontal: 14, height: 52,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15, fontWeight: '500' },
    eyeBtn: { padding: 4 },
    eyeIcon: { fontSize: 16 },

    strengthWrapper: {
        flexDirection: 'row', alignItems: 'center',
        marginTop: 10, marginBottom: 4,
    },
    strengthBars: { flexDirection: 'row', flex: 1, marginRight: 10, gap: 4 },
    strengthBar: { flex: 1, height: 4, borderRadius: 2 },
    strengthLabel: { fontSize: 12, fontWeight: '700', minWidth: 44, textAlign: 'right' },

    rulesWrapper: { marginTop: 8, marginBottom: 4 },
    ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
    ruleDot: { fontSize: 13, fontWeight: '700', width: 20 },
    ruleText: { fontSize: 12 },

    matchText: { fontSize: 12, fontWeight: '600', marginTop: 6 },

    tipCard: {
        width: '100%', flexDirection: 'row', alignItems: 'flex-start',
        borderRadius: 14, borderWidth: 1,
        padding: 14, marginBottom: 20,
    },
    tipIcon: { fontSize: 16, marginRight: 10, marginTop: 1 },
    tipText: { flex: 1, fontSize: 13, lineHeight: 19 },

    saveBtn: {
        width: '100%', borderRadius: 16,
        paddingVertical: 16, alignItems: 'center',
        marginBottom: 16,
    },
    saveBtnText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },

    forgotBtn: { paddingVertical: 4 },
    forgotText: { fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
});

export default ChangePasswordScreen;