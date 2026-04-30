import { set_loading_status, set_status } from "./status_bar.js";

export function bind_refresh_event(render) {
    document.getElementById("refresh_button").addEventListener("click", () => {
        set_loading_status("Refreshing state...");
        render().catch((error) => {
            document.getElementById("state_dump").textContent = String(error);
            set_status(String(error), true);
        });
    });
}
