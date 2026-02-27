// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import { NavLink } from 'react-router-dom';

const CORE_NAV = [
    { to: '/', label: 'Dashboard', icon: GridIcon },
    { to: '/pipeline', label: 'Pipeline', icon: FlowIcon },
    { to: '/datasets', label: 'Datasets', icon: DbIcon },
    { to: '/runs', label: 'Training Runs', icon: PlayIcon },
];

const MANAGE_NAV = [
    { to: '/models', label: 'Model Registry', icon: LayersIcon },
    { to: '/evals', label: 'Evaluations', icon: CheckIcon },
    { to: '/cluster', label: 'Cluster', icon: ServerIcon },
];

const SYSTEM_NAV = [
    { to: '/settings', label: 'Settings', icon: GearIcon },
];

export default function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <h1>
                    <img src="/favicon.png" alt="" />
                    <span>forge-ml</span>
                </h1>
                <div className="tagline">LLM Post-Training Platform</div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section">Core</div>
                {CORE_NAV.map(renderLink)}

                <div className="sidebar-section" style={{ marginTop: 8 }}>Manage</div>
                {MANAGE_NAV.map(renderLink)}

                <div className="sidebar-section" style={{ marginTop: 8 }}>System</div>
                {SYSTEM_NAV.map(renderLink)}
            </nav>

            <div className="sidebar-footer">
                <a href="https://www.linkedin.com/in/ahmadghazinazer" target="_blank" rel="noreferrer">
                    Ahmad Al-Nazer
                </a>
            </div>
        </aside>
    );
}

function renderLink({ to, label, icon: Icon }) {
    return (
        <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
            <Icon />
            <span>{label}</span>
        </NavLink>
    );
}

function GridIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>);
}
function FlowIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v6" /><path d="M18 15v6" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="12" r="3" /><path d="M9 12h6" /></svg>);
}
function DbIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>);
}
function PlayIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>);
}
function LayersIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>);
}
function CheckIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>);
}
function ServerIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>);
}
function GearIcon() {
    return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>);
}
