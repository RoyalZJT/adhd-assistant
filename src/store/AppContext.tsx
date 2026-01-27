import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Task, MicroTask, Thought, FocusState, createInitialFocusState } from '../types';

// ============ State 定义 ============

interface AppState {
    tasks: Task[];
    thoughts: Thought[];
    focus: FocusState;
}

const initialState: AppState = {
    tasks: [],
    thoughts: [],
    focus: createInitialFocusState()
};

// ============ Action 类型 ============

type AppAction =
    // 任务相关
    | { type: 'ADD_TASK'; payload: Task }
    | { type: 'UPDATE_TASK'; payload: Task }
    | { type: 'DELETE_TASK'; payload: string }
    | { type: 'ADD_MICRO_TASK'; payload: { taskId: string; microTask: MicroTask } }
    | { type: 'UPDATE_MICRO_TASK'; payload: { taskId: string; microTask: MicroTask } }
    | { type: 'COMPLETE_MICRO_TASK'; payload: { taskId: string; microTaskId: string } }
    | { type: 'ARCHIVE_OVERDUE_TASKS' } // 宽恕按钮 - 归档逾期任务
    // 专注模式相关
    | { type: 'START_FOCUS'; payload: { taskId: string; microTaskId: string; duration: number } }
    | { type: 'PAUSE_FOCUS' }
    | { type: 'RESUME_FOCUS' }
    | { type: 'END_FOCUS' }
    // 灵感记录相关
    | { type: 'ADD_THOUGHT'; payload: Thought }
    | { type: 'DELETE_THOUGHT'; payload: string }
    | { type: 'PROCESS_THOUGHT'; payload: string } // 闪念胶囊 - 标记为已处理
    // 数据恢复
    | { type: 'LOAD_STATE'; payload: AppState };

// ============ Reducer ============

function appReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {
        // 任务操作
        case 'ADD_TASK':
            return { ...state, tasks: [...state.tasks, action.payload] };

        case 'UPDATE_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t => t.id === action.payload.id ? action.payload : t)
            };

        case 'DELETE_TASK':
            return {
                ...state,
                tasks: state.tasks.filter(t => t.id !== action.payload)
            };

        case 'ADD_MICRO_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.taskId
                        ? { ...t, microTasks: [...t.microTasks, action.payload.microTask] }
                        : t
                )
            };

        case 'UPDATE_MICRO_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.taskId
                        ? {
                            ...t,
                            microTasks: t.microTasks.map(mt =>
                                mt.id === action.payload.microTask.id ? action.payload.microTask : mt
                            )
                        }
                        : t
                )
            };

        case 'COMPLETE_MICRO_TASK':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.id === action.payload.taskId
                        ? {
                            ...t,
                            microTasks: t.microTasks.map(mt =>
                                mt.id === action.payload.microTaskId
                                    ? { ...mt, status: 'completed' as const, completedAt: Date.now() }
                                    : mt
                            )
                        }
                        : t
                )
            };

        // 宽恕按钮 - 将所有未完成的任务归档到“冰柜”
        case 'ARCHIVE_OVERDUE_TASKS':
            return {
                ...state,
                tasks: state.tasks.map(t =>
                    t.status !== 'completed' && !t.archivedAt
                        ? { ...t, archivedAt: Date.now() }
                        : t
                )
            };

        // 专注模式操作
        case 'START_FOCUS':
            return {
                ...state,
                focus: {
                    isActive: true,
                    currentTaskId: action.payload.taskId,
                    currentMicroTaskId: action.payload.microTaskId,
                    startTime: Date.now(),
                    duration: action.payload.duration,
                    pausedTime: 0
                }
            };

        case 'PAUSE_FOCUS':
            return {
                ...state,
                focus: { ...state.focus, isActive: false }
            };

        case 'RESUME_FOCUS':
            return {
                ...state,
                focus: { ...state.focus, isActive: true }
            };

        case 'END_FOCUS':
            return {
                ...state,
                focus: createInitialFocusState()
            };

        // 灵感记录操作
        case 'ADD_THOUGHT':
            return { ...state, thoughts: [action.payload, ...state.thoughts] };

        case 'DELETE_THOUGHT':
            return {
                ...state,
                thoughts: state.thoughts.filter(t => t.id !== action.payload)
            };

        // 闪念胶囊 - 标记为已处理
        case 'PROCESS_THOUGHT':
            return {
                ...state,
                thoughts: state.thoughts.map(t =>
                    t.id === action.payload
                        ? { ...t, status: 'processed' as const, processedAt: Date.now() }
                        : t
                )
            };

        // 数据恢复
        case 'LOAD_STATE':
            return action.payload;

        default:
            return state;
    }
}

// ============ Context ============

interface AppContextValue {
    state: AppState;
    dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

// ============ Provider ============

const STORAGE_KEY = 'adhd-assistant-state';

interface AppProviderProps {
    children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
    const [state, dispatch] = useReducer(appReducer, initialState);

    // 深度清洗函数：确保对象中没有嵌套的对象（除了数组），防止 React 渲染崩溃
    const deepSanitize = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return obj.map(deepSanitize);
        }

        const newObj: any = {};
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                // 如果值是对象且不是数组（和 null），这对于 Task 数据模型来说是非法的（除非是特定的已知结构）
                // 我们的数据模型中，Task 和 Though 只有非对象属性（除了 microTasks 数组）
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // 强制转为字符串，避免 React Error #31
                    console.warn(`Sanitizing illegal object in key "${key}":`, value);
                    newObj[key] = String(value);
                } else {
                    newObj[key] = deepSanitize(value);
                }
            }
        }
        return newObj;
    };

    // 数据迁移：为旧数据添加新字段的默认值
    const migrateState = (savedState: AppState): AppState => {
        let stateToMigrate: AppState = { ...savedState };

        try {
            // 针对 Task 和 Thoughts 列表进行单独清洗
            if (Array.isArray(savedState.tasks)) {
                stateToMigrate.tasks = savedState.tasks.map(deepSanitize);
            }
            if (Array.isArray(savedState.thoughts)) {
                stateToMigrate.thoughts = savedState.thoughts.map(deepSanitize);
            }
        } catch (e) {
            console.error('Sanitization failed', e);
            // 如果清洗失败，stateToMigrate 仍然包含所有数据，虽然可能包含坏数据
            // 但后续的 map 会提供基本保护
        }

        return {
            ...stateToMigrate,
            // 迁移 Thought 数据：确保 status 是字符串且有效
            thoughts: Array.isArray(stateToMigrate.thoughts) ? stateToMigrate.thoughts.map(t => ({
                ...t,
                status: (typeof t.status === 'string' && (t.status === 'inbox' || t.status === 'processed'))
                    ? t.status
                    : 'inbox',
            })) : [],
            // 迁移 Task 数据：确保有 archivedAt 字段
            tasks: Array.isArray(stateToMigrate.tasks) ? stateToMigrate.tasks.map(task => ({
                ...task,
                archivedAt: task.archivedAt ?? undefined,
                dueDate: task.dueDate ?? undefined,
            })) : [],
        };
    };

    // 从 LocalStorage 恢复数据
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // 执行数据迁移
                const migrated = migrateState(parsed);
                dispatch({ type: 'LOAD_STATE', payload: migrated });
            }
        } catch (error) {
            console.error('Failed to load state from localStorage:', error);
            // 如果加载失败，清除可能损坏的数据
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    // 状态变化时保存到 LocalStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save state to localStorage:', error);
        }
    }, [state]);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            {children}
        </AppContext.Provider>
    );
}

// ============ Hook ============

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}

export type { AppState, AppAction };
