/**
 * 语音输入服务 - 封装 Web Speech API
 * 用于思维中转站的语音快捷记录
 */

// 检查浏览器是否支持语音识别
export function isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
        ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}

// 使用 any 类型简化处理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

// 获取 SpeechRecognition 构造函数
function getSpeechRecognitionClass(): (new () => SpeechRecognitionType) | null {
    if (typeof window === 'undefined') return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;

    if ('SpeechRecognition' in window) {
        return win.SpeechRecognition;
    }
    if ('webkitSpeechRecognition' in window) {
        return win.webkitSpeechRecognition;
    }
    return null;
}

export interface SpeechRecognitionResultData {
    transcript: string;
    confidence: number;
}

export interface SpeechRecognitionCallbacks {
    onResult: (result: SpeechRecognitionResultData) => void;
    onError?: (error: string) => void;
    onStart?: () => void;
    onEnd?: () => void;
}

/**
 * 创建语音识别实例
 */
export function createSpeechRecognition(callbacks: SpeechRecognitionCallbacks): {
    start: () => void;
    stop: () => void;
    isSupported: boolean;
} {
    const RecognitionClass = getSpeechRecognitionClass();

    if (!RecognitionClass) {
        return {
            start: () => callbacks.onError?.('语音识别不被当前浏览器支持'),
            stop: () => { },
            isSupported: false
        };
    }

    const recognition = new RecognitionClass();

    // 配置语音识别
    recognition.continuous = false;      // 单次识别
    recognition.interimResults = false;  // 只返回最终结果
    recognition.lang = 'zh-CN';          // 中文识别

    // 事件处理
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
        const result = event.results[0][0];
        callbacks.onResult({
            transcript: result.transcript,
            confidence: result.confidence
        });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
        const errorMessages: Record<string, string> = {
            'no-speech': '未检测到语音输入',
            'audio-capture': '无法访问麦克风',
            'not-allowed': '麦克风权限被拒绝',
            'network': '网络连接错误',
            'aborted': '语音识别被中止'
        };
        callbacks.onError?.(errorMessages[event.error] || `语音识别错误: ${event.error}`);
    };

    recognition.onstart = () => callbacks.onStart?.();
    recognition.onend = () => callbacks.onEnd?.();

    return {
        start: () => {
            try {
                recognition.start();
            } catch {
                callbacks.onError?.('无法启动语音识别');
            }
        },
        stop: () => {
            try {
                recognition.stop();
            } catch {
                // 忽略停止错误
            }
        },
        isSupported: true
    };
}
