function update_sort_buttons(view_model) {
  const start_sort_button = document.getElementById("start_sort_button");
  const save_sort_button = document.getElementById("save_sort_button");
  const cancel_sort_button = document.getElementById("cancel_sort_button");
  const can_sort = view_model.can_sort;
  const is_sorting = view_model.is_sorting;

  start_sort_button.hidden = !can_sort || is_sorting;
  save_sort_button.hidden = !is_sorting;
  cancel_sort_button.hidden = !is_sorting;

  if (can_sort && !is_sorting) {
    start_sort_button.title = "Reorder bookmarks";
  } else if (!can_sort && view_model.selected_source_id !== "all") {
    start_sort_button.title = "Sorting is available only for a GitHub file without filters";
  }
}

function update_export_button(view_model) {
  const export_button = document.getElementById("export_button");
  const can_export = view_model.can_export;

  export_button.hidden = !can_export;
  export_button.title = can_export
    ? "Export this HTTP bookmark file to GitHub"
    : "A writable GitHub source with PAT is required";
}

export function update_bookmark_toolbar_state(view_model) {
  const edit_title_button = document.getElementById("edit_title_button");
  const search_input = document.getElementById("search_input");

  search_input.disabled = view_model.disable_search;

  edit_title_button.hidden = !view_model.can_edit_title;
  update_sort_buttons(view_model);
  update_export_button(view_model);
}

export function update_bookmark_summary(view_model) {
  const bookmark_count = document.getElementById("bookmark_count");
  const active_tag_label = document.getElementById("active_tag_label");

  bookmark_count.textContent = view_model.summary_text;
  active_tag_label.hidden = !view_model.show_filter_label;
  active_tag_label.textContent = view_model.filter_label_text;
}
