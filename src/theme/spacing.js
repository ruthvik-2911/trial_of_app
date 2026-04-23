// ─── SellSathi Spacing & Layout ───────────────────────────────────────────

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
};

export const borderRadius = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    full: 9999,
};

export const shadow = {
    // Dark theme shadows (violet glow)
    dark: {
        sm: {
            shadowColor: '#BEA1F7',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
        },
        md: {
            shadowColor: '#BEA1F7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 12,
            elevation: 8,
        },
        lg: {
            shadowColor: '#BEA1F7',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 16,
        },
        accent: {
            shadowColor: '#BEA1F7',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
        },
    },

    // Light theme shadows (grape)
    light: {
        sm: {
            shadowColor: '#4910BC',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#4910BC',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 6,
        },
        lg: {
            shadowColor: '#4910BC',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 12,
        },
    },

};

export const layout = {
    screenPaddingH: spacing.base,
    screenPaddingV: spacing.lg,
    cardPadding: spacing.base,
    headerHeight: 60,
    tabBarHeight: 64,
    bottomInset: 16,
};