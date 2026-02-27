import { useState } from 'react';
import api from '../lib/api';
import { FileSearch, Upload, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ReconciliationPage = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [tab, setTab] = useState('matched');

    const handleUpload = async () => {
        if (!file) { toast.error('Select a CSV file'); return; }
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/reconciliation/upload-bank-statement', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setResult(data);
            toast.success(`Processed ${data.summary.total} records`);
        } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
        finally { setLoading(false); }
    };

    const tabs = [
        { id: 'matched', label: 'Matched', icon: CheckCircle2, color: 'emerald', count: result?.summary?.matched },
        { id: 'suggested', label: 'Suggested', icon: HelpCircle, color: 'amber', count: result?.summary?.suggested },
        { id: 'unmatched', label: 'Unmatched', icon: XCircle, color: 'red', count: result?.summary?.unmatched },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="page-title flex items-center gap-2"><FileSearch className="w-6 h-6 text-primary-500" />Payment Reconciliation</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload bank statement to match with system payments</p>
            </div>

            <div className="card">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex-1 w-full">
                        <label className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 cursor-pointer hover:border-primary-400 transition-colors">
                            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="hidden" />
                            <div className="text-center">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{file ? file.name : 'Drop CSV or click to upload'}</p>
                                <p className="text-xs text-slate-400 mt-1">Columns: transactionId / transaction_id, amount, date</p>
                            </div>
                        </label>
                    </div>
                    <button onClick={handleUpload} disabled={loading || !file} className="btn-primary whitespace-nowrap">
                        {loading ? 'Processing...' : 'Match Transactions'}
                    </button>
                </div>
            </div>

            {result && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="card text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total Records</p>
                            <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{result.summary.total}</p>
                        </div>
                        <div className="card text-center border-l-4 border-l-emerald-500">
                            <p className="text-sm text-emerald-600">Matched</p>
                            <p className="text-3xl font-extrabold text-emerald-600">{result.summary.matched}</p>
                        </div>
                        <div className="card text-center border-l-4 border-l-amber-500">
                            <p className="text-sm text-amber-600">Suggested</p>
                            <p className="text-3xl font-extrabold text-amber-600">{result.summary.suggested}</p>
                        </div>
                        <div className="card text-center border-l-4 border-l-red-500">
                            <p className="text-sm text-red-600">Unmatched</p>
                            <p className="text-3xl font-extrabold text-red-600">{result.summary.unmatched}</p>
                        </div>
                    </div>

                    <div className="card !p-0 overflow-hidden">
                        <div className="flex border-b border-slate-100 dark:border-slate-800">
                            {tabs.map(t => (
                                <button key={t.id} onClick={() => setTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold transition-all ${tab === t.id ? `text-${t.color}-600 border-b-2 border-${t.color}-500` : 'text-slate-400 hover:text-slate-600'}`}>
                                    <t.icon className="w-4 h-4" />{t.label}{t.count !== undefined && ` (${t.count})`}
                                </button>
                            ))}
                        </div>
                        <div className="p-4">
                            {tab === 'matched' && result.matched.map((m, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{m.payment.transactionId}</p>
                                        <p className="text-xs text-slate-400">{m.payment.vendorName} • {m.payment.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">₹{m.payment.amount?.toLocaleString()}</p>
                                        <p className="text-[10px] text-emerald-500 font-bold">{m.matchType}</p>
                                    </div>
                                </div>
                            ))}
                            {tab === 'suggested' && result.suggested.map((s, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                    <div>
                                        <p className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{s.payment.transactionId}</p>
                                        <p className="text-xs text-slate-400">{s.payment.vendorName} • {s.payment.invoiceNumber}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-amber-600">₹{s.payment.amount?.toLocaleString()}</p>
                                        <span className="badge-yellow text-[10px]">{s.confidence} confidence</span>
                                    </div>
                                </div>
                            ))}
                            {tab === 'unmatched' && result.unmatched.map((u, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                                    <div>
                                        <p className="text-sm text-slate-700 dark:text-slate-200">{JSON.stringify(u.bankRecord).slice(0, 80)}...</p>
                                    </div>
                                    <span className="badge-red text-[10px]">{u.reason}</span>
                                </div>
                            ))}
                            {((tab === 'matched' && !result.matched.length) || (tab === 'suggested' && !result.suggested.length) || (tab === 'unmatched' && !result.unmatched.length)) &&
                                <p className="text-center py-8 text-slate-400">No records in this category</p>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ReconciliationPage;
