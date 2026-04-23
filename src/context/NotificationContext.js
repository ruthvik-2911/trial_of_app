import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceNotificationService from '../services/DeviceNotificationService';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load notifications from AsyncStorage on app start
    useEffect(() => {
        loadNotifications();
    }, []);

    // Save notifications to AsyncStorage whenever they change
    useEffect(() => {
        if (!isLoading) {
            saveNotifications();
        }
    }, [notifications]);

    const loadNotifications = async () => {
        try {
            const savedNotifications = await AsyncStorage.getItem('@notifications');
            if (savedNotifications) {
                setNotifications(JSON.parse(savedNotifications));
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveNotifications = async () => {
        try {
            await AsyncStorage.setItem('@notifications', JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving notifications:', error);
        }
    };

    // Add new notification
    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: 'Just now',
            isRead: false,
            ...notification,
        };
        setNotifications(prev => [newNotification, ...prev]);
        return { success: true, notification: newNotification };
    };

    // Mark notification as read
    const markAsRead = (notificationId) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, isRead: true } : n
            )
        );
        return { success: true };
    };

    // Mark all notifications as read
    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
        );
        return { success: true };
    };

    // Delete notification
    const deleteNotification = (notificationId) => {
        setNotifications(prev =>
            prev.filter(n => n.id !== notificationId)
        );
        return { success: true };
    };

    // Clear all notifications
    const clearAllNotifications = () => {
        setNotifications([]);
        return { success: true };
    };

    // Get unread count
    const getUnreadCount = () => {
        return notifications.filter(n => !n.isRead).length;
    };

    // Get notifications by type
    const getNotificationsByType = (type) => {
        return notifications.filter(n => n.type === type);
    };

    // Create order notification
    const createOrderNotification = (order, status) => {
        const notificationConfig = {
            delivered: {
                icon: 'checkmark-circle',
                iconColor: '#00D97E',
                title: 'Order Delivered',
                message: `Your order #${order.id} has been delivered successfully`,
            },
            shipped: {
                icon: 'cube',
                iconColor: '#FFD700',
                title: 'Order Shipped',
                message: `Your order #${order.id} is on the way`,
            },
            processing: {
                icon: 'time',
                iconColor: '#FFA500',
                title: 'Order Processing',
                message: `Your order #${order.id} is being processed`,
            },
            confirmed: {
                icon: 'checkmark-done',
                iconColor: '#00D9FF',
                title: 'Order Confirmed',
                message: `Your order #${order.id} has been confirmed`,
            },
            cancelled: {
                icon: 'close-circle',
                iconColor: '#FF4757',
                title: 'Order Cancelled',
                message: `Your order #${order.id} has been cancelled`,
            },
        };

        const config = notificationConfig[status];
        if (config) {
            // Trigger native mobile notification
            DeviceNotificationService.showAlert({
                title: config.title,
                body: config.message,
                data: { orderId: order.id, type: 'order_status' }
            });

            return addNotification({
                type: 'order',
                ...config,
                action: 'View Order',
                actionData: { orderId: order.id },
            });
        }
    };

    // Create payment notification
    const createPaymentNotification = (payment) => {
        return addNotification({
            type: 'payment',
            icon: 'card',
            iconColor: '#00D9FF',
            title: payment.success ? 'Payment Successful' : 'Payment Failed',
            message: payment.success
                ? `Payment of ₹${payment.amount} received for order #${payment.orderId}`
                : `Payment of ₹${payment.amount} failed. Please try again.`,
            action: payment.success ? null : 'Retry Payment',
            actionData: { orderId: payment.orderId },
        });
    };

    // Create offer notification
    const createOfferNotification = (offer) => {
        return addNotification({
            type: 'offer',
            icon: 'pricetag',
            iconColor: '#FF6B6B',
            title: offer.title,
            message: offer.message,
            action: 'Shop Now',
            actionData: { category: offer.category },
        });
    };

    // Create price drop notification
    const createPriceDropNotification = (product, oldPrice, newPrice) => {
        const discount = oldPrice - newPrice;
        return addNotification({
            type: 'wishlist',
            icon: 'heart',
            iconColor: '#FF4757',
            title: 'Price Drop Alert',
            message: `${product.name} is now ₹${discount.toLocaleString()} cheaper!`,
            action: 'View Item',
            actionData: { productId: product.id },
        });
    };

    // Create welcome notification
    const createWelcomeNotification = (userName) => {
        // Trigger native mobile notification
        DeviceNotificationService.showAlert({
            title: `Welcome to GoodKart, ${userName}! 🎉`,
            body: 'Start shopping and enjoy exclusive deals!',
        });

        return addNotification({
            type: 'account',
            icon: 'person',
            iconColor: '#FFD700',
            title: `Welcome to GoodKart, ${userName}! 🎉`,
            message: 'Start shopping and enjoy exclusive deals!',
            action: 'Start Shopping',
        });
    };

    // Create custom mobile notification (for demo/specific triggers)
    const createMobileNotification = (title, message, data = {}) => {
        DeviceNotificationService.showAlert({ title, body: message, data });
        return addNotification({
            type: 'announcement',
            icon: 'megaphone',
            iconColor: '#FF4757',
            title,
            message,
            ...data
        });
    };

    const value = {
        notifications,
        isLoading,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
        getUnreadCount,
        getNotificationsByType,
        createOrderNotification,
        createPaymentNotification,
        createOfferNotification,
        createPriceDropNotification,
        createWelcomeNotification,
        createMobileNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to use notification context
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export default NotificationContext;