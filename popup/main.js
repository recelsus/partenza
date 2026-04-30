import { bind_popup_events } from "./bind_events.js";
import { open_edit_view } from "./edit_view.js";
import { set_status } from "./status_bar.js";
import { create_view_controller } from "./view_controller.js";

const {
  apply_state,
  refresh_view,
  render_bookmarks_view
} = create_view_controller(open_edit_view);

bind_popup_events({
  apply_state,
  refresh_view,
  render_bookmarks_view
});

refresh_view().catch((error) => set_status(String(error), true));
