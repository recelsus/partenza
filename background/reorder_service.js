import {
  adapters,
  build_state,
  cache_repository,
  source_repository
} from "./context.js";
import {
  create_plain_document,
  reorder_items_by_ids,
  save_github_cache
} from "./github_helpers.js";

export async function reorder_bookmarks(source_id, ordered_bookmark_ids) {
  const source = await source_repository.get_source(source_id);

  if (!source) {
    throw new Error("Target source was not found");
  }

  if (source.type !== "github" || !source.writable) {
    throw new Error("Bookmark reordering is only supported for writable GitHub sources");
  }

  const target_cache = await cache_repository.get_cache(source_id);

  if (!target_cache) {
    throw new Error("Target source cache was not found");
  }

  const committed_title = target_cache.source_snapshot?.document_title || source.source_name;
  const next_items = reorder_items_by_ids(target_cache.items_cache, ordered_bookmark_ids);
  let write_result;
  let committed_items = next_items;
  let next_title = committed_title;

  try {
    write_result = await adapters.github.write_document(
      source,
      create_plain_document(next_title, committed_items),
      target_cache.last_remote_revision,
      "Reorder bookmarks"
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes("409")) {
      throw error;
    }

    const latest_remote = await adapters.github.read(source);

    if (latest_remote.template_available) {
      throw new Error("GitHub bookmark file is missing");
    }

    next_title = latest_remote.document.title || next_title;
    committed_items = reorder_items_by_ids(latest_remote.document.items, ordered_bookmark_ids);
    write_result = await adapters.github.write_document(
      source,
      create_plain_document(next_title, committed_items),
      latest_remote.revision,
      "Reorder bookmarks"
    );
  }

  await save_github_cache(
    source,
    target_cache,
    committed_items,
    next_title,
    write_result.revision,
    write_result.resolved_branch
  );

  return {
    state: await build_state()
  };
}
