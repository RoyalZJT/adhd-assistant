import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppProvider } from './store/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <AppProvider>
                <App />
            </AppProvider>
        </AuthProvider>
    </React.StrictMode>
);
