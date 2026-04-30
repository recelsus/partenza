import { app_state } from "./state.js";
import { can_sort_selected_source, is_sort_mode_active_for } from "./sort_mode.js";

function get_empty_message(caches, visible_entries) {
    if (caches.length === 0) {
        return "No bookmark cache for the selected source.";
    }

    if (visible_entries.length === 0) {
        return app_state.active_tag_filter || app_state.active_search_query.trim().length > 0
            ? "No bookmarks match the current filter."
            : "No bookmarks found.";
    }

    return "";
}

export function build_bookmark_toolbar_view_model(state, entry_context) {
    const is_sorting = entry_context.is_sorting ?? is_sort_mode_active_for(entry_context.selected_source_id);
    const can_sort = can_sort_selected_source(state, entry_context.selected_source_id);
    const has_github_target = state.sources.some((source) => {
        return source.type === "github" && source.writable;
    });
    const can_export = Boolean(
        entry_context.selected_source
            && entry_context.selected_source.type === "http_static"
            && entry_context.selected_source_id !== "all"
            && has_github_target
            && !is_sorting
    );
    const can_edit_title = Boolean(
        entry_context.selected_source
            && entry_context.selected_source.type === "github"
            && entry_context.selected_source.writable
            && !is_sorting
    );

    return {
        ...entry_context,
        is_sorting,
        empty_message: get_empty_message(entry_context.caches, entry_context.visible_entries),
        summary_text: `${entry_context.visible_entries.length} items`,
        filter_label_text: is_sorting
            ? "drag to reorder"
            : app_state.active_tag_filter ? `tag: ${app_state.active_tag_filter}` : "",
        show_filter_label: is_sorting || Boolean(app_state.active_tag_filter),
        can_sort,
        can_export,
        can_edit_title,
        disable_search: is_sorting
    };
}
