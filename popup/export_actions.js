import { send_message } from "./api.js";
import { app_state } from "./state.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_export_form_values } from "./export_form.js";

export async function export_selected_http_source_action(apply_state, close_export_view) {
  if (!app_state.current_view_state || !app_state.export_context) {
    set_status("State is unavailable", true);
    return;
  }

  const source_id = app_state.export_context.source_id;
  const { target_source_id, file_name } = get_export_form_values();

  set_loading_status("Exporting to GitHub...");
  const response = await send_message({
    type: "export_http_source_to_github",
    source_id,
    target_source_id,
    file_name
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  close_export_view();
  apply_state(response.data.state, response.data.created_source_id);
  set_status("Bookmarks exported to GitHub");
}
