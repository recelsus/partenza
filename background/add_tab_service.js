import {
  build_state,
} from "./context.js";
import { save_source_cache } from "./cache_save_service.js";
import { save_github_cache } from "./github_helpers.js";
import {
  ensure_registered_github_file_path,
  get_add_tab_document_title,
  resolve_add_target_context
} from "./add_tab_target_service.js";
import { create_tab_bookmark } from "./tab_bookmark_service.js";
import { write_github_document_with_retry } from "./github_write_service.js";

export async function add_current_tab(source_id) {
  const target_context = await resolve_add_target_context(source_id);
  const source = target_context.source;
  const writable_cache = target_context.cache;

  if (!source.writable) {
    throw new Error("Selected source is read-only");
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url) {
    throw new Error("Active tab is unavailable");
  }

  const next_item = create_tab_bookmark(tab);
  const next_items = [...writable_cache.items_cache, next_item];
  const next_document_title = get_add_tab_document_title(source, writable_cache);

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

    if (target_context.should_register_source) {
      await ensure_registered_github_file_path(source);
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
    await save_source_cache(source, {
      cache: writable_cache,
      items: next_items,
      title: next_document_title,
      revision: "local-update",
      resolved_branch: writable_cache.source_snapshot?.resolved_branch ?? null,
      dirty: true,
      last_error: null
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
