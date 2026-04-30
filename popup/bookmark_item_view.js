import { apply_sortable_behaviour } from "./bookmark_item_sort.js";
import {
  create_bookmark_actions,
  create_sort_placeholder_actions
} from "./bookmark_item_buttons.js";
import { create_tag_list } from "./bookmark_item_tags.js";

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
    head.appendChild(create_sort_placeholder_actions());
  }

  item.appendChild(head);

  return item;
}
