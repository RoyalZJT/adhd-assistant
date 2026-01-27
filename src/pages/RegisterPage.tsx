/**
 * 注册页面
 */
import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

interface RegisterPageProps {
    onSwitchToLogin: () => void;
    onSuccess?: () => void;
}

export function RegisterPage({ onSwitchToLogin, onSuccess }: RegisterPageProps) {
    const { register, isLoading, error, clearError } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
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
        if (password.length < 8) {
            setLocalError('密码至少需要8位');
            return;
        }
        if (!/[A-Z]/.test(password)) {
            setLocalError('密码必须包含至少一个大写字母');
            return;
        }
        if (!/[a-z]/.test(password)) {
            setLocalError('密码必须包含至少一个小写字母');
            return;
        }
        if (!/\d/.test(password)) {
            setLocalError('密码必须包含至少一个数字');
            return;
        }
        if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;'/`~]/.test(password)) {
            setLocalError('密码必须包含至少一个特殊字符');
            return;
        }
        if (password !== confirmPassword) {
            setLocalError('两次输入的密码不一致');
            return;
        }

        try {
            await register({
                email: email.trim(),
                password,
                username: username.trim() || undefined,
            });
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
                    <h1 className="auth-title">创建账号</h1>
                    <p className="auth-subtitle">注册以开始使用 ADHD 助手</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {displayError && (
                        <div className="auth-error">
                            <span className="auth-error-icon">⚠️</span>
                            {displayError}
                        </div>
                    )}

                    <div className="auth-field">
                        <label htmlFor="email" className="auth-label">邮箱 *</label>
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
                        <label htmlFor="username" className="auth-label">用户名（可选）</label>
                        <input
                            id="username"
                            type="text"
                            className="auth-input"
                            placeholder="请输入用户名"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                            autoComplete="username"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="password" className="auth-label">密码 *</label>
                        <input
                            id="password"
                            type="password"
                            className="auth-input"
                            placeholder="大小写字母+数字+特殊字符，8位以上"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="confirmPassword" className="auth-label">确认密码 *</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            className="auth-input"
                            placeholder="请再次输入密码"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            autoComplete="new-password"
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
                                注册中...
                            </span>
                        ) : (
                            '注册'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        已有账号？
                        <button
                            type="button"
                            className="auth-link"
                            onClick={onSwitchToLogin}
                            disabled={isLoading}
                        >
                            立即登录
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
