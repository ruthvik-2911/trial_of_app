import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import cartService from '../services/api/cartService';
import { useAuth } from '../hooks/useAuth'; // provides { user } with user.uid

const CartContext = createContext();

// ─── User-scoped storage key so different users never share a cache ──────────
const cartStorageKey = (uid) => uid ? `@cart_${uid}` : '@cart_guest';

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Get the authenticated user — uid is needed for all API calls
    const { user } = useAuth();
    const uid = user?.uid;

    // Ref to prevent saving stale data during initial load
    const hasLoaded = useRef(false);
    // Track the previous uid so we can detect actual user switches
    const prevUidRef = useRef(undefined);

    // ─── Reset + load cart whenever the user changes (login / logout) ────────
    useEffect(() => {
        // Skip the very first render comparison (prevUidRef is undefined)
        if (prevUidRef.current !== undefined && prevUidRef.current === uid) return;
        prevUidRef.current = uid;

        // Reset the guard so the persist effect doesn't fire during the switch
        hasLoaded.current = false;
        // Clear in-memory cart immediately — prevents stale items from flashing
        // NOTE: this does NOT call setCartItems inside the persist effect because
        // hasLoaded is false at this point, so nothing gets written to storage.
        setCartItems([]);

        if (uid) {
            loadCartFromServer();
        } else {
            // Not logged in — load guest cart from local storage
            loadCartFromLocal();
        }
    }, [uid]);

    // ─── Persist to AsyncStorage whenever cartItems change (offline backup) ─
    useEffect(() => {
        if (hasLoaded.current) {
            saveCartToLocal(cartItems);
        }
    }, [cartItems, uid]);

    // ─── Server sync ────────────────────────────────────────────────────────
    const loadCartFromServer = async () => {
        setIsLoading(true);
        try {
            const data = await cartService.getCart(uid);
            const serverItems = data?.items || data?.cartItems || [];
            // Normalise server items to the shape our screens expect
            const normalised = serverItems.map(normaliseItem);

            if (normalised.length > 0) {
                // Server has items — use them as source of truth
                setCartItems(normalised);
                hasLoaded.current = true;
            } else {
                // Server returned empty — check local backup
                const key = cartStorageKey(uid);
                const saved = await AsyncStorage.getItem(key);
                const localItems = saved ? JSON.parse(saved) : [];

                if (localItems.length > 0) {
                    // Local has items — restore them and re-push to server
                    setCartItems(localItems);
                    syncCartToServer(localItems);
                } else {
                    // Genuinely empty — both server and local agree
                    setCartItems([]);
                }
                hasLoaded.current = true;
            }
        } catch (error) {
            console.warn('Failed to load cart from server, falling back to local:', error.message);
            await loadCartFromLocal();
            return; // loadCartFromLocal handles hasLoaded + setIsLoading
        } finally {
            setIsLoading(false);
        }
    };


    const syncCartToServer = async (items) => {
        if (!uid) return; // can't sync without a user
        setIsSyncing(true);
        try {
            // Shape items to what the API expects
            const apiItems = items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                variant: item.color || null,
                price: item.price,
                name: item.name,
                image: item.image,
                originalPrice: item.originalPrice,
                discount: item.discount,
                seller: item.seller,
            }));
            await cartService.updateCart(uid, apiItems);
        } catch (error) {
            console.warn('Failed to sync cart to server:', error.message);
            // Local state is still correct — user can keep shopping;
            // next load will attempt server sync again.
        } finally {
            setIsSyncing(false);
        }
    };

    // ─── Local storage helpers ──────────────────────────────────────────────
    const loadCartFromLocal = async () => {
        try {
            const key = cartStorageKey(uid);
            const saved = await AsyncStorage.getItem(key);
            if (saved) {
                setCartItems(JSON.parse(saved));
            }
        } catch (error) {
            console.error('Error loading cart from local storage:', error);
        } finally {
            hasLoaded.current = true;
            setIsLoading(false);
        }
    };

    const saveCartToLocal = async (items) => {
        try {
            const key = cartStorageKey(uid);
            await AsyncStorage.setItem(key, JSON.stringify(items));
        } catch (error) {
            console.error('Error saving cart to local storage:', error);
        }
    };

    // ─── Normalise a server cart item to the shape screens use ──────────────
    const normaliseItem = (item) => ({
        id: item.productId || item.id,
        name: item.name || '',
        price: item.price || 0,
        originalPrice: item.originalPrice || item.price || 0,
        discount: item.discount || 0,
        image: item.image || item.images?.[0] || null,
        color: item.variant || item.color || null,
        quantity: item.quantity || 1,
        inStock: item.inStock !== false,
        seller: item.seller || 'Sellsathi',
    });

    // ─── Cart operations ────────────────────────────────────────────────────

    const addToCart = useCallback((product, quantity = 1, selectedColor = null) => {
        let message = '';
        setCartItems(prev => {
            const existingIdx = prev.findIndex(
                item => item.id === product.id && item.color === selectedColor
            );

            let updated;
            if (existingIdx > -1) {
                updated = [...prev];
                updated[existingIdx] = {
                    ...updated[existingIdx],
                    quantity: updated[existingIdx].quantity + quantity,
                };
                message = 'Quantity updated in cart';
            } else {
                // Use discountPrice (offer price) if available, else fall back to price
                const originalPrice = product.price || 0;
                const effectivePrice = product.discountPrice || product.price || 0;
                const discountPct = originalPrice && effectivePrice < originalPrice
                    ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
                    : (product.discount || 0);

                const newItem = {
                    id: product.id,
                    name: product.name || product.title,
                    price: effectivePrice,
                    originalPrice: originalPrice,
                    discount: discountPct,
                    image: product.image || product.images?.[0],
                    color: selectedColor,
                    quantity,
                    inStock: product.inStock !== false,
                    seller: product.seller || 'Sellsathi',
                };
                updated = [...prev, newItem];
                message = 'Added to cart successfully';
            }

            // Fire-and-forget server sync
            syncCartToServer(updated);
            return updated;
        });

        return { success: true, message };
    }, [uid]);

    const addMultipleToCart = useCallback((products) => {

        setCartItems(prev => {
            let updated = [...prev];
            
            products.forEach(({ product, quantity = 1, selectedColor = null }) => {
                const existingIdx = updated.findIndex(
                    item => item.id === product.id && item.color === selectedColor
                );

                if (existingIdx > -1) {
                    updated[existingIdx] = {
                        ...updated[existingIdx],
                        quantity: updated[existingIdx].quantity + quantity,
                    };
                } else {
                    const originalPrice = product.price || 0;
                    const effectivePrice = product.discountPrice || product.price || 0;
                    const discountPct = originalPrice && effectivePrice < originalPrice
                        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
                        : (product.discount || 0);

                    const newItem = {
                        id: product.id,
                        name: product.name || product.title,
                        price: effectivePrice,
                        originalPrice: originalPrice,
                        discount: discountPct,
                        image: product.image || product.images?.[0],
                        color: selectedColor,
                        quantity,
                        inStock: product.inStock !== false,
                        seller: product.seller || 'Sellsathi',
                    };
                    updated.push(newItem);
                }
            });

            syncCartToServer(updated);
            return updated;
        });

        return { success: true, message: `${products.length} items added to cart` };
    }, [uid]);

    const removeFromCart = useCallback((itemId, color = null) => {
        setCartItems(prev => {
            const updated = prev.filter(
                item => !(item.id === itemId && item.color === color)
            );
            syncCartToServer(updated);
            return updated;
        });
        return { success: true, message: 'Removed from cart' };
    }, [uid]);

    const updateQuantity = useCallback((itemId, newQuantity, color = null) => {
        if (newQuantity < 1) {
            return removeFromCart(itemId, color);
        }
        if (newQuantity > 10) {
            return { success: false, message: 'Maximum 10 items per product' };
        }

        setCartItems(prev => {
            const updated = prev.map(item =>
                item.id === itemId && item.color === color
                    ? { ...item, quantity: newQuantity }
                    : item
            );
            syncCartToServer(updated);
            return updated;
        });
        return { success: true, message: 'Quantity updated' };
    }, [uid]);

    const clearCart = useCallback(() => {
        setCartItems([]);
        syncCartToServer([]);
        return { success: true, message: 'Cart cleared' };
    }, [uid]);

    // ─── Computed helpers ───────────────────────────────────────────────────

    const getCartCount = () =>
        cartItems.reduce((total, item) => total + item.quantity, 0);

    const getCartTotal = () =>
        cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    const getTotalSavings = () =>
        cartItems.reduce(
            (total, item) => total + (item.originalPrice - item.price) * item.quantity,
            0
        );

    const isInCart = (productId, color = null) =>
        cartItems.some(item => item.id === productId && item.color === color);

    const getItemQuantity = (productId, color = null) => {
        const item = cartItems.find(i => i.id === productId && i.color === color);
        return item ? item.quantity : 0;
    };

    // ─── Context value ──────────────────────────────────────────────────────
    const value = {
        cartItems,
        isLoading,
        isSyncing,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartCount,
        getCartTotal,
        getTotalSavings,
        isInCart,
        getItemQuantity,
        refreshCart: loadCartFromServer, // manual refresh if needed
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export default CartContext;