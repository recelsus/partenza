import { send_message } from "./api.js";
import {
  close_edit_view,
  edit_document_title,
  open_edit_view,
  render_edit_target_hint,
  save_bookmark_edit
} from "./edit_view.js";
import {
  close_export_view,
  export_selected_http_source,
  open_export_view,
  render_export_target_hint
} from "./export_view.js";
import {
  render_bookmarks,
  render_sources,
  update_add_tab_button
} from "./render.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import {
  cancel_sort_mode,
  start_sort_mode
} from "./sort_mode.js";

function render_bookmarks_view(state) {
  render_bookmarks(state, {
    open_edit_view,
    apply_state
  });
}

function apply_state(state, selected_source_id = null) {
  app_state.current_view_state = state;
  const next_selected_source_id = selected_source_id !== null && selected_source_id !== undefined
    ? selected_source_id
    : (get_selected_source_id() || "all");

  render_sources(state, next_selected_source_id);
  render_bookmarks_view(state);
  update_add_tab_button(state);
}

async function refresh_view() {
  cancel_sort_mode(render_bookmarks_view);
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

document.getElementById("refresh_button").addEventListener("click", () => {
  refresh_view().catch((error) => set_status(String(error), true));
});

document.getElementById("refresh_button").textContent = "⟳";
document.getElementById("refresh_button").title = "更新";
document.getElementById("refresh_button").setAttribute("aria-label", "更新");

document.getElementById("add_tab_button").textContent = "＋";
document.getElementById("add_tab_button").title = "Add Tab";
document.getElementById("add_tab_button").setAttribute("aria-label", "Add Tab");

document.getElementById("edit_title_button").addEventListener("click", () => {
  edit_document_title(apply_state).catch((error) => set_status(String(error), true));
});

document.getElementById("back_to_list_button").addEventListener("click", () => {
  close_edit_view();
});

document.getElementById("back_from_export_button").addEventListener("click", () => {
  close_export_view();
});

document.getElementById("save_bookmark_button").addEventListener("click", () => {
  save_bookmark_edit(apply_state).catch((error) => set_status(String(error), true));
});

document.getElementById("save_export_button").addEventListener("click", () => {
  export_selected_http_source(apply_state).catch((error) => set_status(String(error), true));
});

document.getElementById("start_sort_button").addEventListener("click", () => {
  if (app_state.current_view_state) {
    start_sort_mode(app_state.current_view_state, render_bookmarks_view);
  }
});

document.getElementById("cancel_sort_button").addEventListener("click", () => {
  cancel_sort_mode(render_bookmarks_view);
});

document.getElementById("save_sort_button").addEventListener("click", async () => {
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
});

document.getElementById("export_button").addEventListener("click", () => {
  open_export_view(get_selected_source_id());
});

document.getElementById("edit_target_source_select").addEventListener("change", (event) => {
  render_edit_target_hint(event.target.value);
});

document.getElementById("export_target_source_select").addEventListener("change", (event) => {
  render_export_target_hint(event.target.value);
});

document.getElementById("add_tab_button").addEventListener("click", async () => {
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
});

document.getElementById("source_select").addEventListener("change", () => {
  app_state.active_tag_filter = null;
  app_state.active_search_query = "";
  close_edit_view();
  close_export_view();
  cancel_sort_mode(render_bookmarks_view);
  document.getElementById("search_input").value = "";
  refresh_view().catch((error) => set_status(String(error), true));
});

document.getElementById("search_input").addEventListener("input", (event) => {
  app_state.active_search_query = event.target.value;

  if (app_state.current_view_state) {
    render_bookmarks_view(app_state.current_view_state);
  }
});

refresh_view().catch((error) => set_status(String(error), true));
