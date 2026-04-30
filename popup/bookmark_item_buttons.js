import { create_delete_icon, create_edit_icon } from "./bookmark_item_icons.js";
import { handle_delete_bookmark } from "./bookmark_item_actions.js";

function create_action_button({
    icon_html,
    disabled,
    enabled_title,
    disabled_title,
    on_click
}) {
    const button = document.createElement("button");
    button.className = "action-button";
    button.innerHTML = icon_html;
    button.disabled = disabled;
    button.title = disabled ? disabled_title : enabled_title;
    button.setAttribute("aria-label", disabled ? disabled_title : enabled_title);
    button.addEventListener("click", on_click);
    return button;
}

export function create_bookmark_actions(source_id, bookmark, writable, open_edit_view, apply_state) {
    const actions = document.createElement("div");
    actions.className = "bookmark-actions";

    actions.appendChild(create_action_button({
        icon_html: create_edit_icon(),
        disabled: !writable,
        enabled_title: "Edit bookmark",
        disabled_title: "Read-only source",
        on_click: () => {
            open_edit_view(source_id, bookmark.id);
        }
    }));

    actions.appendChild(create_action_button({
        icon_html: create_delete_icon(),
        disabled: !writable,
        enabled_title: "Delete bookmark",
        disabled_title: "Read-only source",
        on_click: () => {
            handle_delete_bookmark(source_id, bookmark.id, bookmark.title, apply_state);
        }
    }));

    return actions;
}

export function create_sort_placeholder_actions() {
    const actions = document.createElement("div");
    actions.className = "bookmark-actions";
    return actions;
}
