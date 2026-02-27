// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

export default function EvalChart({ results }) {
    if (!results || results.length === 0) return null;

    const data = results.map((r) => ({
        name: r.benchmark,
        score: r.score,
        threshold: r.threshold || 0,
        fill: r.passed ? '#10b981' : '#ef4444',
    }));

    return (
        <div className="chart-container">
            <h3>Benchmark Scores</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data} layout="vertical" margin={{ left: 100 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        width={90}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1a2234',
                            border: '1px solid #334155',
                            borderRadius: 8,
                            fontSize: 12,
                        }}
                        formatter={(val) => val.toFixed(4)}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {data.map((entry, idx) => (
                            <rect key={idx} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
