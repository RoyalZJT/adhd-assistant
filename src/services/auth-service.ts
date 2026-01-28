/**
 * 认证服务
 * 处理用户登录、注册、登出等操作
 */
import { apiClient, tokenManager, ApiError, formatApiError } from './api-client';

/**
 * 用户信息类型
 */
export interface User {
    id: string;
    email: string;
    username: string | null;
    isActive: boolean;
    createdAt: string;
}

/**
 * 登录响应类型
 */
interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

/**
 * 用户响应类型（后端返回格式）
 */
interface UserResponse {
    id: string;
    email: string;
    username: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * 注册请求参数
 */
export interface RegisterParams {
    email: string;
    password: string;
    username?: string;
}

/**
 * 登录请求参数
 */
export interface LoginParams {
    email: string;
    password: string;
}

/**
 * 将后端用户响应转换为前端用户对象
 */
function mapUserResponse(response: UserResponse): User {
    return {
        id: response.id,
        email: response.email,
        username: response.username,
        isActive: response.is_active,
        createdAt: response.created_at,
    };
}

/**
 * 认证服务
 */
export const authService = {
    /**
     * 用户注册
     */
    register: async (params: RegisterParams): Promise<void> => {
        await apiClient.post('/api/auth/register', params);
    },

    /**
     * 用户登录
     * NOTE: 后端使用 OAuth2 标准，需要 form-urlencoded 格式
     */
    login: async (params: LoginParams): Promise<User> => {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

        // 使用 URLSearchParams 构建 form-data
        const formData = new URLSearchParams();
        formData.append('username', params.email);
        formData.append('password', params.password);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = formatApiError(errorData);
            throw new ApiError(response.status, errorMessage);
        }

        const data: LoginResponse = await response.json();

        // 保存 Token
        tokenManager.setTokens(data.access_token, data.refresh_token);

        // 获取用户信息
        const userResponse = await apiClient.get<UserResponse>('/api/auth/me');
        return mapUserResponse(userResponse);
    },

    /**
     * 登出
     */
    logout: (): void => {
        tokenManager.clearTokens();
    },

    /**
     * 获取当前用户
     */
    getCurrentUser: async (): Promise<User | null> => {
        if (!tokenManager.hasTokens()) {
            return null;
        }

        try {
            const response = await apiClient.get<UserResponse>('/api/auth/me');
            return mapUserResponse(response);
        } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
                tokenManager.clearTokens();
                return null;
            }
            throw error;
        }
    },

    /**
     * 更新用户信息
     */
    updateUser: async (data: { username?: string }): Promise<User> => {
        const response = await apiClient.put<UserResponse>('/api/auth/me', data);
        return mapUserResponse(response);
    },

    /**
     * 检查是否已登录
     */
    isAuthenticated: (): boolean => {
        return tokenManager.hasTokens();
    },
};

export { ApiError };
