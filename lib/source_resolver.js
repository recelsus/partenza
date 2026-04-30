import {
    build_scoped_github_source,
    parse_github_cache_id
} from "./github_source_model.js";

export function get_source_cache(state, source_id) {
    return state.caches.find((entry) => entry.source_id === source_id) ?? null;
}

export function get_source(state, source_id) {
    const cache_id = parse_github_cache_id(source_id);

    if (!cache_id) {
        return state.sources.find((entry) => entry.source_id === source_id) ?? null;
    }

    const source = state.sources.find((entry) => entry.source_id === cache_id.source_id) ?? null;

    if (!source) {
        return null;
    }

    return build_scoped_github_source(source, cache_id.file_path);
}

export function get_source_display_name(state, source_id) {
    const source = get_source(state, source_id);
    const cache = get_source_cache(state, source_id);

    return cache?.source_snapshot?.document_title || source?.source_name || source_id;
}

export function get_github_file_cache(state, source, file_path) {
    return state.caches.find((entry) => {
        return entry.source_id.startsWith(`${source.source_id}::`)
            && entry.source_snapshot?.file_path === file_path;
    }) ?? null;
}
