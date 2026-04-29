import { group_github_sources } from "../lib/source_grouping.js";

function get_source_cache(state, source_id) {
  return state.caches.find((entry) => entry.source_id === source_id) ?? null;
}

function get_github_file_cache(state, source, file_path) {
  return state.caches.find((entry) => {
    return entry.source_id.startsWith(`${source.source_id}::`)
      && entry.source_snapshot?.file_path === file_path;
  }) ?? null;
}

function get_github_file_label(source) {
  if (!source?.path) {
    return "unknown.json";
  }

  const segments = source.path.split("/");
  return segments[segments.length - 1] || source.path;
}

function render_http_source(state, source, handlers, source_list) {
  const cache = get_source_cache(state, source.source_id);
  const wrapper = document.createElement("div");
  wrapper.className = "source-item";
  const display_name = cache?.source_snapshot?.document_title || source.source_name;

  const title = document.createElement("strong");
  title.textContent = display_name;
  wrapper.appendChild(title);

  const meta = document.createElement("span");
  meta.textContent = `${cache?.source_snapshot?.source_type || source.type} / ${(cache?.source_snapshot?.writable ?? source.writable) ? "writable" : "read-only"}`;
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
    handlers.on_sync(source.source_id);
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

function render_github_group(state, sources, handlers, source_list) {
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

  const file_paths = Array.isArray(primary_source.file_paths) ? [...primary_source.file_paths].sort() : [];

  for (const file_path of file_paths) {
    const cache = get_github_file_cache(state, primary_source, file_path);
    const file_line = document.createElement("span");
    const display_name = cache?.source_snapshot?.document_title || primary_source.source_name;
    file_line.textContent = `file: ${get_github_file_label({ path: file_path })} / title: ${display_name} / items: ${cache ? cache.items_cache.length : 0}`;
    wrapper.appendChild(file_line);
  }

  const button_row = document.createElement("div");
  button_row.className = "row";

  const sync_button = document.createElement("button");
  sync_button.textContent = "Sync GitHub";
  sync_button.addEventListener("click", () => {
    handlers.on_sync(primary_source.source_id);
  });
  button_row.appendChild(sync_button);

  const delete_button = document.createElement("button");
  delete_button.textContent = "Delete";
  delete_button.addEventListener("click", () => {
    handlers.on_delete(primary_source.source_id, `${primary_source.owner}/${primary_source.repo}`);
  });
  button_row.appendChild(delete_button);

  wrapper.appendChild(button_row);

  source_list.appendChild(wrapper);
}

export function render_sources(state, handlers) {
  const source_list = document.getElementById("source_list");

  source_list.innerHTML = "";

  if (state.sources.length === 0) {
    const empty_state = document.createElement("div");
    empty_state.className = "source-item";
    empty_state.textContent = "No registered sources.";
    source_list.appendChild(empty_state);
    return;
  }

  const github_groups = group_github_sources(state.sources);
  const http_sources = state.sources.filter((source) => source.type === "http_static");
  const github_group_entries = [...github_groups.values()].sort((left, right) => {
    const left_source = left[0];
    const right_source = right[0];
    return `${left_source.owner}/${left_source.repo}`.localeCompare(`${right_source.owner}/${right_source.repo}`);
  });

  for (const github_group of github_group_entries) {
    render_github_group(state, github_group, handlers, source_list);
  }

  for (const source of http_sources) {
    render_http_source(state, source, handlers, source_list);
  }
}
