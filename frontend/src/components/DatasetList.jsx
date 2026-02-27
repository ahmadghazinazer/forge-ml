// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

export default function DatasetList({ datasets }) {
    if (!datasets || datasets.length === 0) {
        return (
            <div className="empty-state">
                <h3>No datasets registered</h3>
                <p>Register a dataset to begin.</p>
            </div>
        );
    }

    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Version</th>
                    <th>Format</th>
                    <th>Rows</th>
                    <th>License</th>
                    <th>PII</th>
                    <th>Tags</th>
                </tr>
            </thead>
            <tbody>
                {datasets.map((ds) => (
                    <tr key={ds.id}>
                        <td style={{ fontWeight: 500 }}>{ds.name}</td>
                        <td><span className="tag">{ds.version}</span></td>
                        <td style={{ fontSize: 12 }}>{ds.format}</td>
                        <td>{ds.row_count ? ds.row_count.toLocaleString() : '—'}</td>
                        <td style={{ fontSize: 12 }}>{ds.license}</td>
                        <td>
                            <span className={`badge ${ds.pii_checked ? 'passed' : 'pending'}`}>
                                {ds.pii_checked ? 'cleared' : 'unchecked'}
                            </span>
                        </td>
                        <td>
                            {(ds.tags || []).map((t) => (
                                <span className="tag" key={t}>{t}</span>
                            ))}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
