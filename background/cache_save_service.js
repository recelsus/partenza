import { create_source_snapshot } from "../lib/storage_repositories.js";
import { cache_repository } from "./context.js";

export async function save_source_cache(
    source,
    {
        cache = null,
        items,
        title,
        revision,
        resolved_branch = null,
        dirty = false,
        last_error = null
    }
) {
    await cache_repository.save_cache({
        ...cache,
        source_id: source.source_id,
        last_synced_at: new Date().toISOString(),
        last_remote_revision: revision,
        dirty,
        items_cache: items,
        last_error,
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

export async function save_synced_source_cache(
    source,
    items,
    title,
    revision,
    resolved_branch = null
) {
    await save_source_cache(source, {
        items,
        title,
        revision,
        resolved_branch,
        dirty: false,
        last_error: null
    });
}

export async function save_dirty_local_cache(cache, items, revision) {
    await cache_repository.save_cache({
        ...cache,
        items_cache: items,
        last_synced_at: new Date().toISOString(),
        last_remote_revision: revision,
        dirty: true,
        last_error: null
    });
}
