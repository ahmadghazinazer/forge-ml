// Copyright (c) 2025-2026 Ahmad Al-Nazer. All rights reserved.
// https://www.linkedin.com/in/ahmadghazinazer

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
