/**
 * 闪念胶囊状态
 * inbox: 暂存箱，未处理
 * processed: 已整理/转化为任务
 */
export type ThoughtStatus = 'inbox' | 'processed';

/**
 * 灵感记录接口 - 闪念胶囊
 */
export interface Thought {
    id: string;
    content: string;
    type: 'text' | 'voice'; // 记录方式：文字或语音
    status: ThoughtStatus;  // 状态：暂存箱/已处理
    createdAt: number;
    processedAt?: number;   // 处理时间
    linkedTaskId?: string;  // 可关联到某个任务
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * 创建新的灵感记录 - 默认进入暂存箱
 */
export function createThought(content: string, type: 'text' | 'voice' = 'text'): Thought {
    return {
        id: generateId(),
        content,
        type,
        status: 'inbox', // 默认进入暂存箱
        createdAt: Date.now()
    };
}
