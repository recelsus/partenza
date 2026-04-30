import {
    create_empty_cache,
    create_source_id
} from "../lib/storage_repositories.js";
import {
    adapters,
    build_state,
    cache_repository,
    source_repository
} from "./context.js";
import { save_synced_source_cache } from "./source_cache_service.js";

export function build_http_source(url) {
    const normalised_url = url.trim();

    return {
        source_id: create_source_id("http"),
        source_name: normalised_url,
        type: "http_static",
        enabled: true,
        writable: false,
        url: normalised_url
    };
}

export async function assert_http_source_is_unique(url) {
    const existing_sources = await source_repository.list_sources();
    const normalised_url = url.trim();
    const has_duplicate = existing_sources.some((source) => {
        return source.type === "http_static" && source.url === normalised_url;
    });

    if (has_duplicate) {
        throw new Error("HTTP static source with the same URL is already registered");
    }
}

export async function initialise_http_source(source) {
    await adapters.http_static.validate_source(source);
    await source_repository.save_source(source);
    await cache_repository.save_cache(create_empty_cache(source));
    return source;
}

export async function sync_http_source(source) {
    const { document, revision } = await adapters.http_static.read(source);

    await save_synced_source_cache(
        source,
        document.items,
        document.title,
        revision
    );

    return {
        state: await build_state(),
        synced_source_id: source.source_id,
        synced_title: document.title,
        item_count: document.items.length
    };
}

export async function delete_http_source(source) {
    await cache_repository.delete_cache(source.source_id);
    await source_repository.delete_source(source.source_id);
    return build_state();
}
