import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from './store/AppContext';
import { useAuth } from './contexts/AuthContext';
import { Task, Thought, createTask } from './types';
import { TaskDecomposer, ThoughtSandbox, DownloadModal, FreshStartModal, ChatInput } from './components';
import { AuthGate } from './components/AuthGate';
import './App.css';

/**
 * ADHD 助手主应用
 * 终极防御版：包含了全量的空值保护和类型强制转换，防止任何渲染崩溃
 * 新版：移除了强制登录，支持右上角登录/注册
 */
function App() {


    const { state, dispatch } = useApp();
    const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();

    // 状态管理
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [showDownload, setShowDownload] = useState(false);
    const [showFreshStart, setShowFreshStart] = useState(false);

    // 认证模态框状态
    const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

    // 新增状态用于单一焦点展示
    const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // 安全获取任务列表 (过滤掉已归档和已完成任务)
    const activeTasks = useMemo(() => {
        const rawTasks = Array.isArray(state?.tasks) ? state.tasks : [];
        return rawTasks.filter(t => t && !t.archivedAt && t.status !== 'completed');
    }, [state?.tasks]);

    // 当前显示的焦点任务
    const currentTask = useMemo(() => {
        if (activeTasks.length === 0) return null;
        // 确保索引不越界
        const index = currentTaskIndex % activeTasks.length;
        return activeTasks[index];
    }, [activeTasks, currentTaskIndex]);

    // 切换下一个任务 (跳过)
    const handleNextTask = useCallback(() => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentTaskIndex(prev => (prev + 1) % (activeTasks.length || 1));
            setIsTransitioning(false);
        }, 300); // 短暂延迟以显示过渡效果
    }, [activeTasks.length]);

    // 完成任务 (搞定它)
    const handleCompleteTask = useCallback(() => {
        if (!currentTask) return;

        // 触发震动
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }

        dispatch({ type: 'UPDATE_TASK', payload: { ...currentTask, status: 'completed' } as Task });

        // 自动切到下一个，并显示过渡效果
        setIsTransitioning(true);
        setTimeout(() => {
            // 确保在任务列表更新后，索引仍然有效
            setCurrentTaskIndex(prev => prev % (activeTasks.length || 1));
            setIsTransitioning(false);
        }, 500); // 稍长延迟以显示完成效果
    }, [currentTask, dispatch, activeTasks.length]);

    // 计算未完成且未归档的任务数量（逾期任务）
    const overdueTaskCount = activeTasks.length;

    // 当逾期任务超过 3 个时，自动弹出宽恕模式
    useEffect(() => {
        if (overdueTaskCount >= 3 && isAuthenticated) {
            try {
                const lastShown = localStorage.getItem('adhd_fresh_start_shown');
                const today = new Date().toDateString();
                if (lastShown !== today) {
                    setShowFreshStart(true);
                    localStorage.setItem('adhd_fresh_start_shown', today);
                }
            } catch (e) {
                console.warn('Failed to access localStorage for fresh start flag');
            }
        }
    }, [overdueTaskCount, isAuthenticated]);

    // 宽高按钮 - 归档所有逾期任务
    const handleFreshStart = useCallback(() => {
        dispatch({ type: 'ARCHIVE_OVERDUE_TASKS' });
        setShowFreshStart(false);
    }, [dispatch]);

    // 添加/更新任务 (由 TaskDecomposer 调用)
    const handleSaveTask = useCallback((task: Task) => {
        if (editingTask) {
            dispatch({ type: 'UPDATE_TASK', payload: task });
        } else {
            dispatch({ type: 'ADD_TASK', payload: task });
        }
        setShowTaskForm(false);
        setEditingTask(null);
    }, [dispatch, editingTask]);

    // 快速添加任务 (由 ChatInput 调用)
    const handleQuickAddTask = useCallback((title: string, dueDate?: string) => {
        const newTask = createTask(title);
        // 使用类型守卫和显式转换修复 TS2322
        if (dueDate) {
            newTask.dueDate = String(dueDate);
        }
        dispatch({ type: 'ADD_TASK', payload: newTask });
        // 自动聚焦到新任务
        setCurrentTaskIndex(activeTasks.length);
    }, [dispatch, activeTasks.length]);

    // 灵感记录
    const handleAddThought = useCallback((thought: Thought) => {
        if (!thought) return;
        dispatch({ type: 'ADD_THOUGHT', payload: thought });
    }, [dispatch]);

    const handleDeleteThought = useCallback((id: string) => {
        dispatch({ type: 'DELETE_THOUGHT', payload: id });
    }, [dispatch]);

    const handleProcessThought = useCallback((id: string) => {
        dispatch({ type: 'PROCESS_THOUGHT', payload: id });
    }, [dispatch]);

    // 认证加载中
    if (authLoading) {
        return (
            <div className="app-loading">
                <div className="app-loading-spinner"></div>
                <p>正在同步状态...</p>
            </div>
        );
    }

    return (
        <div className="app focus-mode">
            <header className="app-header">
                <div className="app-logo">
                    <span className="app-logo-icon">🧠</span>
                    <div className="app-logo-text-group">
                        <div className="app-logo-text">ADHD FOCUS</div>
                        <div className="app-subtitle">此时 · 此地 · 此事</div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="doom-box-trigger" onClick={() => {/* TODO: Doom Box */ }} title="稍后读箱子">
                        <span className="btn-icon">📦</span>
                    </button>
                    {isAuthenticated ? (
                        <div className="user-menu">
                            <span className="user-name">{String(user?.username || '已登录')}</span>
                            <button className="logout-btn" onClick={logout}>🚪</button>
                        </div>
                    ) : (
                        <button className="auth-nav-btn" onClick={() => setShowAuthModal(true)}>登录</button>
                    )}
                </div>
            </header>

            <main className="app-main">
                {!currentTask ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">✨</div>
                        <h2 className="empty-state-title">全速清空！</h2>
                        <p className="empty-state-text">此刻没有紧迫的任务。是在底部录入一个，还是享受这片刻宁静？</p>
                    </div>
                ) : (
                    <div className={`focus-card-container ${isTransitioning ? 'transitioning' : ''}`}>
                        <div className="focus-card">
                            <div className="focus-card-header">
                                <span className="focus-tag">当前唯一核心</span>
                                <button className="magic-wand-btn" onClick={() => { setEditingTask(currentTask); setShowTaskForm(true); }} title="魔法拆解">✨</button>
                            </div>

                            <h1 className="focus-main-title">{String(currentTask.title)}</h1>

                            <div className="focus-card-footer">
                                <div className="focus-meta">
                                    {currentTask.dueDate && <span className="focus-due">📅 {currentTask.dueDate}</span>}
                                    <span className="focus-sub-count">🧩 {Array.isArray(currentTask.microTasks) ? currentTask.microTasks.length : 0} 步骤</span>
                                </div>
                            </div>
                        </div>

                        <div className="focus-actions-row">
                            <button className="big-action-btn skip" onClick={handleNextTask}>
                                <span className="action-icon">⏩</span>
                                <span className="action-text">不想做 / 跳过</span>
                            </button>
                            <button className="big-action-btn complete" onClick={handleCompleteTask}>
                                <span className="action-icon">💎</span>
                                <span className="action-text">搞定它</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* TODO: ChatInput 替代页脚 */}
            <footer className="app-footer">
                <ChatInput onSend={handleQuickAddTask} />
            </footer>

            {showTaskForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <TaskDecomposer onSave={handleSaveTask} onCancel={() => { setShowTaskForm(false); setEditingTask(null); }} existingTask={editingTask || undefined} />
                    </div>
                </div>
            )}

            {/* 认证模态框 */}
            {showAuthModal && (
                <div className="modal-overlay">
                    <div className="auth-modal-content">
                        <button className="modal-close-btn" onClick={() => setShowAuthModal(false)}>✕</button>
                        <AuthGate onAuthSuccess={() => setShowAuthModal(false)} />
                    </div>
                </div>
            )}

            <ThoughtSandbox
                thoughts={Array.isArray(state?.thoughts) ? state.thoughts : []}
                onAddThought={handleAddThought}
                onDeleteThought={handleDeleteThought}
                onProcessThought={handleProcessThought}
            />

            <DownloadModal isOpen={showDownload} onClose={() => setShowDownload(false)} />

            <FreshStartModal
                isOpen={showFreshStart}
                overdueCount={overdueTaskCount}
                onConfirm={handleFreshStart}
                onClose={() => setShowFreshStart(false)}
            />
        </div>
    );
}

export default App;
