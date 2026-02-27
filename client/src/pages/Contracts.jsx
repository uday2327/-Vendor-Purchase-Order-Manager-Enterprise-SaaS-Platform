import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import { Plus, FileStack, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const statusBadge = { Active: 'badge-green', Expired: 'badge-red', Pending: 'badge-yellow', Terminated: 'badge-slate' };

const Contracts = () => {
    const [contracts, setContracts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [form, setForm] = useState({ vendor: '', title: '', startDate: '', endDate: '', value: 0, terms: '' });
    const [saving, setSaving] = useState(false);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/contracts', { params: { page, limit: 10 } });
            setContracts(data.contracts); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load contracts'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchContracts(); }, [page]);
    useEffect(() => {
        api.get('/vendors', { params: { limit: 100 } }).then(r => setVendors(r.data.vendors)).catch(() => { });
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.vendor || !form.title || !form.startDate || !form.endDate) { toast.error('Fill required fields'); return; }
        setSaving(true);
        try {
            await api.post('/contracts', { ...form, value: parseFloat(form.value) || 0 });
            toast.success('Contract created'); setModalOpen(false); fetchContracts();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><FileStack className="w-6 h-6 text-primary-500" />Contracts</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage vendor contracts ({total} total)</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />New Contract</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? [...Array(3)].map((_, i) => <div key={i} className="card h-40 skeleton" />) : contracts.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400">No contracts found</div>
                ) : contracts.map((c, idx) => (
                    <div key={c._id} className="card space-y-3 animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">{c.title}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{c.vendor?.name} • {c.contractNumber}</p>
                            </div>
                            <span className={statusBadge[c.status] || 'badge-slate'}>{c.status}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{formatDate(c.startDate)} → {formatDate(c.endDate)}</span>
                            <span className="font-bold text-slate-700 dark:text-white">₹{c.value?.toLocaleString()}</span>
                        </div>
                        {c.isExpiringSoon && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Expires in {c.daysUntilExpiry} days
                            </div>
                        )}
                        {c.daysUntilExpiry < 0 && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                Expired {Math.abs(c.daysUntilExpiry)} days ago
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Contract">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Vendor *</label>
                        <select value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="select-field">
                            <option value="">Select Vendor</option>
                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Start Date *</label><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">End Date *</label><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" /></div>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Value (₹)</label><input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="input-field" /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Terms</label><textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} className="input-field" rows="3" /></div>
                    <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default Contracts;
