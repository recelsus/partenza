import {
  build_state,
} from "./context.js";
import { move_github_bookmark } from "./github_bookmark_move_service.js";
import {
  require_cache,
  require_source,
  require_writable_github_source
} from "./source_context_service.js";
import { update_bookmark } from "./bookmark_update_service.js";

export async function save_bookmark_edit(source_id, target_source_id, bookmark_id, updates) {
  const source = await require_writable_github_source(
    source_id,
    "Target source was not found",
    "Selected source is read-only"
  );

  const target_source = target_source_id
    ? await require_source(target_source_id, "Destination source was not found")
    : source;

  if (!target_source.writable || target_source.type !== "github") {
    throw new Error("Destination source must be a writable GitHub source");
  }

  if (target_source.source_id === source.source_id) {
    const result = await update_bookmark(source_id, bookmark_id, updates);
    return {
      ...result,
      target_source_id: source.source_id
    };
  }

  const source_cache = await require_cache(source.source_id, "Bookmark cache was not found");
  const target_cache = await require_cache(target_source.source_id, "Bookmark cache was not found");
  await move_github_bookmark(
    source,
    source_cache,
    target_source,
    target_cache,
    bookmark_id,
    updates
  );

  return {
    state: await build_state(),
    target_source_id: target_source.source_id
  };
}
