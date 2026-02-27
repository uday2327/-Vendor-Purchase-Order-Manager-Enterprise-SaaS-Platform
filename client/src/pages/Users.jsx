import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Search, Edit2, Trash2, ShieldCheck, Key, UserCog } from 'lucide-react';
import toast from 'react-hot-toast';

const roleBadge = { admin: 'badge-red', manager: 'badge-blue', accountant: 'badge-green', viewer: 'badge-slate' };

const Users = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
    const [saving, setSaving] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [resetModal, setResetModal] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/users', { params: { search, page, limit: 10 } });
            setUsers(data.users); setTotal(data.total); setPages(data.pages);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [page, search]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email) { toast.error('Name and email required'); return; }
        if (!editing && !form.password) { toast.error('Password required for new users'); return; }
        setSaving(true);
        try {
            if (editing) { await api.put(`/users/${editing._id}`, form); toast.success('User updated'); }
            else { await api.post('/users', form); toast.success('User created'); }
            setModalOpen(false); fetchUsers();
        } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        try { await api.delete(`/users/${deleteId}`); toast.success('User deleted'); setDeleteId(null); fetchUsers(); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    };

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) { toast.error('Min 6 characters'); return; }
        try { await api.post(`/users/${resetModal._id}/reset-password`, { newPassword }); toast.success('Password reset'); setResetModal(null); setNewPassword(''); }
        catch { toast.error('Reset failed'); }
    };

    const openEdit = (u) => { setEditing(u); setForm({ name: u.name, email: u.email, role: u.role }); setModalOpen(true); };
    const openCreate = () => { setEditing(null); setForm({ name: '', email: '', password: '', role: 'viewer' }); setModalOpen(true); };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="page-title flex items-center gap-2"><UserCog className="w-6 h-6 text-primary-500" />User Management</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage accounts & roles ({total} users)</p>
                </div>
                <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />Add User</button>
            </div>

            <div className="card !p-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
                </div>
            </div>

            <div className="card !p-0 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50/80 dark:bg-surface-900/50 border-b border-slate-100 dark:border-slate-800">
                            <th className="table-header">User</th>
                            <th className="table-header">Role</th>
                            <th className="table-header">2FA</th>
                            <th className="table-header">Joined</th>
                            <th className="table-header text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {loading ? [...Array(5)].map((_, i) => (
                            <tr key={i}><td className="table-cell" colSpan={5}><div className="skeleton h-10 w-full" /></td></tr>
                        )) : users.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-12 text-slate-400">No users found</td></tr>
                        ) : users.map((u, idx) => (
                            <tr key={u._id} className="table-row animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
                                <td className="table-cell">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">{u.name?.charAt(0)}</div>
                                        <div>
                                            <p className="font-semibold text-slate-800 dark:text-white text-sm">{u.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="table-cell"><span className={roleBadge[u.role] || 'badge-slate'}>{u.role}</span></td>
                                <td className="table-cell">{u.enable2FA ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : <span className="text-xs text-slate-400">Off</span>}</td>
                                <td className="table-cell text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button onClick={() => openEdit(u)} className="btn-ghost !p-2" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                        <button onClick={() => setResetModal(u)} className="btn-ghost !p-2" title="Reset Password"><Key className="w-4 h-4" /></button>
                                        <button onClick={() => setDeleteId(u._id)} className="btn-ghost !p-2 hover:!text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {pages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-sm text-slate-500">Page {page} of {pages}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Prev</button>
                            <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page === pages} className="btn-ghost !py-1.5 !px-3 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create/Edit */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'Create User'}>
                <form onSubmit={handleSave} className="space-y-4">
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Name *</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
                    {!editing && <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Password *</label><input type="password" value={form.password || ''} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" /></div>}
                    <div><label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Role</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="select-field">
                            <option value="admin">Admin</option><option value="manager">Manager</option><option value="accountant">Accountant</option><option value="viewer">Viewer</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-3">
                        <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </Modal>

            {/* Delete */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete User" size="sm">
                <p className="text-slate-600 dark:text-slate-300 mb-6">This action cannot be undone.</p>
                <div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button><button onClick={handleDelete} className="btn-danger">Delete</button></div>
            </Modal>

            {/* Reset Password */}
            <Modal isOpen={!!resetModal} onClose={() => { setResetModal(null); setNewPassword(''); }} title="Reset Password" size="sm">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Reset password for <strong>{resetModal?.name}</strong></p>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input-field" placeholder="New password (min 6 chars)" />
                <div className="flex justify-end gap-3 mt-4"><button onClick={() => setResetModal(null)} className="btn-secondary">Cancel</button><button onClick={handleResetPassword} className="btn-primary">Reset</button></div>
            </Modal>
        </div>
    );
};

export default Users;
