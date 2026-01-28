import { useState, useCallback } from 'react';
import { Task, createTask, createMicroTask } from '../../types';
import './TaskDecomposer.css';

interface TaskDecomposerProps {
    /** 保存任务回调 */
    onSave: (task: Task) => void;
    /** 取消回调 */
    onCancel?: () => void;
    /** 编辑现有任务 */
    existingTask?: Task;
}

interface DraftMicroTask {
    id: string;
    title: string;
    estimatedMinutes: number;
}

/**
 * 原子化拆解组件
 * 引导用户将大目标拆解为耗时 < 15 分钟的微型任务
 */
export function TaskDecomposer({ onSave, onCancel, existingTask }: TaskDecomposerProps) {
    const [mainTitle, setMainTitle] = useState(String(existingTask?.title || ''));
    const [microTasks, setMicroTasks] = useState<DraftMicroTask[]>(
        existingTask?.microTasks.map(mt => ({
            id: mt.id,
            title: String(mt.title),
            estimatedMinutes: mt.estimatedMinutes
        })) || [{ id: crypto.randomUUID(), title: '', estimatedMinutes: 10 }]
    );

    // 计算总时间
    const totalMinutes = microTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

    // 添加微任务
    const handleAddMicroTask = useCallback(() => {
        setMicroTasks(prev => [
            ...prev,
            { id: crypto.randomUUID(), title: '', estimatedMinutes: 10 }
        ]);
    }, []);

    // 删除微任务
    const handleDeleteMicroTask = useCallback((id: string) => {
        setMicroTasks(prev => prev.filter(task => task.id !== id));
    }, []);

    // 更新微任务标题
    const handleMicroTaskTitleChange = useCallback((id: string, title: string) => {
        setMicroTasks(prev =>
            prev.map(task => (task.id === id ? { ...task, title } : task))
        );
    }, []);

    // 更新微任务时间
    const handleMicroTaskTimeChange = useCallback((id: string, minutes: number) => {
        setMicroTasks(prev =>
            prev.map(task => (task.id === id ? { ...task, estimatedMinutes: minutes } : task))
        );
    }, []);

    // 保存任务
    const handleSave = useCallback(() => {
        if (!String(mainTitle).trim()) return;

        const validMicroTasks = microTasks.filter(mt => String(mt.title).trim());
        if (validMicroTasks.length === 0) return;

        const task: Task = existingTask
            ? {
                ...existingTask,
                title: String(mainTitle).trim(),
                microTasks: validMicroTasks.map(mt => createMicroTask(String(mt.title).trim(), mt.estimatedMinutes))
            }
            : {
                ...createTask(String(mainTitle).trim()),
                microTasks: validMicroTasks.map(mt => createMicroTask(String(mt.title).trim(), mt.estimatedMinutes))
            };

        onSave(task);
    }, [mainTitle, microTasks, existingTask, onSave]);

    // 验证是否可以保存
    const canSave = String(mainTitle).trim() && microTasks.some(mt => String(mt.title).trim());

    // 时间选项（1-15分钟）
    const timeOptions = [1, 2, 3, 5, 8, 10, 12, 15];

    return (
        <div className="task-decomposer">
            {/* 标题 */}
            <div className="decomposer-header">
                <h2 className="decomposer-title">📦 拆解大任务</h2>
                <p className="decomposer-hint">
                    将复杂任务分解为可在 15 分钟内完成的小步骤
                </p>
            </div>

            {/* 主任务输入 */}
            <input
                type="text"
                className="main-task-input"
                placeholder="输入你想完成的大目标..."
                value={String(mainTitle)}
                onChange={(e) => setMainTitle(e.target.value)}
                autoFocus
            />

            {/* 微任务列表 */}
            <div className="micro-tasks-section">
                <div className="micro-tasks-label">
                    <span>🧩 微任务列表</span>
                    <span className="micro-tasks-count">{microTasks.length} 个</span>
                </div>

                {microTasks.map((task, index) => (
                    <div key={task.id} className="micro-task-item">
                        <span style={{ color: 'var(--text-muted)', width: '24px' }}>
                            {index + 1}.
                        </span>
                        <input
                            type="text"
                            className="micro-task-input"
                            placeholder={`第 ${index + 1} 步：具体要做什么？`}
                            value={String(task.title)}
                            onChange={(e) => handleMicroTaskTitleChange(task.id, e.target.value)}
                        />
                        <div className="time-selector">
                            <select
                                value={task.estimatedMinutes}
                                onChange={(e) => handleMicroTaskTimeChange(task.id, Number(e.target.value))}
                            >
                                {timeOptions.map(min => (
                                    <option key={min} value={min}>{min} 分钟</option>
                                ))}
                            </select>
                        </div>
                        {microTasks.length > 1 && (
                            <button
                                className="micro-task-delete"
                                onClick={() => handleDeleteMicroTask(task.id)}
                                aria-label="删除此任务"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}

                {/* 添加按钮 */}
                <button className="add-micro-task-btn" onClick={handleAddMicroTask}>
                    <span>+</span>
                    <span>添加一个步骤</span>
                </button>

                {/* 时间提示 */}
                {totalMinutes > 60 && (
                    <div className="time-warning">
                        ⚠️ 总时长 {totalMinutes} 分钟，建议拆分为多个独立任务
                    </div>
                )}
            </div>

            {/* 操作按钮 */}
            <div className="decomposer-actions">
                {onCancel && (
                    <button className="decomposer-btn decomposer-btn-secondary" onClick={onCancel}>
                        取消
                    </button>
                )}
                <button
                    className="decomposer-btn decomposer-btn-primary"
                    onClick={handleSave}
                    disabled={!canSave}
                >
                    {existingTask ? '保存修改' : '创建任务'}（共 {totalMinutes} 分钟）
                </button>
            </div>
        </div>
    );
}

export default TaskDecomposer;
