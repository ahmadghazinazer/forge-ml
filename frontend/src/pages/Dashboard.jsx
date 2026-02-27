// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState, useEffect } from 'react';
import { api } from '../api/client';
import MetricCard from '../components/MetricCard';
import RunsTable from '../components/RunsTable';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [runs, setRuns] = useState([]);
    const [cluster, setCluster] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [runsResp, datasetsResp, modelsResp, evalsResp, clusterResp] = await Promise.all([
                    api.runs.list({ page_size: 5 }),
                    api.datasets.list({ page_size: 1 }),
                    api.models.list({ page_size: 1 }),
                    api.evals.list({ page_size: 1 }),
                    api.cluster.status(),
                ]);

                setRuns(runsResp.items || []);
                setCluster(clusterResp);
                setStats({
                    datasets: datasetsResp.total || 0,
                    runs: runsResp.total || 0,
                    models: modelsResp.total || 0,
                    evals: evalsResp.total || 0,
                });
            } catch (err) {
                console.error('Failed to load dashboard:', err);
                setStats({ datasets: 0, runs: 0, models: 0, evals: 0 });
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) {
        return (
            <div>
                <div className="page-header">
                    <h2>Dashboard</h2>
                    <p>Loading platform overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Platform overview and recent activity</p>
            </div>

            <div className="metric-grid">
                <MetricCard label="Datasets" value={stats.datasets} color="blue" sub="Registered" />
                <MetricCard label="Training Runs" value={stats.runs} color="purple" sub="Total" />
                <MetricCard label="Models" value={stats.models} color="green" sub="In Registry" />
                <MetricCard label="Evaluations" value={stats.evals} color="amber" sub="Completed" />
            </div>

            {cluster && (
                <>
                    <h3 className="section-title">Cluster</h3>
                    <div className="metric-grid" style={{ marginBottom: 32 }}>
                        <MetricCard
                            label="Nodes"
                            value={`${cluster.healthy} / ${cluster.total_nodes}`}
                            color="green"
                            sub="Healthy"
                        />
                        <MetricCard
                            label="GPUs Available"
                            value={`${cluster.available_gpus} / ${cluster.total_gpus}`}
                            color="blue"
                        />
                        <MetricCard
                            label="Avg GPU Utilization"
                            value={`${Math.round(cluster.avg_gpu_utilization * 100)}%`}
                            color="amber"
                        />
                        <MetricCard
                            label="Cost Rate"
                            value={`$${cluster.cost_per_gpu_hour}`}
                            color="purple"
                            sub="per GPU/hour"
                        />
                    </div>
                </>
            )}

            <h3 className="section-title">Recent Runs</h3>
            <RunsTable runs={runs} />
        </div>
    );
}
