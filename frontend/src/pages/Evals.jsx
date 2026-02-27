// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';

export default function Evals() {
    let [evals, setEvals] = useState([]);
    let [total, setTotal] = useState(0);
    let [loading, setLoading] = useState(true);
    let [selected, setSelected] = useState(null);
    let [detail, setDetail] = useState(null);
    let [chartType, setChartType] = useState('bar');

    useEffect(() => { loadEvals(); }, []);

    async function loadEvals() {
        setLoading(true);
        try {
            let resp = await api.evals.list({ page_size: 50 });
            setEvals(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('evals load error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function viewDetail(id) {
        setSelected(id);
        try {
            let d = await api.evals.get(id);
            setDetail(d);
        } catch (err) {
            console.error('eval detail error:', err);
        }
    }

    let passedCount = evals.filter(e => e.status === 'passed').length;
    let failedCount = evals.filter(e => e.status === 'failed').length;
    let avgScore = evals.length > 0
        ? (evals.reduce((s, e) => s + (e.overall_score || 0), 0) / evals.filter(e => e.overall_score).length).toFixed(3)
        : '--';

    return (
        <div>
            <div className="page-header">
                <h2>Evaluations</h2>
                <p className="subtitle">Benchmark results, regression detection, and safety checks</p>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <MetricCard label="Total Evals" value={total} color="var(--blue)" />
                <MetricCard label="Passed" value={passedCount} color="var(--green)" />
                <MetricCard label="Failed" value={failedCount} color="var(--red)" />
                <MetricCard label="Avg Score" value={avgScore} color="var(--purple)" />
            </div>

            {loading ? (
                <div className="loading-bar" style={{ maxWidth: 400, margin: '30px 0' }} />
            ) : evals.length === 0 ? (
                <div className="empty-state"><h3>No evaluations yet</h3><p>Run an evaluation against a registered model to see results here.</p></div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Model</th>
                            <th>Suite</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Benchmarks</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {evals.map(ev => (
                            <tr key={ev.id}>
                                <td className="mono" style={{ fontSize: 11 }}>{ev.id}</td>
                                <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{ev.model_id}</td>
                                <td><span className="tag">{ev.suite}</span></td>
                                <td><span className={`badge ${ev.status}`}>{ev.status}</span></td>
                                <td style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 13 }}>
                                    {ev.overall_score != null ? ev.overall_score.toFixed(4) : '--'}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                                    {ev.results ? ev.results.length : 0}
                                </td>
                                <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{new Date(ev.created_at).toLocaleString()}</td>
                                <td>
                                    <button className="btn btn-ghost btn-xs" onClick={() => viewDetail(ev.id)}>Inspect</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {detail && detail.results && detail.results.length > 0 && (
                <div style={{ marginTop: 28 }}>
                    <div className="section-head">
                        <h3>Eval: {selected}</h3>
                        <div style={{ display: 'flex', gap: 6 }}>
                            <button className={`btn btn-ghost btn-xs ${chartType === 'bar' ? 'active' : ''}`} onClick={() => setChartType('bar')}>Bar</button>
                            <button className={`btn btn-ghost btn-xs ${chartType === 'radar' ? 'active' : ''}`} onClick={() => setChartType('radar')}>Radar</button>
                        </div>
                    </div>

                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            {chartType === 'bar' ? (
                                <BarChart data={detail.results.filter(r => r.benchmark !== 'perplexity')} layout="vertical" margin={{ left: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.3)" />
                                    <XAxis type="number" domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 11 }} />
                                    <YAxis type="category" dataKey="benchmark" tick={{ fill: '#94a3b8', fontSize: 12 }} width={110} />
                                    <Tooltip contentStyle={{ background: '#1a2234', border: '1px solid #334155', borderRadius: 10, fontSize: 12 }} formatter={v => v.toFixed(4)} />
                                    <Bar dataKey="score" radius={[0, 4, 4, 0]} maxBarSize={20}>
                                        {detail.results.filter(r => r.benchmark !== 'perplexity').map((r, i) => (
                                            <Cell key={i} fill={r.passed ? '#10b981' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <RadarChart data={detail.results.filter(r => r.benchmark !== 'perplexity')}>
                                    <PolarGrid stroke="rgba(51,65,85,0.4)" />
                                    <PolarAngleAxis dataKey="benchmark" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                    <PolarRadiusAxis domain={[0, 1]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                                </RadarChart>
                            )}
                        </ResponsiveContainer>
                    </div>

                    <table className="data-table">
                        <thead>
                            <tr><th>Benchmark</th><th>Score</th><th>Threshold</th><th>Result</th><th>Samples</th></tr>
                        </thead>
                        <tbody>
                            {detail.results.map(r => (
                                <tr key={r.benchmark}>
                                    <td style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{r.benchmark}</td>
                                    <td className="mono" style={{ fontSize: 13 }}>{r.score.toFixed(4)}</td>
                                    <td className="mono" style={{ color: 'var(--text-dim)' }}>{r.threshold != null ? r.threshold.toFixed(2) : '--'}</td>
                                    <td><span className={`badge ${r.passed ? 'passed' : 'failed'}`}>{r.passed ? 'pass' : 'fail'}</span></td>
                                    <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.details?.samples_evaluated || '--'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
