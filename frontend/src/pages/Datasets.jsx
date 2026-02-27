// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';

export default function Datasets() {
    let [datasets, setDatasets] = useState([]);
    let [total, setTotal] = useState(0);
    let [loading, setLoading] = useState(true);
    let [search, setSearch] = useState('');
    let [selected, setSelected] = useState(null);
    let [lineage, setLineage] = useState([]);

    useEffect(() => { loadDatasets(); }, []);

    async function loadDatasets(name) {
        setLoading(true);
        try {
            let params = { page_size: 50 };
            if (name) params.name = name;
            let resp = await api.datasets.list(params);
            setDatasets(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('datasets load error:', err);
        } finally {
            setLoading(false);
        }
    }

    async function viewLineage(ds) {
        setSelected(ds);
        try {
            let chain = await api.datasets.lineage(ds.id);
            setLineage(chain);
        } catch (err) {
            setLineage([]);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        loadDatasets(search || undefined);
    }

    let totalRows = datasets.reduce((sum, d) => sum + (d.row_count || 0), 0);
    let piiChecked = datasets.filter(d => d.pii_checked).length;

    return (
        <div>
            <div className="page-header">
                <h2>Datasets</h2>
                <p className="subtitle">
                    {total} dataset{total !== 1 ? 's' : ''} registered -- {totalRows.toLocaleString()} total rows
                </p>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <MetricCard label="Total Datasets" value={total} color="var(--blue)" />
                <MetricCard label="Total Rows" value={totalRows >= 1000 ? `${(totalRows / 1000).toFixed(0)}k` : totalRows} color="var(--cyan)" />
                <MetricCard label="PII Cleared" value={piiChecked} color="var(--green)" sub={`${total - piiChecked} unchecked`} />
                <MetricCard label="Formats" value={[...new Set(datasets.map(d => d.format))].length} color="var(--purple)" />
            </div>

            <form onSubmit={handleSearch} style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
                <input
                    className="input-field"
                    type="text"
                    placeholder="Search datasets by name..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: 1, maxWidth: 360 }}
                />
                <button type="submit" className="btn btn-ghost">Search</button>
            </form>

            {loading ? (
                <div className="loading-bar" style={{ maxWidth: 500, margin: '30px 0' }} />
            ) : datasets.length === 0 ? (
                <div className="empty-state"><h3>No datasets found</h3><p>Register a dataset to get started.</p></div>
            ) : (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Version</th>
                            <th>Format</th>
                            <th>Rows</th>
                            <th>License</th>
                            <th>PII Status</th>
                            <th>Tags</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {datasets.map(ds => (
                            <tr key={ds.id}>
                                <td style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{ds.name}</td>
                                <td><span className="tag version">v{ds.version}</span></td>
                                <td className="mono" style={{ fontSize: 11 }}>{ds.format}</td>
                                <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{ds.row_count ? ds.row_count.toLocaleString() : '--'}</td>
                                <td style={{ fontSize: 12, color: 'var(--text-soft)' }}>{ds.license}</td>
                                <td>
                                    <span className={`badge ${ds.pii_checked ? 'passed' : 'pending'}`}>
                                        {ds.pii_checked ? 'cleared' : 'unchecked'}
                                    </span>
                                </td>
                                <td>{(ds.tags || []).map(t => <span className="tag" key={t}>{t}</span>)}</td>
                                <td>
                                    <button className="btn btn-ghost btn-xs" onClick={() => viewLineage(ds)}>Lineage</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {selected && (
                <div style={{ marginTop: 24 }}>
                    <div className="section-head">
                        <h3>Dataset: {selected.name}</h3>
                    </div>
                    <div className="detail-grid">
                        <div className="detail-item"><div className="dl">ID</div><div className="dv mono">{selected.id}</div></div>
                        <div className="detail-item"><div className="dl">Source</div><div className="dv mono" style={{ fontSize: 11 }}>{selected.source_path}</div></div>
                        <div className="detail-item"><div className="dl">Description</div><div className="dv" style={{ fontSize: 12, color: 'var(--text-soft)' }}>{selected.description || '--'}</div></div>
                        <div className="detail-item"><div className="dl">Checksum</div><div className="dv mono" style={{ fontSize: 11 }}>{selected.checksum || '--'}</div></div>
                    </div>

                    {lineage.length > 1 && (
                        <div className="glass-card" style={{ marginTop: 12 }}>
                            <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)', marginBottom: 12 }}>Lineage Chain</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                {lineage.map((l, i) => (
                                    <span key={l.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                                        <span className="tag version">{l.name} v{l.version}</span>
                                        {i < lineage.length - 1 && <span style={{ color: 'var(--text-dim)' }}>&larr;</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
