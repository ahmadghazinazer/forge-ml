// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    AreaChart, Area,
} from 'recharts';
import { api } from '../api/client';

export default function Runs() {
    let [runs, setRuns] = useState([]);
    let [total, setTotal] = useState(0);
    let [filter, setFilter] = useState('');
    let [selected, setSelected] = useState(null);
    let [metrics, setMetrics] = useState([]);
    let [runDetail, setRunDetail] = useState(null);
    let [loading, setLoading] = useState(true);
    let [tab, setTab] = useState('loss');

    let load = useCallback(async () => {
        try {
            let params = { page_size: 50 };
            if (filter) params.status = filter;
            let resp = await api.runs.list(params);
            setRuns(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('runs load error:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { load(); }, [load]);

    async function selectRun(run) {
        setSelected(run.id);
        setRunDetail(run);
        try {
            let m = await api.runs.metrics(run.id, 200);
            setMetrics(m || []);
        } catch (err) {
            setMetrics([]);
        }
    }

    let statuses = ['', 'running', 'completed', 'failed', 'pending', 'cancelled'];

    return (
        <div>
            <div className="page-header">
                <h2>Training Runs</h2>
                <p className="subtitle">{total} run{total !== 1 ? 's' : ''} -- click a row to inspect metrics</p>
            </div>

            <div className="filter-bar">
                {statuses.map(s => (
                    <button key={s} className={`btn btn-ghost btn-sm ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-bar" style={{ maxWidth: 500, margin: '30px 0' }} />
            ) : runs.length === 0 ? (
                <div className="empty-state"><h3>No runs match this filter</h3></div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Base Model</th>
                            <th>Recipe</th>
                            <th>Status</th>
                            <th>GPUs</th>
                            <th>Retries</th>
                            <th>Created</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map(r => (
                            <tr key={r.id} onClick={() => selectRun(r)} style={{ cursor: 'pointer' }}>
                                <td style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{r.name}</td>
                                <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.base_model}</td>
                                <td><span className="tag recipe">{r.recipe}</span></td>
                                <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.num_gpus}x</td>
                                <td style={{ fontSize: 12, color: r.retry_count > 0 ? 'var(--amber)' : 'var(--text-dim)' }}>{r.retry_count || 0}</td>
                                <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(r.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {selected && runDetail && (
                <div style={{ marginTop: 28 }}>
                    <div className="section-head">
                        <h3>Run: {runDetail.name}</h3>
                        <span className={`badge ${runDetail.status}`}>{runDetail.status}</span>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-item"><div className="dl">Run ID</div><div className="dv mono">{runDetail.id}</div></div>
                        <div className="detail-item"><div className="dl">Base Model</div><div className="dv">{runDetail.base_model}</div></div>
                        <div className="detail-item"><div className="dl">Recipe</div><div className="dv">{runDetail.recipe}</div></div>
                        <div className="detail-item"><div className="dl">Dataset</div><div className="dv mono">{runDetail.dataset_id}</div></div>
                        <div className="detail-item"><div className="dl">GPUs</div><div className="dv">{runDetail.num_gpus}</div></div>
                        <div className="detail-item"><div className="dl">Priority</div><div className="dv">{runDetail.priority}</div></div>
                    </div>

                    {metrics.length > 0 && (
                        <>
                            <div className="tabs">
                                {['loss', 'lr', 'gpu_mem', 'throughput'].map(t => (
                                    <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                                        {t === 'loss' ? 'Loss' : t === 'lr' ? 'Learning Rate' : t === 'gpu_mem' ? 'GPU Memory' : 'Throughput'}
                                    </button>
                                ))}
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={320}>
                                    {tab === 'loss' ? (
                                        <AreaChart data={metrics}>
                                            <defs><linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                            <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                                            <Area type="monotone" dataKey="loss" stroke="#3b82f6" strokeWidth={2} fill="url(#lossGrad)" dot={false} activeDot={{ r: 4 }} />
                                        </AreaChart>
                                    ) : tab === 'lr' ? (
                                        <LineChart data={metrics}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                            <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => v.toExponential(1)} />
                                            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                                            <Line type="monotone" dataKey="learning_rate" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    ) : tab === 'gpu_mem' ? (
                                        <AreaChart data={metrics}>
                                            <defs><linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient></defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                            <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" MB" />
                                            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                                            <Area type="monotone" dataKey="gpu_memory_mb" stroke="#f59e0b" strokeWidth={2} fill="url(#memGrad)" dot={false} />
                                        </AreaChart>
                                    ) : (
                                        <LineChart data={metrics}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                            <XAxis dataKey="step" tick={{ fill: '#64748b', fontSize: 11 }} />
                                            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" s/s" />
                                            <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} />
                                            <Line type="monotone" dataKey="throughput_samples_sec" stroke="#10b981" strokeWidth={2} dot={false} />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}

                    {runDetail.tags && runDetail.tags.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            {runDetail.tags.map(t => <span className="tag" key={t}>{t}</span>)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
