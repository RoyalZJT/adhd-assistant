/**
 * 宽恕按钮 - Fresh Start Modal
 * 当用户有大量逾期任务时，提供一键归档功能
 * 消除羞耻感，给予用户重新开始的机会
 */
import { useCallback } from 'react';
import './FreshStartModal.css';

interface FreshStartModalProps {
    /** 是否显示 */
    isOpen: boolean;
    /** 逾期任务数量 */
    overdueCount: number;
    /** 确认归档回调 */
    onConfirm: () => void;
    /** 关闭弹窗 */
    onClose: () => void;
}

/**
 * 宽恕模式弹窗
 * 核心理念：你的过去不定义你的现在
 */
export function FreshStartModal({
    isOpen,
    overdueCount,
    onConfirm,
    onClose,
}: FreshStartModalProps) {

    const handleConfirm = useCallback(() => {
        onConfirm();
        onClose();
    }, [onConfirm, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fresh-start-overlay" onClick={onClose}>
            <div className="fresh-start-modal" onClick={(e) => e.stopPropagation()}>
                {/* 温暖的图标 */}
                <div className="fresh-start-icon">
                    <span className="icon-emoji">🌱</span>
                    <div className="icon-glow" />
                </div>

                {/* 标题 */}
                <h2 className="fresh-start-title">
                    嘿，我注意到你有 {overdueCount} 个任务还没完成
                </h2>

                {/* 温暖的文案 */}
                <div className="fresh-start-message">
                    <p className="message-main">
                        <strong>没关系的。</strong>生活总是比计划复杂得多。
                    </p>
                    <p className="message-sub">
                        我们可以把这些任务暂时放进"冰柜"，给自己一个全新的开始。
                    </p>
                    <p className="message-quote">
                        「你的过去不定义你的现在」
                    </p>
                </div>

                {/* 操作按钮 */}
                <div className="fresh-start-actions">
                    <button
                        className="fresh-start-btn fresh-start-btn-primary"
                        onClick={handleConfirm}
                    >
                        <span className="btn-icon">❄️</span>
                        <span>放入冰柜，重新开始</span>
                    </button>
                    <button
                        className="fresh-start-btn fresh-start-btn-secondary"
                        onClick={onClose}
                    >
                        我想再试试
                    </button>
                </div>

                {/* 说明文字 */}
                <p className="fresh-start-note">
                    放入冰柜的任务不会消失，你随时可以取回它们
                </p>
            </div>
        </div>
    );
}

export default FreshStartModal;
