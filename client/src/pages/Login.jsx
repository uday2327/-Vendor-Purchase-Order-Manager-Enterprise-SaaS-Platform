import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Package, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';
import toast from 'react-hot-toast';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login, setAuthData } = useAuth();
    const { palette } = useTheme();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Login successful!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const { data } = await api.post('/auth/google-login', {
                credential: credentialResponse.credential,
            });
            setAuthData(data.token, data.user);
            toast.success('Google login successful!');
            navigate('/');
        } catch (error) {
            const msg = error.response?.data?.message || 'Google login failed';
            toast.error(msg);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden relative">

            {/* ── Animated Background ── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] animate-float-slow"
                    style={{ backgroundColor: `${palette.hex500}12` }}
                />
                <div
                    className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] animate-float-slower"
                    style={{ backgroundColor: `${palette.hex400}0d` }}
                />
                <div
                    className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full blur-[80px] animate-float-reverse"
                    style={{ backgroundColor: `${palette.hex500}0a` }}
                />

                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px',
                    }}
                />
            </div>

            {/* ── Main Container ── */}
            <div className="relative w-full max-w-[420px] animate-login-appear">

                {/* Logo + Brand */}
                <div className="text-center mb-8 animate-login-slide-down" style={{ animationDelay: '0.1s' }}>
                    <div
                        className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-2xl mb-5 animate-login-logo-pulse"
                        style={{ background: `linear-gradient(135deg, ${palette.hex500}, ${palette.hex600})`, boxShadow: `0 20px 40px -10px ${palette.hex500}50` }}
                    >
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-[26px] font-extrabold text-white tracking-tight">
                        Vendor & PO Manager
                    </h1>
                    <p className="text-slate-500 mt-1.5 text-sm font-medium">
                        Sign in to your dashboard
                    </p>
                </div>

                {/* Card */}
                <div className="bg-slate-800/80 backdrop-blur-2xl rounded-[24px] border border-slate-700/50 p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] animate-login-slide-up" style={{ animationDelay: '0.2s' }}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="animate-login-field" style={{ animationDelay: '0.3s' }}>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Email Address
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10">
                                    <Mail className="w-[17px] h-[17px] text-slate-500 group-focus-within:text-primary-400 transition-colors duration-300" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@vendor.com"
                                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900/70 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 text-sm"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="animate-login-field" style={{ animationDelay: '0.4s' }}>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-11 flex items-center justify-center pointer-events-none z-10">
                                    <Lock className="w-[17px] h-[17px] text-slate-500 group-focus-within:text-primary-400 transition-colors duration-300" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900/70 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-0 bottom-0 w-11 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="animate-login-field" style={{ animationDelay: '0.5s' }}>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 text-white font-bold text-sm rounded-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2 group relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${palette.hex600}, ${palette.hex500})`,
                                    boxShadow: `0 10px 30px -5px ${palette.hex500}40`,
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span className="relative">Sign In</span>
                                        <ArrowRight className="w-4 h-4 relative group-hover:translate-x-1 transition-transform duration-300" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Google OAuth */}
                    {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                        <div className="animate-login-field" style={{ animationDelay: '0.6s' }}>
                            <div className="flex items-center gap-3 my-6">
                                <div className="flex-1 h-px bg-slate-700/50" />
                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">or</span>
                                <div className="flex-1 h-px bg-slate-700/50" />
                            </div>
                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => toast.error('Google sign-in failed')}
                                    shape="pill"
                                    size="large"
                                    text="signin_with"
                                    theme="filled_black"
                                    width="350"
                                />
                            </div>
                            <p className="text-[10px] text-slate-600 text-center mt-2">
                                Google login for pre-registered accounts only
                            </p>
                        </div>
                    )}

                    {/* Demo credentials */}
                    <div className="animate-login-field" style={{ animationDelay: '0.7s' }}>
                        <div className="mt-6 pt-5 border-t border-slate-700/50">
                            <div className="flex items-center gap-3 bg-slate-900/40 rounded-xl px-4 py-3 border border-slate-700/40">
                                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                                    <Lock className="w-3.5 h-3.5 text-primary-400/70" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Demo Credentials</p>
                                    <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                                        admin@vendor.com / admin123
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-[11px] text-slate-600 mt-6 animate-login-field" style={{ animationDelay: '0.8s' }}>
                    Vendor & PO Manager • Procurement Intelligence Platform
                </p>
            </div>
        </div>
    );
};

export default Login;
