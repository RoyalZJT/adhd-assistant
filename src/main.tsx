import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './store/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App';
// 全局错误捕获，防止未被 React Error Boundary 捕获的错误导致页面崩溃或无限刷新
window.onerror = function (message, source, lineno, colno, error) {
    console.error('Global Error Caught:', message, source, lineno, colno, error);
    // 防止旧的自动刷新逻辑
    if (sessionStorage.getItem('adhd_auto_fix_attempted')) {
        return false;
    }
    return false;
};

window.onunhandledrejection = function (event) {
    console.error('Unhandled Rejection:', event.reason);
};

import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            <AuthProvider>
                <AppProvider>
                    <App />
                </AppProvider>
            </AuthProvider>
        </ErrorBoundary>
    </React.StrictMode>
);
