import {
  GITHUB_BOOKMARKS_FILE_PATH
} from "../lib/github_adapter_helpers.js";
import {
  create_empty_cache,
  create_source_snapshot
} from "../lib/storage_repositories.js";
import {
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { find_default_add_target_source } from "./default_target_service.js";
import { save_github_cache } from "./github_helpers.js";
import {
  require_cache,
  require_source,
  get_root_source_id
} from "./source_context_service.js";
import { create_tab_bookmark } from "./tab_bookmark_service.js";
import { write_github_document_with_retry } from "./github_write_service.js";

export async function add_current_tab(source_id) {
  const default_target = source_id === "all"
    ? await find_default_add_target_source()
    : null;
  const source = source_id === "all"
    ? default_target?.source ?? null
    : await require_source(source_id, "Target source was not found");

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (!source.writable) {
    throw new Error("Selected source is read-only");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    throw new Error("Active tab is unavailable");
  }

  const target_cache = source_id === "all" && default_target?.should_register_source
    ? await cache_repository.get_cache(source.source_id)
    : await require_cache(source.source_id, "Target source cache was not found");
  const fallback_cache = source_id === "all" && default_target?.should_register_source
    ? create_empty_cache(source)
    : null;
  const writable_cache = target_cache || fallback_cache;

  if (!writable_cache) {
    throw new Error("Target source cache was not found");
  }

  const next_item = create_tab_bookmark(tab);
  const next_items = [...writable_cache.items_cache, next_item];
  const next_document_title = writable_cache.source_snapshot?.document_title
    || (source.path === GITHUB_BOOKMARKS_FILE_PATH ? "default bookmarks" : source.source_name);

  if (source.type === "github") {
    const write_result = await write_github_document_with_retry(
      source,
      next_document_title,
      next_items,
      writable_cache.last_remote_revision,
      `Add bookmark: ${next_item.title}`,
      (latest_remote) => ({
        title: latest_remote.title || next_document_title,
        items: [...latest_remote.items, next_item]
      })
    );

    if (source_id === "all" && default_target?.should_register_source) {
      const root_source_id = get_root_source_id(source.source_id);
      const root_source = await source_repository.get_source(root_source_id);

      if (root_source) {
        const file_paths = Array.isArray(root_source.file_paths) ? root_source.file_paths : [];

        if (!file_paths.includes(source.path)) {
          await source_repository.save_source({
            ...root_source,
            file_paths: [...file_paths, source.path]
          });
        }
      }
    }

    await save_github_cache(
      source,
      writable_cache,
      write_result.items,
      write_result.title,
      write_result.revision,
      write_result.resolved_branch
    );
  } else {
    await cache_repository.save_cache({
      ...writable_cache,
      items_cache: next_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: "local-update",
      dirty: true,
      last_error: null,
      source_snapshot: create_source_snapshot(
        source,
        next_document_title,
        target_cache?.source_snapshot?.resolved_branch ?? null
      )
    });
  }

  return {
    state: await build_state(),
    added_item: next_item,
    target_source_id: source.source_id
  };
}

export async function handle_add_current_tab_shortcut() {
  try {
    await add_current_tab("all");
  } catch (error) {
    console.error("Failed to add current tab from shortcut", error);
  }
}
