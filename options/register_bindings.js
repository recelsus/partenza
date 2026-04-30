import { send_message } from "./api.js";
import {
    get_github_form_values,
    get_http_form_values,
    reset_github_form,
    reset_http_form
} from "./forms.js";
import { ensure_http_origin_permission } from "./http_permission.js";
import { handle_sync_like_response } from "./source_actions.js";
import { set_loading_status, set_status } from "./status_bar.js";

export function bind_register_events(render) {
    document.getElementById("register_http_button").addEventListener("click", async () => {
        set_loading_status("Registering HTTP source...");
        const form_values = get_http_form_values();
        await ensure_http_origin_permission(form_values.url);
        const response = await send_message({
            type: "register_http_source",
            ...form_values
        });
        const success = await handle_sync_like_response(
            response,
            response.ok ? response.data.synced_source_id : null,
            render
        );

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
        const success = await handle_sync_like_response(
            response,
            response.ok ? response.data.synced_source_id : null,
            render
        );

        if (success) {
            reset_github_form();
            set_status("GitHub repository was registered");
        }
    });
}
