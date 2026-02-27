// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';

export default function Models() {
    let [models, setModels] = useState([]);
    let [total, setTotal] = useState(0);
    let [filter, setFilter] = useState('');
    let [loading, setLoading] = useState(true);

    useEffect(() => { loadModels(); }, [filter]);

    async function loadModels() {
        setLoading(true);
        try {
            let params = { page_size: 50 };
            if (filter) params.status = filter;
            let resp = await api.models.list(params);
            setModels(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('models load error:', err);
        } finally {
            setLoading(false);
        }
    }

    let statuses = ['', 'staging', 'candidate', 'production', 'archived'];

    let stagingCount = models.filter(m => m.status === 'staging').length;
    let prodCount = models.filter(m => m.status === 'production').length;

    return (
        <div>
            <div className="page-header">
                <h2>Model Registry</h2>
                <p className="subtitle">
                    {total} model{total !== 1 ? 's' : ''} registered across promotion stages
                </p>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <MetricCard label="Total Models" value={total} color="var(--blue)" />
                <MetricCard label="Staging" value={stagingCount} color="var(--amber)" />
                <MetricCard label="Production" value={prodCount} color="var(--green)" />
                <MetricCard label="Recipes Used" value={[...new Set(models.map(m => m.recipe))].length || 0} color="var(--purple)" />
            </div>

            <div className="filter-bar">
                {statuses.map(s => (
                    <button key={s} className={`btn btn-ghost btn-sm ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-bar" style={{ maxWidth: 400, margin: '30px 0' }} />
            ) : models.length === 0 ? (
                <div className="empty-state">
                    <h3>No models in registry</h3>
                    <p>Complete a training run and promote it to register a model.</p>
                </div>
            ) : (
                <div className="node-grid">
                    {models.map(m => (
                        <div className="node-card" key={m.id}>
                            <div className="node-header">
                                <span className="node-id">{m.name}</span>
                                <span className={`badge ${m.status}`}>{m.status}</span>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <span className="tag version">v{m.version}</span>
                                <span className="tag recipe">{m.recipe}</span>
                            </div>

                            <div className="util-row" style={{ marginBottom: 2 }}>
                                <span>Base Model</span>
                            </div>
                            <div className="mono" style={{ fontSize: 11, color: 'var(--text-soft)', marginBottom: 8 }}>
                                {m.base_model}
                            </div>

                            {m.description && (
                                <p style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 8 }}>
                                    {m.description}
                                </p>
                            )}

                            <div style={{ borderTop: '1px solid var(--border-dim)', paddingTop: 10, marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                    run: {m.run_id}
                                </span>
                                {m.promoted_at && (
                                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                                        {new Date(m.promoted_at).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
