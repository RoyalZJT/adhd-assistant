import { useState, useCallback, useMemo, useEffect } from 'react';
import { useApp } from './store/AppContext';
import { useAuth } from './contexts/AuthContext';
import { Task, createThought } from './types';
import { TaskDecomposer, FocusView, ThoughtSandbox, DownloadModal, FreshStartModal } from './components';
import { AuthGate } from './components/AuthGate';
import './App.css';

/**
 * ADHD 助手主应用
 */
function App() {
    const { state, dispatch } = useApp();
    const { user, isLoading, isAuthenticated, logout } = useAuth();
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [focusTask, setFocusTask] = useState<Task | null>(null);
    const [focusMicroTaskIndex, setFocusMicroTaskIndex] = useState(0);
    const [showDownload, setShowDownload] = useState(false);
    const [showFreshStart, setShowFreshStart] = useState(false);

    // 计算未完成且未归档的任务数量（逾期任务）- 添加空值检查
    const overdueTaskCount = useMemo(() => {
        return (state.tasks || []).filter(t =>
            t?.status !== 'completed' && !t?.archivedAt
        ).length;
    }, [state.tasks]);

    // 当逾期任务超过 3 个时，自动弹出宽恕模式
    useEffect(() => {
        if (overdueTaskCount >= 3 && isAuthenticated) {
            // 检查是否已经弹出过（今天）
            const lastShown = localStorage.getItem('adhd_fresh_start_shown');
            const today = new Date().toDateString();
            if (lastShown !== today) {
                setShowFreshStart(true);
                localStorage.setItem('adhd_fresh_start_shown', today);
            }
        }
    }, [overdueTaskCount, isAuthenticated]);

    // 宽恕按钮 - 归档所有逾期任务
    const handleFreshStart = useCallback(() => {
        dispatch({ type: 'ARCHIVE_OVERDUE_TASKS' });
    }, [dispatch]);

    // NOTE: 所有 Hooks 必须在条件渲染之前调用，符合 React Hooks 规则

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
        if (confirm('确定要删除这个任务吗？')) {
            dispatch({ type: 'DELETE_TASK', payload: taskId });
        }
    }, [dispatch]);

    // 开始专注
    const handleStartFocus = useCallback((task: Task) => {
        // 找到第一个未完成的微任务
        const firstPendingIndex = task.microTasks.findIndex(
            mt => mt.status !== 'completed'
        );
        if (firstPendingIndex === -1) return;

        setFocusTask(task);
        setFocusMicroTaskIndex(firstPendingIndex);
    }, []);

    // 完成当前微任务
    const handleCompleteMicroTask = useCallback(() => {
        if (!focusTask) return;

        const currentMicroTask = focusTask.microTasks[focusMicroTaskIndex];
        dispatch({
            type: 'COMPLETE_MICRO_TASK',
            payload: { taskId: focusTask.id, microTaskId: currentMicroTask.id }
        });

        // 查找下一个未完成的微任务
        const nextIndex = focusTask.microTasks.findIndex(
            (mt, idx) => idx > focusMicroTaskIndex && mt.status !== 'completed'
        );

        if (nextIndex !== -1) {
            setFocusMicroTaskIndex(nextIndex);
        } else {
            // 所有微任务完成
            setFocusTask(null);
            setFocusMicroTaskIndex(0);
        }
    }, [focusTask, focusMicroTaskIndex, dispatch]);

    // 退出专注模式
    const handleExitFocus = useCallback(() => {
        setFocusTask(null);
        setFocusMicroTaskIndex(0);
    }, []);

    // 添加灵感
    const handleAddThought = useCallback((thought: ReturnType<typeof createThought>) => {
        dispatch({ type: 'ADD_THOUGHT', payload: thought });
    }, [dispatch]);

    // 删除灵感
    const handleDeleteThought = useCallback((id: string) => {
        dispatch({ type: 'DELETE_THOUGHT', payload: id });
    }, [dispatch]);

    // 标记灵感为已处理
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

    // 计算任务进度
    const getTaskProgress = (task: Task) => {
        const completed = task.microTasks.filter(mt => mt.status === 'completed').length;
        return { completed, total: task.microTasks.length };
    };

    // 计算总时长
    const getTaskDuration = (task: Task) => {
        return task.microTasks.reduce((sum, mt) => sum + mt.estimatedMinutes, 0);
    };

    return (
        <div className="app">
            {/* 全局背景纹理覆盖层 */}
            <div className="app-texture" />
            <div className="app-scanline" />

            {/* 顶部导航 */}
            <header className="app-header">
                <div className="app-logo">
                    <span className="app-logo-icon">🧠</span>
                    <div>
                        <div className="app-logo-text">ADHD 助手</div>
                        <div className="app-subtitle">专注 · 拆解 · 完成</div>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="header-download-btn"
                        onClick={() => setShowDownload(true)}
                    >
                        <span className="btn-icon">📲</span>
                        <span>下载APP</span>
                    </button>
                    <div className="user-menu">
                        <span className="user-avatar">👤</span>
                        <span className="user-name">{user?.username || user?.email?.split('@')[0] || '用户'}</span>
                        <button
                            className="logout-btn"
                            onClick={logout}
                            title="退出登录"
                        >
                            🚪
                        </button>
                    </div>
                </div>
            </header>

            {/* 主内容区 */}
            <main className="app-main">
                {state.tasks.length === 0 && !showTaskForm ? (
                    // 空状态
                    <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h2 className="empty-state-title">还没有任务</h2>
                        <p className="empty-state-text">
                            创建你的第一个任务，将它拆解成小步骤，一步一步完成！
                        </p>
                        <button
                            className="add-task-btn"
                            onClick={() => setShowTaskForm(true)}
                        >
                            <span>+</span>
                            <span>创建新任务</span>
                        </button>
                    </div>
                ) : (
                    // 任务列表
                    <div className="task-list">
                        <div className="task-list-header">
                            <h2 className="task-list-title">我的任务</h2>
                            <button
                                className="add-task-btn"
                                onClick={() => setShowTaskForm(true)}
                            >
                                <span>+</span>
                                <span>新任务</span>
                            </button>
                        </div>

                        {state.tasks.map((task) => {
                            const progress = getTaskProgress(task);
                            const duration = getTaskDuration(task);
                            const isCompleted = progress.completed === progress.total;

                            return (
                                <div key={task.id} className="task-card">
                                    <div className="task-card-header">
                                        <h3 className="task-card-title">
                                            {isCompleted && '✅ '}
                                            {task.title}
                                        </h3>
                                        <div className="task-card-actions">
                                            <button
                                                className="task-card-btn"
                                                onClick={() => {
                                                    setEditingTask(task);
                                                    setShowTaskForm(true);
                                                }}
                                                title="编辑"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="task-card-btn delete"
                                                onClick={() => handleDeleteTask(task.id)}
                                                title="删除"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {/* 微任务芯片 */}
                                    <div className="micro-tasks-progress">
                                        {task.microTasks.map((mt) => (
                                            <span
                                                key={mt.id}
                                                className={`micro-task-chip ${mt.status}`}
                                            >
                                                {mt.status === 'completed' ? '✓' : '○'} {mt.title}
                                            </span>
                                        ))}
                                    </div>

                                    {/* 元信息和操作 */}
                                    <div className="task-card-meta">
                                        <span className="task-meta-item">
                                            🧩 {progress.completed}/{progress.total} 步骤
                                        </span>
                                        <span className="task-meta-item">
                                            ⏱️ {duration} 分钟
                                        </span>
                                        {!isCompleted && (
                                            <button
                                                className="start-focus-btn"
                                                onClick={() => handleStartFocus(task)}
                                                style={{ marginLeft: 'auto' }}
                                            >
                                                ▶ 开始专注
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* 任务创建/编辑弹窗 */}
            {showTaskForm && (
                <div className="modal-overlay" onClick={() => {
                    setShowTaskForm(false);
                    setEditingTask(null);
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <TaskDecomposer
                            onSave={handleSaveTask}
                            onCancel={() => {
                                setShowTaskForm(false);
                                setEditingTask(null);
                            }}
                            existingTask={editingTask || undefined}
                        />
                    </div>
                </div>
            )}

            {/* 专注模式 */}
            {focusTask && focusTask.microTasks[focusMicroTaskIndex] && (
                <FocusView
                    taskTitle={focusTask.title}
                    microTask={focusTask.microTasks[focusMicroTaskIndex]}
                    allMicroTasks={focusTask.microTasks}
                    currentIndex={focusMicroTaskIndex}
                    onComplete={handleCompleteMicroTask}
                    onExit={handleExitFocus}
                />
            )}

            {/* 思维中转站 - 闪念胶囊 */}
            <ThoughtSandbox
                thoughts={state.thoughts}
                onAddThought={handleAddThought}
                onDeleteThought={handleDeleteThought}
                onProcessThought={handleProcessThought}
            />

            {/* 下载安装指南 */}
            <DownloadModal
                isOpen={showDownload}
                onClose={() => setShowDownload(false)}
            />

            {/* 宽恕按钮 - Fresh Start */}
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
