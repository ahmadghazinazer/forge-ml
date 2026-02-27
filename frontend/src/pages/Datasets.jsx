// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import DatasetList from '../components/DatasetList';

export default function Datasets() {
    const [datasets, setDatasets] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadDatasets();
    }, []);

    async function loadDatasets(name) {
        setLoading(true);
        try {
            const params = { page_size: 50 };
            if (name) params.name = name;
            const resp = await api.datasets.list(params);
            setDatasets(resp.items || []);
            setTotal(resp.total || 0);
        } catch (err) {
            console.error('Failed to load datasets:', err);
        } finally {
            setLoading(false);
        }
    }

    function handleSearch(e) {
        e.preventDefault();
        loadDatasets(search || undefined);
    }

    return (
        <div>
            <div className="page-header">
                <h2>Datasets</h2>
                <p>{total} dataset{total !== 1 ? 's' : ''} registered</p>
            </div>

            <form onSubmit={handleSearch} style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        flex: 1,
                        maxWidth: 320,
                        padding: '8px 12px',
                        fontSize: 13,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        outline: 'none',
                    }}
                />
                <button type="submit" className="btn btn-secondary">Search</button>
            </form>

            {loading ? (
                <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : (
                <DatasetList datasets={datasets} />
            )}
        </div>
    );
}
