import {
    get_file_label,
    get_source_cache,
    list_github_file_entries
} from "../lib/source_view_helpers.js";

export function render_github_group(state, sources, handlers, source_list) {
    const primary_source = sources[0];
    const primary_cache = get_source_cache(state, primary_source.source_id);
    const wrapper = document.createElement("div");
    wrapper.className = "source-item";
    const branch_label = primary_cache?.source_snapshot?.resolved_branch
        || (primary_source.branch && primary_source.branch.trim().length > 0 ? primary_source.branch : "auto: main -> master");

    const title = document.createElement("strong");
    title.textContent = `${primary_source.owner}/${primary_source.repo}`;
    wrapper.appendChild(title);

    const meta = document.createElement("span");
    meta.textContent = `github / ${primary_source.writable ? "writable" : "read-only"} / files: ${sources.length}`;
    wrapper.appendChild(meta);

    const repo = document.createElement("span");
    repo.textContent = `branch: ${branch_label}`;
    wrapper.appendChild(repo);

    const file_entries = list_github_file_entries(state, primary_source);

    for (const file_entry of file_entries) {
        const file_line = document.createElement("span");
        file_line.textContent = `file: ${get_file_label(file_entry.source)} / title: ${file_entry.display_name} / items: ${file_entry.cache ? file_entry.cache.items_cache.length : 0}`;
        wrapper.appendChild(file_line);
    }

    const button_row = document.createElement("div");
    button_row.className = "row";

    const sync_button = document.createElement("button");
    sync_button.textContent = "Sync GitHub";
    sync_button.addEventListener("click", () => {
        handlers.on_sync(primary_source);
    });
    button_row.appendChild(sync_button);

    const create_file_button = document.createElement("button");
    create_file_button.textContent = "New File";
    create_file_button.addEventListener("click", () => {
        handlers.on_create_file(primary_source.source_id);
    });
    button_row.appendChild(create_file_button);

    const delete_button = document.createElement("button");
    delete_button.textContent = "Delete";
    delete_button.addEventListener("click", () => {
        handlers.on_delete(primary_source.source_id, `${primary_source.owner}/${primary_source.repo}`);
    });
    button_row.appendChild(delete_button);

    wrapper.appendChild(button_row);
    source_list.appendChild(wrapper);
}
