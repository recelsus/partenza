import { send_message } from "./api.js";
import { set_loading_status, set_status } from "./status_bar.js";

export async function save_ui_mode(ui_mode, render_state) {
    set_loading_status("Saving display mode...");
    const response = await send_message({
        type: "save_ui_mode",
        ui_mode
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status("Display mode was updated");
}

export async function save_theme_mode(theme_mode, render_state) {
    set_loading_status("Saving theme...");
    const response = await send_message({
        type: "save_theme_mode",
        theme_mode
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status("Theme was updated");
}
