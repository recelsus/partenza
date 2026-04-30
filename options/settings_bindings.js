import {
    save_theme_mode,
    save_ui_mode
} from "./settings_actions.js";
import { set_status } from "./status_bar.js";

export function bind_ui_mode_events(render) {
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
}

export function bind_theme_mode_events(render) {
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
}
