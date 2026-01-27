import { useState, useCallback, useEffect, useRef } from 'react';
import { Thought, createThought } from '../../types';
import { isSpeechRecognitionSupported } from '../../services';
import './ThoughtSandbox.css';

interface ThoughtSandboxProps {
    /** 保存的灵感列表 */
    thoughts: Thought[];
    /** 添加灵感回调 */
    onAddThought: (thought: Thought) => void;
    /** 删除灵感回调 */
    onDeleteThought?: (id: string) => void;
}

// 使用 any 类型简化 SpeechRecognition 的处理
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

/**
 * 获取 SpeechRecognition 构造函数
 */
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

/**
 * 思维中转站组件
 * 支持一键（语音或快捷输入）记录突发灵感
 */
export function ThoughtSandbox({
    thoughts,
    onAddThought,
}: ThoughtSandboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showList, setShowList] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // 使用 ref 保存 recognition 实例，避免重复创建
    const recognitionRef = useRef<SpeechRecognitionType | null>(null);

    // 语音识别支持检查
    const speechSupported = isSpeechRecognitionSupported();

    // 初始化语音识别实例
    useEffect(() => {
        if (!speechSupported) return;

        const RecognitionClass = getSpeechRecognitionClass();
        if (!RecognitionClass) return;

        const recognition = new RecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'zh-CN';
        recognition.maxAlternatives = 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                }
            }

            if (finalTranscript) {
                setInputValue(prev => prev + finalTranscript);
            }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onerror = (event: any) => {
            console.error('语音识别错误:', event.error);
            const errorMessages: Record<string, string> = {
                'no-speech': '未检测到语音，请对着麦克风说话',
                'audio-capture': '无法访问麦克风，请检查设备',
                'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
                'network': '网络连接错误，语音识别需要联网',
                'aborted': '语音识别被中止',
                'service-not-allowed': '语音服务不可用'
            };
            setErrorMessage(errorMessages[event.error] || `语音识别错误: ${event.error}`);
            setIsRecording(false);
        };

        recognition.onstart = () => {
            setIsRecording(true);
            setErrorMessage(null);
        };

        recognition.onend = () => {
            setIsRecording(false);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch {
                    // 忽略
                }
            }
        };
    }, [speechSupported]);

    // 语音识别切换
    const handleVoiceInput = useCallback(() => {
        if (!speechSupported) {
            setErrorMessage('您的浏览器不支持语音识别，请使用 Chrome 或 Edge');
            return;
        }

        if (!recognitionRef.current) {
            setErrorMessage('语音识别初始化失败');
            return;
        }

        // 检查是否在安全上下文中（HTTPS 或 localhost）
        if (!window.isSecureContext) {
            setErrorMessage('语音识别需要 HTTPS 或 localhost 环境');
            return;
        }

        try {
            if (isRecording) {
                recognitionRef.current.stop();
            } else {
                recognitionRef.current.start();
            }
        } catch (error) {
            console.error('语音操作失败:', error);
            setErrorMessage('语音识别启动失败，请重试');
            setIsRecording(false);
        }
    }, [speechSupported, isRecording]);

    // 清除错误消息
    useEffect(() => {
        if (errorMessage) {
            const timer = setTimeout(() => setErrorMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage]);

    // 保存灵感
    const handleSave = useCallback(() => {
        if (!inputValue.trim()) return;

        const thought = createThought(inputValue.trim(), isRecording ? 'voice' : 'text');
        onAddThought(thought);
        setInputValue('');
        setIsOpen(false);
    }, [inputValue, isRecording, onAddThought]);

    // 键盘快捷键
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setShowList(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 格式化时间
    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} 小时前`;
        return date.toLocaleDateString('zh-CN');
    };

    return (
        <>
            {/* 浮动按钮 */}
            <button
                className={`thought-fab ${isRecording ? 'recording' : ''}`}
                onClick={() => setIsOpen(true)}
                onContextMenu={(e) => {
                    e.preventDefault();
                    setShowList(!showList);
                }}
                aria-label="记录灵感"
                title="点击记录灵感，右键查看历史"
            >
                💡
            </button>

            {/* 灵感输入弹窗 */}
            {isOpen && (
                <div className="thought-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="thought-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="thought-modal-header">
                            <h3 className="thought-modal-title">💡 记录灵感</h3>
                            <button
                                className="thought-modal-close"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>
                        </div>

                        {/* 错误提示 */}
                        {errorMessage && (
                            <div className="thought-error">
                                ⚠️ {errorMessage}
                            </div>
                        )}

                        <div className="thought-input-area">
                            <textarea
                                className="thought-textarea"
                                placeholder="突然想到什么？快记下来！"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        handleSave();
                                    }
                                }}
                            />
                            <button
                                className={`thought-voice-btn ${isRecording ? 'active' : ''} ${!speechSupported ? 'disabled' : ''}`}
                                onClick={handleVoiceInput}
                                title={
                                    !speechSupported ? '浏览器不支持语音识别' :
                                        isRecording ? '点击停止录音' : '点击开始语音输入'
                                }
                            >
                                {isRecording ? '🔴' : '🎤'}
                            </button>
                        </div>

                        {/* 录音状态提示 */}
                        {isRecording && (
                            <div className="thought-recording-hint">
                                🎙️ 正在录音，请说话...
                            </div>
                        )}

                        <button
                            className="thought-save-btn"
                            onClick={handleSave}
                            disabled={!inputValue.trim()}
                        >
                            保存灵感 (Ctrl + Enter)
                        </button>
                    </div>
                </div>
            )}

            {/* 灵感列表 */}
            {showList && thoughts.length > 0 && (
                <div className="thoughts-list">
                    <div className="thoughts-list-header">
                        最近的灵感 ({thoughts.length})
                    </div>
                    {thoughts.slice(0, 10).map((thought) => (
                        <div key={thought.id} className="thought-item">
                            <div className="thought-content">{thought.content}</div>
                            <div className="thought-meta">
                                <span className="thought-type-badge">
                                    {thought.type === 'voice' ? '🎤' : '✏️'}
                                    {thought.type === 'voice' ? '语音' : '文字'}
                                </span>
                                <span>{formatTime(thought.createdAt)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
}

export default ThoughtSandbox;
