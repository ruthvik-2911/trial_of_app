// ─── SellSathi Dark Theme ──────────────────────────────────────────────────

import { darkColors } from './colors';
import { textStyles, fontFamily, fontSize, fontWeight } from './typography';
import { spacing, borderRadius, shadow, layout } from './spacing';

const darkTheme = {
    dark: true,
    colors: darkColors,
    typography: { textStyles, fontFamily, fontSize, fontWeight },
    spacing,
    borderRadius,
    shadow: shadow.dark,
    layout,

    // Gradient presets for LinearGradient
    gradients: {
        background: ['#120430', '#1A0640'],
        card: ['#1A0640', '#250850'],
        primary: ['#BEA1F7', '#9061F9'],
        accent: ['#BEA1F7', '#9061F9'],
        deal: ['#4910BC', '#2E0A78'], // Grape variant
        splash: ['#120430', '#4910BC', '#120430'],
        logo: ['#BEA1F7', '#4910BC'],
        button: ['#BEA1F7', '#9061F9'],
        accentButton: ['#BEA1F7', '#9061F9'],
        header: ['#4910BC', '#120430'],
    },

};

export default darkTheme;