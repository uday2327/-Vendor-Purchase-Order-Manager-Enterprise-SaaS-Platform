import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
    admin: {
        canViewDashboard: true, canViewVendors: true, canWriteVendors: true,
        canViewPurchaseOrders: true, canWritePurchaseOrders: true,
        canViewInvoices: true, canWriteInvoices: true,
        canViewAnalytics: true, canViewAuditLogs: true, canViewBudgets: true,
        canViewUsers: true, canViewContracts: true, canViewInventory: true,
        canViewKanban: true, canViewForecast: true, canViewVendorCompare: true,
        canViewPayments: true, canViewReconciliation: true,
        canViewJournal: true,
    },
    manager: {
        canViewDashboard: true, canViewVendors: true, canWriteVendors: true,
        canViewPurchaseOrders: true, canWritePurchaseOrders: true,
        canViewInvoices: false, canWriteInvoices: false,
        canViewAnalytics: true, canViewAuditLogs: false, canViewBudgets: true,
        canViewUsers: false, canViewContracts: true, canViewInventory: true,
        canViewKanban: true, canViewForecast: true, canViewVendorCompare: true,
        canViewPayments: true, canViewReconciliation: false,
        canViewJournal: false,
    },
    accountant: {
        canViewDashboard: true, canViewVendors: false, canWriteVendors: false,
        canViewPurchaseOrders: false, canWritePurchaseOrders: false,
        canViewInvoices: true, canWriteInvoices: true,
        canViewAnalytics: true, canViewAuditLogs: false, canViewBudgets: true,
        canViewUsers: false, canViewContracts: false, canViewInventory: false,
        canViewKanban: false, canViewForecast: false, canViewVendorCompare: false,
        canViewPayments: true, canViewReconciliation: true,
        canViewJournal: true,
    },
    viewer: {
        canViewDashboard: true, canViewVendors: true, canWriteVendors: false,
        canViewPurchaseOrders: true, canWritePurchaseOrders: false,
        canViewInvoices: true, canWriteInvoices: false,
        canViewAnalytics: false, canViewAuditLogs: false, canViewBudgets: false,
        canViewUsers: false, canViewContracts: true, canViewInventory: true,
        canViewKanban: true, canViewForecast: false, canViewVendorCompare: false,
        canViewPayments: false, canViewReconciliation: false,
        canViewJournal: false,
    },
    vendor: {
        canViewDashboard: true, canViewVendors: true, canWriteVendors: false,
        canViewPurchaseOrders: true, canWritePurchaseOrders: false,
        canViewInvoices: true, canWriteInvoices: false,
        canViewAnalytics: false, canViewAuditLogs: false, canViewBudgets: false,
        canViewUsers: false, canViewContracts: true, canViewInventory: false,
        canViewKanban: false, canViewForecast: false, canViewVendorCompare: false,
        canViewPayments: false, canViewReconciliation: false,
        canViewJournal: false,
    },
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const role = user?.role || 'viewer';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;

    useEffect(() => {
        const loadUser = async () => {
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                } catch { logout(); }
            }
            setLoading(false);
        };
        loadUser();
    }, [token]);

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        return data;
    };

    const setAuthData = (newToken, userData) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, permissions, login, setAuthData, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
