import {
    get_document_title_from_cache,
    read_required_github_document,
    save_github_cache
} from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";

function build_moved_bookmark(bookmark, updates, updated_at) {
    return {
        ...bookmark,
        ...updates,
        updated_at
    };
}

export async function move_github_bookmark(
    source,
    source_cache,
    target_source,
    target_cache,
    bookmark_id,
    updates
) {
    const cached_bookmark = source_cache.items_cache.find((item) => item.id === bookmark_id);

    if (!cached_bookmark) {
        throw new Error("Bookmark was not found");
    }

    const updated_at = new Date().toISOString();
    const source_remote = await read_required_github_document(
        source,
        get_document_title_from_cache(source, source_cache)
    );
    const target_remote = await read_required_github_document(
        target_source,
        get_document_title_from_cache(target_source, target_cache)
    );
    const latest_source_bookmark = source_remote.items.find((item) => item.id === bookmark_id) || cached_bookmark;
    const moved_bookmark = build_moved_bookmark(latest_source_bookmark, updates, updated_at);
    const target_items = [
        ...target_remote.items.filter((item) => item.id !== bookmark_id),
        moved_bookmark
    ];
    const commit_message = `Move bookmark: ${moved_bookmark.title}`;

    const target_write = await write_github_document_with_retry(
        target_source,
        target_remote.title,
        target_items,
        target_remote.revision,
        commit_message,
        (latest_remote) => ({
            title: latest_remote.title,
            items: [
                ...latest_remote.items.filter((item) => item.id !== bookmark_id),
                moved_bookmark
            ]
        })
    );

    const source_items = source_remote.items.filter((item) => item.id !== bookmark_id);
    const source_write = await write_github_document_with_retry(
        source,
        source_remote.title,
        source_items,
        source_remote.revision,
        commit_message,
        (latest_remote) => ({
            title: latest_remote.title,
            items: latest_remote.items.filter((item) => item.id !== bookmark_id)
        })
    );

    await save_github_cache(
        target_source,
        target_cache,
        target_write.items,
        target_write.title,
        target_write.revision,
        target_write.resolved_branch
    );
    await save_github_cache(
        source,
        source_cache,
        source_write.items,
        source_write.title,
        source_write.revision,
        source_write.resolved_branch
    );

    return {
        source_write,
        target_write
    };
}
