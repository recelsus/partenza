import { send_message } from "./api.js";
import { set_loading_status, set_status } from "./status_bar.js";

export async function handle_sync_like_response(response, source_id, render_state) {
    if (!response.ok) {
        document.getElementById("state_dump").textContent = response.message;
        await render_state();
        set_status(response.message, true);
        return false;
    }

    if (response.data.needs_template_creation) {
        const should_create = window.confirm(
            `bookmarks/ is not initialised on branch ${response.data.resolved_branch}. Create bookmarks/bookmarks.json now?`
        );

        if (!should_create) {
            await render_state();
            set_status("GitHub template creation was cancelled", true);
            return false;
        }

        const create_response = await send_message({
            type: "create_github_template",
            source_id
        });

        if (!create_response.ok) {
            document.getElementById("state_dump").textContent = create_response.message;
            await render_state();
            set_status(create_response.message, true);
            return false;
        }

        await render_state();
        set_status("GitHub bookmark template was created");
        return true;
    }

    await render_state();
    set_status("Source state updated");
    return true;
}

export async function sync_source(source_id, render_state) {
    set_loading_status("Syncing source...");
    const response = await send_message({
        type: "sync_source",
        source_id
    });
    await handle_sync_like_response(response, source_id, render_state);
}
