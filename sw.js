importScripts("/js/custom/sw-toolbox.js");
var cacheVersion = "-17104";
var staticImageCacheName = "image" + cacheVersion;
var staticAssetsCacheName = "assets" + cacheVersion;
var contentCacheName = "content" + cacheVersion;
var vendorCacheName = "vendor" + cacheVersion;
var maxEntries = 100;

/* Static ImageCache */
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /qianling-1254036047\.cos\.ap-chengdu\.myqcloud\.com/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /fonts\.googleapis\.com/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /gravatar\.loli\.net/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /embed\.widgetpack\.com/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /embed\.widgetpack\.com/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /gstatic\.loli\.net/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /i\.loli\.net/,
    cache: {
        name: staticImageCacheName,
        maxEntries: maxEntries
    }
});

/* Static Cache */
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /cdn\.bootcss\.com/,
    cache: {
        name: staticAssetsCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /cdn\.jsdelivr\.net/,
    cache: {
        name: staticAssetsCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {origin: /(busuanzi\.ibruce\.info)/,
    cache: {
        name: vendorCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /cdn1\.lncld\.net/,
    cache: {
        name: staticAssetsCacheName,
        maxEntries: maxEntries
    }
});
self.toolbox.router.get("/(.*)", self.toolbox.cacheFirst, {
    origin: /api\.imjad\.cn/,
    cache: {
        name: staticAssetsCacheName,
        maxEntries: maxEntries
    }
});

/* ContentCache */
self.toolbox.router.get("/(.*)", self.toolbox.networkFirst, {
    origin: /qianling\.pw/,
    cache: {
       name: contentCacheName,
       maxEntries: maxEntries
}
  });

/* NoCache */
self.toolbox.router.get("/sw.js",self.toolbox.networkFirst);

/* PreCache */
self.addEventListener("install",
function(event) {return event.waitUntil(self.skipWaiting())
});
self.addEventListener("activate",
function(event) {return event.waitUntil(self.clients.claim())
})
