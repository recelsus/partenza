import { bind_options_events } from "./bind_events.js";
import { create_render_state } from "./render_controller.js";
import { set_status } from "./status_bar.js";

const { render } = create_render_state();

bind_options_events(render);

render().catch((error) => {
  document.getElementById("state_dump").textContent = String(error);
  set_status(String(error), true);
});
