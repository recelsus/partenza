import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import {
    build_github_repo_key,
    build_scoped_github_source
} from "../lib/github_source_model.js";
import { create_empty_cache } from "../lib/storage_repositories.js";
import { adapters, cache_repository, source_repository } from "./context.js";

export async function assert_github_repo_is_unique(source) {
    const existing_sources = await source_repository.list_sources();
    const has_duplicate = existing_sources.some((entry) => {
        return entry.type === "github"
            && build_github_repo_key(entry) === build_github_repo_key(source);
    });

    if (has_duplicate) {
        throw new Error("The same GitHub repository is already registered");
    }
}

export async function ensure_github_repo_file_path(source, file_path) {
    const file_paths = Array.isArray(source.file_paths) ? source.file_paths : [];

    if (file_paths.includes(file_path)) {
        return source;
    }

    const next_source = {
        ...source,
        file_paths: [...file_paths, file_path]
    };

    await source_repository.save_source(next_source);
    return next_source;
}

export async function initialise_github_repo_source(source) {
    const discovered = await adapters.github.list_bookmark_files({
        ...source,
        path: GITHUB_BOOKMARKS_FILE_PATH
    });
    const discovered_paths = discovered.files.length > 0
        ? discovered.files
        : [GITHUB_BOOKMARKS_FILE_PATH];
    const next_source = {
        ...source,
        file_paths: discovered_paths
    };

    await source_repository.save_source(next_source);

    for (const path of discovered_paths) {
        await cache_repository.save_cache(create_empty_cache(build_scoped_github_source(next_source, path)));
    }

    return {
        source: next_source,
        needs_template_creation: discovered.files.length === 0
    };
}
