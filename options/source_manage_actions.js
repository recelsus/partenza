import { send_message } from "./api.js";
import { set_loading_status, set_status } from "./status_bar.js";

export async function delete_source(source_id, display_name, render_state) {
    const should_delete = window.confirm(`Delete source "${display_name}" and its local cache?`);

    if (!should_delete) {
        return;
    }

    set_loading_status("Deleting source...");
    const response = await send_message({
        type: "delete_source",
        source_id
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status("Source was deleted");
}

export async function create_github_file(source_id, render_state) {
    const file_name = window.prompt("New GitHub file name (without .json)", "new-bookmarks");

    if (file_name === null) {
        return;
    }

    set_loading_status("Creating GitHub file...");
    const response = await send_message({
        type: "create_github_file",
        source_id,
        file_name
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status("GitHub file was created");
}

export async function update_github_pat(source_id, render_state) {
    const token = window.prompt("New GitHub PAT (leave blank to clear PAT)", "");

    if (token === null) {
        return;
    }

    set_loading_status("Checking GitHub access...");
    const response = await send_message({
        type: "update_github_source_token",
        source_id,
        token
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status(
        response.data.writable
            ? "GitHub source access updated: writable"
            : "GitHub source access updated: read-only"
    );
}

export async function delete_github_file(source_id, file_path, render_state) {
    const file_name = file_path.split("/").pop() || file_path;
    const should_delete = window.confirm(`Delete GitHub file "${file_name}" from the repository?`);

    if (!should_delete) {
        return;
    }

    set_loading_status("Deleting GitHub file...");
    const response = await send_message({
        type: "delete_github_file",
        source_id,
        file_path
    });

    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return;
    }

    await render_state();
    set_status("GitHub file was deleted");
}
