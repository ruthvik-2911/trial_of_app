# GoodKart API Services

Complete API service layer for the GoodKart e-commerce application.

## 📁 File Structure

```
src/services/api/
├── apiClient.js          # Axios instance with interceptors
├── authService.js        # Authentication & registration
├── productService.js     # Product browsing & search
├── cartService.js        # Shopping cart management
├── orderService.js       # Order placement & tracking
├── profileService.js     # Profile, addresses & wishlist
└── index.js             # Central export point
```

## 🚀 Installation

1. Install dependencies:
```bash
npm install axios
```

2. Set up environment variables in `.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 📖 Usage Examples

### Import Services

```javascript
// Import individual services
import { authService, productService, cartService } from './services/api';

// Or import all services
import api from './services/api';
```

### Authentication

```javascript
import { authService } from './services/api';

// Login
const handleLogin = async (idToken) => {
  try {
    const response = await authService.login({
      idToken,
      email: 'user@example.com',
    });
    console.log('Login successful:', response);
  } catch (error) {
    console.error('Login failed:', error);
  }
};

// Register
const handleRegister = async (userData) => {
  try {
    const response = await authService.register({
      idToken: 'firebase_token',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '+919876543210',
      dob: '1990-01-01',
      password: 'securePassword123',
      isTest: false,
    });
    console.log('Registration successful:', response);
  } catch (error) {
    console.error('Registration failed:', error);
  }
};

// Send Email OTP
const sendOTP = async (email) => {
  try {
    await authService.sendEmailOTP(email);
    console.log('OTP sent to:', email);
  } catch (error) {
    console.error('Failed to send OTP:', error);
  }
};

// Logout
authService.logout();

// Check authentication status
const isLoggedIn = authService.isAuthenticated();
```

### Products

```javascript
import { productService } from './services/api';

// Get all products
const fetchProducts = async () => {
  try {
    const products = await productService.getAllProducts({
      page: 1,
      limit: 20,
      sortBy: 'price',
      order: 'asc',
    });
    console.log('Products:', products);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get single product
const fetchProduct = async (productId) => {
  try {
    const product = await productService.getProductById(productId);
    console.log('Product details:', product);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Search products
const searchProducts = async (query) => {
  try {
    const results = await productService.searchProducts(query, {
      category: 'electronics',
    });
    console.log('Search results:', results);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get products by category
const getByCategory = async (category) => {
  try {
    const products = await productService.getProductsByCategory(category);
    console.log('Category products:', products);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Shopping Cart

```javascript
import { cartService } from './services/api';

const uid = 'user123'; // User ID

// Get cart
const fetchCart = async () => {
  try {
    const cart = await cartService.getCart(uid);
    console.log('Cart:', cart);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Add to cart
const addItem = async () => {
  try {
    const updatedCart = await cartService.addToCart(uid, {
      productId: 'prod123',
      quantity: 2,
      variant: 'blue-medium',
    });
    console.log('Item added:', updatedCart);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Remove from cart
const removeItem = async (productId) => {
  try {
    const updatedCart = await cartService.removeFromCart(uid, productId);
    console.log('Item removed:', updatedCart);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Update quantity
const updateQty = async (productId, quantity) => {
  try {
    const updatedCart = await cartService.updateQuantity(uid, productId, quantity);
    console.log('Quantity updated:', updatedCart);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get cart count
const getCount = async () => {
  try {
    const count = await cartService.getCartCount(uid);
    console.log('Cart items:', count);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Clear cart
const clearCart = async () => {
  try {
    await cartService.clearCart(uid);
    console.log('Cart cleared');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Orders

```javascript
import { orderService } from './services/api';

const uid = 'user123';

// Place order
const placeOrder = async () => {
  try {
    const order = await orderService.placeOrder(uid, {
      items: [
        { productId: 'prod123', quantity: 2, price: 999 },
        { productId: 'prod456', quantity: 1, price: 1499 },
      ],
      total: 3497,
      email: 'user@example.com',
      paymentMethod: 'UPI',
      shippingDetails: {
        address: '123 Main St, Apt 4B',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560001',
        phone: '+919876543210',
      },
    });
    console.log('Order placed:', order);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get user orders
const fetchOrders = async () => {
  try {
    const orders = await orderService.getUserOrders(uid, {
      page: 1,
      limit: 10,
    });
    console.log('Orders:', orders);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get order by ID
const fetchOrder = async (orderId) => {
  try {
    const order = await orderService.getOrderById(orderId);
    console.log('Order details:', order);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Cancel order
const cancelOrder = async (orderId) => {
  try {
    const result = await orderService.cancelOrder(
      orderId,
      'Changed my mind'
    );
    console.log('Order cancelled:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Download invoice
const downloadInvoice = async (orderId) => {
  try {
    await orderService.downloadInvoice(orderId);
    console.log('Invoice downloaded');
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get reviewable orders
const getReviewableOrders = async () => {
  try {
    const orders = await orderService.getReviewableOrders(uid);
    console.log('Reviewable orders:', orders);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Track order
const trackOrder = async (orderId) => {
  try {
    const tracking = await orderService.trackOrder(orderId);
    console.log('Tracking info:', tracking);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Profile & Addresses

```javascript
import { profileService } from './services/api';

const uid = 'user123';

// Get profile
const fetchProfile = async () => {
  try {
    const profile = await profileService.getProfile(uid);
    console.log('Profile:', profile);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Update profile
const updateProfile = async () => {
  try {
    const updated = await profileService.updateProfile(uid, {
      fullName: 'John Doe',
      phone: '+919876543210',
      gender: 'male',
    });
    console.log('Profile updated:', updated);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Get addresses
const fetchAddresses = async () => {
  try {
    const addresses = await profileService.getAddresses(uid);
    console.log('Addresses:', addresses);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Add address
const addAddress = async () => {
  try {
    const address = await profileService.addAddress(uid, {
      name: 'John Doe',
      phone: '+919876543210',
      addressLine1: '123 Main St',
      addressLine2: 'Apt 4B',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      landmark: 'Near City Mall',
      type: 'home',
      isDefault: true,
    });
    console.log('Address added:', address);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Delete address
const deleteAddress = async (addressId) => {
  try {
    await profileService.deleteAddress(uid, addressId);
    console.log('Address deleted');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Wishlist

```javascript
import { profileService } from './services/api';

const uid = 'user123';

// Get wishlist
const fetchWishlist = async () => {
  try {
    const wishlist = await profileService.getWishlist(uid);
    console.log('Wishlist:', wishlist);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Add to wishlist
const addToWishlist = async (productId) => {
  try {
    const wishlist = await profileService.addToWishlist(uid, {
      productId,
    });
    console.log('Added to wishlist:', wishlist);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Remove from wishlist
const removeFromWishlist = async (productId) => {
  try {
    const wishlist = await profileService.removeFromWishlist(uid, productId);
    console.log('Removed from wishlist:', wishlist);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Toggle wishlist
const toggleWishlist = async (productId) => {
  try {
    const wishlist = await profileService.toggleWishlist(uid, productId);
    console.log('Wishlist toggled:', wishlist);
  } catch (error) {
    console.error('Error:', error);
  }
};

// Check if in wishlist
const checkWishlist = async (productId) => {
  try {
    const inWishlist = await profileService.isInWishlist(uid, productId);
    console.log('In wishlist:', inWishlist);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

## 🔒 Authentication

All API requests (except login/register) require authentication. The `apiClient` automatically:
- Adds the `Authorization` header with the token from `localStorage`
- Redirects to login on 401 errors
- Handles common HTTP errors

## 🛠️ Error Handling

All services include try-catch blocks and proper error logging:

```javascript
try {
  const result = await someService.someMethod();
  // Handle success
} catch (error) {
  // Error is already logged by the service
  // Handle UI error state here
  console.error('Operation failed:', error);
}
```

## 📝 Notes

- Update `REACT_APP_API_URL` in `.env` with your backend URL
- Auth tokens are stored in `localStorage`
- User data is cached in `localStorage` and updated on profile changes
- Invoice and shipping label downloads trigger automatic file downloads
- All services use consistent error handling and logging

## 🔄 Response Format

Expected API response format:

```javascript
{
  success: true,
  data: { /* response data */ },
  message: "Operation successful"
}
```

Error response:

```javascript
{
  success: false,
  error: "Error message",
  details: { /* error details */ }
}
```

## 🚀 Integration with React

Example React component:

```javascript
import React, { useEffect, useState } from 'react';
import { productService } from './services/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await productService.getAllProducts();
        setProducts(data.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}

export default ProductList;
```

## 📞 Support

For issues or questions, please contact the development team.