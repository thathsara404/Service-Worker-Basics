self.addEventListener('activate', event => { // We should place delete option in the activate phase because the previous service worker might
    // -using the old cache currently. So when new service worker is installed and trying to activate, we can delete old cache.
    const cachList = []; // Here you can keep the active cache storage names
    console.log('activating----------<<<<<<<<<<<<<<');
    event.waitUntil(
        caches.keys().then( cacheKeys => { // get all the cache keys
            Promise.all(
                cacheKeys.map( cacheKey => {
                    if (cachList.indexOf(cacheKey) === -1) {
                        return caches.delete(cacheKey); // delete the particular cache if that is not in our required cache list.
                    }
                })
            )
        })
    )
}) 