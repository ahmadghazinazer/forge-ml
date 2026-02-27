// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { useState } from 'react';

const DEFAULT_CONFIG = {
    apiUrl: 'http://localhost:8000',
    apiKey: 'dev-key-change-me',
    refreshInterval: 5,
    maxConcurrentRuns: 4,
    defaultRecipe: 'lora_sft',
    checkpointDir: './checkpoints',
    registryDir: './model_registry',
    heartbeatInterval: 30,
    autoRetry: true,
    maxRetries: 3,
    tenantIsolation: true,
};

export default function Settings() {
    let [config, setConfig] = useState({ ...DEFAULT_CONFIG });
    let [saved, setSaved] = useState(false);

    function update(key, val) {
        setConfig(prev => ({ ...prev, [key]: val }));
        setSaved(false);
    }

    function handleSave(e) {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    }

    return (
        <div>
            <div className="page-header">
                <h2>Settings</h2>
                <p className="subtitle">Platform configuration, API keys, and runtime parameters</p>
            </div>

            <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div className="glass-card">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                            API Configuration
                        </h3>
                        <Field label="API Base URL" value={config.apiUrl} onChange={v => update('apiUrl', v)} />
                        <Field label="API Key" value={config.apiKey} onChange={v => update('apiKey', v)} type="password" />
                        <ToggleField label="Tenant Isolation" checked={config.tenantIsolation} onChange={v => update('tenantIsolation', v)} />
                    </div>

                    <div className="glass-card">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                            Training Defaults
                        </h3>
                        <SelectField label="Default Recipe" value={config.defaultRecipe} options={['lora_sft', 'dpo', 'rlhf']} onChange={v => update('defaultRecipe', v)} />
                        <NumField label="Max Concurrent Runs" value={config.maxConcurrentRuns} min={1} max={32} onChange={v => update('maxConcurrentRuns', v)} />
                        <Field label="Checkpoint Directory" value={config.checkpointDir} onChange={v => update('checkpointDir', v)} />
                    </div>

                    <div className="glass-card">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                            Cluster & Reliability
                        </h3>
                        <NumField label="Heartbeat Interval (s)" value={config.heartbeatInterval} min={5} max={120} onChange={v => update('heartbeatInterval', v)} />
                        <ToggleField label="Auto-Retry on Failure" checked={config.autoRetry} onChange={v => update('autoRetry', v)} />
                        <NumField label="Max Retries" value={config.maxRetries} min={0} max={10} onChange={v => update('maxRetries', v)} />
                    </div>

                    <div className="glass-card">
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 16 }}>
                            Storage
                        </h3>
                        <Field label="Model Registry Path" value={config.registryDir} onChange={v => update('registryDir', v)} />
                        <NumField label="Dashboard Refresh (s)" value={config.refreshInterval} min={1} max={60} onChange={v => update('refreshInterval', v)} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary">Save Configuration</button>
                    {saved && <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>Saved</span>}
                </div>
            </form>

            <div className="glass-card" style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 12 }}>
                    Environment Variables
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-soft)', marginBottom: 16 }}>
                    The backend reads configuration from environment variables prefixed with <code>FORGE_</code>.
                    Values set here override defaults. All settings can also be placed in a <code>.env</code> file in the backend directory.
                </p>
                <table className="data-table">
                    <thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead>
                    <tbody>
                        <EnvRow name="FORGE_DEBUG" def="false" desc="Enable debug logging and SQL echo" />
                        <EnvRow name="FORGE_DATABASE_URL" def="sqlite+aiosqlite:///./forge.db" desc="Database connection string" />
                        <EnvRow name="FORGE_DEFAULT_API_KEY" def="dev-key-change-me" desc="API key for authentication" />
                        <EnvRow name="FORGE_MAX_CONCURRENT_RUNS" def="4" desc="Maximum parallel training runs" />
                        <EnvRow name="FORGE_RUN_TIMEOUT_SECONDS" def="86400" desc="Training run timeout (24h default)" />
                        <EnvRow name="FORGE_CHECKPOINT_DIR" def="./checkpoints" desc="Directory for training checkpoints" />
                        <EnvRow name="FORGE_MODEL_REGISTRY_DIR" def="./model_registry" desc="Directory for model artifacts" />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Field({ label, value, onChange, type = 'text' }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
            <input className="input-field" type={type} value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%' }} />
        </div>
    );
}

function NumField({ label, value, min, max, onChange }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
            <input className="input-field" type="number" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)} style={{ width: 100 }} />
        </div>
    );
}

function SelectField({ label, value, options, onChange }) {
    return (
        <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4, fontWeight: 500 }}>{label}</label>
            <select className="input-field" value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%' }}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function ToggleField({ label, checked, onChange }) {
    return (
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ fontSize: 12, color: 'var(--text-soft)', fontWeight: 500 }}>{label}</label>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: checked ? 'var(--blue)' : 'var(--bg-3)',
                    position: 'relative', transition: 'background 200ms',
                }}
            >
                <span style={{
                    position: 'absolute', top: 2, width: 18, height: 18, borderRadius: '50%',
                    background: 'white', transition: 'left 200ms',
                    left: checked ? 20 : 2,
                }} />
            </button>
        </div>
    );
}

function EnvRow({ name, def, desc }) {
    return (
        <tr>
            <td><code style={{ color: 'var(--cyan)', fontSize: 12 }}>{name}</code></td>
            <td className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{def}</td>
            <td style={{ fontSize: 12, color: 'var(--text-soft)' }}>{desc}</td>
        </tr>
    );
}
