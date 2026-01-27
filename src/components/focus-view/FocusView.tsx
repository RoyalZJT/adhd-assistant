import { useState, useCallback, useEffect } from 'react';
import { MicroTask } from '../../types';
import { VisualTimer } from '../visual-timer';
import { VibrationPatterns, focusShield } from '../../services';
import './FocusView.css';

interface FocusViewProps {
    /** 当前任务标题 */
    taskTitle: string;
    /** 当前微任务 */
    microTask: MicroTask;
    /** 所有微任务（用于进度指示） */
    allMicroTasks: MicroTask[];
    /** 当前微任务索引 */
    currentIndex: number;
    /** 完成当前任务回调 */
    onComplete: () => void;
    /** 退出专注模式回调 */
    onExit: () => void;
}

/**
 * 单一焦点模式组件
 * 全屏显示当前任务，屏蔽所有干扰信息
 */
export function FocusView({
    taskTitle: _taskTitle,
    microTask,
    allMicroTasks,
    currentIndex,
    onComplete,
    onExit
}: FocusViewProps) {
    // 注意：taskTitle 在 props 中保留用于未来功能
    void _taskTitle;
    const [isRunning, setIsRunning] = useState(true);

    // 计算剩余时间（分钟转秒）
    const duration = microTask.estimatedMinutes * 60;

    // 激活专注结界
    useEffect(() => {
        focusShield.activate();
        return () => focusShield.deactivate();
    }, []);

    // 计时器控制
    const handleToggle = useCallback(() => {
        setIsRunning(prev => !prev);
    }, []);

    const handleReset = useCallback(() => {
        setIsRunning(false);
    }, []);

    // 计时完成
    const handleTimerComplete = useCallback(() => {
        VibrationPatterns.success();
        setIsRunning(false);
    }, []);

    // 完成任务
    const handleComplete = useCallback(() => {
        VibrationPatterns.success();
        onComplete();
    }, [onComplete]);

    return (
        <div className="focus-view">
            {/* 任务标题 */}
            <div className="focus-task-header">
                <div className="focus-task-label">当前任务</div>
                <h1 className="focus-task-title">{microTask.title}</h1>

                {/* 进度点 */}
                <div className="focus-progress-dots">
                    {allMicroTasks.map((task, index) => (
                        <div
                            key={task.id}
                            className={`focus-progress-dot ${task.status === 'completed' ? 'completed' :
                                index === currentIndex ? 'current' : ''
                                }`}
                            title={task.title}
                        />
                    ))}
                </div>
            </div>

            {/* 视觉计时器 */}
            <div className="focus-timer-area">
                <VisualTimer
                    duration={duration}
                    isRunning={isRunning}
                    onComplete={handleTimerComplete}
                    onToggle={handleToggle}
                    onReset={handleReset}
                />
            </div>

            {/* 底部操作 */}
            <div className="focus-actions">
                <button className="focus-btn focus-btn-exit" onClick={onExit}>
                    <span>✕</span>
                    <span>退出专注</span>
                </button>
                <button className="focus-btn focus-btn-complete" onClick={handleComplete}>
                    <span>✓</span>
                    <span>完成任务</span>
                </button>
            </div>
        </div>
    );
}

export default FocusView;
