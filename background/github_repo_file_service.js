import { create_plain_bookmark_document } from "../lib/bookmark_document.js";
import { build_state, cache_repository, source_repository } from "./context.js";
import { create_github_bookmark_file } from "./github_file_create_service.js";

export async function create_github_file_for_repo(source, file_name, document_title) {
    const result = await create_github_bookmark_file(
        source,
        file_name,
        create_plain_bookmark_document(document_title, []),
        `Create bookmark file: ${file_name}`
    );

    return {
        state: await build_state(),
        created_source_id: result.created_source_id,
        resolved_branch: result.resolved_branch
    };
}

export function derive_github_document_title(file_name, requested_title = "") {
    const trimmed_title = typeof requested_title === "string" ? requested_title.trim() : "";

    if (trimmed_title.length > 0) {
        return trimmed_title;
    }

    const without_extension = file_name.replace(/\.json$/i, "");
    return without_extension.length > 0 ? without_extension : "new bookmarks";
}

export async function delete_github_repo_source(source) {
    const caches = await cache_repository.list_caches();

    for (const cache of caches) {
        if (cache.source_id === source.source_id || cache.source_id.startsWith(`${source.source_id}::`)) {
            await cache_repository.delete_cache(cache.source_id);
        }
    }

    await source_repository.delete_source(source.source_id);
    return build_state();
}
