import {
    create_github_file,
    delete_github_file,
    delete_source,
    update_github_pat,
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
            on_delete_file: (source_id, file_path) => {
                const file_paths = Array.isArray(file_path) ? file_path : [file_path];

                if (file_paths.length === 0) {
                    set_status("No GitHub files are registered", true);
                    return;
                }

                const prompt_text = [
                    "Select a GitHub file to delete.",
                    ...file_paths.map((entry, index) => `${index + 1}. ${entry}`)
                ].join("\n");
                const selected_value = window.prompt(prompt_text, file_paths[0]);

                if (selected_value === null) {
                    return;
                }

                const matched_file_path = file_paths.find((entry, index) => {
                    return entry === selected_value.trim() || String(index + 1) === selected_value.trim();
                });

                if (!matched_file_path) {
                    set_status("Select a valid GitHub file", true);
                    return;
                }

                delete_github_file(source_id, matched_file_path, render).catch((error) => {
                    document.getElementById("state_dump").textContent = String(error);
                    set_status(String(error), true);
                });
            },
            on_create_file: (source_id) => {
                create_github_file(source_id, render).catch((error) => {
                    document.getElementById("state_dump").textContent = String(error);
                    set_status(String(error), true);
                });
            },
            on_update_pat: (source_id) => {
                update_github_pat(source_id, render).catch((error) => {
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
