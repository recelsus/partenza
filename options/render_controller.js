import {
    create_github_file,
    delete_source,
    sync_source
} from "./source_actions.js";
import { render_state } from "./state_view.js";
import { set_status } from "./status_bar.js";

export function create_render_state() {
    async function render() {
        return render_state({
            on_sync: (source) => {
                sync_source(source, render).catch((error) => {
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

    return {
        render
    };
}
