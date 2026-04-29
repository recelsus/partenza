import { send_message } from "./api.js";
import { set_loading_status, set_status } from "./status_bar.js";
import { get_selected_source_id } from "./source_helpers.js";

export async function handle_delete_bookmark(source_id, bookmark_id, bookmark_title, apply_state) {
  const should_delete = window.confirm(`Delete "${bookmark_title}"?`);

  if (!should_delete) {
    return;
  }

  set_loading_status("Deleting bookmark...");
  const response = await send_message({
    type: "delete_bookmark",
    source_id,
    bookmark_id
  });

  if (!response.ok) {
    set_status(response.message, true);
    return;
  }

  apply_state(response.data.state, get_selected_source_id());
  set_status("Bookmark deleted");
}
