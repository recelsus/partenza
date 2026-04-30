import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { create_empty_cache } from "../lib/storage_repositories.js";
import { cache_repository } from "./context.js";
import {
  ensure_github_repo_file_path,
  find_default_github_add_target
} from "./github_repo_service.js";
import { require_source_context } from "./source_context_service.js";

export async function resolve_add_target_context(source_id) {
  if (source_id !== "all") {
    return require_source_context(
      source_id,
      "Target source was not found",
      "Target source cache was not found"
    );
  }

  const default_target = await find_default_github_add_target();

  if (!default_target?.source) {
    throw new Error("Target source was not found");
  }

  const existing_cache = default_target.should_register_source
    ? await cache_repository.get_cache(default_target.source.source_id)
    : null;

  return {
    source: default_target.source,
    cache: existing_cache || create_empty_cache(default_target.source),
    should_register_source: Boolean(default_target.should_register_source)
  };
}

export function get_add_tab_document_title(source, cache) {
  return cache?.source_snapshot?.document_title
    || (source.path === GITHUB_BOOKMARKS_FILE_PATH ? "default bookmarks" : source.source_name);
}

export async function ensure_registered_github_file_path(source) {
  if (!source.path) {
    return;
  }

  await ensure_github_repo_file_path(source, source.path);
}
