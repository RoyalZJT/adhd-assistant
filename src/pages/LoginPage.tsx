/**
 * 登录页面
 */
import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

interface LoginPageProps {
    onSwitchToRegister: () => void;
    onSuccess?: () => void;
}

export function LoginPage({ onSwitchToRegister, onSuccess }: LoginPageProps) {
    const { login, isLoading, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        // 客户端验证
        if (!email.trim()) {
            setLocalError('请输入邮箱');
            return;
        }
        if (!password) {
            setLocalError('请输入密码');
            return;
        }

        try {
            await login({ email: email.trim(), password });
            onSuccess?.();
        } catch {
            // 错误已在 AuthContext 中处理
        }
    };

    const displayError = localError || error;

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <div className="auth-logo">🧠</div>
                    <h1 className="auth-title">欢迎回来</h1>
                    <p className="auth-subtitle">登录以继续使用 ADHD 助手</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {displayError && (
                        <div className="auth-error">
                            <span className="auth-error-icon">⚠️</span>
                            {displayError}
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="email" className="auth-label">邮箱</label>
                        <input
                            id="email"
                            type="email"
                            className="auth-input"
                            placeholder="请输入邮箱"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            autoComplete="email"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password" className="auth-label">密码</label>
                        <input
                            id="password"
                            type="password"
                            className="auth-input"
                            placeholder="请输入密码"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="auth-button"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <span className="auth-loading">
                                <span className="auth-loading-spinner"></span>
                                登录中...
                            </span>
                        ) : (
                            '登录'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        还没有账号？
                        <button
                            type="button"
                            className="auth-link"
                            onClick={onSwitchToRegister}
                            disabled={isLoading}
                        >
                            立即注册
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
