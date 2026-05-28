#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const distDir = path.join(projectRoot, 'dist');
const cacheVersion = `de-olho-pwa-${Date.now()}`;

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(sourceDir, targetDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }

  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function walkFiles(dirPath) {
  const result = [];

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      result.push(...walkFiles(entryPath));
      continue;
    }
    result.push(entryPath);
  }

  return result;
}

function toWebPath(filePath) {
  return `/${path.relative(distDir, filePath).replaceAll(path.sep, '/')}`;
}

function getRevision(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex').slice(0, 16);
}

function shouldPrecache(filePath) {
  const webPath = toWebPath(filePath);
  if (webPath === '/sw.js') {
    return false;
  }

  return /\.(?:html|js|css|png|jpg|jpeg|gif|svg|webp|json|txt|ico)$/i.test(webPath);
}

function buildServiceWorker(precacheEntries) {
  return `const CACHE_NAME = '${cacheVersion}';
const PRECACHE = ${JSON.stringify(precacheEntries, null, 2)};
const PRECACHE_URLS = PRECACHE.map((entry) => entry.url);

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(PRECACHE_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName !== CACHE_NAME)
        .map((cacheName) => caches.delete(cacheName))
    );
    await self.clients.claim();
  })());
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    void networkPromise;
    return cachedResponse;
  }

  return networkPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(request)) ||
          (await cache.match('/offline.html')) ||
          Response.error()
        );
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const response = await staleWhileRevalidate(request);
    return response || Response.error();
  })());
});
`;
}

if (!fs.existsSync(distDir)) {
  console.error('[PWA] dist directory not found. Run `expo export -p web` first.');
  process.exit(1);
}

copyRecursive(publicDir, distDir);

const precacheEntries = walkFiles(distDir)
  .filter(shouldPrecache)
  .map((filePath) => ({
    url: toWebPath(filePath),
    revision: getRevision(filePath),
  }))
  .sort((a, b) => a.url.localeCompare(b.url));

fs.writeFileSync(path.join(distDir, 'sw.js'), buildServiceWorker(precacheEntries));

console.log(`[PWA] service worker generated with ${precacheEntries.length} precached files.`);
