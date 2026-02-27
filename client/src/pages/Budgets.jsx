import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Wallet, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ department: '', monthlyLimit: '' });
    const [saving, setSaving] = useState(false);
    const { permissions } = useAuth();

    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/budgets');
            setBudgets(data);
        } catch { toast.error('Failed to load budgets'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchBudgets(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.department || !form.monthlyLimit) { toast.error('Fill all fields'); return; }
        setSaving(true);
        try {
            await api.post('/budgets', { department: form.department, monthlyLimit: parseFloat(form.monthlyLimit) });
            toast.success('Budget created');
            setModalOpen(false);
            setForm({ department: '', monthlyLimit: '' });
            fetchBudgets();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const getBarColor = (util) => {
        const u = parseFloat(util);
        if (u >= 90) return 'bg-red-500';
        if (u >= 70) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><Wallet className="w-6 h-6 text-primary-500" />Department Budgets</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track spending against monthly limits</p>
                </div>
                {permissions.canWriteVendors && (
                    <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Budget</button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="card h-36 skeleton" />)
                ) : budgets.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400">No budgets configured</div>
                ) : (
                    budgets.map((b) => (
                        <div key={b._id} className="card space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 dark:text-white">{b.department}</h3>
                                {parseFloat(b.utilization) >= 90 && (
                                    <span className="badge-red !py-0.5"><AlertTriangle className="w-3 h-3 mr-1" />Over Budget</span>
                                )}
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Spent: ₹{b.currentSpend?.toLocaleString()}</span>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">₹{b.monthlyLimit?.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                                    <div className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(b.utilization)}`} style={{ width: `${Math.min(parseFloat(b.utilization), 100)}%` }} />
                                </div>
                                <p className="text-xs text-slate-400 text-right">{b.utilization}% utilized</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Budget" size="sm">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Department *</label>
                        <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" placeholder="e.g., Engineering" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Monthly Limit (₹) *</label>
                        <input type="number" min="0" value={form.monthlyLimit} onChange={(e) => setForm({ ...form, monthlyLimit: e.target.value })} className="input-field" placeholder="500000" />
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Budgets;
