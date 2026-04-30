import { create_plain_bookmark_document } from "../lib/bookmark_document.js";
import { build_scoped_github_source } from "../lib/github_source_model.js";
import { delete_github_document_file } from "../lib/github_file_service.js";
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

export async function delete_github_file_from_repo(source, file_path) {
    if (source.type !== "github") {
        throw new Error("GitHub source was not found");
    }

    const file_paths = Array.isArray(source.file_paths) ? source.file_paths : [];

    if (!file_paths.includes(file_path)) {
        throw new Error("GitHub file was not found");
    }

    const scoped_source = build_scoped_github_source(source, file_path);
    const cache = await cache_repository.get_cache(scoped_source.source_id);

    if (!cache || typeof cache.last_remote_revision !== "string" || cache.last_remote_revision.trim().length === 0) {
        throw new Error("GitHub file revision was not found");
    }

    await delete_github_document_file(
        scoped_source,
        cache.last_remote_revision,
        `Delete bookmark file: ${file_path.split("/").pop() || file_path}`
    );

    await cache_repository.delete_cache(scoped_source.source_id);

    const next_file_paths = file_paths.filter((entry) => entry !== file_path);

    await source_repository.save_source({
        ...source,
        file_paths: next_file_paths
    });

    return {
        state: await build_state(),
        deleted_source_id: scoped_source.source_id
    };
}
