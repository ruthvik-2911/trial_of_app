// ─── src/context/AuthContext.js ────────────────────────────────────────────
//
// CENTRAL AUTH STORE — single source of truth for the entire app.
//
// What it holds
// ─────────────
//   uid          string | null   Firebase/backend user ID
//   user         object | null   Full profile returned by the backend
//   token        string | null   JWT / auth token stored in AsyncStorage
//   isLoggedIn   bool            Quick guard used by navigators
//   isLoading    bool            True while the stored session is being restored
//
// What it exposes (via useAuth hook)
// ────────────────────────────────────
//   login(payload)    → calls POST /auth/login,  persists session, sets uid
//   register(payload) → calls POST /auth/register, persists session, sets uid
//   logout()          → wipes AsyncStorage + Redux + resets state
//   updateUser(patch) → merge-update the local user object (for EditProfile etc.)
//
// Usage in any screen / component
// ────────────────────────────────
//   import { useAuth } from '../../context/AuthContext';
//   const { uid, user, isLoggedIn, login, logout } = useAuth();
//
// ──────────────────────────────────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useToast } from '../components/ToastNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';

// Redux slice actions (update these import paths if your slice lives elsewhere)
import {
  setCredentials,
  clearCredentials,
} from '../store/slices/authSlice';

// Backend auth service
import authService from '../services/api/authService';

// Firebase Auth primitives
import { getAuth } from 'firebase/auth';

// ─── Storage keys ──────────────────────────────────────────────────────────
const STORAGE_KEY_TOKEN = '@auth_token';
const STORAGE_KEY_USER = '@auth_user';

// ─── Context ───────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─── Provider ──────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const [uid, setUid] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until stored session is restored

  // ── Restore session on app cold-start ──────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [storedToken, storedUserJson] = await AsyncStorage.multiGet([
          STORAGE_KEY_TOKEN,
          STORAGE_KEY_USER,
        ]);

        const restoredToken = storedToken[1];
        const restoredUser = storedUserJson[1] ? JSON.parse(storedUserJson[1]) : null;

        if (restoredToken && restoredUser) {
          const restoredUid = restoredUser.uid ?? restoredUser._id ?? restoredUser.id ?? null;

          setToken(restoredToken);
          setUser(restoredUser);
          setUid(restoredUid);

          // Keep Redux in sync too
          dispatch(setCredentials({ token: restoredToken, user: restoredUser }));

          console.log('🔑 [AuthContext] Session restored — uid:', restoredUid);
        } else {
          console.log('ℹ️ [AuthContext] No stored session found');
        }
      } catch (err) {
        console.warn('⚠️ [AuthContext] Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, [dispatch]);

  // ── Persist session helpers ─────────────────────────────────────────────
  const persistSession = async (newToken, newUser) => {
    await AsyncStorage.multiSet([
      [STORAGE_KEY_TOKEN, newToken],
      [STORAGE_KEY_USER, JSON.stringify(newUser)],
    ]);
  };

  const wipeSession = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY_TOKEN, STORAGE_KEY_USER]);
  };

  // ── Apply a successful auth response ────────────────────────────────────
  const applyAuthResponse = useCallback(async (responseData, firebaseIdToken = '') => {
    // Backend may not issue its own JWT — it uses the Firebase idToken as the
    // Bearer token for subsequent API calls. Fall back to the Firebase idToken
    // when no backend token is present in the response.
    const newUser = responseData.user ?? responseData.profile ?? responseData;
    const newToken =
      responseData.token ?? responseData.accessToken ?? responseData.jwt ?? firebaseIdToken;
    const newUid = newUser.uid ?? newUser._id ?? newUser.id ?? null;

    setToken(newToken);
    setUser(newUser);
    setUid(newUid);

    // Sync Redux
    dispatch(setCredentials({ token: newToken, user: newUser }));

    // Persist to AsyncStorage so the next cold-start restores automatically
    await persistSession(newToken, newUser);

    console.log('✅ [AuthContext] Session applied — uid:', newUid);
  }, [dispatch]);

  // ── login ───────────────────────────────────────────────────────────────
  /**
   * Call this from LoginScreen after Firebase auth succeeds.
   *
   * @param {Object} payload  { idToken, email?, phone?, isTest? }
   * @returns {{ success: boolean, uid?: string, error?: string }}
   */
  const login = useCallback(async (payload) => {
    try {
      console.log('📤 [AuthContext] POST /auth/login');
      const data = await authService.login(payload);

      // Pass the Firebase idToken so it becomes the Bearer token if the
      // backend doesn't return its own JWT.
      await applyAuthResponse(data, payload.idToken);

      showToast({
        type: 'success',
        title: 'Login Successful',
        message: `Welcome back, ${data.user?.fullName || data.user?.email || 'User'}!`
      });

      const resolvedUid = data.uid ?? data.user?.uid ?? data.user?._id ?? data.user?.id ?? null;
      return { success: true, uid: resolvedUid };
    } catch (err) {
      console.error('❌ [AuthContext] login error:', err);
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Login failed';
      return { success: false, error: message };
    }
  }, [applyAuthResponse]);

  // ── register ────────────────────────────────────────────────────────────
  /**
   * Call this from RegisterScreen after Firebase auth succeeds.
   *
   * @param {Object} payload  { idToken, fullName, email?, phone?, password?, isTest? }
   * @returns {{ success: boolean, uid?: string, error?: string }}
   */
  const register = useCallback(async (payload) => {
    try {
      console.log('📤 [AuthContext] POST /auth/register');
      const data = await authService.register(payload);

      await applyAuthResponse(data, payload.idToken);

      showToast({
        type: 'success',
        title: 'Account Created',
        message: 'Welcome to GoodKart! Start shopping now.'
      });

      const resolvedUid = data.uid ?? data.user?.uid ?? data.user?._id ?? data.user?.id ?? null;
      return { success: true, uid: resolvedUid };
    } catch (err) {
      console.error('❌ [AuthContext] register error:', err);
      const message =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        err?.message ??
        'Registration failed';
      return { success: false, error: message };
    }
  }, [applyAuthResponse]);

  // ── logout ──────────────────────────────────────────────────────────────
  /**
   * Wipes local state, AsyncStorage, and Redux.
   * Call this from ProfileScreen / SettingsScreen.
   */
  const logout = useCallback(async () => {
    try {
      // Optionally tell the backend
      await authService.logout?.();
    } catch (_) {
      // Non-fatal — always clear locally
    }

    setUid(null);
    setUser(null);
    setToken(null);
    dispatch(clearCredentials());
    await wipeSession();

    showToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been successfully logged out.'
    });

    console.log('👋 [AuthContext] Logged out');
  }, [dispatch]);



  // ── updateUser ──────────────────────────────────────────────────────────
  /**
   * Merge-patch the local user object.
   * Call this from EditProfileScreen after a successful profile update API call.
   *
   * @param {Object} patch  Partial user fields to merge in
   */
  const updateUser = useCallback(async (patch) => {
    setUser((prev) => {
      const updated = { ...prev, ...patch };
      // Persist the update so it survives an app restart
      persistSession(token, updated).catch(() => { });
      // Sync Redux
      dispatch(setCredentials({ token, user: updated }));
      return updated;
    });
  }, [token, dispatch]);

  // ── Context value ───────────────────────────────────────────────────────
  // useMemo so consumers only re-render when something actually changes
  const value = useMemo(() => ({
    // State
    uid,
    user,
    token,
    isLoggedIn: !!uid,
    isLoading,

    // Actions
    login,
    register,
    logout,
    updateUser,
  }), [uid, user, token, isLoading, login, register, logout, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── useAuth hook ───────────────────────────────────────────────────────────
/**
 * Primary hook — use this everywhere instead of route.params.uid.
 *
 * @example
 * const { uid, user, isLoggedIn, logout } = useAuth();
 */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
};

export default AuthContext;