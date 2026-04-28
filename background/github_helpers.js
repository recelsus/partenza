import { create_source_snapshot } from "../lib/storage_repositories.js";
import { adapters, cache_repository } from "./context.js";

export function create_plain_document(title, items) {
  return {
    format: "portable-bookmark-store",
    version: 1,
    encoding: "plain",
    title,
    items
  };
}

export function get_document_title_from_cache(source, cache) {
  return cache?.source_snapshot?.document_title || source.source_name;
}

export async function save_github_cache(source, cache, items, title, revision, resolved_branch) {
  await cache_repository.save_cache({
    ...cache,
    items_cache: items,
    last_synced_at: new Date().toISOString(),
    last_remote_revision: revision,
    dirty: false,
    last_error: null,
    source_snapshot: create_source_snapshot(
      {
        ...source,
        branch: resolved_branch
      },
      title,
      resolved_branch
    )
  });
}

export async function read_required_github_document(source, fallback_title = null) {
  const result = await adapters.github.read(source);

  if (result.template_available) {
    throw new Error("GitHub bookmark file is missing");
  }

  return {
    title: result.document.title || fallback_title || source.source_name,
    items: result.document.items,
    revision: result.revision,
    resolved_branch: result.resolved_branch
  };
}

export function reorder_items_by_ids(items, ordered_bookmark_ids) {
  const rank_map = new Map(ordered_bookmark_ids.map((id, index) => [id, index]));
  const known_items = [];
  const unknown_items = [];

  for (const item of items) {
    if (rank_map.has(item.id)) {
      known_items.push(item);
    } else {
      unknown_items.push(item);
    }
  }

  known_items.sort((left, right) => rank_map.get(left.id) - rank_map.get(right.id));
  return [...known_items, ...unknown_items];
}
