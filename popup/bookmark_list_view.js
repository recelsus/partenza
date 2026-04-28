import { app_state } from "./state.js";
import { create_bookmark_item } from "./bookmark_item_view.js";
import {
  get_bookmark_list_context,
  get_visible_bookmark_entries
} from "./bookmark_list_data.js";
import { update_bookmark_toolbar_state, update_bookmark_summary } from "./bookmark_toolbar_state.js";

export function render_bookmarks(state, deps) {
  const bookmarks_list = document.getElementById("bookmarks_list");
  const {
    selected_source_id,
    caches,
    selected_source,
    is_sorting
  } = get_bookmark_list_context(state);

  bookmarks_list.innerHTML = "";
  update_bookmark_toolbar_state(state, selected_source_id, is_sorting, selected_source);

  if (caches.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = "No bookmark cache for the selected source.";
    bookmarks_list.appendChild(item);
    update_bookmark_summary(0, is_sorting);
    return;
  }

  const visible_entries = get_visible_bookmark_entries(state, selected_source_id, is_sorting);
  update_bookmark_summary(visible_entries.length, is_sorting);

  if (visible_entries.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = app_state.active_tag_filter || app_state.active_search_query.trim().length > 0
      ? "No bookmarks match the current filter."
      : "No bookmarks found.";
    bookmarks_list.appendChild(item);
    return;
  }

  for (const entry of visible_entries) {
    bookmarks_list.appendChild(create_bookmark_item(entry, render_bookmarks, deps, state, is_sorting));
  }
}
