import React, { useState, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSend: (title: string, dueDate?: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
    const [text, setText] = useState('');

    const handleSend = () => {
        if (!text.trim()) return;

        let title = text.trim();
        let dueDate: string | undefined = undefined;

        // 极简 NLP 逻辑
        // 1. 日期关键词识别
        const datePatterns = [
            { regex: /(今天|今日)/i, date: () => new Date() },
            {
                regex: /(明天|明日)/i, date: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    return d;
                }
            },
            {
                regex: /(后天)/i, date: () => {
                    const d = new Date();
                    d.setDate(d.getDate() + 2);
                    return d;
                }
            },
            {
                regex: /周([一二三四五六日末]|1|2|3|4|5|6|7)/i, date: (match: string) => {
                    const map: Record<string, number> = { '一': 1, '1': 1, '二': 2, '2': 2, '三': 3, '3': 3, '四': 4, '4': 4, '五': 5, '5': 5, '六': 6, '6': 6, '日': 0, '末': 0, '7': 0 };
                    const targetDay = map[match[1]] ?? 1;
                    const d = new Date();
                    const currentDay = d.getDay();
                    let diff = targetDay - currentDay;
                    if (diff <= 0) diff += 7;
                    d.setDate(d.getDate() + diff);
                    return d;
                }
            }
        ];

        for (const pattern of datePatterns) {
            const match = title.match(pattern.regex);
            if (match) {
                const d = pattern.date(match[1]);
                dueDate = `${d.getMonth() + 1}月${d.getDate()}日`;
                // 移除命中的日期关键词，清理标题
                title = title.replace(pattern.regex, '').trim();
                break;
            }
        }

        onSend(title, dueDate);
        setText('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="chat-input-wrapper">
            <input
                type="text"
                className="chat-style-input"
                placeholder="输入你想做的事... 如：'明天下午开会'"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button className="chat-send-btn" onClick={handleSend} title="发送 (Enter)">
                <span style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}>✈️</span>
            </button>
        </div>
    );
};
