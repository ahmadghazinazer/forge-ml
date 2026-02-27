// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
// https://www.linkedin.com/in/ahmadghazinazer

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Datasets from './pages/Datasets';
import Runs from './pages/Runs';
import Models from './pages/Models';
import Evals from './pages/Evals';

export default function App() {
    return (
        <Layout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/datasets" element={<Datasets />} />
                <Route path="/runs" element={<Runs />} />
                <Route path="/models" element={<Models />} />
                <Route path="/evals" element={<Evals />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    );
}
