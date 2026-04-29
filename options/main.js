import { send_message } from "./api.js";
import {
  get_github_form_values,
  get_http_form_values,
  reset_github_form,
  reset_http_form
} from "./forms.js";
import {
  create_github_file,
  delete_source,
  handle_sync_like_response,
  save_theme_mode,
  save_ui_mode,
  sync_source
} from "./actions.js";
import { render_state } from "./state_view.js";
import { set_loading_status, set_status } from "./status_bar.js";

function create_render_state() {
  return () => render_state({
    on_sync: (source_id) => {
      sync_source(source_id, render).catch((error) => {
        document.getElementById("state_dump").textContent = String(error);
      });
    },
    on_delete: (source_id, display_name) => {
      delete_source(source_id, display_name, render).catch((error) => {
        document.getElementById("state_dump").textContent = String(error);
      });
    },
    on_create_file: (source_id) => {
      create_github_file(source_id, render).catch((error) => {
        document.getElementById("state_dump").textContent = String(error);
        set_status(String(error), true);
      });
    }
  });
}

const render = create_render_state();

document.getElementById("refresh_button").addEventListener("click", () => {
  set_loading_status("Refreshing state...");
  render().catch((error) => {
    document.getElementById("state_dump").textContent = String(error);
    set_status(String(error), true);
  });
});

document.getElementById("register_http_button").addEventListener("click", async () => {
  set_loading_status("Registering HTTP source...");
  const response = await send_message({
    type: "register_http_source",
    ...get_http_form_values()
  });
  const success = await handle_sync_like_response(response, response.ok ? response.data.synced_source_id : null, render);

  if (success) {
    reset_http_form();
    set_status("HTTP source was registered");
  }
});

document.getElementById("register_github_button").addEventListener("click", async () => {
  set_loading_status("Registering GitHub source...");
  const response = await send_message({
    type: "register_github_source",
    ...get_github_form_values()
  });
  const success = await handle_sync_like_response(response, response.ok ? response.data.synced_source_id : null, render);

  if (success) {
    reset_github_form();
    set_status("GitHub repository was registered");
  }
});

document.getElementById("ui_mode_popup").addEventListener("change", (event) => {
  if (event.target.checked) {
    save_ui_mode("popup", render).catch((error) => {
      document.getElementById("state_dump").textContent = String(error);
      set_status(String(error), true);
    });
  }
});

document.getElementById("ui_mode_side_panel").addEventListener("change", (event) => {
  if (event.target.checked) {
    save_ui_mode("side_panel", render).catch((error) => {
      document.getElementById("state_dump").textContent = String(error);
      set_status(String(error), true);
    });
  }
});

document.getElementById("theme_mode_auto").addEventListener("change", (event) => {
  if (event.target.checked) {
    save_theme_mode("auto", render).catch((error) => {
      document.getElementById("state_dump").textContent = String(error);
      set_status(String(error), true);
    });
  }
});

document.getElementById("theme_mode_light").addEventListener("change", (event) => {
  if (event.target.checked) {
    save_theme_mode("light", render).catch((error) => {
      document.getElementById("state_dump").textContent = String(error);
      set_status(String(error), true);
    });
  }
});

document.getElementById("theme_mode_dark").addEventListener("change", (event) => {
  if (event.target.checked) {
    save_theme_mode("dark", render).catch((error) => {
      document.getElementById("state_dump").textContent = String(error);
      set_status(String(error), true);
    });
  }
});

render().catch((error) => {
  document.getElementById("state_dump").textContent = String(error);
  set_status(String(error), true);
});
