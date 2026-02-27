// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import RunsTable from '../components/RunsTable';

export default function Runs() {
    const [runs, setRuns] = useState([]);
    const [total, setTotal] = useState(0);
    const [selected, setSelected] = useState(null);
    const [metrics, setMetrics] = useState([]);
    const [filter, setFilter] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRuns();
    }, [filter]);

    async function loadRuns() {
        setLoading(true);
        try {
            const params = { page_size: 50 };
            if (filter) params.status = filter;
            const resp = await api.runs.list(params);
            setRuns(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('Failed to load runs:', err);
        } finally {
            setLoading(false);
        }
    }

    async function selectRun(runId) {
        setSelected(runId);
        try {
            const m = await api.runs.metrics(runId, 100);
            setMetrics(m);
        } catch (err) {
            console.error('Failed to load metrics:', err);
            setMetrics([]);
        }
    }

    const statusFilters = ['', 'running', 'completed', 'failed', 'pending'];

    return (
        <div>
            <div className="page-header">
                <h2>Training Runs</h2>
                <p>{total} run{total !== 1 ? 's' : ''} total</p>
            </div>

            <div style={{ marginBottom: 20, display: 'flex', gap: 6 }}>
                {statusFilters.map((s) => (
                    <button
                        key={s}
                        className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(s)}
                        style={{ fontSize: 12, padding: '6px 12px' }}
                    >
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : (
                <div onClick={(e) => {
                    const row = e.target.closest('tr');
                    if (!row || !runs.length) return;
                    const idx = Array.from(row.parentNode.children).indexOf(row);
                    if (idx >= 0 && runs[idx]) selectRun(runs[idx].id);
                }}>
                    <RunsTable runs={runs} />
                </div>
            )}

            {selected && metrics.length > 0 && (
                <div className="chart-container" style={{ marginTop: 24 }}>
                    <h3>Loss Curve - {selected}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={metrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis
                                dataKey="step"
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                label={{ value: 'Step', position: 'insideBottom', offset: -5, fill: '#64748b' }}
                            />
                            <YAxis
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                                label={{ value: 'Loss', angle: -90, position: 'insideLeft', fill: '#64748b' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a2234',
                                    border: '1px solid #334155',
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="loss"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, fill: '#3b82f6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
