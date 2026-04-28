import {
  GITHUB_BOOKMARKS_FILE_PATH
} from "../lib/github_adapter.js";
import {
  create_empty_cache,
  create_source_snapshot
} from "../lib/storage_repositories.js";
import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import { find_default_add_target_source } from "./default_target_service.js";
import { create_plain_document } from "./github_helpers.js";

function create_tab_bookmark(tab) {
  const now = new Date().toISOString();

  return {
    id: `tab-${Date.now()}`,
    title: tab.title || tab.url || "Untitled tab",
    url: tab.url || "",
    tags: [],
    note: "Added from the active browser tab.",
    created_at: now,
    updated_at: now
  };
}

export async function add_current_tab(source_id) {
  const default_target = source_id === "all"
    ? await find_default_add_target_source()
    : null;
  const source = source_id === "all"
    ? default_target?.source ?? null
    : await source_repository.get_source(source_id);

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

  const target_cache = await cache_repository.get_cache(source.source_id);
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
    let write_result;
    let committed_items = next_items;

    try {
      write_result = await adapters.github.write_document(
        source,
        create_plain_document(next_document_title, committed_items),
        writable_cache.last_remote_revision,
        `Add bookmark: ${next_item.title}`
      );
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("409")) {
        throw error;
      }

      const latest_remote = await adapters.github.read(source);

      if (latest_remote.template_available) {
        throw new Error("GitHub bookmark file is missing");
      }

      committed_items = [...latest_remote.document.items, next_item];
      write_result = await adapters.github.write_document(
        source,
        create_plain_document(latest_remote.document.title || next_document_title, committed_items),
        latest_remote.revision,
        `Add bookmark: ${next_item.title}`
      );
    }

    if (source_id === "all" && default_target?.should_register_source) {
      await source_repository.save_source(source);
    }

    await cache_repository.save_cache({
      ...writable_cache,
      items_cache: committed_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: write_result.revision,
      dirty: false,
      last_error: null,
      source_snapshot: create_source_snapshot(
        {
          ...source,
          branch: write_result.resolved_branch
        },
        next_document_title,
        write_result.resolved_branch
      )
    });
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
