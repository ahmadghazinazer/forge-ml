// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';

export default function Cluster() {
    let [cluster, setCluster] = useState(null);
    let [costEst, setCostEst] = useState(null);
    let [gpuInput, setGpuInput] = useState(4);
    let [hoursInput, setHoursInput] = useState(8);
    let [loading, setLoading] = useState(true);

    let load = useCallback(async () => {
        try {
            let data = await api.cluster.status();
            setCluster(data);
        } catch (err) {
            console.error('cluster load error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        let id = setInterval(load, 6000);
        return () => clearInterval(id);
    }, [load]);

    async function handleEstimate(e) {
        e.preventDefault();
        try {
            let est = await api.cluster.cost(gpuInput, hoursInput);
            setCostEst(est);
        } catch (err) {
            console.error('cost estimate failed:', err);
        }
    }

    if (loading) return (
        <div>
            <div className="page-header"><h2>Cluster</h2></div>
            <div className="loading-bar" style={{ maxWidth: 400, margin: '40px 0' }} />
        </div>
    );

    let degradedNodes = cluster.nodes.filter(n => n.status === 'degraded').length;
    let offlineNodes = cluster.nodes.filter(n => n.status === 'offline').length;

    return (
        <div>
            <div className="page-header">
                <h2>Cluster Management</h2>
                <p className="subtitle">GPU infrastructure health, utilization, and cost estimation</p>
            </div>

            <div className="metric-grid">
                <MetricCard label="Total Nodes" value={cluster.total_nodes} color="var(--blue)" />
                <MetricCard label="Healthy" value={cluster.healthy} color="var(--green)" sub={degradedNodes ? `${degradedNodes} degraded` : 'All operational'} />
                <MetricCard label="Total GPUs" value={cluster.total_gpus} color="var(--purple)" />
                <MetricCard label="Available GPUs" value={cluster.available_gpus} color="var(--cyan)" sub={`${cluster.total_gpus - cluster.available_gpus} allocated`} />
                <MetricCard label="Avg Utilization" value={`${Math.round(cluster.avg_gpu_utilization * 100)}%`} color="var(--amber)" />
                <MetricCard label="Cost Rate" value={`$${cluster.cost_per_gpu_hour}/hr`} color="var(--teal)" sub="Per GPU" />
            </div>

            <div className="section-head">
                <h3>Node Status</h3>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Refreshing every 6s</span>
            </div>

            <div className="node-grid">
                {cluster.nodes.map(n => (
                    <div className="node-card" key={n.node_id}>
                        <div className="node-header">
                            <span className="node-id">{n.node_id}</span>
                            <span className={`badge ${n.status}`}>{n.status}</span>
                        </div>
                        <div className="gpu-label">{n.gpu_count}x {n.gpu_type}</div>

                        <div style={{ marginTop: 12 }}>
                            <div className="util-row">
                                <span>GPU Utilization</span>
                                <span className="val">{Math.round(n.gpu_utilization * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="fill" style={{
                                    width: `${n.gpu_utilization * 100}%`,
                                    background: n.gpu_utilization > 0.8 ? 'var(--red)' : n.gpu_utilization > 0.5 ? 'var(--amber)' : 'var(--green)',
                                }} />
                            </div>

                            <div className="util-row">
                                <span>Memory Utilization</span>
                                <span className="val">{Math.round(n.memory_utilization * 100)}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="fill" style={{
                                    width: `${n.memory_utilization * 100}%`,
                                    background: n.memory_utilization > 0.85 ? 'var(--red)' : n.memory_utilization > 0.6 ? 'var(--amber)' : 'var(--blue)',
                                }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                            <span>Failures: {n.failure_count}</span>
                            {n.assigned_run_id && <span className="mono" style={{ color: 'var(--cyan)' }}>Run: {n.assigned_run_id.slice(0, 8)}</span>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="section-head" style={{ marginTop: 12 }}>
                <h3>Cost Estimator</h3>
            </div>

            <div className="glass-card" style={{ maxWidth: 600 }}>
                <form onSubmit={handleEstimate} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>GPUs</label>
                        <input className="input-field" type="number" min="1" max="64" value={gpuInput} onChange={e => setGpuInput(+e.target.value)} style={{ width: 80 }} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Hours</label>
                        <input className="input-field" type="number" min="0.5" step="0.5" max="720" value={hoursInput} onChange={e => setHoursInput(+e.target.value)} style={{ width: 80 }} />
                    </div>
                    <button type="submit" className="btn btn-primary">Estimate</button>
                </form>

                {costEst && (
                    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <div className="detail-item">
                            <div className="dl">GPU Cost</div>
                            <div className="dv">${costEst.gpu_cost}</div>
                        </div>
                        <div className="detail-item">
                            <div className="dl">Platform Overhead</div>
                            <div className="dv">${costEst.platform_overhead}</div>
                        </div>
                        <div className="detail-item">
                            <div className="dl">Total Estimated</div>
                            <div className="dv" style={{ color: 'var(--green)' }}>${costEst.total_estimated}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
