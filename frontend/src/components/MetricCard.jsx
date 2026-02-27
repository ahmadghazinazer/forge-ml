// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

export default function MetricCard({ label, value, sub, color = 'var(--blue)', trend }) {
    return (
        <div className="metric-card">
            <div className="accent-bar" style={{ background: color }} />
            <div className="label">{label}</div>
            <div className="value">{value}</div>
            {trend && (
                <div className={`trend ${trend.dir}`}>
                    {trend.dir === 'up' ? '+' : trend.dir === 'down' ? '-' : ''}{trend.text}
                </div>
            )}
            {sub && <div className="sub">{sub}</div>}
        </div>
    );
}
