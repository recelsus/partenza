import { GITHUB_BOOKMARKS_FILE_PATH } from "../lib/github_adapter_helpers.js";
import { build_scoped_github_source } from "../lib/github_source_model.js";
import { adapters, build_state } from "./context.js";
import { save_synced_source_cache } from "./source_cache_service.js";
import { ensure_github_repo_file_path } from "./github_repo_lifecycle_service.js";

export async function sync_github_repo_source(source) {
    const synced_source_ids = [source.source_id];
    let synced_title = null;
    let resolved_branch = null;
    const file_paths = Array.isArray(source.file_paths) && source.file_paths.length > 0
        ? source.file_paths
        : [GITHUB_BOOKMARKS_FILE_PATH];

    for (const file_path of file_paths) {
        const scoped_source = build_scoped_github_source(source, file_path);
        const github_result = await adapters.github.read(scoped_source);

        if (github_result.template_available) {
            return {
                state: await build_state(),
                synced_source_id: source.source_id,
                synced_source_ids,
                needs_template_creation: true,
                resolved_branch: github_result.resolved_branch,
                message: `bookmarks/ is not initialised on branch ${github_result.resolved_branch}`
            };
        }

        await save_synced_source_cache(
            scoped_source,
            github_result.document.items,
            github_result.document.title,
            github_result.revision,
            github_result.resolved_branch
        );

        synced_source_ids.push(scoped_source.source_id);
        synced_title = github_result.document.title;
        resolved_branch = github_result.resolved_branch;
    }

    return {
        state: await build_state(),
        synced_source_id: source.source_id,
        synced_source_ids,
        synced_title,
        resolved_branch
    };
}

export async function create_github_template_for_repo(source) {
    const scoped_source = build_scoped_github_source(source, GITHUB_BOOKMARKS_FILE_PATH);
    const result = await adapters.github.create_template(scoped_source);
    await ensure_github_repo_file_path(source, GITHUB_BOOKMARKS_FILE_PATH);

    await save_synced_source_cache(
        scoped_source,
        result.document.items,
        result.document.title,
        result.revision,
        result.resolved_branch
    );

    return {
        state: await build_state(),
        created_source_id: scoped_source.source_id,
        resolved_branch: result.resolved_branch,
        item_count: result.document.items.length
    };
}
