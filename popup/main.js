import {
  configure_action_button_labels,
  handle_add_tab,
  handle_save_sort,
  handle_search_input,
  handle_source_change,
  handle_start_sort
} from "./action_handlers.js";
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
import { set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";
import { cancel_sort_mode } from "./sort_mode.js";
import { create_view_controller } from "./view_controller.js";

const {
  apply_state,
  refresh_view,
  render_bookmarks_view
} = create_view_controller(open_edit_view);

document.getElementById("refresh_button").addEventListener("click", () => {
  refresh_view().catch((error) => set_status(String(error), true));
});

configure_action_button_labels();

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
  handle_start_sort(render_bookmarks_view);
});

document.getElementById("cancel_sort_button").addEventListener("click", () => {
  cancel_sort_mode(render_bookmarks_view);
});

document.getElementById("save_sort_button").addEventListener("click", async () => {
  handle_save_sort(apply_state, render_bookmarks_view).catch((error) => set_status(String(error), true));
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
  handle_add_tab(apply_state).catch((error) => set_status(String(error), true));
});

document.getElementById("source_select").addEventListener("change", () => {
  handle_source_change(refresh_view, render_bookmarks_view);
});

document.getElementById("search_input").addEventListener("input", (event) => {
  handle_search_input(event, render_bookmarks_view);
});

refresh_view().catch((error) => set_status(String(error), true));
