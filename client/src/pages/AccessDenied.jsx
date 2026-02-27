import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AccessDenied = () => {
    const navigate = useNavigate();
    const { role } = useAuth();

    return (
        <div className="min-h-[70vh] flex items-center justify-center animate-fade-in">
            <div className="text-center space-y-6 max-w-md mx-auto">
                {/* Icon */}
                <div className="w-24 h-24 bg-red-100/60 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto animate-scale-in">
                    <ShieldOff className="w-12 h-12 text-red-500 dark:text-red-400" />
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white">
                        Access Denied
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        Your role <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">{role}</span> does not have permission to view this page.
                    </p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs">
                        Contact your administrator to request access.
                    </p>
                </div>

                {/* Action */}
                <button
                    onClick={() => navigate('/')}
                    className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default AccessDenied;
