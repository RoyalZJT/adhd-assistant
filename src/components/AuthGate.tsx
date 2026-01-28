/**
 * 认证入口组件
 * 管理登录/注册页面切换
 */
import { useState, useEffect } from 'react';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import './AuthGate.css';

type AuthView = 'login' | 'register' | 'success';

interface AuthGateProps {
    onAuthSuccess?: () => void;
    initialView?: AuthView;
}

export function AuthGate({ onAuthSuccess, initialView = 'login' }: AuthGateProps) {
    const [view, setView] = useState<AuthView>(initialView);
    const [countdown, setCountdown] = useState(3);

    // 注册成功后的倒计时
    useEffect(() => {
        if (view === 'success') {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onAuthSuccess?.();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [view, onAuthSuccess]);

    // 注册成功处理
    const handleRegisterSuccess = () => {
        setView('success');
    };

    if (view === 'success') {
        return (
            <div className="auth-page">
                <div className="auth-success-container">
                    <div className="success-icon">✅</div>
                    <h1 className="success-title">注册成功！</h1>
                    <p className="success-message">欢迎加入 ADHD 助手</p>
                    <p className="success-countdown">
                        {countdown} 秒后自动进入应用...
                    </p>
                    <button
                        className="success-button"
                        onClick={onAuthSuccess}
                    >
                        立即进入
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'login') {
        return (
            <LoginPage
                onSwitchToRegister={() => setView('register')}
                onSuccess={onAuthSuccess}
            />
        );
    }

    return (
        <RegisterPage
            onSwitchToLogin={() => setView('login')}
            onSuccess={handleRegisterSuccess}
        />
    );
}
