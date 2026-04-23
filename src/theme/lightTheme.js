// ─── SellSathi Light Theme ─────────────────────────────────────────────────

import { lightColors } from './colors';
import { textStyles, fontFamily, fontSize, fontWeight } from './typography';
import { spacing, borderRadius, shadow, layout } from './spacing';

const lightTheme = {
    dark: false,
    colors: lightColors,
    typography: { textStyles, fontFamily, fontSize, fontWeight },
    spacing,
    borderRadius,
    shadow: shadow.light,
    layout,

    // Gradient presets for LinearGradient
    gradients: {
        background: ['#F5F3FF', '#EDE9FE'],
        card: ['#FFFFFF', '#EDE9FE'],
        primary: ['#BEA1F7', '#9061F9'],
        accent: ['#BEA1F7', '#9061F9'],
        deal: ['#E9D5FF', '#F3E8FF'],
        splash: ['#F5F3FF', '#BEA1F7', '#F5F3FF'],
        logo: ['#4910BC', '#BEA1F7'],
        button: ['#BEA1F7', '#9061F9'],
        accentButton: ['#BEA1F7', '#9061F9'],
        header: ['#4910BC', '#6421E0'], // Grape gradient for header
    },

};

export default lightTheme;