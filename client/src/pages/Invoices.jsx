import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    DollarSign,
    FileText,
    AlertTriangle,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ── Skeleton ── */
const TableSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <tr key={i}>
                <td className="table-cell"><div className="flex items-center gap-2"><div className="skeleton h-4 w-4 !rounded" /><div className="skeleton h-4 w-28" /></div></td>
                <td className="table-cell"><div className="space-y-2"><div className="skeleton h-4 w-20" /><div className="skeleton h-3 w-24" /></div></td>
                <td className="table-cell text-right"><div className="skeleton h-4 w-20 ml-auto" /></td>
                <td className="table-cell text-right"><div className="skeleton h-4 w-16 ml-auto" /></td>
                <td className="table-cell text-right"><div className="skeleton h-4 w-16 ml-auto" /></td>
                <td className="table-cell"><div className="skeleton h-4 w-24" /></td>
                <td className="table-cell"><div className="skeleton h-6 w-16 !rounded-full" /></td>
                <td className="table-cell text-right"><div className="skeleton h-8 w-20 ml-auto" /></td>
            </tr>
        ))}
    </>
);

const Invoices = () => {
    const [invoices, setInvoices] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ purchaseOrder: '', vendor: '', invoiceNumber: '', amount: 0, dueDate: '' });
    const [saving, setSaving] = useState(false);
    const [payModal, setPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const { permissions } = useAuth();
    const canWrite = permissions.canWriteInvoices;

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/invoices', { params: { paymentStatus: statusFilter, page, limit: 10 } });
            setInvoices(data.invoices); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load invoices'); }
        finally { setLoading(false); }
    };

    const fetchVendorsAndOrders = async () => {
        try {
            const [vRes, oRes] = await Promise.all([api.get('/vendors', { params: { limit: 100 } }), api.get('/purchase-orders', { params: { limit: 100 } })]);
            setVendors(vRes.data.vendors); setOrders(oRes.data.purchaseOrders);
        } catch { console.error('Failed to load data'); }
    };

    useEffect(() => { fetchVendorsAndOrders(); }, []);
    useEffect(() => { fetchInvoices(); }, [page, statusFilter]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!createForm.purchaseOrder || !createForm.vendor || !createForm.invoiceNumber || !createForm.amount || !createForm.dueDate) { toast.error('Please fill all fields'); return; }
        setSaving(true);
        try { await api.post('/invoices', createForm); toast.success('Invoice created'); setCreateOpen(false); setCreateForm({ purchaseOrder: '', vendor: '', invoiceNumber: '', amount: 0, dueDate: '' }); fetchInvoices(); }
        catch (error) { toast.error(error.response?.data?.message || 'Create failed'); }
        finally { setSaving(false); }
    };

    const handlePay = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) { toast.error('Enter a valid payment amount'); return; }
        try { await api.put(`/invoices/${payModal._id}/pay`, { amount: parseFloat(payAmount) }); toast.success('Payment recorded'); setPayModal(null); setPayAmount(''); fetchInvoices(); }
        catch { toast.error('Payment failed'); }
    };

    const getStatusBadge = (s) => { const m = { Paid: 'badge-green', Partial: 'badge-yellow', Unpaid: 'badge-red' }; return m[s] || 'badge-slate'; };
    const getStatusIcon = (s) => { const m = { Paid: <CheckCircle2 className="w-3 h-3 mr-1" />, Partial: <Clock className="w-3 h-3 mr-1" />, Unpaid: <AlertTriangle className="w-3 h-3 mr-1" /> }; return m[s] || null; };
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const isOverdue = (inv) => inv.paymentStatus !== 'Paid' && new Date(inv.dueDate) < new Date();

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Invoices</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track invoices & payments ({total} total)</p>
                </div>
                {canWrite && <button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />New Invoice</button>}
            </div>

            {/* Filters */}
            <div className="card !p-4">
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-auto min-w-[160px]">
                    <option value="">All Payment Status</option>
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partial">Partial</option>
                    <option value="Paid">Paid</option>
                </select>
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="table-header">Invoice</th>
                                <th className="table-header">PO / Vendor</th>
                                <th className="table-header text-right">Amount</th>
                                <th className="table-header text-right">Paid</th>
                                <th className="table-header text-right">Outstanding</th>
                                <th className="table-header">Due Date</th>
                                <th className="table-header">Status</th>
                                {canWrite && <th className="table-header text-right">Action</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? <TableSkeleton /> : invoices.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-16 text-slate-400 dark:text-slate-500">No invoices found</td></tr>
                            ) : (
                                invoices.map((inv, idx) => (
                                    <tr key={inv._id} className="table-row animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-primary-500" />
                                                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{inv.invoiceNumber}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{inv.purchaseOrder?.poNumber || '—'}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{inv.vendor?.name || '—'}</p>
                                        </td>
                                        <td className="table-cell text-right"><span className="font-bold text-slate-800 dark:text-white text-sm">₹{inv.amount?.toLocaleString()}</span></td>
                                        <td className="table-cell text-right"><span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">₹{inv.paidAmount?.toLocaleString()}</span></td>
                                        <td className="table-cell text-right">
                                            <span className={`text-sm font-bold ${inv.outstandingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'}`}>₹{inv.outstandingAmount?.toLocaleString()}</span>
                                        </td>
                                        <td className="table-cell">
                                            <p className="text-sm text-slate-600 dark:text-slate-300">{formatDate(inv.dueDate)}</p>
                                            {isOverdue(inv) && <span className="badge-red !py-0.5 mt-1 !text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Overdue</span>}
                                        </td>
                                        <td className="table-cell"><span className={getStatusBadge(inv.paymentStatus)}>{getStatusIcon(inv.paymentStatus)}{inv.paymentStatus}</span></td>
                                        {canWrite && (
                                            <td className="table-cell text-right">
                                                {inv.paymentStatus !== 'Paid' && (
                                                    <button onClick={() => setPayModal(inv)} className="btn-ghost !py-1.5 !px-3 text-sm !text-primary-600 dark:!text-primary-400 hover:!bg-primary-50 dark:hover:!bg-primary-500/10">
                                                        <DollarSign className="w-4 h-4" />Pay
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-900/30">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages} ({total} invoices)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Invoice Modal */}
            <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Invoice">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Purchase Order *</label>
                            <select value={createForm.purchaseOrder} onChange={(e) => { const po = orders.find((o) => o._id === e.target.value); setCreateForm({ ...createForm, purchaseOrder: e.target.value, vendor: po?.vendor?._id || po?.vendor || '', amount: po?.totalAmount || 0 }); }} className="select-field">
                                <option value="">Select PO</option>
                                {orders.map((o) => <option key={o._id} value={o._id}>{o.poNumber} — ₹{o.totalAmount?.toLocaleString()}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Vendor *</label>
                            <select value={createForm.vendor} onChange={(e) => setCreateForm({ ...createForm, vendor: e.target.value })} className="select-field">
                                <option value="">Select Vendor</option>
                                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Invoice Number *</label>
                            <input type="text" value={createForm.invoiceNumber} onChange={(e) => setCreateForm({ ...createForm, invoiceNumber: e.target.value })} className="input-field" placeholder="INV-2025-XXX" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Amount (₹) *</label>
                            <input type="number" min="0" value={createForm.amount} onChange={(e) => setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Due Date *</label>
                            <input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })} className="input-field" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Invoice'}</button>
                    </div>
                </form>
            </Modal>

            {/* Record Payment Modal */}
            <Modal isOpen={!!payModal} onClose={() => { setPayModal(null); setPayAmount(''); }} title="Record Payment" size="sm">
                {payModal && (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 dark:bg-surface-800 rounded-xl space-y-2.5 border border-slate-100 dark:border-slate-700/50">
                            <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Invoice</span><span className="font-bold text-slate-800 dark:text-white">{payModal.invoiceNumber}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Total Amount</span><span className="font-bold">₹{payModal.amount?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm"><span className="text-slate-500 dark:text-slate-400">Already Paid</span><span className="font-bold text-emerald-600 dark:text-emerald-400">₹{payModal.paidAmount?.toLocaleString()}</span></div>
                            <div className="flex justify-between text-sm border-t border-slate-200 dark:border-slate-700 pt-2.5"><span className="text-slate-500 dark:text-slate-400">Outstanding</span><span className="font-extrabold text-red-600 dark:text-red-400">₹{payModal.outstandingAmount?.toLocaleString()}</span></div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Payment Amount (₹)</label>
                            <input type="number" min="0" max={payModal.outstandingAmount} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="input-field" placeholder={`Max: ₹${payModal.outstandingAmount?.toLocaleString()}`} />
                        </div>
                        <div className="flex justify-end gap-3 pt-3">
                            <button onClick={() => { setPayModal(null); setPayAmount(''); }} className="btn-secondary">Cancel</button>
                            <button onClick={handlePay} className="btn-primary"><DollarSign className="w-4 h-4" />Record Payment</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Invoices;
