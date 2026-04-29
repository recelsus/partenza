import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import {
  get_selected_source_id,
  get_source_cache
} from "./source_helpers.js";
import { get_edit_form_values } from "./edit_form.js";

export async function save_bookmark_edit_action(apply_state, close_edit_view) {
  if (!app_state.editing_context || !app_state.current_view_state) {
    set_status("Editing state was not found", true);
    return;
  }

  const form_values = get_edit_form_values();

  if (form_values.title.length === 0) {
    set_status("Title is required", true);
    return;
  }

  if (form_values.url.length === 0) {
    set_status("URL is required", true);
    return;
  }

  set_loading_status("Updating bookmark...");
  const response = await send_message({
    type: "save_bookmark_edit",
    source_id: app_state.editing_context.source_id,
    target_source_id: form_values.target_source_id,
    bookmark_id: app_state.editing_context.bookmark_id,
    updates: {
      title: form_values.title,
      url: form_values.url,
      tags: form_values.tags,
      note: form_values.note
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

export async function edit_document_title_action(apply_state) {
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
