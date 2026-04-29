import {
    get_document_title_from_cache,
    save_github_cache
} from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";

export async function apply_github_document_change(
    source,
    cache,
    commit_message,
    transform_document
) {
    const committed_title = get_document_title_from_cache(source, cache);
    const next_document = transform_document({
        title: committed_title,
        items: cache.items_cache
    });
    const write_result = await write_github_document_with_retry(
        source,
        next_document.title,
        next_document.items,
        cache.last_remote_revision,
        commit_message,
        (latest_remote) => transform_document({
            title: latest_remote.title || committed_title,
            items: latest_remote.items
        })
    );

    await save_github_cache(
        source,
        cache,
        write_result.items,
        write_result.title,
        write_result.revision,
        write_result.resolved_branch
    );

    return write_result;
}
