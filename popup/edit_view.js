import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import {
  get_edit_target_option_label,
  get_selected_source_id,
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

export function open_edit_view(source_id, bookmark_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const source = get_source(app_state.current_view_state, source_id);
  const cache = get_source_cache(app_state.current_view_state, source_id);
  const bookmark = cache?.items_cache.find((entry) => entry.id === bookmark_id) ?? null;

  if (!source || !cache || !bookmark) {
    set_status("Bookmark context was not found", true);
    return;
  }

  app_state.editing_context = {
    source_id,
    bookmark_id
  };

  const target_select = document.getElementById("edit_target_source_select");
  const editable_sources = sort_sources(app_state.current_view_state.sources).filter((entry) => {
    return entry.type === "github" && entry.writable;
  });

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

  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = false;
}

export function close_edit_view() {
  app_state.editing_context = null;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

function get_edit_tag_values() {
  return [
    document.getElementById("edit_bookmark_tag_1").value.trim(),
    document.getElementById("edit_bookmark_tag_2").value.trim(),
    document.getElementById("edit_bookmark_tag_3").value.trim()
  ].filter((tag) => tag.length > 0);
}

export async function save_bookmark_edit(apply_state) {
  if (!app_state.editing_context || !app_state.current_view_state) {
    set_status("Editing state was not found", true);
    return;
  }

  const next_target_source_id = document.getElementById("edit_target_source_select").value;
  const next_title = document.getElementById("edit_bookmark_title").value.trim();
  const next_url = document.getElementById("edit_bookmark_url").value.trim();
  const next_note = document.getElementById("edit_bookmark_note").value.trim();
  const next_tags = get_edit_tag_values();

  if (next_title.length === 0) {
    set_status("Title is required", true);
    return;
  }

  if (next_url.length === 0) {
    set_status("URL is required", true);
    return;
  }

  set_loading_status("Updating bookmark...");
  const response = await send_message({
    type: "save_bookmark_edit",
    source_id: app_state.editing_context.source_id,
    target_source_id: next_target_source_id,
    bookmark_id: app_state.editing_context.bookmark_id,
    updates: {
      title: next_title,
      url: next_url,
      tags: next_tags,
      note: next_note
    }
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  const current_source_id = get_selected_source_id();
  const next_selected_source_id = current_source_id === "all"
    ? "all"
    : response.data.target_source_id || current_source_id;

  close_edit_view();
  apply_state(response.data.state, next_selected_source_id);
  set_status("Bookmark updated");
}

export async function edit_document_title(apply_state) {
  const selected_source_id = get_selected_source_id();

  if (!selected_source_id || selected_source_id === "all") {
    set_status("Select a GitHub source first", true);
    return;
  }

  const cache = get_source_cache(app_state.current_view_state, selected_source_id);
  const current_title = cache?.source_snapshot?.document_title || "";
  const next_title = window.prompt("Document title", current_title);

  if (next_title === null) {
    return;
  }

  set_loading_status("Updating title...");
  const response = await send_message({
    type: "update_document_title",
    source_id: selected_source_id,
    title: next_title
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data.state, selected_source_id);
  set_status("Document title updated");
}
