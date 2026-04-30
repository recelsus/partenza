import { get_bookmark_entry_context } from "./bookmark_list_entries.js";
import { build_bookmark_toolbar_view_model } from "./bookmark_toolbar_view_model.js";

export function get_bookmark_list_view_model(state) {
    const entry_context = get_bookmark_entry_context(state);
    return build_bookmark_toolbar_view_model(state, entry_context);
}
