import { app_state } from "./state.js";
import { move_draft_sort_bookmark } from "./sort_mode.js";

export function apply_sortable_behaviour(item, bookmark_id, render_bookmarks, state, deps) {
  item.classList.add("sortable");
  item.draggable = true;
  item.addEventListener("dragstart", () => {
    app_state.dragging_bookmark_id = bookmark_id;
    item.classList.add("dragging");
  });
  item.addEventListener("dragend", () => {
    app_state.dragging_bookmark_id = null;
    item.classList.remove("dragging");
  });
  item.addEventListener("dragover", (event) => {
    event.preventDefault();
  });
  item.addEventListener("drop", (event) => {
    event.preventDefault();
    move_draft_sort_bookmark(app_state.dragging_bookmark_id, bookmark_id);
    render_bookmarks(state, deps);
  });
}
