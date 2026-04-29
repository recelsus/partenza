import { app_state } from "./state.js";
import { set_status } from "./status_bar.js";
import {
  get_edit_bookmark_context,
  populate_edit_form,
  render_edit_target_hint
} from "./edit_form.js";
import {
  edit_document_title_action,
  save_bookmark_edit_action
} from "./edit_actions.js";

export { render_edit_target_hint };

export function open_edit_view(source_id, bookmark_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const { source, cache, bookmark } = get_edit_bookmark_context(source_id, bookmark_id);

  if (!source || !cache || !bookmark) {
    set_status("Bookmark context was not found", true);
    return;
  }

  app_state.editing_context = {
    source_id,
    bookmark_id
  };

  populate_edit_form(source_id, bookmark);
  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = false;
}

export function close_edit_view() {
  app_state.editing_context = null;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

export async function save_bookmark_edit(apply_state) {
  return save_bookmark_edit_action(apply_state, close_edit_view);
}

export async function edit_document_title(apply_state) {
  return edit_document_title_action(apply_state);
}
