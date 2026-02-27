// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect, useCallback } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';

const POLL_INTERVAL = 5000;

export default function Dashboard() {
    let [stats, setStats] = useState(null);
    let [runs, setRuns] = useState([]);
    let [cluster, setCluster] = useState(null);
    let [activity, setActivity] = useState([]);
    let [loading, setLoading] = useState(true);

    let fetchAll = useCallback(async () => {
        try {
            let [runsR, dsR, modR, evR, clR] = await Promise.all([
                api.runs.list({ page_size: 10 }),
                api.datasets.list({ page_size: 1 }),
                api.models.list({ page_size: 1 }),
                api.evals.list({ page_size: 1 }),
                api.cluster.status(),
            ]);
            setRuns(runsR.items || []);
            setCluster(clR);
            setStats({
                datasets: dsR.total || 0,
                runs: runsR.total || 0,
                models: modR.total || 0,
                evals: evR.total || 0,
                gpus: clR.total_gpus,
                gpuFree: clR.available_gpus,
            });

            let feed = [];
            (runsR.items || []).slice(0, 6).forEach(r => {
                feed.push({
                    id: r.id,
                    color: r.status === 'completed' ? 'var(--green)' : r.status === 'running' ? 'var(--blue)' : r.status === 'failed' ? 'var(--red)' : 'var(--amber)',
                    title: `${r.name} -- ${r.status}`,
                    time: timeSince(r.created_at),
                    type: 'run',
                });
            });
            setActivity(feed);
        } catch (err) {
            console.error('dashboard fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        let id = setInterval(fetchAll, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchAll]);

    if (loading) return <LoadingState />;

    let runningCount = runs.filter(r => r.status === 'running').length;
    let completedCount = runs.filter(r => r.status === 'completed').length;

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p className="subtitle">
                    Real-time overview of your post-training infrastructure
                </p>
                <div className="header-actions">
                    <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                        Auto-refreshing every {POLL_INTERVAL / 1000}s
                    </span>
                </div>
            </div>

            <div className="metric-grid">
                <MetricCard label="Datasets" value={stats.datasets} color="var(--blue)" sub="Registered" />
                <MetricCard label="Active Runs" value={runningCount} color="var(--cyan)" sub={`${completedCount} completed`} />
                <MetricCard label="Models" value={stats.models} color="var(--green)" sub="In registry" />
                <MetricCard label="Evaluations" value={stats.evals} color="var(--purple)" sub="Total" />
                <MetricCard label="GPU Nodes" value={cluster ? cluster.total_nodes : 0} color="var(--teal)" sub={`${cluster?.healthy || 0} healthy`} />
                <MetricCard label="GPUs Available" value={`${stats.gpuFree}/${stats.gpus}`} color="var(--amber)" sub={`${Math.round((cluster?.avg_gpu_utilization || 0) * 100)}% avg load`} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
                <div>
                    <div className="section-head">
                        <h3>Recent Training Runs</h3>
                    </div>
                    {runs.length === 0 ? (
                        <div className="empty-state" style={{ padding: 32 }}><h3>No runs yet</h3></div>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Run</th>
                                    <th>Model</th>
                                    <th>Recipe</th>
                                    <th>Status</th>
                                    <th>GPUs</th>
                                    <th>Started</th>
                                </tr>
                            </thead>
                            <tbody>
                                {runs.slice(0, 8).map(r => (
                                    <tr key={r.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-bright)' }}>{r.name}</td>
                                        <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{r.base_model.split('/').pop()}</td>
                                        <td><span className="tag recipe">{r.recipe}</span></td>
                                        <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                                        <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.num_gpus}x</td>
                                        <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{timeSince(r.created_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div>
                    <div className="section-head">
                        <h3>Activity</h3>
                    </div>
                    <div className="glass-card" style={{ padding: 16 }}>
                        <div className="activity-feed">
                            {activity.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-dim)', fontSize: 13 }}>No recent activity</div>
                            ) : activity.map((item, i) => (
                                <div className="activity-item" key={i}>
                                    <div className="activity-dot" style={{ background: item.color }} />
                                    <div className="activity-content">
                                        <div className="title">{item.title}</div>
                                        <div className="time">{item.time}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {cluster && (
                        <div className="glass-card" style={{ marginTop: 16, padding: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-soft)', marginBottom: 12 }}>Cluster Health</div>
                            {cluster.nodes.slice(0, 4).map(n => (
                                <div key={n.node_id} style={{ marginBottom: 10 }}>
                                    <div className="util-row">
                                        <span>{n.node_id}</span>
                                        <span className="val">{n.gpu_type}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="fill"
                                            style={{
                                                width: `${n.gpu_utilization * 100}%`,
                                                background: n.gpu_utilization > 0.8 ? 'var(--red)' : n.gpu_utilization > 0.5 ? 'var(--amber)' : 'var(--green)',
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p className="subtitle">Loading platform data...</p>
            </div>
            <div className="loading-bar" style={{ maxWidth: 400, margin: '40px 0' }} />
        </div>
    );
}

function timeSince(dateStr) {
    if (!dateStr) return '--';
    let seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    let mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    let hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}
