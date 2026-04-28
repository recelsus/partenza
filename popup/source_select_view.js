import {
  get_selected_source_id,
  get_source,
  get_source_cache,
  get_source_display_name,
  get_source_option_label,
  sort_sources
} from "./source_helpers.js";

export function render_sources(state, selected_source_id) {
  const source_select = document.getElementById("source_select");
  const ordered_sources = sort_sources(state.sources);

  source_select.innerHTML = "";

  const all_option = document.createElement("option");
  all_option.value = "all";
  all_option.textContent = "All";
  all_option.selected = selected_source_id === "all";
  source_select.appendChild(all_option);

  if (ordered_sources.length === 0) {
    source_select.value = "all";
    return;
  }

  let has_selected_source = selected_source_id === "all";

  for (const source of ordered_sources) {
    const display_name = get_source_display_name(state, source.source_id);
    const option = document.createElement("option");
    option.value = source.source_id;
    option.textContent = get_source_option_label(source, display_name);
    option.selected = source.source_id === selected_source_id;
    has_selected_source = has_selected_source || option.selected;
    source_select.appendChild(option);
  }

  if (!has_selected_source && ordered_sources.length > 0) {
    source_select.value = "all";
  }
}

export function update_add_tab_button(state) {
  const add_tab_button = document.getElementById("add_tab_button");
  const selected_source_id = get_selected_source_id();

  if (selected_source_id === "all") {
    const has_default_github_target = state.sources.some((source) => {
      return source.type === "github"
        && source.writable
        && typeof source.token === "string"
        && source.token.trim().length > 0;
    });

    add_tab_button.disabled = !has_default_github_target;
    add_tab_button.title = has_default_github_target
      ? "Add to default GitHub source"
      : "A GitHub source with PAT is required";
    return;
  }

  const cache = get_source_cache(state, selected_source_id);
  const source = get_source(state, selected_source_id);
  const is_writable = Boolean(cache?.source_snapshot?.writable ?? source?.writable);

  add_tab_button.disabled = !is_writable;
  add_tab_button.title = is_writable ? "" : "Read-only source cannot accept local additions";
}
