import { app_state } from "./state.js";
import {
  get_edit_target_option_label,
  get_source,
  get_source_cache,
  get_source_display_name,
  sort_sources
} from "./source_helpers.js";

export function render_edit_target_hint(source_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const source = get_source(app_state.current_view_state, source_id);
  const target_hint = document.getElementById("edit_target_source_hint");

  if (!source) {
    target_hint.textContent = "";
    return;
  }

  target_hint.textContent = `${source.path} / ${get_source_display_name(app_state.current_view_state, source_id)}`;
}

export function populate_edit_form(source_id, bookmark) {
  const target_select = document.getElementById("edit_target_source_select");
  const editable_sources = app_state.current_view_state.caches
    .filter((entry) => entry.source_snapshot?.source_type === "github" && entry.source_snapshot?.writable)
    .sort((left, right) => left.source_id.localeCompare(right.source_id));

  target_select.innerHTML = "";

  for (const editable_source of editable_sources) {
    const option = document.createElement("option");
    option.value = editable_source.source_id;
    option.textContent = get_edit_target_option_label(app_state.current_view_state, editable_source.source_id);
    option.selected = editable_source.source_id === source_id;
    target_select.appendChild(option);
  }

  render_edit_target_hint(source_id);
  document.getElementById("edit_bookmark_title").value = bookmark.title;
  document.getElementById("edit_bookmark_url").value = bookmark.url;
  document.getElementById("edit_bookmark_tag_1").value = bookmark.tags[0] || "";
  document.getElementById("edit_bookmark_tag_2").value = bookmark.tags[1] || "";
  document.getElementById("edit_bookmark_tag_3").value = bookmark.tags[2] || "";
  document.getElementById("edit_bookmark_note").value = bookmark.note || "";
}

export function get_edit_bookmark_context(source_id, bookmark_id) {
  const source = get_source(app_state.current_view_state, source_id);
  const cache = get_source_cache(app_state.current_view_state, source_id);
  const bookmark = cache?.items_cache.find((entry) => entry.id === bookmark_id) ?? null;
  return { source, cache, bookmark };
}

export function get_edit_tag_values() {
  return [
    document.getElementById("edit_bookmark_tag_1").value.trim(),
    document.getElementById("edit_bookmark_tag_2").value.trim(),
    document.getElementById("edit_bookmark_tag_3").value.trim()
  ].filter((tag) => tag.length > 0);
}

export function get_edit_form_values() {
  return {
    target_source_id: document.getElementById("edit_target_source_select").value,
    title: document.getElementById("edit_bookmark_title").value.trim(),
    url: document.getElementById("edit_bookmark_url").value.trim(),
    note: document.getElementById("edit_bookmark_note").value.trim(),
    tags: get_edit_tag_values()
  };
}
