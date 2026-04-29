import { app_state } from "./state.js";
import { set_status } from "./status_bar.js";
import { get_source } from "./source_helpers.js";
import {
  populate_export_form,
  render_export_target_hint
} from "./export_form.js";
import { export_selected_http_source_action } from "./export_actions.js";

export { render_export_target_hint };

export function open_export_view(source_id) {
  if (!app_state.current_view_state) {
    return;
  }

  const source = get_source(app_state.current_view_state, source_id);

  if (!source || source.type !== "http_static") {
    set_status("Select an HTTP source first", true);
    return;
  }

  app_state.export_context = { source_id };
  populate_export_form(app_state.current_view_state, source_id);
  document.getElementById("list_view").hidden = true;
  document.getElementById("edit_view").hidden = true;
  document.getElementById("export_view").hidden = false;
}

export function close_export_view() {
  app_state.export_context = null;
  document.getElementById("export_view").hidden = true;
  document.getElementById("list_view").hidden = false;
}

export async function export_selected_http_source(apply_state) {
  return export_selected_http_source_action(apply_state, close_export_view);
}
