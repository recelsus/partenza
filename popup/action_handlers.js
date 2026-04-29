import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import { cancel_sort_mode, start_sort_mode } from "./sort_mode.js";
import { close_edit_view } from "./edit_view.js";
import { close_export_view } from "./export_view.js";

export function configure_action_button_labels() {
  document.getElementById("refresh_button").textContent = "⟳";
  document.getElementById("refresh_button").title = "更新";
  document.getElementById("refresh_button").setAttribute("aria-label", "更新");

  document.getElementById("add_tab_button").textContent = "＋";
  document.getElementById("add_tab_button").title = "Add Tab";
  document.getElementById("add_tab_button").setAttribute("aria-label", "Add Tab");
}

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

export function handle_start_sort(render_bookmarks_view) {
  if (app_state.current_view_state) {
    start_sort_mode(app_state.current_view_state, render_bookmarks_view);
  }
}
