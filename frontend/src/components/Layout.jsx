// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.

import Sidebar from './Sidebar';

export default function Layout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
