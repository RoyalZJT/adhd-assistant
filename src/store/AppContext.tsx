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
    // 专注模式相关
    | { type: 'START_FOCUS'; payload: { taskId: string; microTaskId: string; duration: number } }
    | { type: 'PAUSE_FOCUS' }
    | { type: 'RESUME_FOCUS' }
    | { type: 'END_FOCUS' }
    // 灵感记录相关
    | { type: 'ADD_THOUGHT'; payload: Thought }
    | { type: 'DELETE_THOUGHT'; payload: string }
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

    // 从 LocalStorage 恢复数据
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                dispatch({ type: 'LOAD_STATE', payload: parsed });
            }
        } catch (error) {
            console.error('Failed to load state from localStorage:', error);
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
