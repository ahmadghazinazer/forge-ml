// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

export default function RunsTable({ runs }) {
    if (!runs || runs.length === 0) {
        return (
            <div className="empty-state">
                <h3>No training runs yet</h3>
                <p>Launch a run to get started.</p>
            </div>
        );
    }

    return (
        <table className="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Base Model</th>
                    <th>Recipe</th>
                    <th>Status</th>
                    <th>GPUs</th>
                    <th>Created</th>
                </tr>
            </thead>
            <tbody>
                {runs.map((run) => (
                    <tr key={run.id}>
                        <td style={{ fontWeight: 500 }}>{run.name}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{run.base_model}</td>
                        <td><span className="tag">{run.recipe}</span></td>
                        <td><span className={`badge ${run.status}`}>{run.status}</span></td>
                        <td>{run.num_gpus}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(run.created_at).toLocaleDateString()}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
