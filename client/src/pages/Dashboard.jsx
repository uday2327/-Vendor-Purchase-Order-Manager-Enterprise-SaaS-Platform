import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import StatsCard from '../components/StatsCard';
import {
    Users,
    ShoppingCart,
    CreditCard,
    AlertTriangle,
    Clock,
    TrendingUp,
    Award,
    DollarSign,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts';


/* ── Skeleton Loader ── */
const DashboardSkeleton = () => (
    <div className="space-y-6 animate-fade-in">
        <div>
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-4 w-72" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="card p-6">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                            <div className="skeleton h-3 w-20" />
                            <div className="skeleton h-8 w-16" />
                        </div>
                        <div className="skeleton w-12 h-12 !rounded-2xl" />
                    </div>
                </div>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card">
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="skeleton h-72 w-full" />
            </div>
            <div className="card">
                <div className="skeleton h-6 w-32 mb-4" />
                <div className="flex flex-col items-center gap-4 py-8">
                    <div className="skeleton w-20 h-20 !rounded-2xl" />
                    <div className="skeleton h-6 w-40" />
                    <div className="skeleton h-4 w-24" />
                </div>
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { dark, palette } = useTheme();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/dashboard');
                setStats(data);
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <DashboardSkeleton />;

    if (!stats) {
        return (
            <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                Failed to load dashboard data.
            </div>
        );
    }

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
        if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`;
        return `₹${val}`;
    };

    const chartTextColor = dark ? '#64748b' : '#94a3b8';
    const gridColor = dark ? 'rgba(30,41,59,0.5)' : 'rgba(241,245,249,0.6)';
    const tooltipBg = dark ? 'rgba(15,23,42,0.95)' : 'rgba(30,41,59,0.95)';
    const themeColor = palette.hex500;
    const themeLighter = palette.hex400;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="animate-fade-in">
                <h1 className="page-title">Dashboard</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Overview of your procurement operations
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatsCard title="Total Vendors" value={stats.totalVendors} icon={Users} color="blue" delay={0} />
                <StatsCard title="Purchase Orders" value={stats.totalPurchaseOrders} icon={ShoppingCart} color="green" delay={60} />
                <StatsCard title="Pending Payments" value={stats.pendingPayments} icon={CreditCard} color="amber" delay={120} />
                <StatsCard title="Overdue Payments" value={stats.overduePayments} icon={AlertTriangle} color="red" delay={180} />
                <StatsCard title="Late Deliveries" value={stats.lateDeliveries} icon={Clock} color="purple" delay={240} />
                <StatsCard title="Outstanding" value={formatCurrency(stats.totalOutstanding)} icon={DollarSign} color="slate" delay={300} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Trend */}
                <div className="lg:col-span-2 card animate-slide-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Monthly Purchase Trend</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Last 12 months</p>
                        </div>
                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyTrend}>
                                <defs>
                                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={themeColor} stopOpacity={0.15} />
                                        <stop offset="95%" stopColor={themeColor} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: tooltipBg,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                                    }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
                                />
                                <Area type="monotone" dataKey="totalAmount" stroke={themeColor} strokeWidth={2} fill="url(#colorAmount)" dot={false} activeDot={{ r: 4, fill: themeColor, strokeWidth: 2, stroke: '#fff' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Vendor */}
                <div className="card flex flex-col animate-slide-up" style={{ animationDelay: '300ms', animationFillMode: 'both' }}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">Top Vendor</h2>
                        <div className="w-10 h-10 bg-amber-100/60 dark:bg-amber-500/10 rounded-xl flex items-center justify-center">
                            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    {stats.topVendor ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-amber-100/60 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-300">
                                <Award className="w-10 h-10 text-amber-600 dark:text-amber-400" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white mb-1">{stats.topVendor.name}</h3>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="text-center px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-500/10">
                                    <p className="text-2xl font-extrabold text-primary-600 dark:text-primary-400">{stats.topVendor.performanceScore}</p>
                                    <p className="text-[11px] font-semibold text-primary-400 dark:text-primary-500 mt-0.5">Score</p>
                                </div>
                                <div className="text-center px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">{stats.topVendor.rating}</p>
                                    <p className="text-[11px] font-semibold text-amber-400 dark:text-amber-500 mt-0.5">Rating</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">No vendor data</div>
                    )}
                </div>
            </div>

            {/* Vendor Expense Breakdown */}
            {stats.vendorExpense && stats.vendorExpense.length > 0 && (
                <div className="card animate-slide-up" style={{ animationDelay: '400ms', animationFillMode: 'both' }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Vendor-wise Expense Breakdown</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Top 10 vendors by spend</p>
                        </div>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.vendorExpense} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: chartTextColor }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCurrency(v)} />
                                <YAxis type="category" dataKey="vendorName" tick={{ fontSize: 12, fill: dark ? '#94a3b8' : '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} width={150} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: tooltipBg, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#f8fafc', fontSize: '12px', fontWeight: '500', backdropFilter: 'blur(12px)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)' }}
                                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Total Spent']}
                                />
                                <Bar dataKey="totalSpent" fill="url(#barGradient)" radius={[0, 8, 8, 0]} barSize={22} />
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor={themeColor} />
                                        <stop offset="100%" stopColor={themeLighter} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
