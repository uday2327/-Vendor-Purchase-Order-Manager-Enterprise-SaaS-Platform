import { useState, useEffect } from 'react';
import api from '../lib/api';
import { GitCompareArrows, Star, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

const VendorCompare = () => {
    const [vendors, setVendors] = useState([]);
    const [selected, setSelected] = useState(['', '', '']);
    const [comparison, setComparison] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/vendors', { params: { limit: 100 } }).then(r => setVendors(r.data.vendors)).catch(() => { });
    }, []);

    const compareVendors = async () => {
        const ids = selected.filter(Boolean);
        if (ids.length < 2) { toast.error('Select at least 2 vendors'); return; }
        setLoading(true);
        try {
            const details = await Promise.all(ids.map(id => api.get(`/vendors/${id}/performance`)));
            setComparison(details.map(d => d.data));
        } catch { toast.error('Comparison failed'); }
        finally { setLoading(false); }
    };

    const getRadarData = () => {
        if (!comparison.length) return [];
        const metrics = ['Rating', 'On-Time %', 'Score', 'Avg Order Value'];
        return metrics.map(metric => {
            const point = { metric };
            comparison.forEach((c, i) => {
                const v = c.vendor;
                const vals = {
                    'Rating': (v.rating / 5) * 100,
                    'On-Time %': c.onTimeDeliveryPercentage,
                    'Score': c.performanceScore,
                    'Avg Order Value': Math.min((c.averageOrderValue / 10000) * 100, 100),
                };
                point[v.name] = vals[metric] || 0;
            });
            return point;
        });
    };

    const riskBadge = (risk) => risk === 'Low' ? 'badge-green' : risk === 'Medium' ? 'badge-yellow' : 'badge-red';

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title flex items-center gap-2"><GitCompareArrows className="w-6 h-6 text-primary-500" />Vendor Comparison</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Side-by-side vendor performance analysis</p>
            </div>

            {/* Select Vendors */}
            <div className="card">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {selected.map((sel, i) => (
                        <select key={i} value={sel} onChange={(e) => { const n = [...selected]; n[i] = e.target.value; setSelected(n); }} className="select-field">
                            <option value="">Vendor {i + 1}</option>
                            {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                        </select>
                    ))}
                </div>
                <button onClick={compareVendors} disabled={loading} className="btn-primary mt-4">{loading ? 'Comparing...' : 'Compare'}</button>
            </div>

            {comparison.length > 0 && (
                <>
                    {/* Radar Chart */}
                    <div className="card">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Performance Radar</h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={getRadarData()}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                {comparison.map((c, i) => (
                                    <Radar key={i} name={c.vendor.name} dataKey={c.vendor.name} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2} />
                                ))}
                                <Legend />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Comparison Table */}
                    <div className="card !p-0 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="table-header">Metric</th>
                                    {comparison.map((c, i) => <th key={i} className="table-header text-center">{c.vendor.name}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {[
                                    { label: 'Rating', key: (c) => <div className="flex items-center justify-center gap-1"><Star className="w-4 h-4 text-amber-400 fill-amber-400" />{c.vendor.rating}/5</div> },
                                    { label: 'Performance Score', key: (c) => <span className="font-bold">{c.performanceScore}</span> },
                                    { label: 'On-Time Delivery', key: (c) => <span className={c.onTimeDeliveryPercentage >= 90 ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>{c.onTimeDeliveryPercentage}%</span> },
                                    { label: 'Total Orders', key: (c) => c.totalOrders },
                                    { label: 'Late Deliveries', key: (c) => <span className={c.lateDeliveryCount > 0 ? 'text-red-500 font-bold' : ''}>{c.lateDeliveryCount}</span> },
                                    { label: 'Avg Order Value', key: (c) => `₹${c.averageOrderValue?.toLocaleString()}` },
                                    { label: 'Risk Index', key: (c) => <span className={riskBadge(c.vendor.riskIndex || 'Low')}>{c.vendor.riskIndex || 'Low'}</span> },
                                ].map((row, i) => (
                                    <tr key={i} className="table-row">
                                        <td className="table-cell font-semibold text-sm text-slate-700 dark:text-slate-200">{row.label}</td>
                                        {comparison.map((c, j) => <td key={j} className="table-cell text-center text-sm">{row.key(c)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default VendorCompare;
