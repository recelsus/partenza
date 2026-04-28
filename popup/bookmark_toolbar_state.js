import { app_state } from "./state.js";
import { get_source } from "./source_helpers.js";
import {
  can_sort_selected_source,
  is_sort_mode_active_for
} from "./sort_mode.js";

function update_sort_buttons(state, selected_source_id) {
  const start_sort_button = document.getElementById("start_sort_button");
  const save_sort_button = document.getElementById("save_sort_button");
  const cancel_sort_button = document.getElementById("cancel_sort_button");
  const can_sort = can_sort_selected_source(state, selected_source_id);
  const is_sorting = is_sort_mode_active_for(selected_source_id);

  start_sort_button.hidden = !can_sort || is_sorting;
  save_sort_button.hidden = !is_sorting;
  cancel_sort_button.hidden = !is_sorting;

  if (can_sort && !is_sorting) {
    start_sort_button.title = "Reorder bookmarks";
  } else if (!can_sort && selected_source_id !== "all") {
    start_sort_button.title = "Sorting is available only for a GitHub file without filters";
  }
}

function update_export_button(state, selected_source_id, is_sorting) {
  const export_button = document.getElementById("export_button");
  const selected_source = get_source(state, selected_source_id);
  const has_github_target = state.sources.some((source) => {
    return source.type === "github"
      && source.writable
      && typeof source.token === "string"
      && source.token.trim().length > 0;
  });
  const can_export = Boolean(
    selected_source
      && selected_source.type === "http_static"
      && selected_source_id !== "all"
      && has_github_target
      && !is_sorting
  );

  export_button.hidden = !can_export;
  export_button.title = can_export
    ? "Export this HTTP bookmark file to GitHub"
    : "A writable GitHub source with PAT is required";
}

export function update_bookmark_toolbar_state(state, selected_source_id, is_sorting, selected_source) {
  const edit_title_button = document.getElementById("edit_title_button");
  const search_input = document.getElementById("search_input");

  search_input.disabled = is_sorting;

  const can_edit_title = Boolean(selected_source && selected_source.type === "github");
  edit_title_button.hidden = !can_edit_title || is_sorting;
  update_sort_buttons(state, selected_source_id);
  update_export_button(state, selected_source_id, is_sorting);
}

export function update_bookmark_summary(count, is_sorting) {
  const bookmark_count = document.getElementById("bookmark_count");
  const active_tag_label = document.getElementById("active_tag_label");

  bookmark_count.textContent = `${count} items`;
  active_tag_label.hidden = !is_sorting && !app_state.active_tag_filter;
  active_tag_label.textContent = is_sorting
    ? "drag to reorder"
    : app_state.active_tag_filter ? `tag: ${app_state.active_tag_filter}` : "";
}
