import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Search, Package, AlertTriangle, CheckCircle2, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

const stockBadge = { 'In Stock': 'badge-green', 'Low Stock': 'badge-yellow', 'Out of Stock': 'badge-red' };

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [form, setForm] = useState({ itemName: '', currentStock: 0, reorderPoint: 10, reorderQty: 50, unitPrice: 0, category: 'General', preferredVendor: '', autoReorder: false });
    const [saving, setSaving] = useState(false);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/inventory', { params: { search, page, limit: 12 } });
            setItems(data.items); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load inventory'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchItems(); }, [page, search]);
    useEffect(() => { api.get('/vendors', { params: { limit: 100 } }).then(r => setVendors(r.data.vendors)).catch(() => { }); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.itemName) { toast.error('Item name required'); return; }
        setSaving(true);
        try { await api.post('/inventory', form); toast.success('Item added'); setModalOpen(false); fetchItems(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><Package className="w-6 h-6 text-primary-500" />Inventory</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stock tracking & auto-reorder ({total} items)</p>
                </div>
                <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus className="w-4 h-4" />Add Item</button>
            </div>

            <div className="card !p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search items..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {loading ? [...Array(4)].map((_, i) => <div key={i} className="card h-36 skeleton" />) : items.length === 0 ? (
                    <div className="col-span-full text-center py-16 text-slate-400">No inventory items</div>
                ) : items.map((item, idx) => (
                    <div key={item._id} className={`card space-y-3 animate-fade-in border-l-4 ${item.stockStatus === 'Out of Stock' ? 'border-l-red-500' : item.stockStatus === 'Low Stock' ? 'border-l-amber-500' : 'border-l-emerald-500'}`} style={{ animationDelay: `${idx * 30}ms` }}>
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-sm">{item.itemName}</h3>
                                <p className="text-xs text-slate-400 font-mono">{item.sku}</p>
                            </div>
                            <span className={stockBadge[item.stockStatus] || 'badge-slate'}>{item.stockStatus}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <div>
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Stock</p>
                                <p className="font-extrabold text-lg text-slate-800 dark:text-white">{item.currentStock}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Reorder at</p>
                                <p className="font-bold text-slate-600 dark:text-slate-300">{item.reorderPoint}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-500 dark:text-slate-400 text-xs">Price</p>
                                <p className="font-bold text-slate-600 dark:text-slate-300">₹{item.unitPrice}</p>
                            </div>
                        </div>
                        {item.autoReorder && <div className="text-xs text-primary-500 font-semibold flex items-center gap-1"><ArrowDown className="w-3 h-3" />Auto-reorder enabled</div>}
                        {item.preferredVendor && <p className="text-xs text-slate-400">Vendor: {item.preferredVendor.name}</p>}
                    </div>
                ))}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Inventory Item">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Item Name *</label><input type="text" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} className="input-field" /></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Stock</label><input type="number" min="0" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: parseInt(e.target.value) || 0 })} className="input-field" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Reorder At</label><input type="number" min="0" value={form.reorderPoint} onChange={(e) => setForm({ ...form, reorderPoint: parseInt(e.target.value) || 0 })} className="input-field" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Reorder Qty</label><input type="number" min="1" value={form.reorderQty} onChange={(e) => setForm({ ...form, reorderQty: parseInt(e.target.value) || 1 })} className="input-field" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Price (₹)</label><input type="number" min="0" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: parseFloat(e.target.value) || 0 })} className="input-field" /></div>
                        <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Category</label><input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" /></div>
                    </div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Preferred Vendor</label>
                        <select value={form.preferredVendor} onChange={(e) => setForm({ ...form, preferredVendor: e.target.value })} className="select-field"><option value="">None</option>{vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}</select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.autoReorder} onChange={(e) => setForm({ ...form, autoReorder: e.target.checked })} className="w-4 h-4 text-primary-600 border-slate-300 rounded" /><span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Enable auto-reorder</span></label>
                    <div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button><button type="submit" disabled={saving} className="btn-primary">{saving ? 'Adding...' : 'Add Item'}</button></div>
                </form>
            </Modal>
        </div>
    );
};

export default InventoryPage;
