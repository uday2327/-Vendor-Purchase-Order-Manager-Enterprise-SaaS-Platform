import { useState, useEffect } from 'react';
import api from '../lib/api';
import { BookOpen, ChevronDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import toast from 'react-hot-toast';

const JournalEntriesPage = () => {
    const [entries, setEntries] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/journal-entries', { params: { referenceType: filter || undefined, page, limit: 15 } });
            setEntries(data.entries); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load entries'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchEntries(); }, [page, filter]);

    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
    const refColor = { Invoice: 'text-blue-500', Payment: 'text-emerald-500', Adjustment: 'text-amber-500', Accrual: 'text-purple-500', Batch: 'text-indigo-500' };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary-500" />Journal Entries</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Double-entry accounting ledger ({total} entries)</p>
            </div>

            <div className="card !p-4 flex flex-wrap items-center gap-3">
                {['', 'Invoice', 'Payment', 'Adjustment', 'Accrual'].map(s => (
                    <button key={s} onClick={() => { setFilter(s); setPage(1); }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === s ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-surface-700'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                {loading ? <div className="card text-center py-12 text-slate-400">Loading...</div> :
                    entries.length === 0 ? <div className="card text-center py-12 text-slate-400">No journal entries found</div> :
                        entries.map((entry, i) => (
                            <div key={entry._id} className="card !p-0 overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                                <button onClick={() => setExpanded(expanded === entry._id ? null : entry._id)}
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50/50 dark:hover:bg-surface-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${entry.isBalanced ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-red-50 dark:bg-red-500/10'}`}>
                                            <BookOpen className={`w-5 h-5 ${entry.isBalanced ? 'text-emerald-500' : 'text-red-500'}`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{entry.description}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className={`text-xs font-bold ${refColor[entry.referenceType] || 'text-slate-400'}`}>{entry.referenceType}</span>
                                                <span className="text-[10px] text-slate-400">{formatDate(entry.createdAt)}</span>
                                                <span className="text-[10px] text-slate-400">{entry.entries.length} lines</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400">Total</p>
                                            <p className="font-bold text-sm">₹{entry.totalDebit?.toLocaleString()}</p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded === entry._id ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expanded === entry._id && (
                                    <div className="border-t border-slate-100 dark:border-slate-800">
                                        <table className="w-full">
                                            <thead><tr className="bg-slate-50/50 dark:bg-surface-900/50">
                                                <th className="table-header">Account</th>
                                                <th className="table-header text-right">Debit (₹)</th>
                                                <th className="table-header text-right">Credit (₹)</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                                                {entry.entries.map((e, j) => (
                                                    <tr key={j} className="table-row">
                                                        <td className="table-cell flex items-center gap-2">
                                                            {e.debit > 0 ? <ArrowUpRight className="w-3.5 h-3.5 text-red-400" /> : <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />}
                                                            <span className="font-medium text-sm">{e.accountName || 'Account'}</span>
                                                        </td>
                                                        <td className="table-cell text-right font-mono text-sm">{e.debit > 0 ? <span className="text-red-600 dark:text-red-400 font-bold">{e.debit.toLocaleString()}</span> : '—'}</td>
                                                        <td className="table-cell text-right font-mono text-sm">{e.credit > 0 ? <span className="text-emerald-600 dark:text-emerald-400 font-bold">{e.credit.toLocaleString()}</span> : '—'}</td>
                                                    </tr>
                                                ))}
                                                <tr className="bg-slate-50/80 dark:bg-surface-900/60 font-bold">
                                                    <td className="table-cell text-sm">Totals</td>
                                                    <td className="table-cell text-right font-mono text-sm text-red-600 dark:text-red-400">{entry.totalDebit?.toLocaleString()}</td>
                                                    <td className="table-cell text-right font-mono text-sm text-emerald-600 dark:text-emerald-400">{entry.totalCredit?.toLocaleString()}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
            </div>

            {pages > 1 && <div className="flex justify-center gap-2">{[...Array(pages)].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold ${page === i + 1 ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-surface-800 text-slate-500'}`}>{i + 1}</button>
            ))}</div>}
        </div>
    );
};

export default JournalEntriesPage;
