import { STORAGE_KEYS } from "./storage_keys.js";

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
