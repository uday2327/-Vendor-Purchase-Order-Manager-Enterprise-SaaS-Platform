/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
    return ({ opacityValue }) => {
        if (opacityValue !== undefined) {
            return `rgba(var(${variableName}), ${opacityValue})`;
        }
        return `rgb(var(${variableName}))`;
    };
}

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    50: withOpacity('--primary-50'),
                    100: withOpacity('--primary-100'),
                    200: withOpacity('--primary-200'),
                    300: withOpacity('--primary-300'),
                    400: withOpacity('--primary-400'),
                    500: withOpacity('--primary-500'),
                    600: withOpacity('--primary-600'),
                    700: withOpacity('--primary-700'),
                    800: withOpacity('--primary-800'),
                    900: withOpacity('--primary-900'),
                    950: withOpacity('--primary-950'),
                },
                accent: {
                    50: withOpacity('--accent-50'),
                    100: withOpacity('--accent-100'),
                    200: withOpacity('--accent-200'),
                    300: withOpacity('--accent-300'),
                    400: withOpacity('--accent-400'),
                    500: withOpacity('--accent-500'),
                    600: withOpacity('--accent-600'),
                    700: withOpacity('--accent-700'),
                    800: withOpacity('--accent-800'),
                    900: withOpacity('--accent-900'),
                },
                surface: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    800: '#1e293b',
                    850: '#172033',
                    900: '#0f172a',
                    950: '#020617',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            boxShadow: {
                soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
                card: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
                glass: '0 4px 30px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
                'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
                'soft-xl': '0 10px 50px -12px rgba(0, 0, 0, 0.06)',
                glow: '0 0 20px rgba(99, 102, 241, 0.15)',
                'glow-lg': '0 0 40px rgba(99, 102, 241, 0.12)',
                'dark-card': '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 2px 8px -1px rgba(0, 0, 0, 0.2)',
                'dark-soft': '0 4px 25px -5px rgba(0, 0, 0, 0.4)',
                'dark-glass': '0 4px 30px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)',
            },
            borderRadius: {
                '2xl': '16px',
                '3xl': '20px',
                '4xl': '24px',
            },
            animation: {
                'fade-in': 'fadeIn 0.4s ease-out',
                'slide-up': 'slideUp 0.35s ease-out',
                'scale-in': 'scaleIn 0.25s ease-out',
                'shimmer': 'shimmer 2s infinite linear',
                'slide-in-right': 'slideInRight 0.3s ease-out',
                'slide-out-right': 'slideOutRight 0.25s ease-in',
                'login-appear': 'loginAppear 0.6s ease-out both',
                'login-slide-down': 'loginSlideDown 0.5s ease-out both',
                'login-slide-up': 'loginSlideUp 0.5s ease-out both',
                'login-field': 'loginField 0.5s ease-out both',
                'login-logo-pulse': 'loginLogoPulse 2s ease-in-out infinite',
                'float-slow': 'floatSlow 8s ease-in-out infinite',
                'float-slower': 'floatSlower 12s ease-in-out infinite',
                'float-reverse': 'floatReverse 10s ease-in-out infinite',
                'command-palette-in': 'commandPaletteIn 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(16px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                slideInRight: {
                    '0%': { opacity: '0', transform: 'translateX(100%)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                slideOutRight: {
                    '0%': { opacity: '1', transform: 'translateX(0)' },
                    '100%': { opacity: '0', transform: 'translateX(100%)' },
                },
                loginAppear: {
                    '0%': { opacity: '0', transform: 'scale(0.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                loginSlideDown: {
                    '0%': { opacity: '0', transform: 'translateY(-20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                loginSlideUp: {
                    '0%': { opacity: '0', transform: 'translateY(30px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                loginField: {
                    '0%': { opacity: '0', transform: 'translateY(12px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                loginLogoPulse: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0.3)' },
                    '50%': { boxShadow: '0 0 0 12px rgba(99,102,241,0)' },
                },
                floatSlow: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '33%': { transform: 'translate(30px, -30px) scale(1.05)' },
                    '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
                },
                floatSlower: {
                    '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
                    '50%': { transform: 'translate(-40px, -20px) scale(1.08)' },
                },
                floatReverse: {
                    '0%, 100%': { transform: 'translate(0, 0)' },
                    '25%': { transform: 'translate(20px, 30px)' },
                    '75%': { transform: 'translate(-30px, -10px)' },
                },
                commandPaletteIn: {
                    '0%': { opacity: '0', transform: 'scale(0.98) translateY(-8px)' },
                    '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
