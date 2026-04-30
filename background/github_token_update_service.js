import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { probe_github_repo_access } from "../lib/github_repo_access_service.js";
import { build_scoped_github_source } from "../lib/github_source_model.js";
import { create_source_snapshot } from "../lib/storage_repositories.js";
import { adapters, build_state, cache_repository, source_repository } from "./context.js";

async function update_github_repo_cache_snapshots(source, fallback_resolved_branch = null) {
    const caches = await cache_repository.list_caches();
    const file_paths = Array.isArray(source.file_paths) ? source.file_paths : [];

    for (const file_path of file_paths) {
        const scoped_source = build_scoped_github_source(source, file_path);
        const cache = caches.find((entry) => entry.source_id === scoped_source.source_id);

        if (!cache) {
            continue;
        }

        const resolved_branch = cache.source_snapshot?.resolved_branch ?? fallback_resolved_branch ?? null;
        const snapshot_source = resolved_branch
            ? {
                ...scoped_source,
                branch: resolved_branch
            }
            : scoped_source;

        await cache_repository.save_cache({
            ...cache,
            source_snapshot: create_source_snapshot(
                snapshot_source,
                cache.source_snapshot?.document_title ?? null,
                resolved_branch
            )
        });
    }
}

export async function update_github_source_token(source_id, token) {
    const source = await source_repository.get_source(source_id);

    if (!source || source.type !== "github") {
        throw new Error("GitHub source was not found");
    }

    const next_source_candidate = {
        ...source,
        token: typeof token === "string" ? token.trim() : ""
    };

    await adapters.github.validate_source({
        ...next_source_candidate,
        path: GITHUB_BOOKMARKS_FILE_PATH
    });

    const access = await probe_github_repo_access({
        ...next_source_candidate,
        path: GITHUB_BOOKMARKS_FILE_PATH
    });
    const next_source = {
        ...next_source_candidate,
        readable: access.readable,
        writable: access.writable,
        visibility: access.visibility
    };

    await source_repository.save_source(next_source);
    await update_github_repo_cache_snapshots(next_source, access.resolved_branch);

    return {
        state: await build_state(),
        source_id: next_source.source_id,
        writable: next_source.writable,
        visibility: next_source.visibility
    };
}
