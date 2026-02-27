// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

export default function MetricCard({ label, value, sub, color = 'blue' }) {
    return (
        <div className={`metric-card ${color}`}>
            <div className="label">{label}</div>
            <div className="value">{value}</div>
            {sub && <div className="sub">{sub}</div>}
        </div>
    );
}
