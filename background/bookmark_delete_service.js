import {
  build_state,
} from "./context.js";
import { save_dirty_local_cache } from "./cache_save_service.js";
import { apply_github_document_change } from "./github_document_change_service.js";
import {
  require_cache,
  require_writable_source
} from "./source_context_service.js";

export async function delete_bookmark(source_id, bookmark_id) {
  const source = await require_writable_source(
    source_id,
    "Target source was not found",
    "Selected source is read-only"
  );
  const target_cache = await require_cache(source_id, "Target source cache was not found");

  const next_items = target_cache.items_cache.filter((item) => item.id !== bookmark_id);

  if (source.type === "github") {
    await apply_github_document_change(
      source,
      target_cache,
      `Delete bookmark: ${bookmark_id}`,
      (document) => ({
        title: document.title,
        items: document.items.filter((item) => item.id !== bookmark_id)
      })
    );
  } else {
    await save_dirty_local_cache(target_cache, next_items, "local-delete");
  }

  return {
    state: await build_state()
  };
}
