import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import { move_draft_sort_bookmark } from "./sort_mode.js";

function create_edit_icon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  `;
}

function create_delete_icon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  `;
}

async function handle_delete_bookmark(source_id, bookmark_id, bookmark_title, apply_state) {
  const should_delete = window.confirm(`Delete "${bookmark_title}"?`);

  if (!should_delete) {
    return;
  }

  set_loading_status("Deleting bookmark...");
  const response = await send_message({
    type: "delete_bookmark",
    source_id,
    bookmark_id
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data.state, get_selected_source_id());
  set_status("Bookmark deleted");
}

export function create_bookmark_item(entry, render_bookmarks, deps, state, is_sorting) {
  const { bookmark, source_id, writable } = entry;
  const { open_edit_view, apply_state } = deps;
  const item = document.createElement("li");
  item.className = "bookmark-item";
  item.dataset.bookmarkId = bookmark.id;

  if (is_sorting) {
    item.classList.add("sortable");
    item.draggable = true;
    item.addEventListener("dragstart", () => {
      app_state.dragging_bookmark_id = bookmark.id;
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
      move_draft_sort_bookmark(app_state.dragging_bookmark_id, bookmark.id);
      render_bookmarks(state, deps);
    });
  }

  const head = document.createElement("div");
  head.className = "bookmark-head";

  const main = document.createElement("div");
  main.className = "bookmark-main";

  const link = document.createElement(is_sorting ? "span" : "a");
  link.className = "bookmark-link";

  if (!is_sorting) {
    link.href = bookmark.url;
    link.target = "_blank";
    link.rel = "noreferrer";
  }

  link.textContent = bookmark.title;
  main.appendChild(link);

  const visible_tags = bookmark.tags.slice(0, 3);

  if (visible_tags.length > 0) {
    const tag_list = document.createElement("div");
    tag_list.className = "tag-list";

    for (const tag of visible_tags) {
      const tag_pill = document.createElement("button");
      tag_pill.type = "button";
      tag_pill.className = "tag-pill";
      tag_pill.textContent = tag;
      tag_pill.classList.toggle("active", app_state.active_tag_filter === tag);
      tag_pill.addEventListener("click", () => {
        app_state.active_tag_filter = app_state.active_tag_filter === tag ? null : tag;
        render_bookmarks(state, deps);
      });
      tag_list.appendChild(tag_pill);
    }

    main.appendChild(tag_list);
  }

  const actions = document.createElement("div");
  actions.className = "bookmark-actions";

  if (!is_sorting) {
    const edit_button = document.createElement("button");
    edit_button.className = "action-button";
    edit_button.innerHTML = create_edit_icon();
    edit_button.disabled = !writable;
    edit_button.title = writable ? "Edit bookmark" : "Read-only source";
    edit_button.setAttribute("aria-label", writable ? "Edit bookmark" : "Read-only source");
    edit_button.addEventListener("click", () => {
      open_edit_view(source_id, bookmark.id);
    });
    actions.appendChild(edit_button);

    const delete_button = document.createElement("button");
    delete_button.className = "action-button";
    delete_button.innerHTML = create_delete_icon();
    delete_button.disabled = !writable;
    delete_button.title = writable ? "Delete bookmark" : "Read-only source";
    delete_button.setAttribute("aria-label", writable ? "Delete bookmark" : "Read-only source");
    delete_button.addEventListener("click", () => {
      handle_delete_bookmark(source_id, bookmark.id, bookmark.title, apply_state);
    });
    actions.appendChild(delete_button);
  }

  head.appendChild(main);
  head.appendChild(actions);
  item.appendChild(head);

  return item;
}
