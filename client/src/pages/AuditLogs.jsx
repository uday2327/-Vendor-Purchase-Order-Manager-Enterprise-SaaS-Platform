import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Shield, Filter, User, Clock, FileText, Truck, DollarSign, Upload, Check, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const actionIcons = {
    CREATE: <FileText className="w-3.5 h-3.5" />,
    UPDATE: <RefreshCw className="w-3.5 h-3.5" />,
    DELETE: <X className="w-3.5 h-3.5" />,
    APPROVE: <Check className="w-3.5 h-3.5" />,
    REJECT: <X className="w-3.5 h-3.5" />,
    SUBMIT: <Upload className="w-3.5 h-3.5" />,
    PAYMENT: <DollarSign className="w-3.5 h-3.5" />,
    DELIVERY: <Truck className="w-3.5 h-3.5" />,
    UPLOAD: <Upload className="w-3.5 h-3.5" />,
    IMPORT: <Upload className="w-3.5 h-3.5" />,
    AUTO_GENERATE: <RefreshCw className="w-3.5 h-3.5" />,
};

const actionColors = {
    CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
    APPROVE: 'badge-green', REJECT: 'badge-red', SUBMIT: 'badge-yellow',
    PAYMENT: 'badge-green', DELIVERY: 'badge-blue', UPLOAD: 'badge-slate',
    IMPORT: 'badge-blue', AUTO_GENERATE: 'badge-yellow',
};

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [entityType, setEntityType] = useState('');
    const [action, setAction] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = { page, limit: 15 };
            if (entityType) params.entityType = entityType;
            if (action) params.action = action;
            const { data } = await api.get('/audit-logs', { params });
            setLogs(data.logs); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load audit logs'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [page, entityType, action]);

    const formatDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><Shield className="w-6 h-6 text-primary-500" />Audit Logs</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enterprise activity tracking ({total} entries)</p>
                </div>
            </div>

            {/* Filters */}
            <div className="card !p-4">
                <div className="flex flex-wrap items-center gap-3">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select value={entityType} onChange={(e) => { setEntityType(e.target.value); setPage(1); }} className="select-field w-auto min-w-[140px]">
                        <option value="">All Entities</option>
                        <option value="Vendor">Vendor</option>
                        <option value="PurchaseOrder">Purchase Order</option>
                        <option value="Invoice">Invoice</option>
                    </select>
                    <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="select-field w-auto min-w-[140px]">
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="APPROVE">Approve</option>
                        <option value="REJECT">Reject</option>
                        <option value="PAYMENT">Payment</option>
                        <option value="DELIVERY">Delivery</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="table-header">Timestamp</th>
                                <th className="table-header">User</th>
                                <th className="table-header">Action</th>
                                <th className="table-header">Entity</th>
                                <th className="table-header">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i}>
                                        <td className="table-cell"><div className="skeleton h-4 w-32" /></td>
                                        <td className="table-cell"><div className="skeleton h-4 w-24" /></td>
                                        <td className="table-cell"><div className="skeleton h-6 w-20 !rounded-full" /></td>
                                        <td className="table-cell"><div className="skeleton h-4 w-28" /></td>
                                        <td className="table-cell"><div className="skeleton h-4 w-32" /></td>
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-16 text-slate-400">No audit logs found</td></tr>
                            ) : (
                                logs.map((log, idx) => (
                                    <tr key={log._id} className="table-row animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {formatDate(log.createdAt)}
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                                                    {log.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{log.user?.name || 'System'}</p>
                                                    <p className="text-[11px] text-slate-400">{log.user?.role || ''}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={`${actionColors[log.action] || 'badge-slate'} inline-flex items-center gap-1`}>
                                                {actionIcons[log.action]}{log.action}
                                            </span>
                                        </td>
                                        <td className="table-cell">
                                            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{log.entityType}</span>
                                        </td>
                                        <td className="table-cell">
                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{JSON.stringify(log.metadata || {}).slice(0, 50)}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-900/30">
                        <p className="text-sm text-slate-500">Page {page} of {pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Prev</button>
                            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
