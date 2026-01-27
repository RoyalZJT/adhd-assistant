/**
 * API 客户端
 * 封装 HTTP 请求，处理认证 Token
 */

// API 基础 URL - 需要根据实际部署地址修改
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token 存储键名
const ACCESS_TOKEN_KEY = 'adhd_access_token';
const REFRESH_TOKEN_KEY = 'adhd_refresh_token';

/**
 * Token 管理
 */
export const tokenManager = {
    getAccessToken: (): string | null => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    },

    getRefreshToken: (): string | null => {
        return localStorage.getItem(REFRESH_TOKEN_KEY);
    },

    setTokens: (accessToken: string, refreshToken: string): void => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    },

    clearTokens: (): void => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    },

    hasTokens: (): boolean => {
        return !!localStorage.getItem(ACCESS_TOKEN_KEY);
    },
};

/**
 * API 错误类
 */
export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public detail?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * 发起 API 请求
 * 自动处理 Token 和错误
 */
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // 添加认证头
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // 处理 401 错误 - 尝试刷新 Token
    if (response.status === 401 && tokenManager.getRefreshToken()) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
            // 重试原请求
            const newAccessToken = tokenManager.getAccessToken();
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            const retryResponse = await fetch(url, { ...options, headers });

            if (!retryResponse.ok) {
                const error = await retryResponse.json().catch(() => ({}));
                throw new ApiError(retryResponse.status, '请求失败', error.detail);
            }

            return retryResponse.json();
        } else {
            // 刷新失败，清除 Token
            tokenManager.clearTokens();
            throw new ApiError(401, '登录已过期，请重新登录');
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.detail || '请求失败', error.detail);
    }

    return response.json();
}

/**
 * 尝试刷新 Token
 */
async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            tokenManager.setTokens(data.access_token, data.refresh_token);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * API 客户端
 */
export const apiClient = {
    get: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint, { method: 'GET' });
    },

    post: <T>(endpoint: string, data?: unknown): Promise<T> => {
        return request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    put: <T>(endpoint: string, data?: unknown): Promise<T> => {
        return request<T>(endpoint, {
            method: 'PUT',
            body: data ? JSON.stringify(data) : undefined,
        });
    },

    delete: <T>(endpoint: string): Promise<T> => {
        return request<T>(endpoint, { method: 'DELETE' });
    },
};
