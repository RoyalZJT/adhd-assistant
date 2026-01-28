/**
 * 认证上下文
 * 管理全局认证状态
 */
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService, User, LoginParams, RegisterParams } from '../services/auth-service';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;
    login: (params: LoginParams) => Promise<void>;
    register: (params: RegisterParams) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 初始化时检查登录状态
    useEffect(() => {
        const initAuth = async () => {
            try {
                const currentUser = await authService.getCurrentUser();
                setUser(currentUser);
            } catch (err) {
                console.error('认证初始化失败:', err);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback(async (params: LoginParams) => {
        setError(null);
        setIsLoading(true);

        try {
            const loggedInUser = await authService.login(params);
            setUser(loggedInUser);
        } catch (err: any) {
            // 终极保护：确保存入 error state 的永远是字符串
            const rawMsg = err.message || (typeof err === 'string' ? err : '登录失败');
            const safeMsg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
            setError(safeMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (params: RegisterParams) => {
        setError(null);
        setIsLoading(true);

        try {
            await authService.register(params);
            // 注册成功后自动登录
            const loggedInUser = await authService.login({
                email: params.email,
                password: params.password,
            });
            setUser(loggedInUser);
        } catch (err: any) {
            // 终极保护：确保存入 error state 的永远是字符串
            const rawMsg = err.message || (typeof err === 'string' ? err : '注册失败');
            const safeMsg = typeof rawMsg === 'string' ? rawMsg : JSON.stringify(rawMsg);
            setError(safeMsg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
        setError(null);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        logout,
        clearError,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * 使用认证上下文的 Hook
 */
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth 必须在 AuthProvider 内部使用');
    }
    return context;
}
