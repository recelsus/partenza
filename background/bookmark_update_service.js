import {
  build_state,
} from "./context.js";
import { save_dirty_local_cache } from "./cache_save_service.js";
import { apply_github_document_change } from "./github_document_change_service.js";
import {
  require_cache,
  require_writable_source
} from "./source_context_service.js";

function merge_bookmark_updates(items, bookmark_id, updates, updated_at) {
  return items.map((item) => {
    if (item.id !== bookmark_id) {
      return item;
    }

    return {
      ...item,
      ...updates,
      updated_at
    };
  });
}

export async function update_bookmark(source_id, bookmark_id, updates) {
  const source = await require_writable_source(
    source_id,
    "Target source was not found",
    "Selected source is read-only"
  );
  const target_cache = await require_cache(source_id, "Target source cache was not found");

  const updated_at = new Date().toISOString();
  const next_items = merge_bookmark_updates(target_cache.items_cache, bookmark_id, updates, updated_at);

  if (source.type === "github") {
    await apply_github_document_change(
      source,
      target_cache,
      `Update bookmark: ${updates.title || bookmark_id}`,
      (document) => ({
        title: document.title,
        items: merge_bookmark_updates(document.items, bookmark_id, updates, updated_at)
      })
    );
  } else {
    await save_dirty_local_cache(target_cache, next_items, "local-edit");
  }

  return {
    state: await build_state()
  };
}
