// Echo Precision offline support.
// Everything the app needs is saved on the phone when it installs, so it opens with no signal.
// With signal, the newest version is fetched (waiting at most a few seconds) so deployments are never stale.
const CACHE = "echo-precision-v1.16.2";
const SHELL = ["/", "/index.html", "/ballistics.js", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png", "/icon-maskable-512.png", "/apple-touch-icon.png"];
const WAIT_MS = 3000;

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => Promise.all(SHELL.map(path => fetch(path, { cache: "reload" }).then(res => { if (!res.ok) throw new Error(path + " " + res.status); return cache.put(path, res); }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("echo-precision-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", event => {
  if (event.data === "offline-status") {
    caches.open(CACHE).then(cache => Promise.all(SHELL.map(p => cache.match(p)))).then(hits => {
      event.source && event.source.postMessage({ type: "offline-status", ready: hits.every(Boolean), version: CACHE });
    });
  }
});

function fromCache(req) {
  const url = new URL(req.url);
  const key = req.mode === "navigate" || url.pathname === "/" ? "/index.html" : url.pathname;
  return caches.open(CACHE).then(cache => cache.match(key, { ignoreSearch: true }).then(hit => hit || cache.match(req, { ignoreSearch: true })));
}

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const key = req.mode === "navigate" || url.pathname === "/" ? "/index.html" : url.pathname;

  const network = fetch(req, { cache: "no-store" }).then(res => {
    if (res.ok && res.type === "basic") {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put(key, copy));
    }
    return res;
  });

  event.respondWith(new Promise(resolve => {
    let done = false;
    const finish = res => { if (!done && res) { done = true; resolve(res); } };
    // Weak signal at the range: after a few seconds, open from the phone instead of waiting.
    const timer = setTimeout(() => fromCache(req).then(finish), WAIT_MS);
    network.then(res => { clearTimeout(timer); finish(res); })
      .catch(() => { clearTimeout(timer); fromCache(req).then(hit => finish(hit || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } }))); });
  }));
  event.waitUntil(network.catch(() => {}));
});
