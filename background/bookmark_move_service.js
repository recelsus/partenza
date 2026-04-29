import {
  build_state,
} from "./context.js";
import {
  get_document_title_from_cache,
  read_required_github_document,
  save_github_cache
} from "./github_helpers.js";
import { write_github_document_with_retry } from "./github_write_service.js";
import {
  require_cache,
  require_source,
  require_writable_github_source
} from "./source_context_service.js";
import { update_bookmark } from "./bookmark_update_service.js";

export async function save_bookmark_edit(source_id, target_source_id, bookmark_id, updates) {
  const source = await require_writable_github_source(
    source_id,
    "Target source was not found",
    "Selected source is read-only"
  );

  const target_source = target_source_id
    ? await require_source(target_source_id, "Destination source was not found")
    : source;

  if (!target_source.writable || target_source.type !== "github") {
    throw new Error("Destination source must be a writable GitHub source");
  }

  if (target_source.source_id === source.source_id) {
    const result = await update_bookmark(source_id, bookmark_id, updates);
    return {
      ...result,
      target_source_id: source.source_id
    };
  }

  const source_cache = await require_cache(source.source_id, "Bookmark cache was not found");
  const target_cache = await require_cache(target_source.source_id, "Bookmark cache was not found");

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
  const moved_bookmark = {
    ...latest_source_bookmark,
    ...updates,
    updated_at
  };
  const target_items = [
    ...target_remote.items.filter((item) => item.id !== bookmark_id),
    moved_bookmark
  ];
  const target_write = await write_github_document_with_retry(
    target_source,
    target_remote.title,
    target_items,
    target_remote.revision,
    `Move bookmark: ${moved_bookmark.title}`,
    (latest_remote) => ({
      title: latest_remote.title,
      items: [
        ...latest_remote.items.filter((item) => item.id !== bookmark_id),
        moved_bookmark
      ]
    })
  );

  const committed_source_items = source_remote.items.filter((item) => item.id !== bookmark_id);
  const source_write = await write_github_document_with_retry(
    source,
    source_remote.title,
    committed_source_items,
    source_remote.revision,
    `Move bookmark: ${moved_bookmark.title}`,
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
    state: await build_state(),
    target_source_id: target_source.source_id
  };
}
