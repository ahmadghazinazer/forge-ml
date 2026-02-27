// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

const BASE = '/api';

async function request(path, options = {}) {
    const url = `${BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const resp = await fetch(url, { ...options, headers });
    if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.detail || body.error || `Request failed: ${resp.status}`);
    }
    if (resp.status === 204) return null;
    return resp.json();
}

export const api = {
    datasets: {
        list: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return request(`/datasets${qs ? '?' + qs : ''}`);
        },
        get: (id) => request(`/datasets/${id}`),
        register: (data) => request('/datasets/register', { method: 'POST', body: JSON.stringify(data) }),
        lineage: (id) => request(`/datasets/${id}/lineage`),
        delete: (id) => request(`/datasets/${id}`, { method: 'DELETE' }),
    },
    runs: {
        list: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return request(`/runs${qs ? '?' + qs : ''}`);
        },
        get: (id) => request(`/runs/${id}`),
        launch: (data) => request('/runs/launch', { method: 'POST', body: JSON.stringify(data) }),
        metrics: (id, lastN) => {
            const qs = lastN ? `?last_n=${lastN}` : '';
            return request(`/runs/${id}/metrics${qs}`);
        },
        cancel: (id) => request(`/runs/${id}/cancel`, { method: 'POST' }),
    },
    models: {
        list: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return request(`/models${qs ? '?' + qs : ''}`);
        },
        get: (id) => request(`/models/${id}`),
        promote: (data) => request('/models/promote', { method: 'POST', body: JSON.stringify(data) }),
    },
    evals: {
        list: (params = {}) => {
            const qs = new URLSearchParams(params).toString();
            return request(`/evals${qs ? '?' + qs : ''}`);
        },
        get: (id) => request(`/evals/${id}`),
        run: (data) => request('/evals/run', { method: 'POST', body: JSON.stringify(data) }),
        compare: (id, baselineId) => request(`/evals/${id}/compare/${baselineId}`),
    },
    cluster: {
        status: () => request('/cluster/status'),
        cost: (numGpus, hours) => request(`/cluster/cost?num_gpus=${numGpus}&hours=${hours}`),
    },
    health: () => request('/health'),
};
