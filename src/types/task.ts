/**
 * 任务状态枚举
 * pending: 待开始 | active: 进行中 | completed: 已完成 | paused: 已暂停
 */
export type TaskStatus = 'pending' | 'active' | 'completed' | 'paused';

/**
 * 微任务接口 - 拆解后的原子化任务
 * 每个微任务耗时应 < 15 分钟
 */
export interface MicroTask {
    id: string;
    title: string;
    estimatedMinutes: number; // 预估时间（分钟），最大 15
    status: TaskStatus;
    createdAt: number;
    completedAt?: number;
}

/**
 * 主任务接口 - 包含多个微任务
 */
export interface Task {
    id: string;
    title: string;
    description?: string;
    microTasks: MicroTask[];
    status: TaskStatus;
    createdAt: number;
    completedAt?: number;
    /** 截止日期（时间戳或格式化字符串） */
    dueDate?: number | string;
    /** 归档时间戳 - 放入"冰柜"的时间 */
    archivedAt?: number;
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * 创建新的微任务
 */
export function createMicroTask(title: string, estimatedMinutes: number = 15): MicroTask {
    return {
        id: generateId(),
        title,
        estimatedMinutes: Math.min(estimatedMinutes, 15), // 强制限制 15 分钟
        status: 'pending',
        createdAt: Date.now()
    };
}

/**
 * 创建新的主任务
 */
export function createTask(title: string, description?: string): Task {
    return {
        id: generateId(),
        title,
        description,
        microTasks: [],
        status: 'pending',
        createdAt: Date.now()
    };
}
