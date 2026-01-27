import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获渲染过程中的错误，防止整个应用白屏
 */
export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidMount() {
        // 如果应用在加载后 10 秒内没有崩溃，则认为状态已稳定，清除自动修复标记
        // 这样下次如果发生崩溃，仍然可以尝试自动修复
        setTimeout(() => {
            sessionStorage.removeItem('adhd_auto_fix_attempted');
        }, 10000);
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // 自动修复机制：检测到致命错误时，尝试一次自动清理数据
        // 使用 sessionStorage 防止无限循环刷新
        const hasAutoFixed = sessionStorage.getItem('adhd_auto_fix_attempted');

        if (!hasAutoFixed) {
            // 标记已尝试自动修复
            sessionStorage.setItem('adhd_auto_fix_attempted', 'true');
            console.log('Attempting auto-fix: Clearing data and reloading...');

            // 执行清理
            this.handleReset();
            return;
        }

        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReset = () => {
        // 清除所有相关的本地存储
        try {
            console.log('Clearing all app data...');
            localStorage.removeItem('adhd-assistant-state');
            localStorage.removeItem('adhd_user');
            localStorage.removeItem('adhd_token');
            // 清除其他可能残留的 key
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('adhd')) {
                    localStorage.removeItem(key);
                }
            });
        } catch (e) {
            console.error('Failed to clear localStorage', e);
        }

        // 重置错误状态
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });

        // 强制刷新
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container">
                    <div className="error-content">
                        <div className="error-icon">😵</div>
                        <h1>哎呀，出错了</h1>
                        <p className="error-message">
                            应用遇到了一些问题，这可能是由于数据格式不兼容导致的。
                        </p>

                        {this.state.error && (
                            <div className="error-details">
                                <p className="error-name">{this.state.error.toString()}</p>
                            </div>
                        )}

                        <div className="error-actions">
                            <button
                                className="reset-button"
                                onClick={this.handleReset}
                            >
                                🗑️ 清除所有数据并重试
                            </button>
                            <button
                                className="reload-button"
                                onClick={() => window.location.reload()}
                            >
                                🔄 仅刷新页面
                            </button>
                        </div>

                        <p className="error-hint">
                            如果清除数据后问题依然存在，请联系开发者。
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
