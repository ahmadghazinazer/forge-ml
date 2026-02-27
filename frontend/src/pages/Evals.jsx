// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import EvalChart from '../components/EvalChart';

export default function Evals() {
    const [evals, setEvals] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        loadEvals();
    }, []);

    async function loadEvals() {
        setLoading(true);
        try {
            const resp = await api.evals.list({ page_size: 50 });
            setEvals(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('Failed to load evals:', err);
        } finally {
            setLoading(false);
        }
    }

    async function viewDetail(evalId) {
        setSelected(evalId);
        try {
            const d = await api.evals.get(evalId);
            setDetail(d);
        } catch (err) {
            console.error('Failed to load eval detail:', err);
        }
    }

    return (
        <div>
            <div className="page-header">
                <h2>Evaluations</h2>
                <p>{total} evaluation{total !== 1 ? 's' : ''} total</p>
            </div>

            {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : evals.length === 0 ? (
                <div className="empty-state">
                    <h3>No evaluations yet</h3>
                    <p>Run an evaluation against a registered model.</p>
                </div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Model</th>
                            <th>Suite</th>
                            <th>Status</th>
                            <th>Score</th>
                            <th>Created</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {evals.map((ev) => (
                            <tr key={ev.id}>
                                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{ev.id}</td>
                                <td style={{ fontSize: 12 }}>{ev.model_id}</td>
                                <td><span className="tag">{ev.suite}</span></td>
                                <td><span className={`badge ${ev.status}`}>{ev.status}</span></td>
                                <td style={{ fontWeight: 600 }}>
                                    {ev.overall_score != null ? ev.overall_score.toFixed(4) : '—'}
                                </td>
                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    {new Date(ev.created_at).toLocaleDateString()}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-secondary"
                                        style={{ fontSize: 11, padding: '4px 10px' }}
                                        onClick={() => viewDetail(ev.id)}
                                    >
                                        Detail
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {detail && detail.results && detail.results.length > 0 && (
                <div style={{ marginTop: 24 }}>
                    <h3 className="section-title">Eval: {selected}</h3>
                    <EvalChart results={detail.results} />

                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Benchmark</th>
                                <th>Score</th>
                                <th>Threshold</th>
                                <th>Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detail.results.map((r) => (
                                <tr key={r.benchmark}>
                                    <td style={{ fontWeight: 500 }}>{r.benchmark}</td>
                                    <td style={{ fontFamily: 'monospace' }}>{r.score.toFixed(4)}</td>
                                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                        {r.threshold != null ? r.threshold.toFixed(2) : '—'}
                                    </td>
                                    <td>
                                        <span className={`badge ${r.passed ? 'passed' : 'failed'}`}>
                                            {r.passed ? 'pass' : 'fail'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
