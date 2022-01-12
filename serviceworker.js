console.log('we are service workers');
// changing this comment will cause to update the browser service woker (version: 12)
// chrome://serviceworker-internals/
try {
    importScripts('./script_one.js');
} catch (e) {
    console.error(e);
}

// Listening to the install event and Add Cache (Service Worker Prefetch)
const preCacheList = ['./img1.jpg', '/', './_js/change.js'];
self.addEventListener('install', event => {
    console.log('install event');
    event.waitUntil(
        caches.open('cache-some-files-v1')
            .then( cache => {
                cache.addAll(preCacheList);// with addAll() browser will donwload the content and add to cache
            })
    )
});

// Listening to the activate event
self.addEventListener('activate', event => {
    console.log('activate event');
});

// Listening to the fetch event
self.addEventListener('fetch', event => {
    const requestURL = new URL(event.request.url);
    if (event.request.url === 'https://localhost:3000/contact') {
        // Here we fake our response
        const header = new Headers({
            'Content-Type': 'text/html'
        });
        const content = `
                <html>
                    <body>
                        Contact Us: 0777777777
                        <br>
                        <a href="https://localhost:3000/">Home</a> <br>
                        <p>Cache: ${event.request.cache}</p> <br>
                        <p>Credentials: ${event.request.credential}</p> <br>
                        <p>Destination: ${event.request.destination}</p> <br>
                        <p>Method: ${event.request.method}</p> <br>
                        <p>Referrer: ${event.request.referrer}</p> <br>
                    </body>
                </html>
        `;
        const response = new Response(content, {headers: header, statusText: 'OK', status: 200});
        event.respondWith(response);
    } else {
            // Network-First policy: this is good for freequently chaning files **
            // Check the URL for change.js file and load it from the server
            if(event.request.url.includes('_js')) {
                // Network First Approach
                // event.respondWith(
                //     fetch(event.request)
                //         .catch( error => {
                //             return caches.match(event.request);
                //         })
                // )

                // Stale-While-Revalidate
                // With this approach we first look into the cache and if the cache available we send the content from the cache.
                // At the sametime we download the latest content from the CDN or the server.
                // If cacge is not availabe it sends the content from the network call.
                // If lot of file requests going through this part, this will be slower when compared to the cache first.
                // event.respondWith(
                //     caches.match(event.request).then( response => {
                //             const netWorkResult = fetch(event.request)
                //                 .then(networkResponse => {
                //                     console.log('fetch complete...');
                //                     return caches.open('cache-some-files-v1').then( cache => {
                //                             cache.put(event.request, networkResponse.clone())
                //                             return networkResponse;
                //                         })
                //                 });
                //             console.log('send before fetch...', response);
                //             return response || netWorkResult;
                //         })
                // );

                // Stale-While-Revalidate modification
                // In this approach we are looking into the cache first. And if cache is good to go, content will be loaded from the cache.
                event.respondWith(
                    caches.match(event.request).then( response => {
                        if (response) {
                            console.log(`Stale-While sending from cache`);
                            return response;
                        } else {
                            return fetch(event.request)
                                .then(networkResponse => {
                                    return caches.open('cache-some-files-v1').then( cache => {
                                        console.log(`Stale-While add to cache`);
                                        cache.put(event.request, networkResponse.clone())
                                            return networkResponse;
                                    })
                                });
                        }
                    })
                );
            } else {
                // Cache-First policy: this is good for constant files**
                event.respondWith(
                    caches.match(event.request)
                        .then( response => {
                            if (response) { // the requested URL is cached
                                console.log(`Cache first: The requested URL (${event.request.url}) is found in the cache and returning from the cache.`);
                                return response;
                            } else {
                                // img2 is loaded as a responsive image. so we can't cache this in the install event. if we cache this we have to cache all the image versions
                                // But we can cache the browser appropriate version
                                console.log(`Cache first: Downloading through the network ${event.request.url}`);
                                if (event.request.url.includes('/img-responsive/')) {
                                    const data =  fetch(event.request).then(networkResponse => {
                                        return caches.open('cache-some-files-v1').then( cache => {
                                            console.log(`Cache first: Adding to the cache ${event.request.url}`);
                                            cache.put(event.request, networkResponse.clone()); // Here we cache the browser appropriate version
                                            return networkResponse;
                                        })
                                    });
                                    return data;
                                } else {
                                    // Definitely we need to download this from the server instead of accessing the cache
                                    return fetch(event.request);
                                }
                            }
                        })
                );
            }
    }

})

const cacheMemoryListToDelete = ['cache-some-files-v1'];
const maxMemorySizeAllowed = 1;
setInterval(function() {
    console.log('checking--->>');
    caches.keys().then(function (cacheKeys) {
        Promise.all(
            cacheKeys.map(function (cacheKey) {
                if (cacheMemoryListToDelete.indexOf(cacheKey) !== -1) {
                    if ('storage' in navigator && 'estimate' in navigator.storage) {
                        navigator.storage.estimate().then(function ({usage, quota}) {
                            console.log(usage);
                            const usedMemory = usage/1000000;
                            const availableQuota = quota/1000000;
                            console.log('Available Cache Quota(KB): ', availableQuota);
                            console.log('Used Memory(KB): ', usedMemory);
                            if (usedMemory> maxMemorySizeAllowed) {
                                console.log('deleted');
                                return caches.delete(cacheKey);
                            } else {
                                console.log('not deleted');
                            }
                        });
                    }
                }
            })
        );
    });
}, 1000*60*10)