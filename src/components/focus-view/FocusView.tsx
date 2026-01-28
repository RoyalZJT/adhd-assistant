import { useState, useCallback, useEffect } from 'react';
import { MicroTask } from '../../types';
import { VisualTimer } from '../visual-timer';
import { CelebrationOverlay } from '../celebration';
import { VibrationPatterns, focusShield, rewardSystem, Reward } from '../../services';
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
 * 集成多巴胺反馈系统
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

    // 庆祝动画状态
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationReward, setCelebrationReward] = useState<Reward | null>(null);
    const [comboCount, setComboCount] = useState(0);
    const [isAllComplete, setIsAllComplete] = useState(false);

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

    // 完成任务 - 触发多巴胺反馈
    const handleComplete = useCallback(() => {
        // 检查是否是最后一个任务
        const pendingTasks = allMicroTasks.filter(t => t.status !== 'completed');
        const willBeAllComplete = pendingTasks.length <= 1; // 当前这个完成后就全部完成

        // 触发奖励系统
        const { reward, comboCount: combo } = rewardSystem.triggerCompletion(willBeAllComplete);

        // 震动反馈
        VibrationPatterns.success();
        if (willBeAllComplete) {
            rewardSystem.vibrate([100, 50, 100, 50, 200]); // 强力震动
        }

        // 设置庆祝状态
        setCelebrationReward(reward);
        setComboCount(combo);
        setIsAllComplete(willBeAllComplete);
        setShowCelebration(true);
    }, [allMicroTasks]);

    // 庆祝动画结束后执行实际的完成逻辑
    const handleCelebrationClose = useCallback(() => {
        setShowCelebration(false);
        setCelebrationReward(null);
        onComplete();
    }, [onComplete]);

    return (
        <div className="focus-view">
            {/* 任务标题 */}
            <div className="focus-task-header">
                <div className="focus-task-label">当前任务</div>
                <h1 className="focus-task-title">{String(microTask.title)}</h1>

                {/* 进度点 */}
                <div className="focus-progress-dots">
                    {allMicroTasks.map((task, index) => (
                        <div
                            key={task.id}
                            className={`focus-progress-dot ${task.status === 'completed' ? 'completed' :
                                index === currentIndex ? 'current' : ''
                                }`}
                            title={String(task.title)}
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

            {/* 庆祝动画覆盖层 */}
            <CelebrationOverlay
                isVisible={showCelebration}
                reward={celebrationReward}
                comboCount={comboCount}
                isAllComplete={isAllComplete}
                onClose={handleCelebrationClose}
            />
        </div>
    );
}

export default FocusView;
