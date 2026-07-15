const CACHE_NAME = 'hcp-interaction-v1';
const DB_NAME = 'hcp-sync-db';
const STORE_NAME = 'sync-store';

// Initialize IndexedDB
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveToDB(data) {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.add({ data, timestamp: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getFromDB() {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

function clearDB(id) {
  return initDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // We only intercept the specific POST request
  if (event.request.method === 'POST' && event.request.url.includes('/api/hcps/interactions')) {
    event.respondWith(
      fetch(event.request.clone()).catch(async (err) => {
        // If fetch fails (offline), we cache it
        const reqClone = event.request.clone();
        const data = await reqClone.json();
        await saveToDB(data);
        
        // Register sync if supported
        if ('sync' in self.registration) {
          await self.registration.sync.register('sync-interactions');
        }
        
        // Return a dummy success response so the UI thinks it saved
        return new Response(JSON.stringify({ success: true, offline: true }), {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        });
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interactions') {
    event.waitUntil(syncInteractions());
  }
});

// For browsers that don't support Background Sync, we can listen for messages
self.addEventListener('message', (event) => {
  if (event.data === 'syncInteractions') {
    event.waitUntil(syncInteractions());
  }
});

async function syncInteractions() {
  const records = await getFromDB();
  for (const record of records) {
    try {
      const response = await fetch('/api/hcps/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.data),
      });
      if (response.ok) {
        await clearDB(record.id);
      }
    } catch (err) {
      console.error('Sync failed for record:', record.id, err);
      // Wait for next sync
    }
  }
}
