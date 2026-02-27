import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Columns3, Package, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const columns = [
    { id: 'Pending', label: 'Pending', icon: Clock, color: 'amber', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30' },
    { id: 'Delivered', label: 'Delivered', icon: Truck, color: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/30' },
    { id: 'Cancelled', label: 'Cancelled', icon: XCircle, color: 'red', bg: 'bg-red-50 dark:bg-red-500/10', border: 'border-red-200 dark:border-red-500/30' },
];

const statusBadge = { Pending: 'badge-yellow', Delivered: 'badge-green', Cancelled: 'badge-red' };

const KanbanBoard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dragItem, setDragItem] = useState(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/purchase-orders', { params: { limit: 100 } });
            setOrders(data.purchaseOrders || []);
        } catch { toast.error('Failed to load orders'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, []);

    const handleDragStart = (e, order) => {
        setDragItem(order);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!dragItem || dragItem.status === newStatus) { setDragItem(null); return; }
        try {
            await api.put(`/purchase-orders/${dragItem._id}`, { status: newStatus });
            setOrders(prev => prev.map(o => o._id === dragItem._id ? { ...o, status: newStatus } : o));
            toast.success(`Moved to ${newStatus}`);
        } catch { toast.error('Update failed'); }
        setDragItem(null);
    };

    const getColumnOrders = (status) => orders.filter(o => o.status === status);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title flex items-center gap-2"><Columns3 className="w-6 h-6 text-primary-500" />Kanban Board</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Drag & drop purchase orders between statuses</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
                {columns.map(col => {
                    const colOrders = getColumnOrders(col.id);
                    return (
                        <div key={col.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={`rounded-2xl border-2 border-dashed ${col.border} ${col.bg} p-4 transition-all`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <col.icon className={`w-5 h-5 text-${col.color}-500`} />
                                    <h3 className="font-bold text-slate-800 dark:text-white">{col.label}</h3>
                                </div>
                                <span className="text-xs font-bold bg-white dark:bg-surface-800 px-2.5 py-1 rounded-full text-slate-500 shadow-sm">{colOrders.length}</span>
                            </div>

                            <div className="space-y-3 min-h-[200px]">
                                {loading ? [...Array(2)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />) :
                                    colOrders.map(order => (
                                        <div key={order._id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, order)}
                                            className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/50 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">{order.poNumber}</span>
                                                {order.isLateDelivery && <span className="badge-red !py-0.5 !text-[10px]">Late</span>}
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">{order.vendor?.name || 'Unknown'}</p>
                                            <div className="flex items-center justify-between text-xs text-slate-400">
                                                <span>{order.items?.length || 0} items</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300">₹{order.totalAmount?.toLocaleString()}</span>
                                            </div>
                                            {order.expectedDeliveryDate && <p className="text-xs text-slate-400 mt-1">Due: {formatDate(order.expectedDeliveryDate)}</p>}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default KanbanBoard;
