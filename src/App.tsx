import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from './store/AppContext';
import { useAuth } from './contexts/AuthContext';
import { Task, Thought } from './types';
import { TaskDecomposer, FocusView, ThoughtSandbox, DownloadModal, FreshStartModal } from './components';
import { AuthGate } from './components/AuthGate';
import './App.css';

/**
 * ADHD 助手主应用
 * 终极防御版：包含了全量的空值保护和类型强制转换，防止任何渲染崩溃
 */
function App() {
    // 调试日志：跟踪渲染状态
    console.log('App: Component Render');

    const { state, dispatch } = useApp();
    const { user, isLoading, isAuthenticated, logout } = useAuth();

    // 状态管理
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [focusMicroTaskIndex, setFocusMicroTaskIndex] = useState(0);
    const [showDownload, setShowDownload] = useState(false);
    const [showFreshStart, setShowFreshStart] = useState(false);

    // 安全获取任务列表
    const tasks = useMemo(() => Array.isArray(state?.tasks) ? state.tasks : [], [state?.tasks]);

    // 计算未完成且未归档的任务数量（逾期任务）
    const overdueTaskCount = useMemo(() => {
        return tasks.filter(t =>
            t && t.status !== 'completed' && !t.archivedAt
        ).length;
    }, [tasks]);

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

    // 添加/更新任务
    const handleSaveTask = useCallback((task: Task) => {
        if (editingTask) {
            dispatch({ type: 'UPDATE_TASK', payload: task });
        } else {
            dispatch({ type: 'ADD_TASK', payload: task });
        }
        setShowTaskForm(false);
        setEditingTask(null);
    }, [dispatch, editingTask]);

    // 删除任务
    const handleDeleteTask = useCallback((taskId: string) => {
        if (window.confirm('确定要删除这个任务吗？')) {
            dispatch({ type: 'DELETE_TASK', payload: taskId });
        }
    }, [dispatch]);

    // 开始专注
    const handleStartFocus = useCallback((task: Task) => {
        if (!task || !Array.isArray(task.microTasks)) return;

        const firstPendingIndex = task.microTasks.findIndex(
            mt => mt && mt.status !== 'completed'
        );
        if (firstPendingIndex === -1) return;

        setFocusTask(task);
        setFocusMicroTaskIndex(firstPendingIndex);
    }, []);

    // 完成当前微任务
    const handleCompleteMicroTask = useCallback(() => {
        if (!focusTask || !Array.isArray(focusTask.microTasks)) return;

        const currentMicroTask = focusTask.microTasks[focusMicroTaskIndex];
        if (!currentMicroTask) return;

        dispatch({
            type: 'COMPLETE_MICRO_TASK',
            payload: { taskId: focusTask.id, microTaskId: currentMicroTask.id }
        });

        const nextIndex = focusTask.microTasks.findIndex(
            (mt, idx) => idx > focusMicroTaskIndex && mt && mt.status !== 'completed'
        );

        if (nextIndex !== -1) {
            setFocusMicroTaskIndex(nextIndex);
        } else {
            setFocusTask(null);
            setFocusMicroTaskIndex(0);
        }
    }, [focusTask, focusMicroTaskIndex, dispatch]);

    const handleExitFocus = useCallback(() => {
        setFocusTask(null);
        setFocusMicroTaskIndex(0);
    }, []);

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
    if (isLoading) {
        return (
            <div className="app-loading">
                <div className="app-loading-spinner"></div>
                <p>加载中...</p>
            </div>
        );
    }

    // 未登录时显示登录/注册页面
    if (!isAuthenticated) {
        return <AuthGate />;
    }

    // 渲染层辅助函数：确保数据安全
    const getTaskProgress = (task: Task) => {
        const microTasks = Array.isArray(task?.microTasks) ? task.microTasks : [];
        const completed = microTasks.filter(mt => mt && mt.status === 'completed').length;
        return { completed, total: microTasks.length };
    };

    const getTaskDuration = (task: Task) => {
        const microTasks = Array.isArray(task?.microTasks) ? task.microTasks : [];
        return microTasks.reduce((sum, mt) => sum + (mt?.estimatedMinutes || 0), 0);
    };

    return (
        <div className="app">
            <div className="app-texture" />
            <div className="app-scanline" />

            <header className="app-header">
                <div className="app-logo">
                    <span className="app-logo-icon">🧠</span>
                    <div>
                        <div className="app-logo-text">ADHD 助手</div>
                        <div className="app-subtitle">专注 · 拆解 · 完成</div>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="header-download-btn" onClick={() => setShowDownload(true)}>
                        <span className="btn-icon">📲</span>
                        <span>下载APP</span>
                    </button>
                    <div className="user-menu">
                        <span className="user-avatar">👤</span>
                        <span className="user-name">{String(user?.username || user?.email?.split('@')[0] || '用户')}</span>
                        <button className="logout-btn" onClick={logout} title="退出登录">🚪</button>
                    </div>
                </div>
            </header>

            <main className="app-main">
                {tasks.length === 0 && !showTaskForm ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h2 className="empty-state-title">还没有任务</h2>
                        <p className="empty-state-text">创建你的第一个任务，将它拆解成小步骤，一步一步完成！</p>
                        <button className="add-task-btn" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
                            <span className="btn-icon">+</span> 创建第一个任务
                        </button>
                    </div>
                ) : (
                    <div className="task-container">
                        <div className="task-header">
                            <h2>我的任务清单</h2>
                            <button className="add-task-inline-btn" onClick={() => { setEditingTask(null); setShowTaskForm(true); }}>
                                <span className="btn-icon">+</span> 添加任务
                            </button>
                        </div>
                        <div className="task-grid">
                            {tasks.map((task) => {
                                if (!task || !task.id) return null;
                                const { completed, total } = getTaskProgress(task);
                                const isCompleted = task.status === 'completed';
                                return (
                                    <div key={task.id} className={`task-card ${isCompleted ? 'completed' : ''} ${task.archivedAt ? 'archived' : ''}`}>
                                        <div className="task-card-header">
                                            <h3 className="task-title" title={String(task.title)}>{String(task.title)}</h3>
                                            <div className="task-actions">
                                                <button className="task-action-btn edit" onClick={() => { setEditingTask(task); setShowTaskForm(true); }} title="编辑">✏️</button>
                                                <button className="task-action-btn delete" onClick={() => handleDeleteTask(task.id)} title="删除">🗑️</button>
                                            </div>
                                        </div>
                                        <div className="task-meta">
                                            <span className="task-duration">⏱️ {getTaskDuration(task)} 分钟</span>
                                            <span className="task-tasks-count">🔢 {total} 个步骤</span>
                                        </div>
                                        <div className="task-progress-section">
                                            <div className="task-progress-bar">
                                                <div className="task-progress-fill" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
                                            </div>
                                            <div className="task-progress-text">{completed} / {total} 已完成</div>
                                        </div>
                                        <button className="start-focus-btn" onClick={() => handleStartFocus(task)} disabled={isCompleted}>
                                            {isCompleted ? '已完成' : '开始专注'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {showTaskForm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <TaskDecomposer onSave={handleSaveTask} onCancel={() => { setShowTaskForm(false); setEditingTask(null); }} existingTask={editingTask || undefined} />
                    </div>
                </div>
            )}

            {focusTask && focusTask.microTasks && focusTask.microTasks[focusMicroTaskIndex] && (
                <FocusView
                    taskTitle={String(focusTask.title)}
                    microTask={focusTask.microTasks[focusMicroTaskIndex]}
                    allMicroTasks={focusTask.microTasks}
                    currentIndex={focusMicroTaskIndex}
                    onComplete={handleCompleteMicroTask}
                    onExit={handleExitFocus}
                />
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
