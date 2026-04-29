import {
  build_state,
} from "./context.js";
import {
  reorder_items_by_ids,
  save_github_cache
} from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";
import {
  require_cache,
  require_writable_github_source
} from "./source_context_service.js";

export async function reorder_bookmarks(source_id, ordered_bookmark_ids) {
  const source = await require_writable_github_source(
    source_id,
    "Target source was not found",
    "Bookmark reordering is only supported for writable GitHub sources"
  );
  const target_cache = await require_cache(source_id, "Target source cache was not found");

  const committed_title = target_cache.source_snapshot?.document_title || source.source_name;
  const next_items = reorder_items_by_ids(target_cache.items_cache, ordered_bookmark_ids);
  const write_result = await write_github_document_with_retry(
    source,
    committed_title,
    next_items,
    target_cache.last_remote_revision,
    "Reorder bookmarks",
    (latest_remote) => ({
      title: latest_remote.title || committed_title,
      items: reorder_items_by_ids(latest_remote.items, ordered_bookmark_ids)
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

  return {
    state: await build_state()
  };
}
