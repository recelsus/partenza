import {
  build_state,
} from "./context.js";
import { reorder_items_by_ids } from "./github_helpers.js";
import { apply_github_document_change } from "./github_document_change_service.js";
import {
  require_writable_github_source_context
} from "./source_context_service.js";

export async function reorder_bookmarks(source_id, ordered_bookmark_ids) {
  const { source, cache: target_cache } = await require_writable_github_source_context(
    source_id,
    "Target source was not found",
    "Bookmark reordering is only supported for writable GitHub sources",
    "Target source cache was not found"
  );

  await apply_github_document_change(
    source,
    target_cache,
    "Reorder bookmarks",
    (document) => ({
      title: document.title,
      items: reorder_items_by_ids(document.items, ordered_bookmark_ids)
    })
  );

  return {
    state: await build_state()
  };
}
