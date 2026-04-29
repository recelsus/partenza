import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import { cancel_sort_mode } from "./sort_mode.js";
import {
  render_bookmarks,
  render_sources,
  update_add_tab_button
} from "./render.js";

function render_bookmarks_view(state, open_edit_view, apply_state) {
  render_bookmarks(state, {
    open_edit_view,
    apply_state
  });
}

export function create_view_controller(open_edit_view) {
  function apply_state(state, selected_source_id = null) {
    app_state.current_view_state = state;
    const next_selected_source_id = selected_source_id !== null && selected_source_id !== undefined
      ? selected_source_id
      : (get_selected_source_id() || "all");

    render_sources(state, next_selected_source_id);
    render_bookmarks_view(state, open_edit_view, apply_state);
    update_add_tab_button(state);
  }

  async function refresh_view() {
    cancel_sort_mode((next_state) => render_bookmarks_view(next_state, open_edit_view, apply_state));
    set_loading_status("Loading...");
    const selected_source_id = get_selected_source_id();
    const response = await send_message({ type: "get_view_state" });

    if (!response.ok) {
      set_status(response.message, true);
      return;
    }

    apply_state(response.data, selected_source_id);
    set_status("State loaded");
  }

  return {
    apply_state,
    refresh_view,
    render_bookmarks_view: (state) => render_bookmarks_view(state, open_edit_view, apply_state)
  };
}
