import { create_bookmark_item } from "./bookmark_item_view.js";
import { get_bookmark_list_view_model } from "./bookmark_list_view_model.js";
import { update_bookmark_toolbar_state, update_bookmark_summary } from "./bookmark_toolbar_state.js";

export function render_bookmarks(state, deps) {
  const bookmarks_list = document.getElementById("bookmarks_list");
  const view_model = get_bookmark_list_view_model(state);

  bookmarks_list.innerHTML = "";
  update_bookmark_toolbar_state(view_model);

  if (view_model.caches.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = view_model.empty_message;
    bookmarks_list.appendChild(item);
    update_bookmark_summary(view_model);
    return;
  }

  update_bookmark_summary(view_model);

  if (view_model.visible_entries.length === 0) {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = view_model.empty_message;
    bookmarks_list.appendChild(item);
    return;
  }

  for (const entry of view_model.visible_entries) {
    bookmarks_list.appendChild(
      create_bookmark_item(entry, render_bookmarks, deps, state, view_model.is_sorting)
    );
  }
}
