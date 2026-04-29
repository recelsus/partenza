import { send_message } from "./api.js";
import { render_settings } from "./forms.js";
import { render_sources } from "./source_list_view.js";

export async function render_state(handlers) {
  const response = await send_message({ type: "get_view_state" });
  const dump = document.getElementById("state_dump");

  if (!response.ok) {
    dump.textContent = response.message;
    return null;
  }

  render_settings(response.data.settings);
  render_sources(response.data, handlers);
  dump.textContent = JSON.stringify(response.data, null, 2);
  return response.data;
}
