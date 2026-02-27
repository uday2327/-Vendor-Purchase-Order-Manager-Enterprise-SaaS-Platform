import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import CommandPalette from './CommandPalette';
import {
    LayoutDashboard, Users, ShoppingCart, FileText, LogOut, Menu, X, Package,
    ChevronRight, Moon, Sun, Monitor, BarChart3, Wallet, Shield, FileStack, Boxes,
    Columns3, TrendingUp, GitCompareArrows, UserCog, CreditCard, FileSearch,
    BookOpen, Search, ChevronDown, Palette, Check,
} from 'lucide-react';

const allNavItems = [
    { section: 'Main Menu' },
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' },
    { to: '/vendors', label: 'Vendors', icon: Users, permission: 'canViewVendors' },
    { to: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, permission: 'canViewPurchaseOrders' },
    { to: '/invoices', label: 'Invoices', icon: FileText, permission: 'canViewInvoices' },
    { to: '/kanban', label: 'Kanban Board', icon: Columns3, permission: 'canViewKanban' },
    { section: 'Management' },
    { to: '/contracts', label: 'Contracts', icon: FileStack, permission: 'canViewContracts' },
    { to: '/inventory', label: 'Inventory', icon: Boxes, permission: 'canViewInventory' },
    { to: '/budgets', label: 'Budgets', icon: Wallet, permission: 'canViewBudgets' },
    { section: 'Intelligence' },
    { to: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'canViewAnalytics' },
    { to: '/forecast', label: 'Forecasting', icon: TrendingUp, permission: 'canViewForecast' },
    { to: '/vendor-compare', label: 'Vendor Compare', icon: GitCompareArrows, permission: 'canViewVendorCompare' },
    { section: 'Finance' },
    { to: '/payments', label: 'Payments', icon: CreditCard, permission: 'canViewPayments' },
    { to: '/journal-entries', label: 'Journal Entries', icon: BookOpen, permission: 'canViewJournal' },
    { to: '/reconciliation', label: 'Reconciliation', icon: FileSearch, permission: 'canViewReconciliation' },
    { section: 'Administration' },
    { to: '/users', label: 'User Management', icon: UserCog, permission: 'canViewUsers' },
    { to: '/audit-logs', label: 'Audit Logs', icon: Shield, permission: 'canViewAuditLogs' },
];

const routeLabels = {
    '/': 'Dashboard', '/vendors': 'Vendors', '/purchase-orders': 'Purchase Orders',
    '/invoices': 'Invoices', '/kanban': 'Kanban Board', '/contracts': 'Contracts',
    '/inventory': 'Inventory', '/budgets': 'Budgets', '/analytics': 'Analytics',
    '/forecast': 'Forecasting', '/vendor-compare': 'Vendor Compare',
    '/payments': 'Payments', '/journal-entries': 'Journal Entries',
    '/reconciliation': 'Reconciliation', '/users': 'User Management',
    '/audit-logs': 'Audit Logs', '/access-denied': 'Access Denied',
};

/* ── Swatch hex colors for the theme picker ── */
const SWATCH_COLORS = {
    indigo: '#6366f1',
    emerald: '#10b981',
    rose: '#f43f5e',
    amber: '#f59e0b',
    cyan: '#06b6d4',
    violet: '#8b5cf6',
};

const Layout = ({ children }) => {
    const { user, role, permissions, logout } = useAuth();
    const { dark, mode, toggleTheme, accent, setAccent, accentKeys, palettes } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [themePickerOpen, setThemePickerOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

    // ⌘K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handler = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleLogout = () => { logout(); navigate('/login'); };
    const currentLabel = routeLabels[location.pathname] || 'Page';

    const visibleItems = [];
    let lastSection = null;
    for (const item of allNavItems) {
        if (item.section) { lastSection = item; continue; }
        if (permissions[item.permission]) {
            if (lastSection) { visibleItems.push(lastSection); lastSection = null; }
            visibleItems.push(item);
        }
    }

    useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

    return (
        <div className="h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ═══════════════════ SIDEBAR ═══════════════════ */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    flex flex-col
                    bg-slate-900 dark:bg-slate-950
                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    lg:m-3 lg:rounded-[24px]
                    shadow-xl
                    ${expanded ? 'w-[250px]' : 'w-[76px]'}
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                onMouseEnter={() => !expanded && setExpanded(true)}
                onMouseLeave={() => expanded && setExpanded(false)}
            >
                {/* ── Logo ── */}
                <div className={`flex items-center h-[68px] shrink-0 transition-all duration-500 ${expanded ? 'px-5 gap-3' : 'px-0 justify-center'}`}>
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-colors duration-300"
                        style={{ background: `linear-gradient(135deg, ${SWATCH_COLORS[accent]}, ${SWATCH_COLORS[accent]}dd)` }}
                    >
                        <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ${expanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        <h1 className="text-[15px] font-bold text-white whitespace-nowrap leading-tight">Vendor & PO</h1>
                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.25em]">Manager</p>
                    </div>
                    <button className="ml-auto lg:hidden p-1.5 hover:bg-white/10 rounded-lg shrink-0" onClick={() => setSidebarOpen(false)}>
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {visibleItems.map((item, i) => {
                        if (item.section) {
                            return (
                                <div key={i} className={`transition-all duration-500 ${expanded ? 'px-3 pt-5 pb-1.5' : 'pt-3 pb-1 mx-2 border-t border-white/[0.06]'}`}>
                                    {expanded && (
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap overflow-hidden">
                                            {item.section}
                                        </p>
                                    )}
                                </div>
                            );
                        }
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.to === '/'}
                                onClick={() => setSidebarOpen(false)}
                                onMouseEnter={() => setHoveredItem(item.to)}
                                onMouseLeave={() => setHoveredItem(null)}
                                className={({ isActive }) =>
                                    `relative flex items-center ${expanded ? 'px-3 gap-3' : 'justify-center px-0'} py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 group overflow-hidden
                                    ${isActive
                                        ? 'bg-primary-500/10 text-white'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <div
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-500"
                                                style={{ backgroundColor: SWATCH_COLORS[accent], boxShadow: `0 0 10px ${SWATCH_COLORS[accent]}66` }}
                                            />
                                        )}

                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 transition-all duration-300 ${isActive ? 'bg-primary-500/10' : ''}`}>
                                            <item.icon className={`w-[17px] h-[17px] transition-all duration-300 ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                                        </div>

                                        <span className={`whitespace-nowrap transition-all duration-500 ${expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 w-0'}`}>
                                            {item.label}
                                        </span>

                                        {expanded && isActive && (
                                            <ChevronRight className="w-3.5 h-3.5 text-primary-400/50 ml-auto shrink-0" />
                                        )}

                                        {!expanded && hoveredItem === item.to && (
                                            <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap z-50 border border-slate-700 animate-scale-in">
                                                {item.label}
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-r-[5px] border-r-slate-800 border-b-[5px] border-b-transparent" />
                                            </div>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* ── User section ── */}
                <div className="p-2 shrink-0">
                    <div className={`flex items-center ${expanded ? 'gap-3 px-3 py-3' : 'justify-center py-3'} rounded-xl bg-white/[0.03] transition-all duration-500`}>
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg shrink-0 transition-colors duration-300"
                            style={{ background: `linear-gradient(135deg, ${SWATCH_COLORS[accent]}, ${SWATCH_COLORS[accent]}cc)` }}
                        >
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                        <div className={`min-w-0 transition-all duration-500 ${expanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
                            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-[10px] text-primary-400/70 font-semibold uppercase tracking-wider">{role}</p>
                        </div>
                        {expanded && (
                            <button
                                onClick={handleLogout}
                                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 ml-auto shrink-0"
                                title="Logout"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* ═══════════════════ MAIN ═══════════════════ */}
            <div className="flex-1 flex flex-col min-w-0 h-screen">
                {/* Header */}
                <header className="h-[64px] shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 lg:px-6 z-30">
                    <button className="lg:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg mr-3" onClick={() => setSidebarOpen(true)}>
                        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1.5 text-sm">
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Home</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                        <span className="text-slate-700 dark:text-slate-200 font-semibold">{currentLabel}</span>
                    </div>

                    <div className="flex-1" />

                    <button
                        onClick={() => setCommandPaletteOpen(true)}
                        className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 mr-3 w-56 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 group"
                    >
                        <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 transition-colors" />
                        <span className="text-xs text-slate-400 dark:text-slate-500">Search...</span>
                        <span className="ml-auto text-[10px] text-slate-300 dark:text-slate-600 font-mono border border-slate-200 dark:border-slate-700 rounded px-1">⌘K</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {/* ── Theme Picker ── */}
                        <div className="relative">
                            <button
                                onClick={() => setThemePickerOpen(!themePickerOpen)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200 group border border-slate-200 dark:border-slate-700"
                                title="Change theme color"
                            >
                                <Palette className="w-4 h-4 text-primary-500 group-hover:rotate-12 transition-transform duration-300" />
                            </button>
                            {themePickerOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setThemePickerOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 p-4 w-[220px] animate-scale-in">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Theme Color</p>
                                        <div className="grid grid-cols-3 gap-2">
                                            {accentKeys.map((key) => (
                                                <button
                                                    key={key}
                                                    onClick={() => { setAccent(key); setThemePickerOpen(false); }}
                                                    className={`group relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${accent === key
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                                        : 'border-transparent hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                        }`}
                                                >
                                                    <div
                                                        className="w-8 h-8 rounded-full shadow-md transition-transform duration-200 flex items-center justify-center"
                                                        style={{ backgroundColor: SWATCH_COLORS[key] }}
                                                    >
                                                        {accent === key && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                                                        {palettes[key].name}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Dark/Light toggle */}
                        <button onClick={toggleTheme} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all duration-200 group border border-slate-200 dark:border-slate-700" title={mode === 'light' ? 'Dark' : mode === 'dark' ? 'System' : 'Light'}>
                            {mode === 'light' && <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform duration-300" />}
                            {mode === 'dark' && <Moon className="w-4 h-4 text-primary-400 group-hover:-rotate-12 transition-transform duration-300" />}
                            {mode === 'system' && <Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:scale-110 transition-transform duration-300" />}
                        </button>
                        <NotificationBell />

                        <div className="relative hidden sm:block">
                            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-[11px] shadow-sm transition-colors duration-300"
                                    style={{ background: `linear-gradient(135deg, ${SWATCH_COLORS[accent]}, ${SWATCH_COLORS[accent]}cc)` }}
                                >
                                    {user?.name?.charAt(0) || 'A'}
                                </div>
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{user?.name || 'Admin'}</span>
                                <ChevronDown className="w-3 h-3 text-slate-400" />
                            </button>
                            {userMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden animate-scale-in">
                                        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{user?.name}</p>
                                            <p className="text-xs text-slate-400">{user?.email}</p>
                                        </div>
                                        <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                            <LogOut className="w-3.5 h-3.5" />Sign out
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
            </div>

            {/* Command Palette */}
            <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
        </div>
    );
};

export default Layout;
