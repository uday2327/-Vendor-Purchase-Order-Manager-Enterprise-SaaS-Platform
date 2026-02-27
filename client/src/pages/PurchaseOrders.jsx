import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    Clock,
    CheckCircle2,
    XCircle,
    Package,
} from 'lucide-react';
import toast from 'react-hot-toast';

const emptyItem = { name: '', qty: 1, unitPrice: 0 };

/* ── Skeleton ── */
const TableSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <tr key={i}>
                <td className="table-cell"><div className="flex items-center gap-2"><div className="skeleton h-4 w-4 !rounded" /><div className="skeleton h-4 w-24" /></div></td>
                <td className="table-cell"><div className="skeleton h-4 w-28" /></td>
                <td className="table-cell"><div className="skeleton h-4 w-16" /></td>
                <td className="table-cell text-right"><div className="skeleton h-4 w-20 ml-auto" /></td>
                <td className="table-cell"><div className="skeleton h-4 w-24" /></td>
                <td className="table-cell"><div className="skeleton h-6 w-20 !rounded-full" /></td>
                <td className="table-cell text-right"><div className="skeleton h-8 w-20 ml-auto" /></td>
            </tr>
        ))}
    </>
);

const PurchaseOrders = () => {
    const [orders, setOrders] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        vendor: '', items: [{ ...emptyItem }], expectedDeliveryDate: '', status: 'Pending',
        actualDeliveryDate: '', isRecurring: false, recurringInterval: 'None',
    });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const { permissions } = useAuth();
    const canWrite = permissions.canWritePurchaseOrders;

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchase-orders', { params: { search, status: statusFilter, page, limit: 10 } });
            setOrders(data.purchaseOrders); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load purchase orders'); }
        finally { setLoading(false); }
    };

    const fetchVendors = async () => {
        try { const { data } = await api.get('/vendors', { params: { limit: 100 } }); setVendors(data.vendors); }
        catch { console.error('Failed to load vendors'); }
    };

    useEffect(() => { fetchVendors(); }, []);
    useEffect(() => { fetchOrders(); }, [page, search, statusFilter]);

    const openCreate = () => {
        setEditing(null);
        setForm({ vendor: '', items: [{ ...emptyItem }], expectedDeliveryDate: '', status: 'Pending', actualDeliveryDate: '', isRecurring: false, recurringInterval: 'None' });
        setModalOpen(true);
    };

    const openEdit = (order) => {
        setEditing(order);
        setForm({
            vendor: order.vendor?._id || order.vendor,
            items: order.items.map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
            expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : '',
            status: order.status,
            actualDeliveryDate: order.actualDeliveryDate ? order.actualDeliveryDate.slice(0, 10) : '',
            isRecurring: order.isRecurring || false,
            recurringInterval: order.recurringInterval || 'None',
        });
        setModalOpen(true);
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
    const removeItem = (index) => { if (form.items.length <= 1) return; setForm({ ...form, items: form.items.filter((_, i) => i !== index) }); };
    const updateItem = (index, field, value) => { const updated = [...form.items]; updated[index] = { ...updated[index], [field]: value }; setForm({ ...form, items: updated }); };
    const calcTotal = () => form.items.reduce((sum, item) => sum + (item.qty || 0) * (item.unitPrice || 0), 0);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.vendor || !form.expectedDeliveryDate) { toast.error('Please fill vendor and delivery date'); return; }
        if (form.items.some((i) => !i.name || !i.qty || !i.unitPrice)) { toast.error('Please fill all item fields'); return; }
        setSaving(true);
        try {
            if (editing) { await api.put(`/purchase-orders/${editing._id}`, form); toast.success('Purchase order updated'); }
            else { await api.post('/purchase-orders', form); toast.success('Purchase order created'); }
            setModalOpen(false); fetchOrders();
        } catch (error) { toast.error(error.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/purchase-orders/${deleteId}`); toast.success('Purchase order deleted'); setDeleteId(null); fetchOrders(); }
        catch { toast.error('Delete failed'); }
    };

    const getStatusBadge = (status) => { const m = { Delivered: 'badge-green', Pending: 'badge-yellow', Cancelled: 'badge-red' }; return m[status] || 'badge-slate'; };
    const getStatusIcon = (status) => { const m = { Delivered: <CheckCircle2 className="w-3 h-3 mr-1" />, Pending: <Clock className="w-3 h-3 mr-1" />, Cancelled: <XCircle className="w-3 h-3 mr-1" /> }; return m[status] || null; };
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Purchase Orders</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage procurement orders ({total} total)</p>
                </div>
                {canWrite && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />New PO</button>}
            </div>

            {/* Filters */}
            <div className="card !p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" placeholder="Search PO number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
                    </div>
                    <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="select-field w-auto min-w-[150px]">
                        <option value="">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="table-header">PO Number</th>
                                <th className="table-header">Vendor</th>
                                <th className="table-header">Items</th>
                                <th className="table-header text-right">Total</th>
                                <th className="table-header">Delivery</th>
                                <th className="table-header">Status</th>
                                {canWrite && <th className="table-header text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? <TableSkeleton /> : orders.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-16 text-slate-400 dark:text-slate-500">No purchase orders found</td></tr>
                            ) : (
                                orders.map((order, idx) => (
                                    <tr key={order._id} className="table-row animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-2">
                                                <Package className="w-4 h-4 text-primary-500" />
                                                <span className="font-bold text-slate-800 dark:text-slate-100 font-mono text-sm">{order.poNumber}</span>
                                                {order.isRecurring && <span className="badge-blue !py-0.5 !px-1.5 !text-[10px]">Recurring</span>}
                                            </div>
                                        </td>
                                        <td className="table-cell"><span className="text-sm font-medium text-slate-700 dark:text-slate-200">{order.vendor?.name || 'Unknown'}</span></td>
                                        <td className="table-cell"><span className="text-sm text-slate-600 dark:text-slate-300">{order.items?.length || 0} item(s)</span></td>
                                        <td className="table-cell text-right"><span className="font-bold text-slate-800 dark:text-white text-sm">₹{order.totalAmount?.toLocaleString()}</span></td>
                                        <td className="table-cell">
                                            <div className="text-sm">
                                                <p className="text-slate-600 dark:text-slate-300">{formatDate(order.expectedDeliveryDate)}</p>
                                                {order.isLateDelivery && <span className="badge-red !py-0.5 mt-1"><AlertTriangle className="w-3 h-3 mr-1" />Late</span>}
                                            </div>
                                        </td>
                                        <td className="table-cell"><span className={getStatusBadge(order.status)}>{getStatusIcon(order.status)}{order.status}</span></td>
                                        {canWrite && (
                                            <td className="table-cell text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(order)} className="btn-ghost !p-2" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeleteId(order._id)} className="btn-ghost !p-2 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                </div>
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages} ({total} orders)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Purchase Order' : 'New Purchase Order'} size="lg">
                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Vendor *</label>
                            <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="select-field">
                                <option value="">Select Vendor</option>
                                {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Expected Delivery *</label>
                            <input type="date" value={form.expectedDeliveryDate} onChange={(e) => setForm({ ...form, expectedDeliveryDate: e.target.value })} className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Status</label>
                            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-field">
                                <option value="Pending">Pending</option><option value="Delivered">Delivered</option><option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Actual Delivery Date</label>
                            <input type="date" value={form.actualDeliveryDate} onChange={(e) => setForm({ ...form, actualDeliveryDate: e.target.value })} className="input-field" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="w-4 h-4 text-primary-600 border-slate-300 dark:border-slate-600 rounded focus:ring-primary-500" />
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Recurring Order</span>
                            </label>
                        </div>
                        {form.isRecurring && (
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Interval</label>
                                <select value={form.recurringInterval} onChange={(e) => setForm({ ...form, recurringInterval: e.target.value })} className="select-field">
                                    <option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Items */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-200">Items</label>
                            <button type="button" onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add Item</button>
                        </div>
                        <div className="space-y-3">
                            {form.items.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-surface-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                    <div className="flex-1"><input type="text" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} placeholder="Item name" className="input-field !bg-white dark:!bg-surface-900" /></div>
                                    <div className="w-24"><input type="number" min="1" value={item.qty} onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)} placeholder="Qty" className="input-field !bg-white dark:!bg-surface-900" /></div>
                                    <div className="w-32"><input type="number" min="0" value={item.unitPrice} onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)} placeholder="Price" className="input-field !bg-white dark:!bg-surface-900" /></div>
                                    <div className="w-28 flex items-center justify-end pt-2.5"><span className="text-sm font-bold text-slate-700 dark:text-slate-200">₹{((item.qty || 0) * (item.unitPrice || 0)).toLocaleString()}</span></div>
                                    {form.items.length > 1 && <button type="button" onClick={() => removeItem(index)} className="mt-2.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-right"><span className="text-lg font-extrabold text-slate-800 dark:text-white">Total: ₹{calcTotal().toLocaleString()}</span></div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create PO'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Purchase Order" size="sm">
                <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this purchase order?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
                    <button onClick={handleDelete} className="btn-danger">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default PurchaseOrders;
