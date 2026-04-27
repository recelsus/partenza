export const STORAGE_KEYS = {
  sources: "bookmark_sources",
  caches: "bookmark_source_caches",
  settings: "bookmark_sync_settings"
};

export const DEFAULT_SYNC_SETTINGS = {
  sync_on_popup_open: false,
  sync_on_browser_start: false,
  auto_sync_enabled: false,
  auto_sync_interval_minutes: 360
};

export function create_source_id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function build_source_locator(source, resolved_branch = null) {
  if (source.type === "http_static") {
    return source.url;
  }

  if (source.type === "github") {
    const branch_label = resolved_branch || (source.branch && source.branch.trim().length > 0
      ? source.branch.trim()
      : "main|master");
    return `${source.owner}/${source.repo}:${source.path}@${branch_label}`;
  }

  return source.source_id;
}

export function create_source_snapshot(source, document_title = null, resolved_branch = null) {
  return {
    source_name: source.source_name,
    source_type: source.type,
    writable: source.writable,
    locator: build_source_locator(source, resolved_branch),
    document_title,
    resolved_branch
  };
}

export function create_empty_cache(source) {
  return {
    source_id: source.source_id,
    last_synced_at: null,
    last_remote_revision: null,
    dirty: false,
    items_cache: [],
    last_error: null,
    source_snapshot: create_source_snapshot(source)
  };
}

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
    return result[STORAGE_KEYS.settings] ?? DEFAULT_SYNC_SETTINGS;
  }

  async save_settings(settings) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.settings]: settings
    });
  }
}

export async function get_storage_state(source_repository, cache_repository, settings_repository) {
  const [sources, caches, settings] = await Promise.all([
    source_repository.list_sources(),
    cache_repository.list_caches(),
    settings_repository.get_settings()
  ]);

  return { sources, caches, settings };
}

export async function clear_storage_state() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.sources,
    STORAGE_KEYS.caches,
    STORAGE_KEYS.settings
  ]);
}
