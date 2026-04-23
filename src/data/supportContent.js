// ─── Support Content Data ─────────────────────────────────────────────────────
// Extracted from SellSathi_refactored-main source files.

export const FAQ_DATA = {
    customer: [
        {
            q: 'What is GoodKart?',
            a: 'GoodKart is an online marketplace where home artists and creators can sell their handmade products, and customers can discover unique handcrafted items.'
        },
        {
            q: 'Are the products handmade?',
            a: 'Yes. Most products on GoodKart are handmade or created by independent home artists and small creators.'
        },
        {
            q: 'How do I place an order?',
            list: ['Browse products', 'Add items to cart', 'Proceed to checkout', 'Enter delivery address', 'Complete payment'],
            ordered: true
        },
        {
            q: 'How can I track my order?',
            a: 'Once your order is shipped, you will receive a tracking ID and can track your delivery from the My Orders section.'
        },
        {
            q: 'What payment methods are available?',
            a: 'We support UPI, Debit / Credit Cards, Net Banking, and Cash on Delivery (where available).'
        },
        {
            q: 'How long will delivery take?',
            a: 'Delivery usually takes 3–7 business days, depending on your location and the seller\'s location.'
        },
        {
            q: 'Can I cancel my order?',
            a: 'Yes, orders can be cancelled before the seller ships the product.'
        },
        {
            q: 'What if the product arrives damaged?',
            a: 'Please contact support within 48 hours with photos, and we will assist with replacement or refund.'
        },
        {
            q: 'Can I return handmade products?',
            a: 'Return policies may vary depending on the seller and product category. Check the specific product page for details.'
        }
    ],
    seller: [
        {
            q: 'Who can sell on GoodKart?',
            a: 'Anyone who creates handmade products, crafts, or artistic items from home can register as a seller.'
        },
        {
            q: 'How do I become a seller?',
            a: 'Click "Become a Seller" in the menu, fill in your details, upload required verification documents, and wait for admin approval.'
        },
        {
            q: 'Is there any registration fee?',
            a: 'Currently, seller registration is free.'
        },
        {
            q: 'How do I list my products?',
            list: ['Login to Seller Dashboard', 'Click Add Product', 'Upload images', 'Add description and price'],
            ordered: true
        },
        {
            q: 'How will I receive orders?',
            a: 'When a customer places an order, you will receive a notification in your seller dashboard.'
        },
        {
            q: 'How does shipping work?',
            a: 'Once you mark the item Ready for Pickup, our logistics partner will handle the shipping process.'
        },
        {
            q: 'How do I receive payments?',
            a: 'Payments are transferred to your registered bank account after the order is delivered.'
        }
    ]
};

export const POLICIES = {
    'Cancellation & Returns': {
        effectiveDate: '27 March 2026',
        intro: 'This Cancellation & Returns Policy ("Policy") applies to purchases made on GoodKart and must be read with the Terms of Use.',
        sections: [
            {
                title: '1.1 Cancellation Policy',
                content: [
                    'Before Shipment: Customers may request cancellation before the Seller marks the order as "Ready for Pickup".',
                    'After Shipment: Once shipped, cancellation may not be possible. Return/refund may apply instead.',
                    'Platform Cancellations: GoodKart may cancel orders for suspected fraud, non-availability, or pricing errors.'
                ]
            },
            {
                title: '1.2 Return Policy',
                content: 'Returns are accepted only if the product is damaged, incorrect, or materially differs from the description.',
                bulletPoints: [
                    'Return requests must be raised within 48 hours of delivery.',
                    'Clear proof (unboxing video/photos) is required.',
                    'Products must be in original condition and packaging.'
                ]
            },
            {
                title: '1.3 Non-Returnable Items',
                bulletPoints: [
                    'Custom-made or personalized products',
                    'Perishable items',
                    'Hygiene-sensitive items',
                    'Explicitly marked non-returnable categories'
                ]
            },
            {
                title: '1.4 Refunds',
                content: 'Refunds are processed after verification, typically within 5–10 business days. Shipping charges may be non-refundable unless the return is due to seller error.'
            }
        ]
    },
    'Terms of Use': {
        effectiveDate: '27 March 2026',
        intro: 'These Terms constitute a legally binding agreement between GoodKart and the User.',
        sections: [
            {
                title: '1.1 Overview',
                content: 'GoodKart operates as a technology and marketplace intermediary enabling Sellers and Customers to connect. We do not manufacture or own the products listed by independent sellers.'
            },
            {
                title: '1.2 User Eligibility',
                content: 'Users must be at least 18 years of age and competent to contract under applicable laws.'
            },
            {
                title: '1.3 Platform Use',
                content: 'Users agree not to use the platform for unlawful, fraudulent, or harmful purposes, including the distribution of malicious code or IP infringement.'
            },
            {
                title: '1.4 Payments & Logistics',
                content: 'Payments are processed via third-party gateways (e.g., Razorpay). Shipping is enabled through logistics partners like Shiprocket. Delivery timelines are estimates.'
            }
        ]
    },
    'Privacy': {
        effectiveDate: '27 March 2026',
        intro: 'This policy explains how GoodKart collects and protects your personal data.',
        sections: [
            {
                title: '1.1 Data Collection',
                bulletPoints: [
                    'Identity & Contact: Name, email, phone number.',
                    'Address: Shipping and billing locations.',
                    'Usage Data: IP address, device type, and logs.'
                ]
            },
            {
                title: '1.2 Data Usage',
                content: 'Data is used to process orders, improve security, detect fraud, and communicate updates.'
            },
            {
                title: '1.3 Data Sharing',
                content: 'We share necessary data with payment gateways, logistics partners, and sellers to fulfill your purchase. We do not sell your personal data.'
            }
        ]
    },
    'Security': {
        effectiveDate: '27 March 2026',
        intro: 'GoodKart uses commercially reasonable security practices to protect your data.',
        sections: [
            {
                title: '1.1 Measures',
                bulletPoints: [
                    'HTTPS/TLS encryption for data in transit.',
                    'Secure authentication and session controls.',
                    'Least-privilege access and periodic security reviews.'
                ]
            },
            {
                title: '1.2 User Responsibility',
                content: 'Users are responsible for keeping passwords and OTPs confidential. Notify support immediately of any suspicious activity.'
            }
        ]
    }
};

export const CONTACT_INFO = {
    email: 'support@goodkart.com',
    phone: '+91 1800-456-789',
    office: 'Bangalore, Karnataka, India',
    hours: '24/7 Support'
};
