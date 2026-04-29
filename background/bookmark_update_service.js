import {
  build_state,
  cache_repository
} from "./context.js";
import {
  save_github_cache
} from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";
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
    const committed_title = target_cache.source_snapshot?.document_title || source.source_name;
    const write_result = await write_github_document_with_retry(
      source,
      committed_title,
      next_items,
      target_cache.last_remote_revision,
      `Update bookmark: ${updates.title || bookmark_id}`,
      (latest_remote) => ({
        title: latest_remote.title || committed_title,
        items: merge_bookmark_updates(latest_remote.items, bookmark_id, updates, updated_at)
      })
    );

    await save_github_cache(
      source,
      target_cache,
      write_result.items,
      write_result.title,
      write_result.revision,
      write_result.resolved_branch
    );
  } else {
    await cache_repository.save_cache({
      ...target_cache,
      items_cache: next_items,
      last_synced_at: new Date().toISOString(),
      last_remote_revision: "local-edit",
      dirty: true,
      last_error: null
    });
  }

  return {
    state: await build_state()
  };
}
