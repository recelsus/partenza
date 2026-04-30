import { app_state } from "./state.js";

export function create_tag_list(bookmark, render_bookmarks, state, deps) {
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
