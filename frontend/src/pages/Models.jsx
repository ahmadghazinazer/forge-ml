// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function Models() {
    const [models, setModels] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadModels();
    }, [filter]);

    async function loadModels() {
        setLoading(true);
        try {
            const params = { page_size: 50 };
            if (filter) params.status = filter;
            const resp = await api.models.list(params);
            setModels(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('Failed to load models:', err);
        } finally {
            setLoading(false);
        }
    }

    const statusOptions = ['', 'staging', 'candidate', 'production', 'archived'];

    return (
        <div>
            <div className="page-header">
                <h2>Model Registry</h2>
                <p>{total} model{total !== 1 ? 's' : ''} registered</p>
            </div>

            <div style={{ marginBottom: 20, display: 'flex', gap: 6 }}>
                {statusOptions.map((s) => (
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
            ) : models.length === 0 ? (
                <div className="empty-state">
                    <h3>No models yet</h3>
                    <p>Promote a completed run to add a model to the registry.</p>
                </div>
            ) : (
                <div className="node-grid">
                    {models.map((m) => (
                        <div className="node-card" key={m.id}>
                            <div className="node-header">
                                <span className="node-id">{m.name}</span>
                                <span className={`badge ${m.status}`}>{m.status}</span>
                            </div>
                            <div style={{ marginBottom: 8 }}>
                                <span className="tag">v{m.version}</span>
                                <span className="tag">{m.recipe}</span>
                            </div>
                            <div className="detail-item" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                                <div className="dl">Base Model</div>
                                <div className="dv" style={{ fontSize: 12 }}>{m.base_model}</div>
                            </div>
                            {m.description && (
                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                                    {m.description}
                                </p>
                            )}
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                                From run: {m.run_id}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
