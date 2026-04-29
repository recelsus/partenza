import { create_source_snapshot } from "../lib/storage_repositories.js";
import { cache_repository } from "./context.js";

export async function save_synced_source_cache(
  source,
  items,
  title,
  revision,
  resolved_branch = null
) {
  await cache_repository.save_cache({
    source_id: source.source_id,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: revision,
    dirty: false,
    items_cache: items,
    last_error: null,
    source_snapshot: create_source_snapshot(
      resolved_branch
        ? {
            ...source,
            branch: resolved_branch
          }
        : source,
      title,
      resolved_branch
    )
  });
}
