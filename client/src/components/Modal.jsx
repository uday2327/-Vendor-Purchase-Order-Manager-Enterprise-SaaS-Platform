import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAnimating(true);
            requestAnimationFrame(() => setVisible(true));
        } else {
            setVisible(false);
            const timer = setTimeout(() => setAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!animating && !isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Slide-over panel */}
            <div
                className={`relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl w-full ${sizeClasses[size]} h-full flex flex-col border-l border-white/40 dark:border-slate-700/30 shadow-2xl transition-transform duration-300 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100/60 dark:border-slate-800/50 shrink-0">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100/70 dark:hover:bg-slate-800/40 rounded-xl transition-all duration-200 group"
                    >
                        <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
