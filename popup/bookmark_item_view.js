import { app_state } from "./state.js";
import { create_delete_icon, create_edit_icon } from "./bookmark_item_icons.js";
import { handle_delete_bookmark } from "./bookmark_item_actions.js";
import { apply_sortable_behaviour } from "./bookmark_item_sort.js";

function create_tag_list(bookmark, render_bookmarks, state, deps) {
  const visible_tags = bookmark.tags.slice(0, 3);

  if (visible_tags.length === 0) {
    return null;
  }

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

  return tag_list;
}

function create_bookmark_actions(source_id, bookmark, writable, open_edit_view, apply_state) {
  const actions = document.createElement("div");
  actions.className = "bookmark-actions";

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

  return actions;
}

export function create_bookmark_item(entry, render_bookmarks, deps, state, is_sorting) {
  const { bookmark, source_id, writable } = entry;
  const { open_edit_view, apply_state } = deps;
  const item = document.createElement("li");
  item.className = "bookmark-item";
  item.dataset.bookmarkId = bookmark.id;

  if (is_sorting) {
    apply_sortable_behaviour(item, bookmark.id, render_bookmarks, state, deps);
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

  const tag_list = create_tag_list(bookmark, render_bookmarks, state, deps);

  if (tag_list) {
    main.appendChild(tag_list);
  }

  head.appendChild(main);

  if (!is_sorting) {
    head.appendChild(create_bookmark_actions(source_id, bookmark, writable, open_edit_view, apply_state));
  } else {
    const actions = document.createElement("div");
    actions.className = "bookmark-actions";
    head.appendChild(actions);
  }

  item.appendChild(head);

  return item;
}
