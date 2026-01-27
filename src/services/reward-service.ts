/**
 * 奖励服务 - 多巴胺反馈系统
 * 提供任务完成时的音效和随机奖励机制
 */

// 音效类型
type SoundType = 'complete' | 'bonus' | 'levelup' | 'click';

// 奖励类型（变率奖励机制）
export interface Reward {
    id: string;
    type: 'common' | 'rare' | 'epic' | 'legendary';
    title: string;
    emoji: string;
    description: string;
    probability: number; // 触发概率
}

// 预设奖励池
const REWARD_POOL: Reward[] = [
    // 普通奖励 (60%)
    { id: 'star', type: 'common', title: '小星星', emoji: '⭐', description: '继续加油！', probability: 0.3 },
    { id: 'thumbsup', type: 'common', title: '点赞', emoji: '👍', description: '做得好！', probability: 0.3 },

    // 稀有奖励 (25%)
    { id: 'medal', type: 'rare', title: '奖章', emoji: '🏅', description: '你获得了一枚奖章！', probability: 0.15 },
    { id: 'trophy', type: 'rare', title: '小奖杯', emoji: '🏆', description: '太棒了！', probability: 0.1 },

    // 史诗奖励 (12%)
    { id: 'diamond', type: 'epic', title: '钻石', emoji: '💎', description: '闪耀！你是最棒的！', probability: 0.08 },
    { id: 'rocket', type: 'epic', title: '火箭', emoji: '🚀', description: '突破天际！', probability: 0.04 },

    // 传说奖励 (3%)
    { id: 'unicorn', type: 'legendary', title: '独角兽', emoji: '🦄', description: '传说中的独角兽出现了！', probability: 0.02 },
    { id: 'dragon', type: 'legendary', title: '神龙', emoji: '🐉', description: '神龙降临！今天是你的幸运日！', probability: 0.01 },
];

// 连击奖励加成
const COMBO_MULTIPLIERS = [1, 1.2, 1.5, 2, 3];

/**
 * 音效播放器
 */
class SoundPlayer {
    private enabled: boolean = true;
    private volume: number = 0.5;

    constructor() {
        // 检查用户偏好
        const savedEnabled = localStorage.getItem('adhd_sound_enabled');
        this.enabled = savedEnabled !== 'false';

        const savedVolume = localStorage.getItem('adhd_sound_volume');
        if (savedVolume) {
            this.volume = parseFloat(savedVolume);
        }
    }

    /**
     * 预加载音效（使用内置音频）
     */
    preload(): void {
        // 使用 Web Audio API 生成简单音效，避免外部文件依赖
        console.log('音效系统已初始化');
    }

    /**
     * 播放合成音效
     */
    play(type: SoundType): void {
        if (!this.enabled) return;

        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // 根据类型设置不同的音效
        switch (type) {
            case 'complete':
                // 完成音：上升的两个音符
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2); // G5
                gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.4);
                break;

            case 'bonus':
                // 奖励音：金币音效（高频闪烁）
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1047, audioContext.currentTime); // C6
                oscillator.frequency.setValueAtTime(1319, audioContext.currentTime + 0.05); // E6
                oscillator.frequency.setValueAtTime(1568, audioContext.currentTime + 0.1); // G6
                oscillator.frequency.setValueAtTime(2093, audioContext.currentTime + 0.15); // C7
                gainNode.gain.setValueAtTime(this.volume * 0.25, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.5);
                break;

            case 'levelup':
                // 升级音：胜利号角
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(392, audioContext.currentTime); // G4
                oscillator.frequency.setValueAtTime(523, audioContext.currentTime + 0.15); // C5
                oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.3); // E5
                oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.45); // G5
                gainNode.gain.setValueAtTime(this.volume * 0.2, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.8);
                break;

            case 'click':
                // 点击音：短促
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(this.volume * 0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.05);
                break;
        }
    }

    /**
     * 设置是否启用音效
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        localStorage.setItem('adhd_sound_enabled', String(enabled));
    }

    /**
     * 设置音量
     */
    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('adhd_sound_volume', String(this.volume));
    }

    isEnabled(): boolean {
        return this.enabled;
    }

    getVolume(): number {
        return this.volume;
    }
}



/**
 * 奖励系统
 */
class RewardSystem {
    private completedCount: number = 0;
    private comboCount: number = 0;
    private lastCompletionTime: number = 0;
    private earnedRewards: Reward[] = [];
    private soundPlayer: SoundPlayer;

    constructor() {
        this.soundPlayer = new SoundPlayer();
        this.loadState();
    }

    /**
     * 加载保存的状态
     */
    private loadState(): void {
        try {
            const savedState = localStorage.getItem('adhd_reward_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.completedCount = state.completedCount || 0;
                this.earnedRewards = state.earnedRewards || [];
            }
        } catch {
            console.error('加载奖励状态失败');
        }
    }

    /**
     * 保存状态
     */
    private saveState(): void {
        try {
            localStorage.setItem('adhd_reward_state', JSON.stringify({
                completedCount: this.completedCount,
                earnedRewards: this.earnedRewards,
            }));
        } catch {
            console.error('保存奖励状态失败');
        }
    }

    /**
     * 完成任务时触发奖励
     * @param isAllComplete 是否完成了所有微任务
     * @returns 获得的奖励（如果有）
     */
    triggerCompletion(isAllComplete: boolean = false): { reward: Reward | null; comboCount: number } {
        const now = Date.now();

        // 检查连击（5分钟内连续完成）
        if (now - this.lastCompletionTime < 5 * 60 * 1000) {
            this.comboCount = Math.min(this.comboCount + 1, COMBO_MULTIPLIERS.length - 1);
        } else {
            this.comboCount = 0;
        }

        this.lastCompletionTime = now;
        this.completedCount++;

        // 播放音效
        if (isAllComplete) {
            this.soundPlayer.play('levelup');
        } else {
            this.soundPlayer.play('complete');
        }

        // 计算是否获得奖励（变率奖励机制）
        const comboMultiplier = COMBO_MULTIPLIERS[this.comboCount];
        const baseChance = isAllComplete ? 0.5 : 0.3; // 全部完成时奖励概率更高
        const adjustedChance = baseChance * comboMultiplier;

        if (Math.random() < adjustedChance) {
            const reward = this.rollReward();
            if (reward) {
                this.earnedRewards.push(reward);
                this.soundPlayer.play('bonus');
                this.saveState();
            }
            return { reward, comboCount: this.comboCount };
        }

        this.saveState();
        return { reward: null, comboCount: this.comboCount };
    }

    /**
     * 随机抽取奖励
     */
    private rollReward(): Reward | null {
        const roll = Math.random();
        let cumulative = 0;

        for (const reward of REWARD_POOL) {
            cumulative += reward.probability;
            if (roll < cumulative) {
                return { ...reward };
            }
        }

        return REWARD_POOL[0]; // 默认返回普通奖励
    }

    /**
     * 获取统计数据
     */
    getStats(): { completedCount: number; earnedRewards: Reward[] } {
        return {
            completedCount: this.completedCount,
            earnedRewards: [...this.earnedRewards],
        };
    }

    /**
     * 获取音效播放器
     */
    getSoundPlayer(): SoundPlayer {
        return this.soundPlayer;
    }

    /**
     * 触发震动反馈（移动设备）
     */
    vibrate(pattern: number | number[] = 50): void {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }
}

// 导出单例
export const rewardSystem = new RewardSystem();
export type { SoundType };
