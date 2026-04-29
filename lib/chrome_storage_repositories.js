import {
  DEFAULT_SYNC_SETTINGS,
  STORAGE_KEYS
} from "./storage_keys.js";
import { ChromeStorageArrayRepository } from "./chrome_storage_array_repository.js";

export class ChromeStorageSourceRepository extends ChromeStorageArrayRepository {
  constructor() {
    super(STORAGE_KEYS.sources, (source) => source.source_id);
  }

  async list_sources() {
    return this.list_items();
  }

  async get_source(source_id) {
    return this.get_item(source_id);
  }

  async save_source(next_source) {
    await this.save_item(next_source);
  }

  async delete_source(source_id) {
    await this.delete_item(source_id);
  }
}

export class ChromeStorageSourceCacheRepository extends ChromeStorageArrayRepository {
  constructor() {
    super(STORAGE_KEYS.caches, (cache) => cache.source_id);
  }

  async list_caches() {
    return this.list_items();
  }

  async get_cache(source_id) {
    return this.get_item(source_id);
  }

  async save_cache(next_cache) {
    await this.save_item(next_cache);
  }

  async delete_cache(source_id) {
    await this.delete_item(source_id);
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
