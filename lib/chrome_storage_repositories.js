import {
  DEFAULT_SYNC_SETTINGS,
  STORAGE_KEYS
} from "./storage_keys.js";

export class ChromeStorageSourceRepository {
  async list_sources() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.sources);
    return result[STORAGE_KEYS.sources] ?? [];
  }

  async get_source(source_id) {
    const sources = await this.list_sources();
    return sources.find((source) => source.source_id === source_id) ?? null;
  }

  async save_source(next_source) {
    const sources = await this.list_sources();
    const existing_index = sources.findIndex((source) => source.source_id === next_source.source_id);
    const next_sources = existing_index === -1
      ? [...sources, next_source]
      : sources.map((source) => (source.source_id === next_source.source_id ? next_source : source));

    await chrome.storage.local.set({
      [STORAGE_KEYS.sources]: next_sources
    });
  }

  async delete_source(source_id) {
    const sources = await this.list_sources();
    await chrome.storage.local.set({
      [STORAGE_KEYS.sources]: sources.filter((source) => source.source_id !== source_id)
    });
  }
}

export class ChromeStorageSourceCacheRepository {
  async list_caches() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.caches);
    return result[STORAGE_KEYS.caches] ?? [];
  }

  async get_cache(source_id) {
    const caches = await this.list_caches();
    return caches.find((cache) => cache.source_id === source_id) ?? null;
  }

  async save_cache(next_cache) {
    const caches = await this.list_caches();
    const existing_index = caches.findIndex((cache) => cache.source_id === next_cache.source_id);
    const next_caches = existing_index === -1
      ? [...caches, next_cache]
      : caches.map((cache) => (cache.source_id === next_cache.source_id ? next_cache : cache));

    await chrome.storage.local.set({
      [STORAGE_KEYS.caches]: next_caches
    });
  }

  async delete_cache(source_id) {
    const caches = await this.list_caches();
    await chrome.storage.local.set({
      [STORAGE_KEYS.caches]: caches.filter((cache) => cache.source_id !== source_id)
    });
  }
}

export class ChromeStorageSyncSettingsRepository {
  async get_settings() {
    const result = await chrome.storage.local.get(STORAGE_KEYS.settings);
    return {
      ...DEFAULT_SYNC_SETTINGS,
      ...(result[STORAGE_KEYS.settings] ?? {})
    };
  }

  async save_settings(settings) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.settings]: settings
    });
  }
}
