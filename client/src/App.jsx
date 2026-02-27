import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';
import Budgets from './pages/Budgets';
import Users from './pages/Users';
import Contracts from './pages/Contracts';
import InventoryPage from './pages/InventoryPage';
import KanbanBoard from './pages/KanbanBoard';
import Forecast from './pages/Forecast';
import VendorCompare from './pages/VendorCompare';
import Payments from './pages/Payments';
import Reconciliation from './pages/Reconciliation';
import JournalEntries from './pages/JournalEntries';
import AccessDenied from './pages/AccessDenied';

const RoleRoute = ({ permissionKey, children }) => {
    const { permissions } = useAuth();
    if (!permissions[permissionKey]) return <Layout><AccessDenied /></Layout>;
    return children;
};

function App() {
    const { token } = useAuth();

    const route = (path, perm, Component) => (
        <Route path={path} element={
            <ProtectedRoute><RoleRoute permissionKey={perm}><Layout><Component /></Layout></RoleRoute></ProtectedRoute>
        } />
    );

    return (
        <Routes>
            <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

            {route('/', 'canViewDashboard', Dashboard)}
            {route('/vendors', 'canViewVendors', Vendors)}
            {route('/purchase-orders', 'canViewPurchaseOrders', PurchaseOrders)}
            {route('/invoices', 'canViewInvoices', Invoices)}
            {route('/analytics', 'canViewAnalytics', Analytics)}
            {route('/budgets', 'canViewBudgets', Budgets)}
            {route('/audit-logs', 'canViewAuditLogs', AuditLogs)}
            {route('/users', 'canViewUsers', Users)}
            {route('/contracts', 'canViewContracts', Contracts)}
            {route('/inventory', 'canViewInventory', InventoryPage)}
            {route('/kanban', 'canViewKanban', KanbanBoard)}
            {route('/forecast', 'canViewForecast', Forecast)}
            {route('/vendor-compare', 'canViewVendorCompare', VendorCompare)}
            {route('/payments', 'canViewPayments', Payments)}
            {route('/reconciliation', 'canViewReconciliation', Reconciliation)}
            {route('/journal-entries', 'canViewJournal', JournalEntries)}

            <Route path="/access-denied" element={<ProtectedRoute><Layout><AccessDenied /></Layout></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default App;
