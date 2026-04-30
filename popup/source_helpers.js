import {
  get_edit_target_option_label,
  get_file_label,
  get_source_sort_rank,
  list_github_file_entries,
  list_writable_github_file_entries,
  list_writable_github_repo_sources,
  get_source,
  get_source_cache,
  get_source_display_name,
  get_source_option_label,
  sort_sources
} from "../lib/source_view_helpers.js";

export function get_selected_source_id() {
  return document.getElementById("source_select").value;
}

export {
  get_edit_target_option_label,
  get_file_label,
  get_source_sort_rank,
  list_github_file_entries,
  list_writable_github_file_entries,
  list_writable_github_repo_sources,
  get_source,
  get_source_cache,
  get_source_display_name,
  get_source_option_label,
  sort_sources
};
