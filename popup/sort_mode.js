import { app_state } from "./state.js";
import {
  get_selected_source_id,
  get_source,
  get_source_cache
} from "./source_helpers.js";

export function is_sort_mode_active_for(source_id) {
  return app_state.sort_mode_source_id === source_id;
}

export function can_sort_selected_source(state, selected_source_id) {
  const source = get_source(state, selected_source_id);

  return Boolean(
    source
      && source.type === "github"
      && selected_source_id !== "all"
      && !app_state.active_tag_filter
      && app_state.active_search_query.trim().length === 0
  );
}

export function reorder_entries(entries, ordered_ids) {
  const rank_map = new Map(ordered_ids.map((id, index) => [id, index]));

  return [...entries].sort((left, right) => {
    const left_rank = rank_map.has(left.bookmark.id) ? rank_map.get(left.bookmark.id) : Number.MAX_SAFE_INTEGER;
    const right_rank = rank_map.has(right.bookmark.id) ? rank_map.get(right.bookmark.id) : Number.MAX_SAFE_INTEGER;
    return left_rank - right_rank;
  });
}

export function move_draft_sort_bookmark(moved_id, target_id) {
  if (!moved_id || !target_id || moved_id === target_id) {
    return;
  }

  const next_ids = [...app_state.draft_sort_bookmark_ids];
  const from_index = next_ids.indexOf(moved_id);
  const to_index = next_ids.indexOf(target_id);

  if (from_index === -1 || to_index === -1) {
    return;
  }

  next_ids.splice(from_index, 1);
  next_ids.splice(to_index, 0, moved_id);
  app_state.draft_sort_bookmark_ids = next_ids;
}

export function start_sort_mode(state, render_bookmarks) {
  const source_id = get_selected_source_id();

  if (!can_sort_selected_source(state, source_id)) {
    return;
  }

  const cache = get_source_cache(state, source_id);

  if (!cache) {
    return;
  }

  app_state.sort_mode_source_id = source_id;
  app_state.draft_sort_bookmark_ids = cache.items_cache.map((bookmark) => bookmark.id);
  app_state.dragging_bookmark_id = null;
  render_bookmarks(state);
}

export function cancel_sort_mode(render_bookmarks) {
  app_state.sort_mode_source_id = null;
  app_state.draft_sort_bookmark_ids = [];
  app_state.dragging_bookmark_id = null;

  if (app_state.current_view_state) {
    render_bookmarks(app_state.current_view_state);
  }
}
