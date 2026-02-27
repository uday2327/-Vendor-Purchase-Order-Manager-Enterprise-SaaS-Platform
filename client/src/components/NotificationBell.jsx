import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';
import { Bell, Check, AlertTriangle, Clock, DollarSign, CheckCircle2, Info, X } from 'lucide-react';

const typeIcons = {
    late_delivery: <Clock className="w-4 h-4 text-amber-500" />,
    overdue_invoice: <AlertTriangle className="w-4 h-4 text-red-500" />,
    overspending: <DollarSign className="w-4 h-4 text-red-500" />,
    budget_exceeded: <AlertTriangle className="w-4 h-4 text-red-500" />,
    po_approved: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    po_rejected: <X className="w-4 h-4 text-red-500" />,
    payment_received: <DollarSign className="w-4 h-4 text-emerald-500" />,
    info: <Info className="w-4 h-4 text-primary-500" />,
};

const NotificationBell = () => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const ref = useRef(null);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications', { params: { limit: 10 } });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
        } catch { }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/all/read');
            fetchNotifications();
        } catch { }
    };

    const markOneRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            fetchNotifications();
        } catch { }
    };

    const timeAgo = (date) => {
        const s = Math.floor((Date.now() - new Date(date)) / 1000);
        if (s < 60) return 'Just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-xl transition-all duration-200 border border-transparent hover:border-slate-200/30 dark:hover:border-slate-700/20"
            >
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl rounded-2xl shadow-glass-lg border border-white/60 dark:border-slate-700/30 z-50 overflow-hidden animate-scale-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100/60 dark:border-slate-800/40">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="py-8 text-center text-sm text-slate-400">No notifications</div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n._id}
                                    onClick={() => !n.read && markOneRead(n._id)}
                                    className={`flex gap-3 px-4 py-3 border-b border-slate-100/40 dark:border-slate-800/30 cursor-pointer transition-colors ${n.read ? 'opacity-50' : 'hover:bg-primary-50/30 dark:hover:bg-primary-900/15'}`}
                                >
                                    <div className="mt-0.5">{typeIcons[n.type] || typeIcons.info}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[13px] text-slate-700 dark:text-slate-200 leading-snug">{n.message}</p>
                                        <p className="text-[11px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.read && <div className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
