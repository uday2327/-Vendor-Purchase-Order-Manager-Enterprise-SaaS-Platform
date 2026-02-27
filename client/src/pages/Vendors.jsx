import { useState, useEffect } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/Modal';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Star,
    ChevronLeft,
    ChevronRight,
    Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

const emptyVendor = { name: '', contactPerson: '', phone: '', email: '', address: '', gstTaxId: '', rating: 0 };

/* ── Skeleton ── */
const TableSkeleton = () => (
    <>
        {[...Array(5)].map((_, i) => (
            <tr key={i}>
                <td className="table-cell"><div className="space-y-2"><div className="skeleton h-4 w-36" /><div className="skeleton h-3 w-28" /></div></td>
                <td className="table-cell"><div className="space-y-2"><div className="skeleton h-4 w-28" /><div className="skeleton h-3 w-24" /></div></td>
                <td className="table-cell"><div className="skeleton h-4 w-32" /></td>
                <td className="table-cell"><div className="skeleton h-4 w-12" /></td>
                <td className="table-cell"><div className="skeleton h-6 w-14 !rounded-full" /></td>
                <td className="table-cell text-right"><div className="skeleton h-8 w-20 ml-auto" /></td>
            </tr>
        ))}
    </>
);

const Vendors = () => {
    const [vendors, setVendors] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyVendor);
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const { permissions } = useAuth();
    const canWrite = permissions.canWriteVendors;

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/vendors', { params: { search, page, limit: 10 } });
            setVendors(data.vendors);
            setTotal(data.total);
            setPages(data.pages);
        } catch { toast.error('Failed to load vendors'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVendors(); }, [page, search]);

    const openCreate = () => { setEditing(null); setForm(emptyVendor); setModalOpen(true); };
    const openEdit = (v) => {
        setEditing(v);
        setForm({ name: v.name, contactPerson: v.contactPerson, phone: v.phone, email: v.email, address: v.address || '', gstTaxId: v.gstTaxId || '', rating: v.rating || 0 });
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name || !form.contactPerson || !form.phone || !form.email) { toast.error('Please fill in all required fields'); return; }
        setSaving(true);
        try {
            if (editing) { await api.put(`/vendors/${editing._id}`, form); toast.success('Vendor updated'); }
            else { await api.post('/vendors', form); toast.success('Vendor created'); }
            setModalOpen(false); fetchVendors();
        } catch (error) { toast.error(error.response?.data?.message || 'Save failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/vendors/${deleteId}`); toast.success('Vendor deleted'); setDeleteId(null); fetchVendors(); }
        catch { toast.error('Delete failed'); }
    };

    const getScoreBadge = (score) => {
        if (score >= 80) return 'badge-green';
        if (score >= 50) return 'badge-yellow';
        return 'badge-red';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title">Vendors</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your vendor directory ({total} total)</p>
                </div>
                {canWrite && <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add Vendor</button>}
            </div>

            {/* Search */}
            <div className="card !p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search vendors..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
                </div>
            </div>

            {/* Table */}
            <div className="card !p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                                <th className="table-header">Vendor</th>
                                <th className="table-header">Contact</th>
                                <th className="table-header">GST/Tax ID</th>
                                <th className="table-header">Rating</th>
                                <th className="table-header">Performance</th>
                                {canWrite && <th className="table-header text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {loading ? <TableSkeleton /> : vendors.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500">No vendors found</td></tr>
                            ) : (
                                vendors.map((vendor, idx) => (
                                    <tr key={vendor._id} className="table-row animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                                        <td className="table-cell">
                                            <p className="font-semibold text-slate-800 dark:text-slate-100">{vendor.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.email}</p>
                                        </td>
                                        <td className="table-cell">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{vendor.contactPerson}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{vendor.phone}</p>
                                        </td>
                                        <td className="table-cell"><span className="text-sm text-slate-600 dark:text-slate-300 font-mono">{vendor.gstTaxId || '—'}</span></td>
                                        <td className="table-cell">
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{vendor.rating}</span>
                                            </div>
                                        </td>
                                        <td className="table-cell">
                                            <span className={getScoreBadge(vendor.performanceScore)}><Award className="w-3 h-3 mr-1" />{vendor.performanceScore}</span>
                                        </td>
                                        {canWrite && (
                                            <td className="table-cell text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(vendor)} className="btn-ghost !p-2" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => setDeleteId(vendor._id)} className="btn-ghost !p-2 hover:!text-red-600 hover:!bg-red-50 dark:hover:!bg-red-500/10" title="Delete"><Trash2 className="w-4 h-4" /></button>
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
                        <p className="text-sm text-slate-500 dark:text-slate-400">Page {page} of {pages} ({total} vendors)</p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Vendor' : 'Add Vendor'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Vendor Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Company name" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Contact Person *</label><input type="text" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="input-field" placeholder="Person name" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Phone *</label><input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="+91-XXXXXXXXXX" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@company.com" /></div>
                        <div className="sm:col-span-2"><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Address</label><input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input-field" placeholder="Full address" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">GST/Tax ID</label><input type="text" value={form.gstTaxId} onChange={(e) => setForm({ ...form, gstTaxId: e.target.value })} className="input-field" placeholder="GST number" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Rating (0-5)</label><input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Vendor" size="sm">
                <p className="text-slate-600 dark:text-slate-300 mb-6">Are you sure you want to delete this vendor? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
                    <button onClick={handleDelete} className="btn-danger">Delete</button>
                </div>
            </Modal>
        </div>
    );
};

export default Vendors;
