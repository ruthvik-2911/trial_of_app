import apiClient from './apiClient';

/**
 * Order Service
 * Handles order placement, tracking, cancellation, and invoice management
 */

const orderService = {
    /**
     * Place a new order, generate invoice, and reduce stock
     * @param {string} uid - User ID
     * @param {Object} orderData - Order details
     * @param {Array} orderData.items - Array of order items
     * @param {number} orderData.total - Order total amount
     * @param {string} orderData.email - User email
     * @param {string} orderData.paymentMethod - Payment method (COD, Card, UPI, etc.)
     * @param {Object} orderData.shippingDetails - Shipping information
     * @param {string} orderData.shippingDetails.address - Shipping address
     * @param {string} orderData.shippingDetails.city - City
     * @param {string} orderData.shippingDetails.state - State
     * @param {string} orderData.shippingDetails.pincode - Pincode
     * @param {string} orderData.shippingDetails.phone - Contact phone
     * @returns {Promise} Order confirmation
     */
    placeOrder: async (uid, orderData) => {
        try {
            const response = await apiClient.post('/orders/place', {
                uid,
                orderData: {
                    items: orderData.items,
                    total: orderData.total,
                    email: orderData.email,
                    paymentMethod: orderData.paymentMethod,
                    shippingDetails: orderData.shippingDetails,
                },
            });

            return response.data;
        } catch (error) {
            console.error('Error placing order:', error);
            throw error;
        }
    },

    /**
     * Get all orders placed by the user
     * @param {string} uid - User ID
     * @param {Object} [params] - Optional query parameters
     * @param {string} [params.status] - Filter by order status
     * @param {number} [params.page] - Page number
     * @param {number} [params.limit] - Items per page
     * @returns {Promise} List of user orders
     */
    getUserOrders: async (uid, params = {}) => {
        try {
            // Add cache-buster to ensure we get the latest orders
            const response = await apiClient.get(`/orders/user/${uid}`, { 
                params: { ...params, _t: Date.now() } 
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching user orders:', error);
            throw error;
        }
    },

    /**
     * Get delivered orders that are not yet reviewed
     * @param {string} uid - User ID
     * @returns {Promise} Reviewable orders
     */
    getReviewableOrders: async (uid) => {
        try {
            const response = await apiClient.get(`/orders/user/${uid}/reviewable-orders`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reviewable orders:', error);
            throw error;
        }
    },

    /**
     * Fetch details of a specific order
     * @param {string} orderId - Order ID
     * @returns {Promise} Order details
     */
    getOrderById: async (orderId) => {
        try {
            const response = await apiClient.get(`/orders/${orderId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Cancel an order and process refund if applicable
     * @param {string} orderId - Order ID
     * @param {string} cancellationReason - Reason for cancellation
     * @returns {Promise} Cancellation confirmation
     */
    cancelOrder: async (orderId, cancellationReason) => {
        try {
            const response = await apiClient.post(`/orders/${orderId}/cancel`, {
                cancellationReason,
            });

            return response.data;
        } catch (error) {
            console.error(`Error canceling order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Open invoice PDF for the order in the device browser/viewer
     * @param {string} orderId - Order ID
     */
    downloadInvoice: async (orderId) => {
        try {
            const url = orderService.getInvoiceUrl(orderId);
            const { Linking } = require('react-native');
            await Linking.openURL(url);
        } catch (error) {
            console.error(`Error opening invoice for order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Get invoice URL without downloading
     * @param {string} orderId - Order ID
     * @returns {string} Invoice URL
     */
    getInvoiceUrl: (orderId) => {
        return `${apiClient.defaults.baseURL}/orders/invoice/${orderId}`;
    },

    /**
     * Fetch shipping label for the order
     * @param {string} orderId - Order ID
     * @returns {Promise} Shipping label data or PDF
     */
    getShippingLabel: async (orderId) => {
        try {
            const response = await apiClient.get(`/orders/${orderId}/label`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching shipping label for order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Open shipping label in the device browser/viewer
     * @param {string} orderId - Order ID
     */
    downloadShippingLabel: async (orderId) => {
        try {
            const url = `${apiClient.defaults.baseURL}/orders/${orderId}/label`;
            const { Linking } = require('react-native');
            await Linking.openURL(url);
        } catch (error) {
            console.error(`Error opening shipping label for order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Track order status
     * @param {string} orderId - Order ID
     * @returns {Promise} Order tracking information
     */
    trackOrder: async (orderId) => {
        try {
            const order = await orderService.getOrderById(orderId);
            return {
                orderId: order.id,
                status: order.status,
                trackingNumber: order.trackingNumber,
                estimatedDelivery: order.estimatedDelivery,
                timeline: order.timeline,
            };
        } catch (error) {
            console.error(`Error tracking order ${orderId}:`, error);
            throw error;
        }
    },

    /**
     * Get orders by status
     * @param {string} uid - User ID
     * @param {string} status - Order status (pending, processing, shipped, delivered, cancelled)
     * @returns {Promise} Filtered orders
     */
    getOrdersByStatus: async (uid, status) => {
        try {
            return await orderService.getUserOrders(uid, { status });
        } catch (error) {
            console.error(`Error fetching ${status} orders:`, error);
            throw error;
        }
    },
};

export default orderService;