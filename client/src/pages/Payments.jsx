import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import { CreditCard, Plus, Search, Check, X, Clock, ChevronDown, AlertTriangle, Percent, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const statusBadge = { Pending: 'badge-yellow', Success: 'badge-green', Failed: 'badge-red', Refunded: 'badge-slate' };
const approvalBadge = { 'N/A': '', Submitted: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red', Draft: 'badge-slate' };

const PaymentsPage = () => {
    const [payments, setPayments] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [approveModal, setApproveModal] = useState(null);
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [discountInfo, setDiscountInfo] = useState(null);
    const [form, setForm] = useState({ invoice: '', amount: '', paymentMethod: 'Manual', scheduledDate: '' });
    const [saving, setSaving] = useState(false);
    const [approvalComment, setApprovalComment] = useState('');

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/payments', { params: { status: filter || undefined, page, limit: 12 } });
            setPayments(data.payments); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load payments'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchPayments(); }, [page, filter]);

    const openCreateModal = async () => {
        try {
            const { data } = await api.get('/invoices', { params: { limit: 100 } });
            setInvoices((data.invoices || []).filter(i => i.paymentStatus !== 'Paid'));
        } catch { }
        setModalOpen(true);
    };

    const handleInvoiceSelect = async (invoiceId) => {
        const inv = invoices.find(i => i._id === invoiceId);
        setSelectedInvoice(inv);
        setForm({ ...form, invoice: invoiceId, amount: inv?.outstandingAmount || '' });
        setDiscountInfo(null);
        if (inv?.vendor) {
            try {
                const vendorId = inv.vendor._id || inv.vendor;
                const { data } = await api.get(`/vendors/${vendorId}`);
                if (data.vendor?.earlyPaymentDays > 0 && data.vendor?.earlyPaymentDiscountPercentage > 0) {
                    const daysSince = Math.floor((Date.now() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24));
                    if (daysSince <= data.vendor.earlyPaymentDays) {
                        const discount = Math.round(inv.outstandingAmount * (data.vendor.earlyPaymentDiscountPercentage / 100) * 100) / 100;
                        setDiscountInfo({ percentage: data.vendor.earlyPaymentDiscountPercentage, amount: discount, daysLeft: data.vendor.earlyPaymentDays - daysSince });
                    }
                }
            } catch { }
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.invoice || !form.amount) { toast.error('Invoice and amount required'); return; }
        setSaving(true);
        try {
            await api.post('/payments', { invoice: form.invoice, amount: parseFloat(form.amount), paymentMethod: form.paymentMethod, scheduledDate: form.scheduledDate || undefined });
            toast.success('Payment created'); setModalOpen(false); setForm({ invoice: '', amount: '', paymentMethod: 'Manual', scheduledDate: '' }); setSelectedInvoice(null); setDiscountInfo(null); fetchPayments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleApprove = async (action) => {
        if (!approveModal) return;
        try {
            await api.post(`/payments/${approveModal._id}/approve`, { action, comment: approvalComment });
            toast.success(`Payment ${action.toLowerCase()}`); setApproveModal(null); setApprovalComment(''); fetchPayments();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><CreditCard className="w-6 h-6 text-primary-500" />Payments</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Accounts payable & transaction management ({total})</p>
                </div>
                <button onClick={openCreateModal} className="btn-primary"><Plus className="w-4 h-4" />New Payment</button>
            </div>

            <div className="card !p-4 flex flex-wrap items-center gap-3">
                {['', 'Pending', 'Success', 'Failed'].map(s => (
                    <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === s ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-700'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            <div className="card !p-0 overflow-hidden">
                <table className="w-full">
                    <thead><tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                        <th className="table-header">Transaction</th><th className="table-header">Invoice</th><th className="table-header">Vendor</th>
                        <th className="table-header text-right">Amount</th><th className="table-header">Method</th><th className="table-header">Status</th>
                        <th className="table-header">Approval</th><th className="table-header">Date</th><th className="table-header text-center">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {loading ? <tr><td colSpan={9} className="text-center py-12 text-slate-400">Loading...</td></tr> :
                            payments.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-slate-400">No payments found</td></tr> :
                                payments.map((p, i) => (
                                    <tr key={p._id} className="table-row animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                                        <td className="table-cell font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{p.transactionId}</td>
                                        <td className="table-cell text-sm">{p.invoice?.invoiceNumber || '—'}</td>
                                        <td className="table-cell text-sm font-medium">{p.vendor?.name || '—'}</td>
                                        <td className="table-cell text-right font-bold">₹{p.amount?.toLocaleString()}{p.discountApplied > 0 && <span className="text-xs text-emerald-500 ml-1">(-₹{p.discountApplied})</span>}</td>
                                        <td className="table-cell text-xs">{p.paymentMethod}</td>
                                        <td className="table-cell"><span className={statusBadge[p.paymentStatus] || 'badge-slate'}>{p.paymentStatus}</span></td>
                                        <td className="table-cell">{p.paymentApprovalStatus !== 'N/A' && <span className={approvalBadge[p.paymentApprovalStatus]}>{p.paymentApprovalStatus}</span>}
                                            {p.scheduledDate && <span className="badge-blue ml-1 text-[10px]"><Calendar className="w-3 h-3 inline" /> Scheduled</span>}
                                        </td>
                                        <td className="table-cell text-xs text-slate-400">{formatDate(p.paidAt || p.scheduledDate)}</td>
                                        <td className="table-cell text-center">
                                            {p.paymentApprovalStatus === 'Submitted' && (
                                                <button onClick={() => setApproveModal(p)} className="text-xs font-bold text-primary-500 hover:underline">Review</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {pages > 1 && <div className="flex justify-center gap-2">{[...Array(pages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-surface-800 text-slate-500'}`}>{i + 1}</button>
            ))}</div>}

            {/* Create Payment Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Payment">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Invoice *</label>
                        <select value={form.invoice} onChange={(e) => handleInvoiceSelect(e.target.value)} className="select-field">
                            <option value="">Select invoice...</option>
                            {invoices.map(i => <option key={i._id} value={i._id}>{i.invoiceNumber} — ₹{i.outstandingAmount?.toLocaleString()} outstanding</option>)}
                        </select>
                    </div>
                    {discountInfo && (
                        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-3 flex items-start gap-2">
                            <Percent className="w-4 h-4 text-emerald-600 mt-0.5" />
                            <div><p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Early Payment Discount Available!</p>
                                <p className="text-xs text-emerald-600 dark:text-emerald-300">Pay within {discountInfo.daysLeft} days and save ₹{discountInfo.amount.toLocaleString()} ({discountInfo.percentage}%)</p></div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Amount (₹) *</label>
                            <input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input-field" />
                        </div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Method</label>
                            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="select-field">
                                {['Manual', 'Card', 'UPI', 'Bank Transfer'].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Schedule Payment (optional)</label>
                        <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="input-field" />
                    </div>
                    <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Processing...' : 'Create Payment'}</button></div>
                </form>
            </Modal>

            {/* Approve/Reject Modal */}
            <Modal isOpen={!!approveModal} onClose={() => setApproveModal(null)} title="Review Payment">
                {approveModal && <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-surface-800 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Transaction</span><span className="font-mono font-bold text-sm">{approveModal.transactionId}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Amount</span><span className="font-bold text-lg">₹{approveModal.amount?.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-sm text-slate-500">Invoice</span><span className="font-bold text-sm">{approveModal.invoice?.invoiceNumber}</span></div>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Comment</label>
                        <input type="text" value={approvalComment} onChange={(e) => setApprovalComment(e.target.value)} className="input-field" placeholder="Optional comment..." /></div>
                    <div className="flex justify-end gap-3">
                        <button onClick={() => handleApprove('Rejected')} className="btn-secondary !text-red-500 !border-red-200"><X className="w-4 h-4" />Reject</button>
                        <button onClick={() => handleApprove('Approved')} className="btn-primary"><Check className="w-4 h-4" />Approve</button>
                    </div>
                </div>}
            </Modal>
        </div>
    );
};

export default PaymentsPage;
