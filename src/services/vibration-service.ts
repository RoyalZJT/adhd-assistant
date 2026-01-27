/**
 * 体感时标服务 - 周期性震动反馈
 * 使用 Vibration API 提供外部物理时间参考
 */

// 检查设备是否支持震动
export function isVibrationSupported(): boolean {
    return 'vibrate' in navigator;
}

// 触发单次轻微震动
export function vibrate(duration: number = 100): boolean {
    if (!isVibrationSupported()) {
        console.warn('Vibration API not supported');
        return false;
    }
    return navigator.vibrate(duration);
}

// 触发节奏震动模式
export function vibratePattern(pattern: number[]): boolean {
    if (!isVibrationSupported()) {
        console.warn('Vibration API not supported');
        return false;
    }
    return navigator.vibrate(pattern);
}

// 停止震动
export function stopVibration(): boolean {
    if (!isVibrationSupported()) {
        return false;
    }
    return navigator.vibrate(0);
}

/**
 * 创建周期性震动计时器
 * @param intervalMs 震动间隔（毫秒）
 * @param vibrationMs 震动持续时间（毫秒）
 * @returns 停止函数
 */
export function createPeriodicVibration(
    intervalMs: number = 5 * 60 * 1000, // 默认 5 分钟
    vibrationMs: number = 200
): () => void {
    if (!isVibrationSupported()) {
        console.warn('Vibration API not supported, periodic vibration disabled');
        return () => { };
    }

    const intervalId = setInterval(() => {
        // 使用双脉冲模式，更容易被感知
        vibratePattern([vibrationMs, 100, vibrationMs]);
    }, intervalMs);

    return () => {
        clearInterval(intervalId);
        stopVibration();
    };
}

/**
 * 预设震动模式
 */
export const VibrationPatterns = {
    // 轻微提醒 - 单次短振
    gentle: () => vibrate(100),

    // 标准提醒 - 双脉冲
    standard: () => vibratePattern([150, 100, 150]),

    // 紧急提醒 - 三连振
    urgent: () => vibratePattern([200, 100, 200, 100, 200]),

    // 完成庆祝 - 渐强模式
    success: () => vibratePattern([50, 50, 100, 50, 150, 50, 200])
};
