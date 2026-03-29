# SellSathi

A React Native e-commerce app built with Expo Router and the Dark Lumina Noir design system.

## Tech Stack

- **Framework**: React Native with Expo Router (file-based routing)
- **State Management**: Zustand
- **API**: Axios
- **UI**: React Native with expo-linear-gradient, react-native-safe-area-context
- **Theme**: Dark Lumina Noir design system

## Project Structure

```
├── app/                    # Expo Router file-based routing
│   ├── _layout.jsx         # Root layout with SafeAreaProvider
│   ├── (auth)/             # Authentication stack
│   │   ├── _layout.jsx
│   │   ├── splash.jsx
│   │   ├── login.jsx
│   │   ├── register.jsx
│   │   └── forgot-password.jsx
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── _layout.jsx     # 5 tabs: Home, Categories, Cart, Orders, Profile
│   │   ├── home.jsx
│   │   ├── categories.jsx
│   │   ├── cart.jsx
│   │   ├── orders.jsx
│   │   └── profile.jsx
│   ├── product/            # Product screens
│   │   ├── [id].jsx        # Product detail
│   │   └── listing.jsx     # Product listing
│   ├── checkout/           # Checkout flow
│   │   ├── index.jsx       # Main checkout
│   │   ├── address.jsx     # Address step
│   │   ├── payment.jsx     # Payment step
│   │   └── success.jsx     # Order success
│   └── orders/
│       └── tracking.jsx    # Order tracking
├── components/             # Reusable components
│   ├── common/             # Common components
│   ├── home/               # Home screen components
│   ├── product/            # Product components
│   ├── checkout/           # Checkout components
│   └── layout/             # Layout components
├── constants/              # App constants
│   ├── colors.js           # Dark Lumina Noir color tokens
│   ├── categories.js       # Categories data
│   └── productVariants.js # Product variants
├── services/               # API services
│   └── api.js              # Axios configuration
├── store/                  # Zustand stores
│   ├── useAuthStore.js     # Authentication state
│   └── useCartStore.js     # Shopping cart state
├── utils/                  # Utility functions
│   ├── priceUtils.js       # Price formatting & calculations
│   ├── cartUtils.js        # Cart utilities
│   ├── orderUtils.js       # Order status utilities
│   └── reviewUtils.js      # Review utilities
└── assets/                 # Static assets
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Run on device/simulator:
   ```bash
   npm run android    # Android
   npm run ios        # iOS
   npm run web        # Web (if configured)
   ```

## Design System

The app uses a dark theme with the Lumina Noir color palette:

- **Background**: `#0A0E13`
- **Surface**: `#111827`
- **Accent**: `#00E5FF` (Cyan)
- **Text**: `#FFFFFF` (Primary), `#94A3B8` (Secondary)

All screens show placeholder content in cyan accent color on dark background to verify the theme is working.

## Features

- ✅ File-based routing with Expo Router
- ✅ Dark Lumina Noir theme
- ✅ Authentication flow (splash, login, register, forgot password)
- ✅ Bottom tab navigation (5 tabs)
- ✅ Product listing and detail views
- ✅ Shopping cart with Zustand state management
- ✅ Checkout flow (address, payment, success)
- ✅ Order tracking
- ✅ API integration ready
- ✅ Component structure ready

## API Configuration

The app is configured to connect to:
```
https://sellsathibackend.onrender.com/api
```

API endpoints are pre-configured in `services/api.js` for:
- Products (list, detail)
- Authentication (login, register)
- Orders
- Cart operations

## State Management

- **useAuthStore**: User authentication state
- **useCartStore**: Shopping cart state with add/remove/clear operations

## Utilities

Helper functions for:
- Price formatting and discount calculations
- Cart total and item count
- Order status mapping
- Review rating calculations
