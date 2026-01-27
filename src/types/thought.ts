/**
 * 灵感记录接口 - 思维中转站
 */
export interface Thought {
    id: string;
    content: string;
    type: 'text' | 'voice'; // 记录方式：文字或语音
    createdAt: number;
    linkedTaskId?: string;  // 可关联到某个任务
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/**
 * 创建新的灵感记录
 */
export function createThought(content: string, type: 'text' | 'voice' = 'text'): Thought {
    return {
        id: generateId(),
        content,
        type,
        createdAt: Date.now()
    };
}
