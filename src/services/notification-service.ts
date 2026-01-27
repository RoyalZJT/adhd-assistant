/**
 * 专注结界服务 - 通知管理
 * 在专注模式下管理系统通知
 */

// 检查通知权限状态
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) {
        return 'unsupported';
    }
    return Notification.permission;
}

// 请求通知权限
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!('Notification' in window)) {
        console.warn('Notification API not supported');
        return 'unsupported';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Failed to request notification permission:', error);
        return 'denied';
    }
}

// 发送通知
export function sendNotification(title: string, options?: NotificationOptions): Notification | null {
    if (getNotificationPermission() !== 'granted') {
        console.warn('Notification permission not granted');
        return null;
    }

    try {
        return new Notification(title, {
            icon: '/vite.svg',
            badge: '/vite.svg',
            ...options
        });
    } catch (error) {
        console.error('Failed to send notification:', error);
        return null;
    }
}

/**
 * 专注结界管理器
 * NOTE: Web API 无法真正屏蔽系统通知，只能在页面内提供专注提示
 */
export class FocusShield {
    private isActive: boolean = false;
    private focusStartTime: number = 0;

    // 激活专注结界
    async activate(): Promise<boolean> {
        // 请求通知权限（用于专注结束时的提醒）
        await requestNotificationPermission();

        this.isActive = true;
        this.focusStartTime = Date.now();

        // 发送专注开始通知
        sendNotification('专注模式已激活', {
            body: '开始专注，屏蔽干扰！',
            tag: 'focus-shield',
            silent: true
        });

        return true;
    }

    // 停用专注结界
    deactivate(): void {
        if (!this.isActive) return;

        const duration = Math.round((Date.now() - this.focusStartTime) / 60000);

        this.isActive = false;
        this.focusStartTime = 0;

        // 发送专注结束通知
        sendNotification('专注模式已结束', {
            body: `本次专注时长: ${duration} 分钟`,
            tag: 'focus-shield'
        });
    }

    // 获取当前状态
    getStatus(): { isActive: boolean; duration: number } {
        return {
            isActive: this.isActive,
            duration: this.isActive ? Date.now() - this.focusStartTime : 0
        };
    }
}

// 创建单例实例
export const focusShield = new FocusShield();
