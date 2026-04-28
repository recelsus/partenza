import { GithubAdapter } from "../lib/github_adapter.js";
import { HttpStaticAdapter } from "../lib/http_static_adapter.js";
import {
  ChromeStorageSourceCacheRepository,
  ChromeStorageSourceRepository,
  ChromeStorageSyncSettingsRepository,
  get_storage_state
} from "../lib/storage_repositories.js";

export const source_repository = new ChromeStorageSourceRepository();
export const cache_repository = new ChromeStorageSourceCacheRepository();
export const settings_repository = new ChromeStorageSyncSettingsRepository();

export const adapters = {
  http_static: new HttpStaticAdapter(),
  github: new GithubAdapter()
};

export async function build_state() {
  return get_storage_state(source_repository, cache_repository, settings_repository);
}
