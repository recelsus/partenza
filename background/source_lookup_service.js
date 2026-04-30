import {
    cache_repository,
    source_repository
} from "./context.js";
import {
    build_scoped_github_source,
    parse_github_cache_id
} from "../lib/github_source_model.js";

export async function require_source(source_id, message = "Source was not found") {
    const github_cache_id = parse_github_cache_id(source_id);
    const source = github_cache_id
        ? await source_repository.get_source(github_cache_id.source_id)
        : await source_repository.get_source(source_id);

    if (!source) {
        throw new Error(message);
    }

    return github_cache_id ? build_scoped_github_source(source, github_cache_id.file_path) : source;
}

export async function require_cache(source_id, message = "Source cache was not found") {
    const cache = await cache_repository.get_cache(source_id);

    if (!cache) {
        throw new Error(message);
    }

    return cache;
}

export function get_root_source_id(source_id) {
    const github_cache_id = parse_github_cache_id(source_id);
    return github_cache_id ? github_cache_id.source_id : source_id;
}
