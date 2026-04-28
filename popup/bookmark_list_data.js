import { app_state } from "./state.js";
import {
  get_selected_source_id,
  get_source,
  get_source_cache,
  get_source_sort_rank
} from "./source_helpers.js";
import {
  is_sort_mode_active_for,
  reorder_entries
} from "./sort_mode.js";

export function get_bookmark_list_context(state) {
  const selected_source_id = get_selected_source_id();
  const caches = selected_source_id === "all"
    ? state.caches
    : state.caches.filter((entry) => entry.source_id === selected_source_id);
  const selected_source = get_source(state, selected_source_id);
  const is_sorting = is_sort_mode_active_for(selected_source_id);

  return {
    selected_source_id,
    caches,
    selected_source,
    is_sorting
  };
}

function collect_bookmark_entries(state, selected_source_id) {
  if (selected_source_id !== "all") {
    const cache = get_source_cache(state, selected_source_id);
    const source = get_source(state, selected_source_id);

    if (!cache || !source) {
      return [];
    }

    return cache.items_cache.map((bookmark) => ({
      bookmark,
      source_id: cache.source_id,
      writable: Boolean(cache.source_snapshot?.writable),
      source_type: cache.source_snapshot?.source_type || source.type || ""
    }));
  }

  return state.caches.flatMap((cache) => {
    return cache.items_cache.map((bookmark) => ({
      bookmark,
      source_id: cache.source_id,
      writable: Boolean(cache.source_snapshot?.writable),
      source_type: cache.source_snapshot?.source_type || ""
    }));
  }).sort((left, right) => {
    const rank_diff = get_source_sort_rank({ type: left.source_type })
      - get_source_sort_rank({ type: right.source_type });

    if (rank_diff !== 0) {
      return rank_diff;
    }

    return left.bookmark.title.localeCompare(right.bookmark.title);
  });
}

function filter_bookmark_entries(bookmark_entries) {
  const filtered_entries = app_state.active_tag_filter
    ? bookmark_entries.filter((entry) => entry.bookmark.tags.includes(app_state.active_tag_filter))
    : bookmark_entries;
  const search_query = app_state.active_search_query.trim().toLowerCase();

  return search_query.length > 0
    ? filtered_entries.filter((entry) => {
      const { bookmark } = entry;
      const haystacks = [
        bookmark.title,
        bookmark.url,
        bookmark.note,
        ...bookmark.tags
      ];

      return haystacks.some((value) => value.toLowerCase().includes(search_query));
    })
    : filtered_entries;
}

export function get_visible_bookmark_entries(state, selected_source_id, is_sorting) {
  const source_entries = collect_bookmark_entries(state, selected_source_id);

  return is_sorting
    ? reorder_entries(source_entries, app_state.draft_sort_bookmark_ids)
    : filter_bookmark_entries(source_entries);
}
