import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import { cancel_sort_mode, start_sort_mode } from "./sort_mode.js";

export async function handle_save_sort(apply_state, render_bookmarks_view) {
    if (!app_state.current_view_state || !app_state.sort_mode_source_id) {
        return;
    }

    set_loading_status("Saving order...");
    const response = await send_message({
        type: "reorder_bookmarks",
        source_id: app_state.sort_mode_source_id,
        ordered_bookmark_ids: app_state.draft_sort_bookmark_ids
    });

    if (!response.ok) {
        set_status(response.message, true);
        return;
    }

    const selected_source_id = app_state.sort_mode_source_id;
    cancel_sort_mode(render_bookmarks_view);
    apply_state(response.data.state, selected_source_id);
    set_status("Bookmark order updated");
}

export async function handle_add_tab(apply_state) {
    set_loading_status("Adding bookmark...");
    const source_id = get_selected_source_id();

    if (!source_id) {
        set_status("Select a source first", true);
        return;
    }

    const response = await send_message({
        type: "add_current_tab",
        source_id
    });

    if (!response.ok) {
        set_status(response.message, true);
        return;
    }

    apply_state(response.data.state, source_id);
    set_status(`Current tab added: ${response.data.added_item.title}`);
}

export function handle_start_sort(render_bookmarks_view) {
    if (app_state.current_view_state) {
        start_sort_mode(app_state.current_view_state, render_bookmarks_view);
    }
}
