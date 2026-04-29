import { build_scoped_github_source } from "../lib/github_source_model.js";
import { adapters, source_repository } from "./context.js";
import { save_source_cache } from "./cache_save_service.js";
import { assert_writable_github_target, build_github_export_path } from "./export_helpers.js";

export async function create_github_bookmark_file(
    github_base_source,
    file_name,
    document,
    commit_message
) {
    assert_writable_github_target(github_base_source);

    const export_path = build_github_export_path(file_name);
    const file_paths = Array.isArray(github_base_source.file_paths) ? github_base_source.file_paths : [];

    if (file_paths.includes(export_path)) {
        throw new Error("A GitHub bookmark file with the same name is already registered");
    }

    const export_source = build_scoped_github_source(github_base_source, export_path);
    const inspection = await adapters.github.inspect_source(export_source);

    if (inspection.status === "file_ready") {
        throw new Error("A GitHub bookmark file with the same name already exists");
    }

    const write_result = await adapters.github.write_document(
        export_source,
        document,
        null,
        commit_message
    );

    await source_repository.save_source({
        ...github_base_source,
        file_paths: [...file_paths, export_path]
    });

    await save_source_cache(export_source, {
        items: document.items,
        title: document.title,
        revision: write_result.revision,
        resolved_branch: write_result.resolved_branch,
        dirty: false,
        last_error: null
    });

    return {
        created_source_id: export_source.source_id,
        export_path,
        resolved_branch: write_result.resolved_branch
    };
}
