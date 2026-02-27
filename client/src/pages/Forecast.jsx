import { useState, useEffect } from 'react';
import api from '../lib/api';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import toast from 'react-hot-toast';

const severityBadge = { Critical: 'badge-red', Warning: 'badge-yellow', Info: 'badge-blue' };

const Forecast = () => {
    const [forecast, setForecast] = useState(null);
    const [anomalies, setAnomalies] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [f, a] = await Promise.all([api.get('/analytics/forecast'), api.get('/analytics/anomalies')]);
                setForecast(f.data); setAnomalies(a.data);
            } catch { toast.error('Failed to load data'); }
            finally { setLoading(false); }
        };
        fetchAll();
    }, []);

    if (loading) return <div className="space-y-6 animate-fade-in"><h1 className="page-title">Intelligence</h1><div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{[1, 2].map(i => <div key={i} className="card h-80 skeleton" />)}</div></div>;

    const chartData = forecast ? [...(forecast.historical || []), ...(forecast.forecast || [])] : [];
    const trendIcon = forecast?.trend === 'increasing' ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : forecast?.trend === 'decreasing' ? <TrendingDown className="w-5 h-5 text-red-500" /> : <Minus className="w-5 h-5 text-slate-400" />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary-500" />Intelligence & Forecasting</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Predictive analytics & anomaly detection</p>
            </div>

            {/* Summary Cards */}
            {forecast && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="card flex items-center gap-4">
                        {trendIcon}
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Trend</p><p className="font-bold text-slate-800 dark:text-white capitalize">{forecast.trend}</p></div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <Target className="w-5 h-5 text-primary-500" />
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Avg Monthly Spend</p><p className="font-bold text-slate-800 dark:text-white">₹{forecast.avgMonthly?.toLocaleString()}</p></div>
                    </div>
                    <div className="card flex items-center gap-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div><p className="text-sm text-slate-500 dark:text-slate-400">Anomalies Detected</p><p className="font-bold text-slate-800 dark:text-white">{anomalies?.anomalies?.length || 0}</p></div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Forecast Chart */}
                <div className="card lg:col-span-2">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Spend Forecast (3-Month Prediction)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(v) => v ? `₹${v.toLocaleString()}` : 'N/A'} />
                            <Legend />
                            <Line type="monotone" dataKey="actual" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} name="Actual" connectNulls={false} />
                            <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} name="Predicted" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Anomalies Table */}
                <div className="card lg:col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">Anomaly Detection</h3>
                        {anomalies?.stats && <span className="text-xs text-slate-400 ml-auto">Threshold: ₹{anomalies.stats.threshold?.toLocaleString()}</span>}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="table-header">PO</th>
                                    <th className="table-header">Vendor</th>
                                    <th className="table-header text-right">Amount</th>
                                    <th className="table-header">Deviation</th>
                                    <th className="table-header">Reason</th>
                                    <th className="table-header">Severity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {anomalies?.anomalies?.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-10 text-slate-400">No anomalies detected ✅</td></tr>
                                ) : anomalies?.anomalies?.map((a, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{a.poNumber}</td>
                                        <td className="table-cell text-sm">{a.vendorName}</td>
                                        <td className="table-cell text-right font-bold text-sm">₹{a.totalAmount?.toLocaleString()}</td>
                                        <td className="table-cell text-sm font-mono">{a.deviation}σ</td>
                                        <td className="table-cell text-xs text-slate-500">{a.reason}</td>
                                        <td className="table-cell"><span className={severityBadge[a.severity] || 'badge-slate'}>{a.severity}</span></td>
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

export default Forecast;
