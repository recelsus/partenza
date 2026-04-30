import {
    get_source_cache,
    get_source_type_label
} from "../lib/source_view_helpers.js";

export function render_http_source(state, source, handlers, source_list) {
    const cache = get_source_cache(state, source.source_id);
    const wrapper = document.createElement("div");
    wrapper.className = "source-item";
    const display_name = cache?.source_snapshot?.document_title || source.source_name;

    const title = document.createElement("strong");
    title.textContent = display_name;
    wrapper.appendChild(title);

    const meta = document.createElement("span");
    meta.textContent = `${get_source_type_label(cache?.source_snapshot?.source_type || source.type)} / ${(cache?.source_snapshot?.writable ?? source.writable) ? "writable" : "read-only"}`;
    wrapper.appendChild(meta);

    const url = document.createElement("span");
    url.textContent = cache?.source_snapshot?.locator || source.url;
    wrapper.appendChild(url);

    const cache_info = document.createElement("span");
    cache_info.textContent = `items: ${cache ? cache.items_cache.length : 0} / last synced: ${cache?.last_synced_at ?? "-"}`;
    wrapper.appendChild(cache_info);

    const button_row = document.createElement("div");
    button_row.className = "row";

    const sync_button = document.createElement("button");
    sync_button.textContent = "Sync HTTP";
    sync_button.addEventListener("click", () => {
        handlers.on_sync(source);
    });
    button_row.appendChild(sync_button);

    const delete_button = document.createElement("button");
    delete_button.textContent = "Delete";
    delete_button.addEventListener("click", () => {
        handlers.on_delete(source.source_id, display_name);
    });
    button_row.appendChild(delete_button);

    wrapper.appendChild(button_row);
    source_list.appendChild(wrapper);
}
