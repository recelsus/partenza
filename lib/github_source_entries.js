import { build_scoped_github_source } from "./github_source_model.js";
import {
    get_github_file_cache,
    get_source,
    get_source_display_name
} from "./source_resolver.js";
import { get_file_label } from "./source_labels.js";
import { sort_sources } from "./source_sorting.js";

export function list_github_file_entries(state, source) {
    const file_paths = Array.isArray(source?.file_paths) ? [...source.file_paths].sort() : [];

    return file_paths.map((file_path) => {
        const scoped_source = build_scoped_github_source(source, file_path);
        const cache = get_github_file_cache(state, source, file_path);

        return {
            source_id: scoped_source.source_id,
            source: scoped_source,
            cache,
            file_path,
            file_label: get_file_label(scoped_source),
            display_name: cache?.source_snapshot?.document_title || source.source_name
        };
    });
}

export function list_writable_github_file_entries(state) {
    return state.caches
        .filter((entry) => entry.source_snapshot?.source_type === "github" && entry.source_snapshot?.writable)
        .map((entry) => {
            const source = get_source(state, entry.source_id);

            return {
                source_id: entry.source_id,
                source,
                cache: entry,
                display_name: get_source_display_name(state, entry.source_id),
                file_label: get_file_label(source)
            };
        })
        .filter((entry) => entry.source)
        .sort((left, right) => left.source_id.localeCompare(right.source_id));
}

export function list_writable_github_repo_sources(state) {
    return sort_sources(state.sources).filter((entry) => {
        return entry.type === "github"
            && entry.writable
            && typeof entry.token === "string"
            && entry.token.trim().length > 0;
    });
}
