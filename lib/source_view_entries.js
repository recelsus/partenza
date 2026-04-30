import { build_scoped_github_source } from "./github_source_model.js";
import {
    get_github_file_cache,
    get_source,
    get_source_display_name
} from "./source_resolver.js";

export function get_source_sort_rank(source) {
    if (source.type === "github") {
        return 0;
    }

    if (source.type === "http_static") {
        return 1;
    }

    return 9;
}

export function sort_sources(sources) {
    return [...sources].sort((left, right) => {
        const rank_diff = get_source_sort_rank(left) - get_source_sort_rank(right);

        if (rank_diff !== 0) {
            return rank_diff;
        }

        return left.source_name.localeCompare(right.source_name);
    });
}

export function get_source_type_label(source_type) {
    if (source_type === "github") {
        return "GitHub";
    }

    if (source_type === "http_static") {
        return "HTTP";
    }

    return source_type;
}

export function get_file_label(source) {
    if (!source || typeof source.path !== "string" || source.path.length === 0) {
        return "unknown.json";
    }

    const segments = source.path.split("/");
    return segments[segments.length - 1] || source.path;
}

export function get_edit_target_option_label(state, source_id) {
    const source = get_source(state, source_id);
    const display_name = get_source_display_name(state, source_id);
    return `${get_file_label(source)} - ${display_name}`;
}

export function get_source_option_label(source, display_name) {
    return `${get_source_type_label(source.type)} - ${display_name}`;
}

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
