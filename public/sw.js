const CACHE_NAME = 'adhd-assistant-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('缓存静态资源');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // 强制激活新版本
    self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // 立即接管所有页面
    self.clients.claim();
});

// 请求拦截 - 网络优先策略
self.addEventListener('fetch', (event) => {
    // 跳过非 GET 请求
    if (event.request.method !== 'GET') return;

    // 跳过 Chrome 扩展请求
    if (event.request.url.startsWith('chrome-extension://')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // 仅缓存成功的响应
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // 网络失败时从缓存获取
                return caches.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }
                    // 返回离线页面（如果是导航请求）
                    if (event.request.mode === 'navigate') {
                        return caches.match('/');
                    }
                    return new Response('离线状态', { status: 503 });
                });
            })
    );
});

// 推送通知处理
self.addEventListener('push', (event) => {
    const data = event.data?.json() || {};
    const options = {
        body: data.body || '该专注了！',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-72.png',
        vibrate: [200, 100, 200],
        tag: 'adhd-reminder',
        requireInteraction: true,
        actions: [
            { action: 'start', title: '开始专注' },
            { action: 'snooze', title: '稍后提醒' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'ADHD 助手', options)
    );
});

// 通知点击处理
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'start') {
        event.waitUntil(
            clients.openWindow('/?action=focus')
        );
    } else if (event.action === 'snooze') {
        // 5分钟后再次提醒
        setTimeout(() => {
            self.registration.showNotification('ADHD 助手', {
                body: '别忘了你的任务哦！',
                icon: '/icons/icon-192.png'
            });
        }, 5 * 60 * 1000);
    } else {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
