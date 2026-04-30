import { app_state } from "./state.js";
import { set_status } from "./status_bar.js";
import { close_edit_view } from "./edit_view.js";
import { close_export_view } from "./export_view.js";
import { cancel_sort_mode } from "./sort_mode.js";

export function handle_source_change(refresh_view, render_bookmarks_view) {
    app_state.active_tag_filter = null;
    app_state.active_search_query = "";
    close_edit_view();
    close_export_view();
    cancel_sort_mode(render_bookmarks_view);
    document.getElementById("search_input").value = "";
    refresh_view().catch((error) => set_status(String(error), true));
}

export function handle_search_input(event, render_bookmarks_view) {
    app_state.active_search_query = event.target.value;

    if (app_state.current_view_state) {
        render_bookmarks_view(app_state.current_view_state);
    }
}
