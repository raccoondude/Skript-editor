// Version of the offline cache (change this value everytime you want to update cache)
const CACHE_NAME = 'skEditor-1.0.0.2'              

// Add a path you want to cache in this list.
const URLS = [                
  '/',
  '/app',
  'ace/ace.js',
  'lib/codeblast.js',
  'ace/ext-split.js',
  'ace/ext-language_tools.js',
  'scripts/script.js',
  'styles/main.css',
  'styles/index.css',
  'images/link.svg',
  'images/brush.svg',
  'images/download.svg',
  'images/file.svg',
  'images/options.svg',
  'images/refresh.svg',
  'images/upload.svg',
  'images/share.svg',
  'images/discord.svg',
  'images/home.svg',
  'ace/mode-skript.js',
  'manifest.json',
  'https://fonts.googleapis.com/css?family=Inconsolata',
  'https://cdn.jsdelivr.net/npm/js-cookie@2/src/js.cookie.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/lz-string/1.4.4/lz-string.min.js',
  'https://fonts.gstatic.com/s/inconsolata/v17/QldKNThLqRwH-OJ1UHjlKGlZ5qg.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.3/jquery.min.js'
]

// Respond with cached resources
// This is called everytime the browser requests resources from the server
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(request => {
      if (request) {
        return request
      } else {
        // if there are no cache, try fetching request
        return fetch(e.request)
      }
    })
  )
});

// Cache resources
self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE_NAME).then(cache => cache.addAll(URLS))
));

// Delete outdated caches
self.addEventListener('activate', e => {
  if (navigator.onLine) self.skipWaiting();
  e.waitUntil(
    caches.keys().then(keyList => {
      // `keyList` contains all cache names under appname.glitch.me domain
      return Promise.all(keyList.map((key, i) => {
        if (keyList[i] !== CACHE_NAME) {
          return caches.delete(keyList[i])
        }
      }))
    })
  )
})