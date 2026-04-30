import {
    require_cache,
    require_source
} from "./source_lookup_service.js";

export async function require_source_context(source_id, source_message, cache_message) {
    const source = await require_source(source_id, source_message);
    const cache = await require_cache(source_id, cache_message);

    return {
        source,
        cache
    };
}

export async function require_writable_source(source_id, not_found_message, read_only_message) {
    const source = await require_source(source_id, not_found_message);

    if (!source.writable) {
        throw new Error(read_only_message);
    }

    return source;
}

export async function require_writable_source_context(
    source_id,
    not_found_message,
    read_only_message,
    cache_message
) {
    const source = await require_writable_source(source_id, not_found_message, read_only_message);
    const cache = await require_cache(source_id, cache_message);

    return {
        source,
        cache
    };
}

export async function require_writable_github_source(source_id, not_found_message, read_only_message) {
    const source = await require_writable_source(source_id, not_found_message, read_only_message);

    if (source.type !== "github") {
        throw new Error(read_only_message);
    }

    return source;
}

export async function require_writable_github_source_context(
    source_id,
    not_found_message,
    read_only_message,
    cache_message
) {
    const source = await require_writable_github_source(source_id, not_found_message, read_only_message);
    const cache = await require_cache(source_id, cache_message);

    return {
        source,
        cache
    };
}
