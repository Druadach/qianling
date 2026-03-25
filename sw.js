(() => {const CACHE_NAME = 'qianlingCache';
const BASE_URL = 'https://qianling.pw/';
const VERSION_PATH = 'https://id.v3/';
const ESCAPE = 15;
const INVALID_KEY = 'X-Swpp-Invalid';
const STORAGE_TIMESTAMP = 'X-Swpp-Time';
const UPDATE_JSON_URL = 'swpp/update.json';
const UPDATE_CD = 600000;
const isFetchSuccessful = (response) => [200, 301, 302, 307, 308].includes(response.status);
const matchCacheRule = (url) => {
  const { host, pathname, href } = url;

  // 1. 绝对不要缓存的黑名单：各种第三方统计、评论系统API、动态接口
  const isBlackList =
  host.includes('busuanzi') ||
  host.includes('baidu.com') ||
  host.includes('google-analytics') ||
  href.includes('/comment/') ||
  href.includes('/message/') ||
  href.includes('/api/');

  if (isBlackList) {
    return false;
  }

  // 2. 页面 HTML 缓存 (本站)
  if (pathname.endsWith('/')) {
    return 60 * 60 * 1000; // 1小时
  }

  // 3. 定义我们允许缓存的“安全域名” (本站域名 + 且支持跨域的优质 CDN)
  const isSafeHost =
  host === 'qianling.pw' ||
  host === 'localhost:4000' ||
  host.includes('cdn.bootcdn.net') ||
  host.includes('cdn.jsdelivr.net') ||
  host.includes('unpkg.com') ||
  host.includes('fonts.loli.net');

  // 4. 只有在安全域名下，才对图片、JS、CSS 开启缓存
  if (isSafeHost) {
    if (/\.(css|js|woff2?|ttf|eot|svg)(\?|$)/i.test(pathname)) {
      return 30 * 24 * 60 * 60 * 1000;
    }
    if (/\.(png|jpe?g|gif|webp|ico|bmp)(\?|$)/i.test(pathname)) {
      return 180 * 24 * 60 * 60 * 1000;
    }
    if (/\.(mp3|mp4|webm|ogg)(\?|$)/i.test(pathname)) {
      return 7 * 24 * 60 * 60 * 1000;
    }
  }

  // 其他不属于上述规则的请求（如未知的第三方域名资源）一律不缓存，交给浏览器原本的流程
  return false;
};
const normalizeUrl = (url) => {
                if (url.endsWith('/index.html'))
                    return url.substring(0, url.length - 10);
                if (url.endsWith('.html'))
                    return url.substring(0, url.length - 5);
                else
                    return url;
            };
const matchUpdateRule = (exp) => {
                /**
                 * 遍历所有value
                 * @param action 接受value并返回bool的函数
                 * @return 如果 value 只有一个则返回 `action(value)`，否则返回所有运算的或运算（带短路）
                 */
                const forEachValues = (action) => {
                    const value = exp.value;
                    if (Array.isArray(value)) {
                        for (let it of value) {
                            if (action(it))
                                return true;
                        }
                        return false;
                    }
                    else
                        return action(value);
                };
                switch (exp.flag) {
                    case 'html':
                        return url => /\/$|\.html$/.test(url);
                    case 'suf':
                        return url => forEachValues(value => url.endsWith(value));
                    case 'pre':
                        return url => forEachValues(value => url.startsWith(value));
                    case 'str':
                        return url => forEachValues(value => url.includes(value));
                    case 'reg':
                        return url => forEachValues(value => new RegExp(value, 'i').test(url));
                    default:
                        throw exp;
                }
            };
const matchFromCaches = (request) => caches.match(request, { cacheName: CACHE_NAME });
const writeResponseToCache = async (request, response, date) => {
                if (date) {
                    const headers = new Headers(response.headers);
                    headers.set(STORAGE_TIMESTAMP, new Date().toISOString());
                    response = new Response(response.body, {
                        status: response.status,
                        headers
                    });
                }
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, response);
            };
const markCacheInvalid = (request) => matchFromCaches(request).then(response => {
                if (!response)
                    return;
                const headers = new Headers(response.headers);
                headers.set(INVALID_KEY, '1');
                return writeResponseToCache(request, new Response(response.body, { status: response.status, headers }));
            });
const isValidCache = (response, rule) => {
                const headers = response.headers;
                if (headers.has(INVALID_KEY))
                    return false;
                // 只有本站资源允许永久缓存
                if (rule < 0) {
                    const url = response.url;
                    const baseLength = BASE_URL.length;
                    if (url.startsWith(BASE_URL) && (url.length === baseLength || url[baseLength] === '/')) {
                        return true;
                    }
                    // 将rule设置为一天（24小时）
                    rule = 24 * 60 * 60 * 1000;
                }
                const storage = headers.get(STORAGE_TIMESTAMP);
                if (!storage)
                    return true;
                const storageDate = new Date(storage).getTime();
                const nowTimestamp = Date.now();
                // @ts-ignore
                return nowTimestamp - storageDate < rule;
            };
const readVersion = () => matchFromCaches(VERSION_PATH)
                .then(response => response?.json?.());
const writeVersion = (version) => {
                version.tp = Date.now();
                return writeResponseToCache(VERSION_PATH, new Response(JSON.stringify(version)));
            };
const postMessage = async (type, data, ...goals) => {
                if (!goals.length) {
                    // @ts-ignore
                    goals = await clients.matchAll();
                }
                const body = { type, data };
                for (let client of goals) {
                    client.postMessage(body);
                }
            };
const transferError2Response = (err) => new Response(JSON.stringify({
                type: err.name,
                message: err.message,
                stack: err.stack,
                addition: err
            }), {
                status: 599,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
const fetchWrapper = (request, banCache, cors, optional) => {
                const init = {
                    referrerPolicy: request.referrerPolicy ?? '',
                    ...optional
                };
                init.cache = banCache ? 'no-store' : 'default';
                if (cors) {
                    init.mode = 'cors';
                    init.credentials = 'same-origin';
                }
                return fetch(request, init);
            };
const isCors = () => false;
const getFastestRequests = null;
const getStandbyRequests = null;
const fetchFastest = async (list, optional) => {
                const fallbackFetch = (request, controller) => {
                    return fetchWrapper(request, true, true, {
                        ...optional,
                        signal: controller?.signal
                    });
                };
                const controllers = Array.from({ length: list.length }, () => new AbortController());
                try {
                    const { i: index, r: response } = await Promise.any(list.map((it, index) => fallbackFetch(it, controllers[index])
                        .then(response => isFetchSuccessful(response) ? { i: index, r: response } : Promise.reject(response))));
                    for (let k = 0; k < list.length; k++) {
                        if (k != index)
                            controllers[k].abort();
                    }
                    return response;
                }
                catch (err) {
                    const value = err.errors[0];
                    return value.body ? value : transferError2Response(err);
                }
            };
const fetchStandby = async (request, standbyRequests, optional) => {
                const fallbackFetch = (request, controller) => {
                    return fetchWrapper(request, true, true, {
                        ...optional,
                        signal: controller?.signal
                    });
                };
                // 需要用到的一些字段，未初始化的后面会进行初始化
                let id, standbyResolve, standbyReject;
                // 尝试封装 response
                const resolveResponse = (index, response) => isFetchSuccessful(response) ? { i: index, r: response } : Promise.reject(response);
                const { t: time, r: src, l: listGetter } = standbyRequests;
                const controllers = new Array(listGetter.length + 1);
                // 尝试同时拉取 standbyRequests 中的所有 Request
                const task = () => Promise.any(listGetter().map((it, index) => fallbackFetch(it, controllers[index + 1] = new AbortController())
                    .then(response => resolveResponse(index + 1, response)))).then(obj => standbyResolve(obj))
                    .catch(() => standbyReject());
                // 尝试拉取初始 request
                const firstFetch = fallbackFetch(src || request, controllers[0] = new AbortController())
                    .then(response => resolveResponse(0, response))
                    .catch(err => {
                    // 如果失败则跳过等待
                    clearTimeout(id);
                    // noinspection JSIgnoredPromiseFromCall
                    task();
                    return Promise.reject(err); // 保留当前错误
                });
                // 延时拉取其它 request
                const standby = new Promise((resolve1, reject1) => {
                    standbyResolve = resolve1;
                    standbyReject = reject1;
                    id = setTimeout(task, time);
                });
                try {
                    const { i: index, r: response } = await Promise.any([firstFetch, standby]);
                    // 中断未完成的请求
                    for (let k = 0; controllers[k]; k++) {
                        if (k != index)
                            controllers[k].abort();
                    }
                    return response;
                }
                catch (err) {
                    const value = err.errors[0];
                    return value.body ? value : transferError2Response(err);
                }
            };
const fetchFile = (request, optional) => {
                        // @ts-ignore
                        if (!request.url)
                            request = new Request(request);
                        return fetchWrapper(request, true, true, optional).catch(transferError2Response);
                    };
const isBlockRequest = () => false;
const modifyRequest = () => null;
const handleEscape = async () => {
                const oldVersion = await readVersion();
                if (ESCAPE && oldVersion && oldVersion.escape !== ESCAPE) {
                    await caches.delete(CACHE_NAME);
                    await postMessage('escape', null);
                }
            };
const handleUpdate = async (oldVersion, force) => {
                if (!force && oldVersion && Date.now() - oldVersion.tp < UPDATE_CD)
                    return;
                const json = await (await fetch(UPDATE_JSON_URL, {
                    // @ts-ignore
                    priority: 'high'
                })).json();
                const { global, info } = json;
                const newVersion = { global, local: info[0].version, escape: ESCAPE };
                // 新访客或触发了逃生门
                if (!oldVersion || (ESCAPE && ESCAPE !== oldVersion.escape)) {
                    await writeVersion(newVersion);
                    return oldVersion ? 1 : -1;
                }
                // 已是最新版本时跳过剩余步骤
                if (oldVersion.global === global && oldVersion.local === newVersion.local) {
                    await writeVersion(oldVersion);
                    return;
                }
                // 按版本顺序更新缓存，直到找到当前版本
                const expressionList = [];
                for (let infoElement of info) {
                    if (infoElement.version === oldVersion.local) {
                        const urlList = [];
                        const cache = await caches.open(CACHE_NAME);
                        const keys = await cache.keys();
                        for (let request of keys) {
                            const url = request.url;
                            if (url !== VERSION_PATH && expressionList.find(it => it(url))) {
                                await markCacheInvalid(request);
                                urlList.push(url);
                            }
                        }
                        await writeVersion(newVersion);
                        return urlList;
                    }
                    const changeList = infoElement.change;
                    if (changeList) {
                        for (let change of changeList) {
                            expressionList.push(matchUpdateRule(change));
                        }
                    }
                }
                // 运行到这里说明版本号丢失
                await caches.delete(CACHE_NAME);
                await writeVersion(newVersion);
                return 2;
            };
const handleFetchEvent = (event) => {
                // @ts-ignore
                let request = event.request;
                if (request.method !== 'GET' || !request.url.startsWith('http'))
                    return;
                if (isBlockRequest(request)) {
                    // @ts-ignore
                    return event.respondWith(new Response(null, { status: 204 }));
                }
                const newRequest = modifyRequest(request);
                if (newRequest)
                    request = newRequest;
                let cleanUrl = request.url;
                for (let i = 0; i < cleanUrl.length; i++) {
                    const item = cleanUrl[i];
                    if (item === '?' || item === '#') {
                        cleanUrl = cleanUrl.substring(0, i);
                    }
                }
                const cacheKey = new URL(normalizeUrl(cleanUrl));
                const cacheRule = matchCacheRule(cacheKey);
                if (cacheRule) {
                    // @ts-ignore
                    event.respondWith(matchFromCaches(cacheKey).then(cacheResponse => {
                        if (cacheResponse && isValidCache(cacheResponse, cacheRule))
                            return cacheResponse;
                        const responsePromise = fetchFile(request)
                            .then(response => {
                            if (isFetchSuccessful(response)) {
                                // noinspection JSIgnoredPromiseFromCall
                                writeResponseToCache(cacheKey, response.clone());
                                return response;
                            }
                            return cacheResponse ?? response;
                        });
                        return cacheResponse ? responsePromise.catch(() => cacheResponse) : responsePromise;
                    }));
                }
                else if (newRequest) {
                    // @ts-ignore
                    event.respondWith(fetchWrapper(request, false, isCors(request)));
                }
            };
self.addEventListener('install', (_event) => {
                // @ts-ignore
                skipWaiting();
                if (ESCAPE) {
                    // noinspection JSIgnoredPromiseFromCall
                    handleEscape();
                }
            });
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));
self.addEventListener('fetch', (event) => handleFetchEvent(event));
self.addEventListener('periodicSync', (event) => {
                // @ts-ignore
                if (event.tag === 'update') {
                    // @ts-ignore
                    event.waitUntil(handleUpdate(null, true));
                }
            });
self.addEventListener('message', async (event) => {
                // @ts-ignore
                const data = event.data;
                switch (data.type) {
                    case 'update':
                        const oldVersion = await readVersion();
                        const updateResult = await handleUpdate(oldVersion);
                        if (!updateResult)
                            return;
                        switch (updateResult) {
                            case -1:
                                return postMessage('new', null);
                            case 1:
                                return postMessage('revise', null);
                            case 2:
                                return postMessage('update', null);
                            default:
                                if (Array.isArray(updateResult)) {
                                    return postMessage('update', updateResult);
                                }
                        }
                }
            })})()