// ─── GoodKart Mock Data ─────────────────────────────────────────────────────

export const CATEGORIES = [
    { id: '1', name: 'Fashion (Men)', icon: 'shirt-outline', color: '#7B5EEA' },
    { id: '2', name: 'Jewels', icon: 'diamond-outline', color: '#FFD700' },
    { id: '3', name: 'Tech', icon: 'phone-portrait-outline', color: '#60A5FA' },
    { id: '4', name: 'Home', icon: 'home-outline', color: '#4ADE80' },
    { id: '5', name: 'Beauty', icon: 'rose-outline', color: '#F472B6' },
    { id: '6', name: 'Sports', icon: 'fitness-outline', color: '#FB923C' },
];

export const FLASH_DEALS = [
    {
        id: 'fd1',
        badge: '⚡ EXCLUSIVE DROP',
        title: 'Premium\nCollection 2025',
        subtitle: 'Limited edition · 48h only',
        cta: 'Discover →',
        gradientColors: ['#2D1B69', '#1A0B3E'],
        accentColor: '#FFD700',
    },
    {
        id: 'fd2',
        badge: '🔥 FLASH DROP',
        title: 'Next-Gen Tech\nDeals Today',
        subtitle: 'Limited stock · Ends 11:59 PM',
        cta: 'Shop Now →',
        gradientColors: ['#1A2E4A', '#0D1B2E'],
        accentColor: '#60A5FA',
    },
];

export const CURATED_PRODUCTS = [
    {
        id: 'p1',
        name: 'Air Max Prestige',
        price: 4299,
        originalPrice: 7000,
        discount: 39,
        rating: 4.5,
        reviews: 128,
        category: 'Fashion (Men)',
        badge: 'HOT',
        badgeColor: '#FFD700',
        emoji: '👟',
    },
    {
        id: 'p2',
        name: 'Gold Watch Pro',
        price: 8999,
        originalPrice: 14000,
        discount: 36,
        rating: 4.8,
        reviews: 312,
        category: 'Jewels',
        badge: 'EXCLUSIVE',
        badgeColor: '#7B5EEA',
        emoji: '⌚',
    },
    {
        id: 'p3',
        name: 'Pixel 9 Ultra',
        price: 72000,
        originalPrice: 85000,
        discount: 15,
        rating: 4.7,
        reviews: 541,
        category: 'Tech',
        badge: 'NEW',
        badgeColor: '#60A5FA',
        emoji: '📱',
    },
    {
        id: 'p4',
        name: 'Sony WH-1000XM5',
        price: 18999,
        originalPrice: 29990,
        discount: 37,
        rating: 4.8,
        reviews: 5441,
        category: 'Tech',
        badge: 'TOP RATED',
        badgeColor: '#4ADE80',
        emoji: '🎧',
    },
];

export const TRENDING_PRODUCTS = [
    {
        id: 't1',
        name: 'Diamond Pendant',
        price: 12500,
        originalPrice: 18000,
        discount: 31,
        rating: 4.6,
        reviews: 89,
        emoji: '💎',
        badge: 'TRENDING',
        badgeColor: '#FFD700',
    },
    {
        id: 't2',
        name: 'Silk Kurta Set',
        price: 3200,
        originalPrice: 5000,
        discount: 36,
        rating: 4.4,
        reviews: 203,
        emoji: '👗',
        badge: 'HOT',
        badgeColor: '#F472B6',
    },
    {
        id: 't3',
        name: 'Smart Speaker',
        price: 5499,
        originalPrice: 8000,
        discount: 31,
        rating: 4.3,
        reviews: 167,
        emoji: '🔊',
        badge: 'NEW',
        badgeColor: '#60A5FA',
    },
    {
        id: 't4',
        name: 'Leather Wallet',
        price: 1299,
        originalPrice: 2000,
        discount: 35,
        rating: 4.5,
        reviews: 432,
        emoji: '👛',
        badge: 'SALE',
        badgeColor: '#FB923C',
    },
];

// ─── Product Detail Data ────────────────────────────────────────────────────
export const PRODUCT_DETAIL = {
    id: 'pd1',
    name: 'Gold Edition Smart Watch Pro',
    subtitle: 'Premium Smartwatch with AMOLED Display',
    price: 8999,
    originalPrice: 14000,
    discount: 36,
    rating: 4.9,
    reviews: 1203,
    badge: 'EXCLUSIVE',
    badgeColor: '#FFD700',
    inStock: true,
    stockLabel: '· In Stock',
    emoji: '⌚',

    // Image carousel — using emoji + gradient placeholders (replace with real images)
    images: [
        { id: 'i1', emoji: '⌚', gradient: ['#2D1B69', '#1A0B3E'] },
        { id: 'i2', emoji: '⌚', gradient: ['#1A2E4A', '#0D1B2E'] },
        { id: 'i3', emoji: '⌚', gradient: ['#1A3A2E', '#0D2018'] },
    ],

    colors: [
        { id: 'c1', name: 'Gold', hex: '#FFD700' },
        { id: 'c2', name: 'Silver', hex: '#C0C0C0' },
        { id: 'c3', name: 'Black', hex: '#1A1A2E' },
    ],

    specs: [
        { label: 'Display', value: '1.4" AMOLED, 454×454' },
        { label: 'Battery', value: '7 Days / 500mAh' },
        { label: 'Water', value: '5ATM Resistant' },
        { label: 'Sensors', value: 'HR, SpO2, GPS' },
        { label: 'Compat.', value: 'iOS & Android' },
    ],

    highlights: ['40hr Battery', 'ANC Noise', 'Hi-Res Audio'],

    seller: {
        name: 'GoodKartLux',
        rating: 4.8,
        sales: '12K+ sold',
        verified: true,
    },

    reviews: [
        {
            id: 'r1',
            user: 'Rahul M.',
            avatar: 'R',
            rating: 5,
            date: '12 Mar 2025',
            comment: 'Absolutely stunning watch. Build quality is premium and the gold finish looks gorgeous in person.',
        },
        {
            id: 'r2',
            user: 'Priya K.',
            avatar: 'P',
            rating: 5,
            date: '8 Mar 2025',
            comment: 'Battery life is exceptional. Easily lasts 6-7 days on a single charge. Worth every rupee!',
        },
        {
            id: 'r3',
            user: 'Arjun S.',
            avatar: 'A',
            rating: 4,
            date: '2 Mar 2025',
            comment: 'Great smartwatch overall. Health tracking is accurate and the AMOLED display is stunning.',
        },
    ],
};

export const SAVED_ADDRESSES = [
    {
        id: '1',
        name: 'Rahul Srivastava',
        phone: '+91 98765 43210',
        pincode: '560103',
        state: 'Karnataka',
        city: 'Bengaluru',
        houseNo: 'House No. 42, Skyview Apartments',
        area: 'Sarjapur Road, Bellandur',
        type: 'Home',
        isDefault: true,
    },
    {
        id: '2',
        name: 'Rahul Srivastava',
        phone: '+91 88888 77777',
        pincode: '110001',
        state: 'Delhi',
        city: 'New Delhi',
        houseNo: 'Unit 502, Tech Park Tower A',
        area: 'Connaught Place',
        type: 'Work',
        isDefault: false,
    },
];

export const SAVED_PAYMENTS = [
    {
        id: '1',
        type: 'card',
        cardType: 'Visa',
        number: '**** **** **** 4582',
        expiry: '09/27',
        holder: 'Rahul Srivastava',
        isDefault: true,
        gradient: ['#1A2E4A', '#0D1B2E'],
    },
    {
        id: '2',
        type: 'card',
        cardType: 'Mastercard',
        number: '**** **** **** 8812',
        expiry: '12/26',
        holder: 'Rahul Srivastava',
        isDefault: false,
        gradient: ['#2D1B69', '#1A0B3E'],
    },
    {
        id: '3',
        type: 'upi',
        number: 'rahulsriv@okicici',
        provider: 'Google Pay',
        isDefault: false,
    },
];

export const WALLET_TRANSACTIONS = [
    { id: 't1', type: 'credit', label: 'Cashback Earned', desc: 'Order #GK-2025-8821', amount: 450, date: '28 Mar' },
    { id: 't2', type: 'debit', label: 'Order Payment', desc: 'Order #GK-2025-7988', amount: 1200, date: '25 Mar' },
    { id: 't3', type: 'credit', label: 'Referral Bonus', desc: 'Joined: Amit Kumar', amount: 100, date: '20 Mar' },
    { id: 't4', type: 'credit', label: 'Promotional Reward', desc: 'App Anniversary', amount: 50, date: '15 Mar' },
    { id: 't5', type: 'debit', label: 'Voucher Purchased', desc: 'Starbucks Gift Card', amount: 250, date: '10 Mar' },
];