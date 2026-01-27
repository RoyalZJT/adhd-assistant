/**
 * 专注模式状态
 */
export interface FocusState {
    isActive: boolean;           // 是否处于专注模式
    currentTaskId: string | null; // 当前专注的任务 ID
    currentMicroTaskId: string | null; // 当前专注的微任务 ID
    startTime: number | null;    // 专注开始时间
    duration: number;            // 专注持续时间（毫秒）
    pausedTime: number;          // 暂停累计时间（毫秒）
}

/**
 * 专注会话记录 - 用于统计分析
 */
export interface FocusSession {
    id: string;
    taskId: string;
    microTaskId: string;
    startTime: number;
    endTime: number;
    duration: number;
    completed: boolean;
}

/**
 * 初始化专注状态
 */
export function createInitialFocusState(): FocusState {
    return {
        isActive: false,
        currentTaskId: null,
        currentMicroTaskId: null,
        startTime: null,
        duration: 0,
        pausedTime: 0
    };
}
