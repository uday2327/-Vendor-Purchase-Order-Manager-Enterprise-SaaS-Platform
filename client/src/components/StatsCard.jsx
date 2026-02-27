import { useEffect, useRef, useState } from 'react';

const AnimatedCounter = ({ value, duration = 800 }) => {
    const [display, setDisplay] = useState(0);
    const prevRef = useRef(0);

    useEffect(() => {
        const start = prevRef.current;
        const end = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0;
        const isString = typeof value === 'string';

        if (isNaN(end)) {
            setDisplay(value);
            return;
        }

        const startTime = performance.now();
        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);
            setDisplay(current);
            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                setDisplay(end);
                prevRef.current = end;
            }
        };
        requestAnimationFrame(tick);
    }, [value, duration]);

    if (typeof value === 'string') {
        return <>{display === parseFloat(String(value).replace(/[^0-9.-]/g, '')) ? value : display}</>;
    }

    return <>{display.toLocaleString()}</>;
};

const StatsCard = ({ title, value, icon: Icon, trend, color = 'blue', delay = 0 }) => {
    const colorMap = {
        blue: {
            iconBg: 'bg-blue-100/60 dark:bg-blue-500/10',
            iconText: 'text-blue-600 dark:text-blue-400',
            trendText: 'text-blue-600 dark:text-blue-400',
        },
        green: {
            iconBg: 'bg-emerald-100/60 dark:bg-emerald-500/10',
            iconText: 'text-emerald-600 dark:text-emerald-400',
            trendText: 'text-emerald-600 dark:text-emerald-400',
        },
        amber: {
            iconBg: 'bg-amber-100/60 dark:bg-amber-500/10',
            iconText: 'text-amber-600 dark:text-amber-400',
            trendText: 'text-amber-600 dark:text-amber-400',
        },
        red: {
            iconBg: 'bg-red-100/60 dark:bg-red-500/10',
            iconText: 'text-red-600 dark:text-red-400',
            trendText: 'text-red-600 dark:text-red-400',
        },
        purple: {
            iconBg: 'bg-purple-100/60 dark:bg-purple-500/10',
            iconText: 'text-purple-600 dark:text-purple-400',
            trendText: 'text-purple-600 dark:text-purple-400',
        },
        slate: {
            iconBg: 'bg-slate-100/60 dark:bg-slate-500/10',
            iconText: 'text-slate-600 dark:text-slate-400',
            trendText: 'text-slate-600 dark:text-slate-400',
        },
    };

    const c = colorMap[color] || colorMap.blue;

    return (
        <div
            className="card-hover group animate-slide-up"
            style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-1.5">
                    <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{title}</p>
                    <p className="text-[26px] font-extrabold text-slate-800 dark:text-white tracking-tight leading-none" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        <AnimatedCounter value={value} />
                    </p>
                    {trend && (
                        <p className={`text-xs font-semibold ${c.trendText} mt-1`}>{trend}</p>
                    )}
                </div>
                <div className={`w-11 h-11 ${c.iconBg} rounded-xl flex items-center justify-center group-hover:scale-105 transition-all duration-300`}>
                    {Icon && <Icon className={`w-5 h-5 ${c.iconText}`} />}
                </div>
            </div>
        </div>
    );
};

export default StatsCard;
