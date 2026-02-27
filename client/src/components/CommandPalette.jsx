import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import {
    Search, X, LayoutDashboard, Users, ShoppingCart, FileText, Columns3,
    FileStack, Boxes, Wallet, BarChart3, TrendingUp, GitCompareArrows,
    CreditCard, BookOpen, FileSearch, UserCog, Shield, ArrowRight,
    Hash, Building2, Receipt, Command,
} from 'lucide-react';

/* ── Page definitions for navigation search ── */
const NAV_PAGES = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'canViewDashboard', keywords: ['home', 'overview', 'stats'] },
    { path: '/vendors', label: 'Vendors', icon: Users, permission: 'canViewVendors', keywords: ['supplier', 'company'] },
    { path: '/purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, permission: 'canViewPurchaseOrders', keywords: ['po', 'order', 'buy'] },
    { path: '/invoices', label: 'Invoices', icon: FileText, permission: 'canViewInvoices', keywords: ['bill', 'invoice'] },
    { path: '/kanban', label: 'Kanban Board', icon: Columns3, permission: 'canViewKanban', keywords: ['board', 'drag', 'status'] },
    { path: '/contracts', label: 'Contracts', icon: FileStack, permission: 'canViewContracts', keywords: ['agreement', 'deal'] },
    { path: '/inventory', label: 'Inventory', icon: Boxes, permission: 'canViewInventory', keywords: ['stock', 'items', 'warehouse'] },
    { path: '/budgets', label: 'Budgets', icon: Wallet, permission: 'canViewBudgets', keywords: ['budget', 'allocation', 'spend'] },
    { path: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'canViewAnalytics', keywords: ['chart', 'report', 'data'] },
    { path: '/forecast', label: 'Forecasting', icon: TrendingUp, permission: 'canViewForecast', keywords: ['predict', 'trend', 'future'] },
    { path: '/vendor-compare', label: 'Vendor Compare', icon: GitCompareArrows, permission: 'canViewVendorCompare', keywords: ['compare', 'side by side'] },
    { path: '/payments', label: 'Payments', icon: CreditCard, permission: 'canViewPayments', keywords: ['pay', 'transaction', 'money'] },
    { path: '/journal-entries', label: 'Journal Entries', icon: BookOpen, permission: 'canViewJournal', keywords: ['journal', 'ledger', 'accounting'] },
    { path: '/reconciliation', label: 'Reconciliation', icon: FileSearch, permission: 'canViewReconciliation', keywords: ['reconcile', 'match'] },
    { path: '/users', label: 'User Management', icon: UserCog, permission: 'canViewUsers', keywords: ['user', 'role', 'admin'] },
    { path: '/audit-logs', label: 'Audit Logs', icon: Shield, permission: 'canViewAuditLogs', keywords: ['log', 'history', 'trail'] },
];

const CommandPalette = ({ isOpen, onClose }) => {
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [pageResults, setPageResults] = useState([]);
    const [dataResults, setDataResults] = useState({ vendors: [], purchaseOrders: [], invoices: [] });
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const listRef = useRef(null);
    const navigate = useNavigate();
    const { permissions } = useAuth();
    const { palette } = useTheme();
    const debounceRef = useRef(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setPageResults([]);
            setDataResults({ vendors: [], purchaseOrders: [], invoices: [] });
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Filter pages by query
    const filterPages = useCallback((q) => {
        if (!q.trim()) return [];
        const lower = q.toLowerCase();
        return NAV_PAGES.filter(page => {
            if (!permissions[page.permission]) return false;
            return (
                page.label.toLowerCase().includes(lower) ||
                page.keywords.some(kw => kw.includes(lower))
            );
        });
    }, [permissions]);

    // Search data from API (debounced)
    const searchData = useCallback((q) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q.trim() || q.trim().length < 2) {
            setDataResults({ vendors: [], purchaseOrders: [], invoices: [] });
            setLoading(false);
            return;
        }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const { data } = await api.get(`/search?q=${encodeURIComponent(q.trim())}`);
                setDataResults(data);
            } catch {
                setDataResults({ vendors: [], purchaseOrders: [], invoices: [] });
            }
            setLoading(false);
        }, 300);
    }, []);

    // On query change
    useEffect(() => {
        const pages = filterPages(query);
        setPageResults(pages);
        searchData(query);
        setActiveIndex(0);
    }, [query, filterPages, searchData]);

    // Build flat result list for keyboard navigation
    const allResults = [];

    if (pageResults.length > 0) {
        pageResults.forEach(page => {
            allResults.push({ type: 'page', data: page });
        });
    }

    if (dataResults.vendors.length > 0) {
        dataResults.vendors.forEach(v => {
            allResults.push({ type: 'vendor', data: v });
        });
    }

    if (dataResults.purchaseOrders.length > 0) {
        dataResults.purchaseOrders.forEach(po => {
            allResults.push({ type: 'po', data: po });
        });
    }

    if (dataResults.invoices.length > 0) {
        dataResults.invoices.forEach(inv => {
            allResults.push({ type: 'invoice', data: inv });
        });
    }

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => Math.min(i + 1, allResults.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => Math.max(i - 1, 0));
        } else if (e.key === 'Enter' && allResults[activeIndex]) {
            e.preventDefault();
            handleSelect(allResults[activeIndex]);
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.children?.[activeIndex];
        el?.scrollIntoView?.({ block: 'nearest' });
    }, [activeIndex]);

    // Handle selecting a result
    const handleSelect = (result) => {
        onClose();
        switch (result.type) {
            case 'page':
                navigate(result.data.path);
                break;
            case 'vendor':
                navigate('/vendors');
                break;
            case 'po':
                navigate('/purchase-orders');
                break;
            case 'invoice':
                navigate('/invoices');
                break;
        }
    };

    if (!isOpen) return null;

    // Track the current flat index for highlighting
    let flatIndex = -1;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-x-4 top-[15%] sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[560px] z-[101] animate-command-palette-in">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                        <Search className="w-5 h-5 text-slate-400 shrink-0" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search pages, vendors, purchase orders, invoices..."
                            className="flex-1 text-[15px] text-slate-700 dark:text-slate-200 bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                        {query && (
                            <button onClick={() => setQuery('')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        )}
                        <kbd className="hidden sm:flex items-center gap-0.5 px-2 py-1 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
                        {/* Empty state */}
                        {!query && (
                            <div className="px-5 py-10 text-center">
                                <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${palette.hex500}15` }}>
                                    <Command className="w-6 h-6" style={{ color: palette.hex500 }} />
                                </div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Type to search pages & data</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Navigate, find vendors, POs, invoices...</p>
                            </div>
                        )}

                        {query && allResults.length === 0 && !loading && (
                            <div className="px-5 py-10 text-center">
                                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-400 dark:text-slate-500">No results for "<span className="font-semibold text-slate-600 dark:text-slate-300">{query}</span>"</p>
                            </div>
                        )}

                        {/* Page results */}
                        {pageResults.length > 0 && (
                            <>
                                <div className="px-5 pt-2 pb-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pages</p>
                                </div>
                                {pageResults.map((page) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            key={page.path}
                                            onClick={() => handleSelect({ type: 'page', data: page })}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 ${activeIndex === idx
                                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${activeIndex === idx
                                                ? 'bg-primary-100 dark:bg-primary-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800'
                                                }`}>
                                                <page.icon className={`w-4 h-4 ${activeIndex === idx ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${activeIndex === idx ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {page.label}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Navigate to {page.label}</p>
                                            </div>
                                            {activeIndex === idx && <ArrowRight className="w-4 h-4 text-primary-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Vendor results */}
                        {dataResults.vendors.length > 0 && (
                            <>
                                <div className="px-5 pt-3 pb-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vendors</p>
                                </div>
                                {dataResults.vendors.map((v) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            key={v._id}
                                            onClick={() => handleSelect({ type: 'vendor', data: v })}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 ${activeIndex === idx
                                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeIndex === idx
                                                ? 'bg-primary-100 dark:bg-primary-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800'
                                                }`}>
                                                <Building2 className={`w-4 h-4 ${activeIndex === idx ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${activeIndex === idx ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {v.name}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                    {v.contactPerson} · Score: {v.performanceScore}
                                                </p>
                                            </div>
                                            {activeIndex === idx && <ArrowRight className="w-4 h-4 text-primary-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* PO results */}
                        {dataResults.purchaseOrders.length > 0 && (
                            <>
                                <div className="px-5 pt-3 pb-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Orders</p>
                                </div>
                                {dataResults.purchaseOrders.map((po) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            key={po._id}
                                            onClick={() => handleSelect({ type: 'po', data: po })}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 ${activeIndex === idx
                                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeIndex === idx
                                                ? 'bg-primary-100 dark:bg-primary-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800'
                                                }`}>
                                                <Hash className={`w-4 h-4 ${activeIndex === idx ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${activeIndex === idx ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {po.poNumber}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                    {po.vendor?.name || 'Unknown'} · ₹{po.totalAmount?.toLocaleString()} · {po.status}
                                                </p>
                                            </div>
                                            {activeIndex === idx && <ArrowRight className="w-4 h-4 text-primary-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Invoice results */}
                        {dataResults.invoices.length > 0 && (
                            <>
                                <div className="px-5 pt-3 pb-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoices</p>
                                </div>
                                {dataResults.invoices.map((inv) => {
                                    flatIndex++;
                                    const idx = flatIndex;
                                    return (
                                        <button
                                            key={inv._id}
                                            onClick={() => handleSelect({ type: 'invoice', data: inv })}
                                            onMouseEnter={() => setActiveIndex(idx)}
                                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all duration-150 ${activeIndex === idx
                                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${activeIndex === idx
                                                ? 'bg-primary-100 dark:bg-primary-500/20'
                                                : 'bg-slate-100 dark:bg-slate-800'
                                                }`}>
                                                <Receipt className={`w-4 h-4 ${activeIndex === idx ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${activeIndex === idx ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {inv.invoiceNumber}
                                                </p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                                    {inv.vendor?.name || 'Unknown'} · ₹{inv.amount?.toLocaleString()} · {inv.paymentStatus}
                                                </p>
                                            </div>
                                            {activeIndex === idx && <ArrowRight className="w-4 h-4 text-primary-400 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}

                        {/* Loading indicator */}
                        {loading && query.length >= 2 && (
                            <div className="px-5 py-3 flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                                <span className="text-xs text-slate-400">Searching data...</span>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">↑↓</kbd>
                            <span className="text-[11px] text-slate-400">Navigate</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">↵</kbd>
                            <span className="text-[11px] text-slate-400">Open</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800">Esc</kbd>
                            <span className="text-[11px] text-slate-400">Close</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CommandPalette;
