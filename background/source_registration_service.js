import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { build_github_cache_id } from "../lib/github_source_unit.js";
import {
  create_empty_cache,
  create_source_id
} from "../lib/storage_repositories.js";
import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { sync_source } from "./source_sync_service.js";

export async function register_http_source(url) {
  const existing_sources = await source_repository.list_sources();
  const normalised_url = url.trim();
  const has_duplicate = existing_sources.some((source) => {
    return source.type === "http_static" && source.url === normalised_url;
  });

  if (has_duplicate) {
    throw new Error("HTTP static source with the same URL is already registered");
  }

  const next_source = {
    source_id: create_source_id("http"),
    source_name: normalised_url,
    type: "http_static",
    enabled: true,
    writable: false,
    url: normalised_url
  };

  await adapters.http_static.validate_source(next_source);
  await source_repository.save_source(next_source);
  await cache_repository.save_cache(create_empty_cache(next_source));
  return sync_source(next_source.source_id);
}

export async function register_github_source(input) {
  const base_source = {
    source_id: create_source_id("github"),
    source_name: `${input.owner.trim()}/${input.repo.trim()}`,
    type: "github",
    enabled: true,
    writable: true,
    owner: input.owner.trim(),
    repo: input.repo.trim(),
    branch: input.branch.trim(),
    token: input.token.trim(),
    file_paths: []
  };

  await adapters.github.validate_source({
    ...base_source,
    path: GITHUB_BOOKMARKS_FILE_PATH
  });

  const existing_sources = await source_repository.list_sources();
  const duplicate_repo = existing_sources.find((source) => {
    return source.type === "github"
      && source.owner === base_source.owner
      && source.repo === base_source.repo
      && source.branch === base_source.branch;
  });

  if (duplicate_repo) {
    throw new Error("The same GitHub repository is already registered");
  }

  const discovered = await adapters.github.list_bookmark_files({
    ...base_source,
    path: GITHUB_BOOKMARKS_FILE_PATH
  });
  const discovered_paths = discovered.files.length > 0 ? discovered.files : [GITHUB_BOOKMARKS_FILE_PATH];
  const next_source = {
    ...base_source,
    file_paths: discovered_paths
  };

  await source_repository.save_source(next_source);

  for (const path of discovered_paths) {
    await cache_repository.save_cache(create_empty_cache({
      ...next_source,
      source_id: build_github_cache_id(next_source.source_id, path),
      path
    }));
  }

  if (discovered.files.length === 0) {
    return sync_source(next_source.source_id);
  }

  await sync_source(next_source.source_id);

  return {
    state: await build_state(),
    synced_source_id: next_source.source_id
  };
}
