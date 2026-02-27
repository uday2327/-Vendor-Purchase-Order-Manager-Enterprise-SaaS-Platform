import { createContext, useContext, useState, useEffect } from 'react';

const ThemeCtx = createContext(null);

/* ── Theme palette hex values (for Recharts and inline styles) ── */
const ACCENT_PALETTES = {
    indigo: { name: 'Indigo', hex500: '#6366f1', hex400: '#818cf8', hex600: '#4f46e5', swatch: 'bg-indigo-500' },
    emerald: { name: 'Emerald', hex500: '#10b981', hex400: '#34d399', hex600: '#059669', swatch: 'bg-emerald-500' },
    rose: { name: 'Rose', hex500: '#f43f5e', hex400: '#fb7185', hex600: '#e11d48', swatch: 'bg-rose-500' },
    amber: { name: 'Amber', hex500: '#f59e0b', hex400: '#fbbf24', hex600: '#d97706', swatch: 'bg-amber-500' },
    cyan: { name: 'Cyan', hex500: '#06b6d4', hex400: '#22d3ee', hex600: '#0891b2', swatch: 'bg-cyan-500' },
    violet: { name: 'Violet', hex500: '#8b5cf6', hex400: '#a78bfa', hex600: '#7c3aed', swatch: 'bg-violet-500' },
};

const ACCENT_KEYS = Object.keys(ACCENT_PALETTES);

export const ThemeProvider = ({ children }) => {
    /* ── Dark / Light / System ── */
    const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'system');
    const getSystemDark = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = mode === 'dark' || (mode === 'system' && getSystemDark());

    useEffect(() => {
        const root = document.documentElement;
        if (dark) root.classList.add('dark');
        else root.classList.remove('dark');
        localStorage.setItem('theme', mode);
    }, [dark, mode]);

    useEffect(() => {
        if (mode !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => setMode('system');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [mode]);

    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light');
    };

    /* ── Accent Color ── */
    const [accent, setAccent] = useState(() => localStorage.getItem('accent') || 'indigo');

    useEffect(() => {
        document.documentElement.setAttribute('data-accent', accent);
        localStorage.setItem('accent', accent);
    }, [accent]);

    const palette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.indigo;

    return (
        <ThemeCtx.Provider value={{
            dark, mode, toggleTheme,
            accent, setAccent,
            accentKeys: ACCENT_KEYS,
            palettes: ACCENT_PALETTES,
            palette,          // current palette hex values
        }}>
            {children}
        </ThemeCtx.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeCtx);
    if (!context) throw new Error('useTheme must be used within ThemeProvider');
    return context;
};
