import { useState } from 'react';
import './DownloadModal.css';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = 'android' | 'ios' | 'desktop';

interface InstallStep {
    text: string;
    highlight?: string;
}

const installSteps: Record<Platform, InstallStep[]> = {
    android: [
        { text: '使用 Chrome 浏览器打开此网页' },
        { text: '点击浏览器右上角', highlight: '菜单按钮 (⋮)' },
        { text: '选择', highlight: '"添加到主屏幕"' },
        { text: '点击', highlight: '"安装"', },
        { text: '完成！在桌面找到 ADHD助手 图标启动' }
    ],
    ios: [
        { text: '使用 Safari 浏览器打开此网页' },
        { text: '点击底部', highlight: '分享按钮 (↑)' },
        { text: '向下滑动，找到并点击', highlight: '"添加到主屏幕"' },
        { text: '点击右上角', highlight: '"添加"' },
        { text: '完成！在主屏幕找到 ADHD助手 图标启动' }
    ],
    desktop: [
        { text: '使用 Chrome 或 Edge 浏览器打开此网页' },
        { text: '点击地址栏右侧的', highlight: '安装图标 (⊕)' },
        { text: '在弹出的对话框中点击', highlight: '"安装"' },
        { text: '完成！应用将作为独立窗口运行' }
    ]
};

const platforms = [
    { id: 'android' as Platform, icon: '🤖', name: 'Android', desc: 'Chrome 浏览器' },
    { id: 'ios' as Platform, icon: '🍎', name: 'iPhone / iPad', desc: 'Safari 浏览器' },
    { id: 'desktop' as Platform, icon: '💻', name: '电脑桌面', desc: 'Chrome / Edge' }
];

/**
 * 下载安装指南模态框
 */
export function DownloadModal({ isOpen, onClose }: DownloadModalProps) {
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

    if (!isOpen) return null;

    const handlePlatformSelect = (platform: Platform) => {
        setSelectedPlatform(platform);
    };

    const handleBack = () => {
        setSelectedPlatform(null);
    };

    return (
        <div className="download-modal-overlay" onClick={onClose}>
            <div className="download-modal" onClick={(e) => e.stopPropagation()}>
                <button className="download-close-btn" onClick={onClose}>
                    ✕
                </button>

                <div className="download-header">
                    <div className="download-icon">📲</div>
                    <h2 className="download-title">安装 ADHD 助手</h2>
                    <p className="download-subtitle">
                        {selectedPlatform
                            ? '按照以下步骤安装到您的设备'
                            : '选择您的设备类型'
                        }
                    </p>
                </div>

                {!selectedPlatform ? (
                    // 平台选择
                    <div className="platform-cards">
                        {platforms.map((platform) => (
                            <div
                                key={platform.id}
                                className="platform-card"
                                onClick={() => handlePlatformSelect(platform.id)}
                            >
                                <span className="platform-icon">{platform.icon}</span>
                                <div className="platform-info">
                                    <div className="platform-name">{platform.name}</div>
                                    <div className="platform-desc">{platform.desc}</div>
                                </div>
                                <span className="platform-arrow">→</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    // 安装步骤
                    <>
                        <div className="platform-card active" onClick={handleBack}>
                            <span className="platform-icon">
                                {platforms.find(p => p.id === selectedPlatform)?.icon}
                            </span>
                            <div className="platform-info">
                                <div className="platform-name">
                                    {platforms.find(p => p.id === selectedPlatform)?.name}
                                </div>
                                <div className="platform-desc">点击切换平台</div>
                            </div>
                            <span className="platform-arrow">←</span>
                        </div>

                        <div className="install-steps">
                            <div className="install-steps-title">安装步骤</div>
                            {installSteps[selectedPlatform].map((step, index) => (
                                <div key={index} className="install-step">
                                    <span className="step-number">{index + 1}</span>
                                    <div className="step-content">
                                        <p className="step-text">
                                            {step.text}
                                            {step.highlight && (
                                                <span className="step-highlight"> {step.highlight}</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="download-footer">
                    💡 安装后可离线使用，数据自动保存在本地
                </div>
            </div>
        </div>
    );
}

export default DownloadModal;
