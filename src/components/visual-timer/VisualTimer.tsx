import { useState, useEffect, useCallback, useMemo } from 'react';
import { VibrationPatterns, createPeriodicVibration } from '../../services';
import './VisualTimer.css';

interface VisualTimerProps {
    /** 总时长（秒） */
    duration: number;
    /** 是否正在运行 */
    isRunning: boolean;
    /** 计时结束回调 */
    onComplete?: () => void;
    /** 暂停/继续回调 */
    onToggle?: () => void;
    /** 重置回调 */
    onReset?: () => void;
}

/**
 * 视觉化计时器组件
 * 使用圆环动画展示时间流逝，禁止仅使用数字倒计时
 */
export function VisualTimer({
    duration,
    isRunning,
    onComplete,
    onToggle,
    onReset
}: VisualTimerProps) {
    const [remainingSeconds, setRemainingSeconds] = useState(duration);

    // 计算进度百分比（0-1）
    const progress = useMemo(() => {
        return Math.max(0, remainingSeconds / duration);
    }, [remainingSeconds, duration]);

    // 确定颜色状态：> 50% 绿色，20%-50% 黄色，< 20% 红色
    const colorState = useMemo(() => {
        if (progress > 0.5) return 'safe';
        if (progress > 0.2) return 'warning';
        return 'danger';
    }, [progress]);

    // 格式化时间显示
    const formattedTime = useMemo(() => {
        const mins = Math.floor(remainingSeconds / 60);
        const secs = remainingSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, [remainingSeconds]);

    // SVG 圆环参数
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference * (1 - progress);

    // 倒计时逻辑
    useEffect(() => {
        if (!isRunning || remainingSeconds <= 0) return;

        const timer = setInterval(() => {
            setRemainingSeconds(prev => {
                if (prev <= 1) {
                    VibrationPatterns.success();
                    onComplete?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isRunning, remainingSeconds, onComplete]);

    // 周期性震动提醒（体感时标）
    useEffect(() => {
        if (!isRunning) return;

        // 每 5 分钟震动一次
        const stopVibration = createPeriodicVibration(5 * 60 * 1000, 200);

        return () => stopVibration();
    }, [isRunning]);

    // 重置计时器
    const handleReset = useCallback(() => {
        setRemainingSeconds(duration);
        onReset?.();
    }, [duration, onReset]);

    // 生成粒子效果
    const particles = useMemo(() => {
        if (!isRunning) return null;
        return Array.from({ length: 6 }).map((_, i) => (
            <div
                key={i}
                className="timer-particle"
                style={{
                    left: `${50 + 40 * Math.cos((i / 6) * Math.PI * 2)}%`,
                    top: `${50 + 40 * Math.sin((i / 6) * Math.PI * 2)}%`,
                    animationDelay: `${i * 0.5}s`
                }}
            />
        ));
    }, [isRunning]);

    return (
        <div className="visual-timer">
            <div className="timer-ring-container">
                {/* SVG 圆环进度 */}
                <svg className="timer-ring" viewBox="0 0 280 280">
                    {/* 背景轨道 */}
                    <circle
                        className="timer-ring-background"
                        cx="140"
                        cy="140"
                        r={radius}
                    />
                    {/* 进度圆环 */}
                    <circle
                        className={`timer-ring-progress ${colorState}`}
                        cx="140"
                        cy="140"
                        r={radius}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>

                {/* 粒子效果 */}
                <div className="timer-particles">{particles}</div>

                {/* 中心时间显示 */}
                <div className="timer-center">
                    <div className="timer-time">{formattedTime}</div>
                    <div className="timer-label">
                        {isRunning ? '专注中' : remainingSeconds === duration ? '准备开始' : '已暂停'}
                    </div>
                </div>
            </div>

            {/* 控制按钮 */}
            <div className="timer-controls">
                <button
                    className="timer-btn timer-btn-secondary"
                    onClick={handleReset}
                    aria-label="重置计时器"
                >
                    ↻
                </button>
                <button
                    className="timer-btn timer-btn-primary"
                    onClick={onToggle}
                    aria-label={isRunning ? '暂停' : '开始'}
                >
                    {isRunning ? '⏸' : '▶'}
                </button>
            </div>
        </div>
    );
}

export default VisualTimer;
