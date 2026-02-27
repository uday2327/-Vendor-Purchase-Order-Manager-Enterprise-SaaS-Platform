import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import {
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, Award, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#14b8a6', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316'];

const Analytics = () => {
    const { palette } = useTheme();
    const [aging, setAging] = useState([]);
    const [vendorSpend, setVendorSpend] = useState([]);
    const [monthlyGrowth, setMonthlyGrowth] = useState([]);
    const [reliability, setReliability] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [a, s, g, r] = await Promise.all([
                    api.get('/analytics/payment-aging'),
                    api.get('/analytics/vendor-spend'),
                    api.get('/analytics/monthly-growth'),
                    api.get('/analytics/vendor-reliability'),
                ]);
                setAging(a.data);
                setVendorSpend(s.data);
                setMonthlyGrowth(g.data);
                setReliability(r.data);
            } catch { toast.error('Failed to load analytics'); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    if (loading) return (
        <div className="space-y-6 animate-fade-in">
            <h1 className="page-title">Analytics</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => <div key={i} className="card h-80 skeleton" />)}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title">Analytics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Advanced business intelligence & reporting</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Aging */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Payment Aging Report</h3>
                    </div>
                    {aging.length === 0 || (aging.length === 1 && aging[0].range === 'No Data') ? (
                        <div className="h-[250px] flex items-center justify-center text-sm text-slate-400">No unpaid invoices found</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={aging} dataKey="total" nameKey="range" cx="50%" cy="50%" outerRadius={80} label={({ range, count, total }) => `${range} (${count}): ₹${total.toLocaleString()}`}>
                                    {aging.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Vendor Spend */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <DollarSign className="w-5 h-5 text-indigo-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Vendor Spend Distribution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={vendorSpend.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.4)" />
                            <XAxis dataKey="vendorName" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                            <Bar dataKey="totalSpend" fill={palette.hex500} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Monthly Growth */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Monthly PO Growth</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={monthlyGrowth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.4)" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v, name) => name === 'total' ? `₹${v.toLocaleString()}` : `${v}%`} />
                            <Line type="monotone" dataKey="total" stroke={palette.hex500} strokeWidth={2} dot={{ r: 3, fill: palette.hex500 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Vendor Reliability */}
                <div className="card">
                    <div className="flex items-center gap-2 mb-4">
                        <Award className="w-5 h-5 text-purple-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Vendor Reliability Ranking</h3>
                    </div>
                    <div className="overflow-y-auto max-h-[250px]">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">#</th>
                                    <th className="text-left py-2 px-2 text-xs font-semibold text-slate-500">Vendor</th>
                                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">On-Time %</th>
                                    <th className="text-right py-2 px-2 text-xs font-semibold text-slate-500">Risk</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reliability.map((v, i) => (
                                    <tr key={v.vendorId} className="border-b border-slate-50 dark:border-slate-800/50">
                                        <td className="py-2 px-2 text-sm font-bold text-slate-400">{i + 1}</td>
                                        <td className="py-2 px-2 text-sm font-medium text-slate-700 dark:text-slate-200">{v.vendorName}</td>
                                        <td className="py-2 px-2 text-sm font-bold text-right text-emerald-600 dark:text-emerald-400">{v.onTimePercent}%</td>
                                        <td className="py-2 px-2 text-right">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${v.riskIndex === 'Low' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : v.riskIndex === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>{v.riskIndex}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
