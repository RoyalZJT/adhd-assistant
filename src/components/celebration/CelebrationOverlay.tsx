/**
 * 庆祝动画覆盖层
 * 完成任务时的多巴胺反馈动画
 */
import { useEffect, useState, useCallback } from 'react';
import { Reward } from '../../services/reward-service';
import './CelebrationOverlay.css';

interface CelebrationOverlayProps {
    /** 是否显示 */
    isVisible: boolean;
    /** 获得的奖励 */
    reward: Reward | null;
    /** 连击数 */
    comboCount: number;
    /** 是否完成全部任务 */
    isAllComplete?: boolean;
    /** 关闭回调 */
    onClose: () => void;
}

// 彩带粒子类型
interface Confetti {
    id: number;
    x: number;
    color: string;
    delay: number;
    rotation: number;
}

// 火花粒子类型
interface Spark {
    id: number;
    angle: number;
    distance: number;
    size: number;
    color: string;
}

/**
 * 庆祝动画覆盖层组件
 */
export function CelebrationOverlay({
    isVisible,
    reward,
    comboCount,
    isAllComplete = false,
    onClose,
}: CelebrationOverlayProps) {
    const [confetti, setConfetti] = useState<Confetti[]>([]);
    const [sparks, setSparks] = useState<Spark[]>([]);
    const [showReward, setShowReward] = useState(false);

    // 生成彩带
    const generateConfetti = useCallback(() => {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        const newConfetti: Confetti[] = [];

        const count = isAllComplete ? 60 : 30;

        for (let i = 0; i < count; i++) {
            newConfetti.push({
                id: i,
                x: Math.random() * 100,
                color: colors[Math.floor(Math.random() * colors.length)],
                delay: Math.random() * 0.5,
                rotation: Math.random() * 360,
            });
        }

        setConfetti(newConfetti);
    }, [isAllComplete]);

    // 生成火花
    const generateSparks = useCallback(() => {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1'];
        const newSparks: Spark[] = [];

        const count = isAllComplete ? 24 : 12;

        for (let i = 0; i < count; i++) {
            newSparks.push({
                id: i,
                angle: (360 / count) * i,
                distance: 50 + Math.random() * 50,
                size: 3 + Math.random() * 4,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }

        setSparks(newSparks);
    }, [isAllComplete]);

    // 显示时触发动画
    useEffect(() => {
        if (isVisible) {
            generateConfetti();
            generateSparks();

            // 延迟显示奖励
            if (reward) {
                setTimeout(() => setShowReward(true), 300);
            }

            // 自动关闭
            const timer = setTimeout(() => {
                onClose();
            }, reward ? 3000 : 1500);

            return () => clearTimeout(timer);
        } else {
            setShowReward(false);
            setConfetti([]);
            setSparks([]);
        }
    }, [isVisible, reward, generateConfetti, generateSparks, onClose]);

    if (!isVisible) return null;

    // 根据奖励类型获取样式类
    const getRewardClass = (type: Reward['type']) => {
        switch (type) {
            case 'legendary': return 'reward-legendary';
            case 'epic': return 'reward-epic';
            case 'rare': return 'reward-rare';
            default: return 'reward-common';
        }
    };

    return (
        <div className="celebration-overlay" onClick={onClose}>
            {/* 彩带雨 */}
            <div className="confetti-container">
                {confetti.map((c) => (
                    <div
                        key={c.id}
                        className="confetti"
                        style={{
                            left: `${c.x}%`,
                            backgroundColor: c.color,
                            animationDelay: `${c.delay}s`,
                            transform: `rotate(${c.rotation}deg)`,
                        }}
                    />
                ))}
            </div>

            {/* 中心效果 */}
            <div className="celebration-center">
                {/* 火花爆炸 */}
                <div className="sparks-container">
                    {sparks.map((s) => (
                        <div
                            key={s.id}
                            className="spark"
                            style={{
                                '--angle': `${s.angle}deg`,
                                '--distance': `${s.distance}px`,
                                width: `${s.size}px`,
                                height: `${s.size}px`,
                                backgroundColor: s.color,
                            } as React.CSSProperties}
                        />
                    ))}
                </div>

                {/* 完成文字 */}
                <div className={`celebration-text ${isAllComplete ? 'all-complete' : ''}`}>
                    {isAllComplete ? (
                        <>
                            <span className="celebration-emoji">🎉</span>
                            <span className="celebration-title">全部完成！</span>
                            <span className="celebration-subtitle">你太棒了！</span>
                        </>
                    ) : (
                        <>
                            <span className="celebration-emoji">✨</span>
                            <span className="celebration-title">完成！</span>
                        </>
                    )}
                </div>

                {/* 连击显示 */}
                {comboCount > 0 && (
                    <div className="combo-display">
                        <span className="combo-count">{comboCount + 1}x</span>
                        <span className="combo-text">连击！</span>
                    </div>
                )}

                {/* 奖励弹出 */}
                {reward && showReward && (
                    <div className={`reward-popup ${getRewardClass(reward.type)}`}>
                        <div className="reward-glow" />
                        <span className="reward-emoji">{reward.emoji}</span>
                        <div className="reward-info">
                            <span className="reward-title">{reward.title}</span>
                            <span className="reward-desc">{reward.description}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CelebrationOverlay;
