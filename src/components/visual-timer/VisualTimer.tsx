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
 * 视觉化计时器组件 - Time Timer 风格
 * 使用圆盘填充动画展示时间流逝，让时间"看得见"
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

    // 是否处于紧急状态（最后 20%）
    const isUrgent = progress <= 0.2 && isRunning;

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

    // 圆盘扇形角度（Time Timer 风格）
    const pieAngle = progress * 360;

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
        return Array.from({ length: 8 }).map((_, i) => (
            <div
                key={i}
                className="timer-particle"
                style={{
                    left: `${50 + 42 * Math.cos((i / 8) * Math.PI * 2)}%`,
                    top: `${50 + 42 * Math.sin((i / 8) * Math.PI * 2)}%`,
                    animationDelay: `${i * 0.4}s`
                }}
            />
        ));
    }, [isRunning]);

    return (
        <div className={`visual-timer ${isUrgent ? 'urgent' : ''}`}>
            <div className="timer-ring-container">
                {/* Time Timer 风格的圆盘填充 */}
                <svg className="timer-pie" viewBox="0 0 280 280">
                    <defs>
                        <linearGradient id="pieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={
                                colorState === 'safe' ? 'var(--neon-green)' :
                                    colorState === 'warning' ? 'var(--warning)' : 'var(--danger)'
                            } stopOpacity="0.8" />
                            <stop offset="100%" stopColor={
                                colorState === 'safe' ? 'hsl(150, 100%, 40%)' :
                                    colorState === 'warning' ? 'hsl(35, 100%, 50%)' : 'hsl(0, 100%, 40%)'
                            } stopOpacity="0.6" />
                        </linearGradient>
                    </defs>
                    {/* 圆盘扇形 - 表示剩余时间 */}
                    <path
                        className={`timer-pie-fill ${colorState}`}
                        d={describeArc(140, 140, 115, 0, pieAngle)}
                        fill="url(#pieGradient)"
                    />
                </svg>

                {/* SVG 圆环进度（外圈） */}
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

                {/* 脉动光晕（紧急状态） */}
                {isUrgent && <div className="timer-pulse-ring" />}

                {/* 中心时间显示 */}
                <div className="timer-center">
                    <div className={`timer-time ${isUrgent ? 'urgent-text' : ''}`}>
                        {formattedTime}
                    </div>
                    <div className="timer-label">
                        {isRunning ? (isUrgent ? '⚡ 快没时间了！' : '专注中') :
                            remainingSeconds === duration ? '准备开始' : '已暂停'}
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

/**
 * 生成 SVG 扇形路径
 * 用于 Time Timer 风格的圆盘填充
 */
function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
    if (endAngle <= 0) return '';
    if (endAngle >= 360) {
        // 完整圆
        return `M ${x} ${y - radius} A ${radius} ${radius} 0 1 1 ${x - 0.001} ${y - radius} Z`;
    }

    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
        'M', x, y,
        'L', start.x, start.y,
        'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        'Z'
    ].join(' ');
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
        x: centerX + radius * Math.cos(angleInRadians),
        y: centerY + radius * Math.sin(angleInRadians)
    };
}

export default VisualTimer;

