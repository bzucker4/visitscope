window.VisitScopeStore = (function () {
  const DB_NAME = "visitscope";
  const DB_VERSION = 1;
  const STORE = "inquiries";

  function openDb() {
    if (!window.indexedDB) return Promise.reject(new Error("This browser cannot store inquiries locally."));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const objectStore = db.createObjectStore(STORE, { keyPath: "id" });
          objectStore.createIndex("createdAt", "createdAt");
          objectStore.createIndex("status", "status");
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function txDone(tx) {
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  async function withStore(mode, fn) {
    const db = await openDb();
    const tx = db.transaction(STORE, mode);
    const result = fn(tx.objectStore(STORE));
    await txDone(tx);
    db.close();
    return result;
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function createId() {
    return "inq_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  async function list() {
    const rows = await withStore("readonly", (store) => requestToPromise(store.getAll()));
    return (rows || []).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  function get(id) {
    return withStore("readonly", (store) => requestToPromise(store.get(id)));
  }

  async function save(inquiry) {
    const now = new Date().toISOString();
    const record = {
      ...inquiry,
      id: inquiry.id || createId(),
      createdAt: inquiry.createdAt || now,
      updatedAt: now,
      status: inquiry.status || "new",
      outcome: inquiry.outcome || null,
      activity: inquiry.activity || []
    };
    await withStore("readwrite", (store) => store.put(record));
    return record;
  }

  async function update(id, patch, activity) {
    const current = await get(id);
    if (!current) throw new Error("Inquiry not found");
    const next = {
      ...current,
      ...patch,
      id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString(),
      activity: activity ? [...(current.activity || []), activity] : (current.activity || [])
    };
    await withStore("readwrite", (store) => store.put(next));
    return next;
  }

  async function clear() {
    await withStore("readwrite", (store) => store.clear());
  }

  return { createId, list, get, save, update, clear };
})();
